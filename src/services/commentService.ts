import { supabase } from '@/src/lib/supabase';
import { UserProfile } from '@/src/types';
import { notificationService } from './notificationService';

export interface CommentItem {
  id: string;
  media_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: UserProfile;
  likes_count?: number;
  is_liked?: boolean;
}

const LOCAL_LIKES_KEY = 'pasiones_comment_likes';

function getLocalLikedComments(userId?: string): Record<string, boolean> {
  if (!userId) return {};
  try {
    const raw = localStorage.getItem(`${LOCAL_LIKES_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setLocalLikedComment(userId: string, commentId: string, isLiked: boolean) {
  try {
    const current = getLocalLikedComments(userId);
    if (isLiked) {
      current[commentId] = true;
    } else {
      delete current[commentId];
    }
    localStorage.setItem(`${LOCAL_LIKES_KEY}_${userId}`, JSON.stringify(current));
  } catch (e) {
    console.error('Error saving comment like locally:', e);
  }
}

export const commentService = {
  async fetchComments(mediaId: string, currentUserId?: string): Promise<CommentItem[]> {
    try {
      let rawComments: CommentItem[] = [];

      const { data, error } = await supabase
        .from('media_comments')
        .select('*, profiles(*)')
        .eq('media_id', mediaId)
        .order('created_at', { ascending: true });

      if (error) {
        const { data: altData, error: altError } = await supabase
          .from('comments')
          .select('*, profiles(*)')
          .eq('media_id', mediaId)
          .order('created_at', { ascending: true });

        if (altError) {
          console.error('Error fetching comments from database:', altError);
          return [];
        }
        rawComments = (altData || []) as CommentItem[];
      } else {
        rawComments = (data || []) as CommentItem[];
      }

      // Populate likes info
      const localLikedMap = getLocalLikedComments(currentUserId);
      
      // Try to fetch remote comment likes if table exists
      let remoteLikesMap: Record<string, { count: number; userLiked: boolean }> = {};
      try {
        const commentIds = rawComments.map(c => c.id);
        if (commentIds.length > 0) {
          const { data: likesData } = await supabase
            .from('comment_likes')
            .select('comment_id, user_id')
            .in('comment_id', commentIds);

          if (likesData) {
            likesData.forEach(l => {
              if (!remoteLikesMap[l.comment_id]) {
                remoteLikesMap[l.comment_id] = { count: 0, userLiked: false };
              }
              remoteLikesMap[l.comment_id].count += 1;
              if (currentUserId && l.user_id === currentUserId) {
                remoteLikesMap[l.comment_id].userLiked = true;
              }
            });
          }
        }
      } catch {
        // Fallback to local storage calculation
      }

      return rawComments.map(c => {
        const remote = remoteLikesMap[c.id];
        const isLikedLocally = !!localLikedMap[c.id];
        
        let likesCount = remote ? remote.count : (c.likes_count || 0);
        let isLiked = remote ? remote.userLiked : isLikedLocally;

        // Ensure local state syncs if user liked locally
        if (isLikedLocally && (!remote || !remote.userLiked)) {
          isLiked = true;
          if (!remote) likesCount += 1;
        }

        return {
          ...c,
          likes_count: likesCount,
          is_liked: isLiked
        };
      });
    } catch (err) {
      console.error('Error in fetchComments:', err);
      return [];
    }
  },

  async toggleCommentLike(commentId: string, userId: string, currentIsLiked: boolean): Promise<{ isLiked: boolean; newCount: number }> {
    const nextIsLiked = !currentIsLiked;
    setLocalLikedComment(userId, commentId, nextIsLiked);

    try {
      if (nextIsLiked) {
        await supabase
          .from('comment_likes')
          .insert({ comment_id: commentId, user_id: userId });
      } else {
        await supabase
          .from('comment_likes')
          .delete()
          .match({ comment_id: commentId, user_id: userId });
      }
    } catch (e) {
      console.warn('Comment like remote sync note:', e);
    }

    return { isLiked: nextIsLiked, newCount: nextIsLiked ? 1 : -1 };
  },

  async addComment(
    mediaId: string, 
    userId: string, 
    content: string, 
    userProfile?: UserProfile
  ): Promise<CommentItem> {
    const trimmedContent = content.trim();

    let insertedComment: CommentItem | null = null;

    // Try inserting into media_comments
    const { data, error } = await supabase
      .from('media_comments')
      .insert({
        media_id: mediaId,
        user_id: userId,
        content: trimmedContent
      })
      .select('*, profiles(*)')
      .single();

    if (!error && data) {
      insertedComment = data as CommentItem;
    } else {
      // Fallback try to comments table if media_comments table differs
      const { data: altData, error: altError } = await supabase
        .from('comments')
        .insert({
          media_id: mediaId,
          user_id: userId,
          content: trimmedContent
        })
        .select('*, profiles(*)')
        .single();

      if (!altError && altData) {
        insertedComment = altData as CommentItem;
      } else {
        throw new Error(error?.message || altError?.message || 'Error al guardar el comentario en la base de datos.');
      }
    }

    // Sync comments_count in media table
    try {
      const { count } = await supabase
        .from('media_comments')
        .select('*', { count: 'exact', head: true })
        .eq('media_id', mediaId);

      const totalCount = count !== null ? count : 1;

      await supabase
        .from('media')
        .update({ comments_count: totalCount })
        .eq('id', mediaId);
    } catch (countErr) {
      console.warn('Could not update comments_count on media:', countErr);
    }

    // Notify post owner
    try {
      const { data: media } = await supabase
        .from('media')
        .select('user_id, caption')
        .eq('id', mediaId)
        .single();

      if (media && media.user_id !== userId) {
        await notificationService.createNotification({
          user_id: media.user_id,
          sender_id: userId,
          type: 'comment',
          title: 'Nuevo Comentario',
          content: `${userProfile?.full_name || 'Alguien'} comentó: "${trimmedContent.substring(0, 30)}..."`,
          link: `/post/${mediaId}`
        });
      }
    } catch (notifErr) {
      console.warn('Could not send notification:', notifErr);
    }

    // Dispatch custom event for UI components sync
    window.dispatchEvent(new CustomEvent('pasiones_comment_added', { 
      detail: { mediaId, comment: insertedComment } 
    }));

    return insertedComment;
  },

  async deleteComment(commentId: string, mediaId?: string): Promise<void> {
    try {
      await supabase.from('media_comments').delete().eq('id', commentId);
      await supabase.from('comments').delete().eq('id', commentId);

      if (mediaId) {
        const { count } = await supabase
          .from('media_comments')
          .select('*', { count: 'exact', head: true })
          .eq('media_id', mediaId);

        await supabase
          .from('media')
          .update({ comments_count: count || 0 })
          .eq('id', mediaId);

        window.dispatchEvent(new CustomEvent('pasiones_comment_deleted', { 
          detail: { mediaId, commentId } 
        }));
      }
    } catch (e) {
      console.error('Error deleting comment remotely:', e);
      throw e;
    }
  },

  subscribeToComments(
    mediaId: string,
    onCommentChange: (payload: { eventType: 'INSERT' | 'DELETE'; comment: Partial<CommentItem> }) => void
  ) {
    const channelName = `comments_rt_${mediaId}_${Math.random().toString(36).substring(2, 6)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'media_comments',
          filter: `media_id=eq.${mediaId}`
        },
        async (payload) => {
          if (payload.new && payload.new.id) {
            const { data } = await supabase
              .from('media_comments')
              .select('*, profiles(*)')
              .eq('id', payload.new.id)
              .single();

            if (data) {
              onCommentChange({ eventType: 'INSERT', comment: data as CommentItem });
            } else {
              onCommentChange({
                eventType: 'INSERT',
                comment: {
                  id: payload.new.id,
                  media_id: mediaId,
                  user_id: payload.new.user_id,
                  content: payload.new.content,
                  created_at: payload.new.created_at || new Date().toISOString()
                }
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'media_comments',
          filter: `media_id=eq.${mediaId}`
        },
        (payload) => {
          if (payload.old && payload.old.id) {
            onCommentChange({
              eventType: 'DELETE',
              comment: { id: payload.old.id, media_id: mediaId }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};

