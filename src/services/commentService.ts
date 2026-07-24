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
}

export const commentService = {
  async fetchComments(mediaId: string): Promise<CommentItem[]> {
    try {
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
        return (altData || []) as CommentItem[];
      }

      return (data || []) as CommentItem[];
    } catch (err) {
      console.error('Error in fetchComments:', err);
      return [];
    }
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

