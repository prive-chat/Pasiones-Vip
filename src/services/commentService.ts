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

const LOCAL_STORAGE_KEY = 'pasiones_local_comments';

function getLocalComments(mediaId: string): CommentItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw);
    return all.filter((c: CommentItem) => c.media_id === mediaId);
  } catch {
    return [];
  }
}

function saveLocalComment(comment: CommentItem) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : [];
    all.push(comment);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Error saving local comment', e);
  }
}

function deleteLocalComment(commentId: string) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return;
    const all = JSON.parse(raw);
    const filtered = all.filter((c: CommentItem) => c.id !== commentId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Error deleting local comment', e);
  }
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
          return getLocalComments(mediaId);
        }
        return (altData || []) as CommentItem[];
      }

      const remoteComments = (data || []) as CommentItem[];
      const localComments = getLocalComments(mediaId);
      
      const combined = [...remoteComments];
      localComments.forEach(local => {
        if (!combined.some(r => r.id === local.id)) {
          combined.push(local);
        }
      });

      return combined.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } catch {
      return getLocalComments(mediaId);
    }
  },

  async addComment(
    mediaId: string, 
    userId: string, 
    content: string, 
    userProfile?: UserProfile
  ): Promise<CommentItem> {
    const newCommentId = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const localComment: CommentItem = {
      id: newCommentId,
      media_id: mediaId,
      user_id: userId,
      content: content.trim(),
      created_at: now,
      profiles: userProfile
    };

    saveLocalComment(localComment);

    try {
      const { data, error } = await supabase
        .from('media_comments')
        .insert({
          id: newCommentId,
          media_id: mediaId,
          user_id: userId,
          content: content.trim()
        })
        .select('*, profiles(*)')
        .single();

      if (error) {
        await supabase
          .from('comments')
          .insert({
            id: newCommentId,
            media_id: mediaId,
            user_id: userId,
            content: content.trim()
          });
      }

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
          content: `${userProfile?.full_name || 'Alguien'} comentó: "${content.substring(0, 30)}..."`,
          link: `/post/${mediaId}`
        });
      }

      if (data) {
        window.dispatchEvent(new CustomEvent('pasiones_comment_added', { detail: { mediaId, comment: data } }));
        return data as CommentItem;
      }
    } catch (e) {
      console.warn('Supabase comment insert warning, saved locally:', e);
    }

    window.dispatchEvent(new CustomEvent('pasiones_comment_added', { detail: { mediaId, comment: localComment } }));
    return localComment;
  },

  async deleteComment(commentId: string, mediaId?: string): Promise<void> {
    deleteLocalComment(commentId);
    if (mediaId) {
      window.dispatchEvent(new CustomEvent('pasiones_comment_deleted', { detail: { mediaId, commentId } }));
    }
    try {
      await supabase.from('media_comments').delete().eq('id', commentId);
      await supabase.from('comments').delete().eq('id', commentId);
    } catch (e) {
      console.warn('Error deleting comment remotely:', e);
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
