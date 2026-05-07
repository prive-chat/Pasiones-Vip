import { supabase } from '../lib/supabase';

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  created_at: string;
  expires_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
    is_verified: boolean;
  };
}

export const storyService = {
  async uploadStory(userId: string, file: Blob | File, type: 'image' | 'video') {
    const fileExt = (file as File).name?.split('.').pop() || (type === 'video' ? 'mp4' : 'jpg');
    const fileName = `${userId}/stories/${Date.now()}.${fileExt}`;

    // 1. Subir el archivo
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(fileName);

    // 2. Calcular expiración (24h)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // 3. Insertar en base de datos
    const { error: dbError } = await supabase
      .from('stories')
      .insert({
        user_id: userId,
        media_url: publicUrl,
        media_type: type,
        expires_at: expiresAt.toISOString(),
      });

    if (dbError) throw dbError;
    
    return publicUrl;
  },

  async fetchActiveStories() {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('stories')
      .select(`
        *,
        profiles:user_id (
          full_name,
          avatar_url,
          is_verified
        )
      `)
      .gt('expires_at', now)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Story[];
  }
};
