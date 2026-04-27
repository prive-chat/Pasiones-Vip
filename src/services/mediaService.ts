import { supabase } from '@/src/lib/supabase';
import { MediaItem } from '@/src/types';
import { notificationService } from './notificationService';

export const mediaService = {
  async fetchMedia(userId?: string, page = 0, limit = 10) {
    // Definitive solution: Fetch ALL media for the global feed, 
    // but prioritize showing content that is public or from followed users.
    // For now, to "bring the app to life", we fetch all media ordered by date.
    
    const { data, error } = await supabase
      .from('media')
      .select('*, profiles(*), likes(count), shares_count')
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) throw error;

    let transformedData = data.map(item => ({
      ...item,
      likes_count: item.likes?.[0]?.count || 0,
      is_liked: false
    }));

    if (userId && transformedData.length > 0) {
      const mediaIds = transformedData.map(item => item.id);
      const { data: userLikes } = await supabase
        .from('likes')
        .select('media_id, type')
        .eq('user_id', userId)
        .in('media_id', mediaIds);

      if (userLikes) {
        const reactions = new Map(userLikes.map(l => [l.media_id, l.type]));
        transformedData = transformedData.map(item => ({
          ...item,
          is_liked: reactions.has(item.id),
          reaction_type: reactions.get(item.id) || null
        }));
      }
    }
    
    return transformedData as MediaItem[];
  },

  async fetchTrendingMedia(userId?: string, limit = 5) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('media')
      .select('*, profiles(*), likes(count), shares_count')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    let transformedData = data.map(item => ({
      ...item,
      likes_count: item.likes?.[0]?.count || 0,
      is_liked: false
    }));

    if (userId && transformedData.length > 0) {
      const mediaIds = transformedData.map(item => item.id);
      const { data: userLikes } = await supabase
        .from('likes')
        .select('media_id, type')
        .eq('user_id', userId)
        .in('media_id', mediaIds);

      if (userLikes) {
        const reactions = new Map(userLikes.map(l => [l.media_id, l.type]));
        transformedData = transformedData.map(item => ({
          ...item,
          is_liked: reactions.has(item.id),
          reaction_type: reactions.get(item.id) || null
        }));
      }
    }
    
    return transformedData as MediaItem[];
  },

  async likeMedia(userId: string, mediaId: string, reactionType: string = 'heart') {
    // First fetch media to know the owner
    const { data: media, error: mediaError } = await supabase
      .from('media')
      .select('user_id, caption')
      .eq('id', mediaId)
      .single();

    if (mediaError) throw mediaError;

    const { error } = await supabase
      .from('likes')
      .upsert({ 
        user_id: userId, 
        media_id: mediaId,
        type: reactionType 
      }, { onConflict: 'user_id, media_id' });

    if (error) throw error;

    // Create notification if it's not the user's own post
    if (media.user_id !== userId) {
      // Fetch sender profile for the name
      const { data: sender } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      await notificationService.createNotification({
        user_id: media.user_id,
        sender_id: userId,
        type: 'like',
        title: 'Nuevo Me Gusta',
        content: `${sender?.full_name || 'Alguien'} le dio me gusta a tu publicación${media.caption ? `: "${media.caption.substring(0, 20)}..."` : ''}`,
        link: `/post/${mediaId}`
      });
    }
  },

  async unlikeMedia(userId: string, mediaId: string) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .match({ user_id: userId, media_id: mediaId });

    if (error) throw error;
  },

  async checkIfLiked(userId: string, mediaId: string) {
    const { data, error } = await supabase
      .from('likes')
      .select('id')
      .match({ user_id: userId, media_id: mediaId })
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },

  async fetchMediaItem(id: string, userId?: string) {
    const { data, error } = await supabase
      .from('media')
      .select('*, profiles(*), likes(count), shares_count')
      .eq('id', id)
      .single();

    if (error) throw error;
    
    let is_liked = false;
    let reaction_type = null;
    if (userId) {
      const { data: likeData } = await supabase
        .from('likes')
        .select('id, type')
        .match({ user_id: userId, media_id: id })
        .single();
      is_liked = !!likeData;
      reaction_type = likeData?.type || null;
    }

    return {
      ...data,
      likes_count: data.likes?.[0]?.count || 0,
      is_liked,
      reaction_type
    } as MediaItem;
  },

  async fetchUserMedia(userId: string, currentUserId?: string, page = 0, limit = 12) {
    const { data, error } = await supabase
      .from('media')
      .select('*, profiles(*), likes(count), shares_count')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) throw error;

    let transformedData = data.map(item => ({
      ...item,
      likes_count: item.likes?.[0]?.count || 0,
      is_liked: false
    }));

    if (currentUserId && transformedData.length > 0) {
      const mediaIds = transformedData.map(item => item.id);
      const { data: userLikes } = await supabase
        .from('likes')
        .select('media_id, type')
        .eq('user_id', currentUserId)
        .in('media_id', mediaIds);

      if (userLikes) {
        const reactions = new Map(userLikes.map(l => [l.media_id, l.type]));
        transformedData = transformedData.map(item => ({
          ...item,
          is_liked: reactions.has(item.id),
          reaction_type: reactions.get(item.id) || null
        }));
      }
    }

    return transformedData as MediaItem[];
  },

  async deleteMedia(id: string) {
    try {
      // 1. Fetch the media item first to get the URL
      const { data: media, error: fetchError } = await supabase
        .from('media')
        .select('url')
        .eq('id', id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (media?.url) {
        // 2. Extract path from URL
        // URL format: https://[project].supabase.co/storage/v1/object/public/media/path/to/file
        const urlParts = media.url.split('/storage/v1/object/public/media/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          // 3. Delete from storage
          const { error: storageError } = await supabase.storage
            .from('media')
            .remove([filePath]);
          
          if (storageError) {
            console.error('Error deleting file from storage:', storageError);
          }
        }
      }

      // 4. Delete from database
      const { error } = await supabase
        .from('media')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('Error in deleteMedia:', err);
      throw err;
    }
  },

  async uploadMedia(
    userId: string, 
    file: File, 
    type: 'image' | 'video', 
    caption: string | null,
    onProgress?: (progress: number) => void
  ) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(fileName, file, {
        onUploadProgress: (evt: any) => {
          if (onProgress) {
            const progress = Math.round((evt.loaded / evt.total) * 100);
            onProgress(progress);
          }
        }
      } as any);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(fileName);

    const { data, error: dbError } = await supabase.from('media').insert({
      user_id: userId,
      url: publicUrl,
      type,
      caption: caption?.trim() || null,
    }).select().single();

    if (dbError) throw dbError;
    return data;
  },

  async shareMedia(mediaId: string) {
    const { error } = await supabase.rpc('increment_media_share', { p_media_id: mediaId });
    if (error) throw error;
  },

  getThumbnailUrl(url: string, width = 400, height = 400) {
    // Supabase Storage image transformation (requires Pro plan or specific config, but good practice)
    // If not supported, it just returns the original URL
    if (url.includes('/storage/v1/object/public/media/')) {
      return `${url}?width=${width}&height=${height}&resize=contain`;
    }
    return url;
  }
};
