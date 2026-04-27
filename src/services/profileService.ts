import { supabase } from '@/src/lib/supabase';
import { UserProfile } from '@/src/types';
import { notificationService } from './notificationService';

export const profileService = {
  async fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as UserProfile;
  },

  async fetchAllProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) throw error;
    return data as UserProfile[];
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as UserProfile;
  },

  async searchProfiles(query: string) {
    if (!query.trim()) return [];
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(10);

    if (error) throw error;
    return data as UserProfile[];
  },

  async followUser(followerId: string, followingId: string, isPrivate: boolean) {
    const status = isPrivate ? 'pending' : 'accepted';
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: followerId, following_id: followingId, status });

    if (error && error.code !== '23505') throw error;

    // Create notification
    const { data: sender } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', followerId)
      .single();

    await notificationService.createNotification({
      user_id: followingId,
      sender_id: followerId,
      type: isPrivate ? 'follow_request' : 'follow_accept',
      title: isPrivate ? 'Solicitud de seguimiento' : 'Nuevo seguidor',
      content: isPrivate 
        ? `${sender?.full_name || 'Alguien'} quiere seguirte.` 
        : `${sender?.full_name || 'Alguien'} comenzó a seguirte.`,
      link: `/profile/${followerId}`
    });

    return status;
  },

  async unfollowUser(followerId: string, followingId: string) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .match({ follower_id: followerId, following_id: followingId });

    if (error) throw error;
  },

  async fetchFollowStatus(followerId: string, followingId: string) {
    const { data, error } = await supabase
      .from('follows')
      .select('status')
      .match({ follower_id: followerId, following_id: followingId })
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.status as 'pending' | 'accepted' | null;
  },

  async acceptFollowRequest(followerId: string, followingId: string) {
    const { error } = await supabase
      .from('follows')
      .update({ status: 'accepted' })
      .match({ follower_id: followerId, following_id: followingId });

    if (error) throw error;

    // Create notification for the follower
    const { data: sender } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', followingId)
      .single();

    await notificationService.createNotification({
      user_id: followerId,
      sender_id: followingId,
      type: 'follow_accept',
      title: 'Solicitud aceptada',
      content: `${sender?.full_name || 'Alguien'} aceptó tu solicitud de seguimiento.`,
      link: `/profile/${followingId}`
    });
  },

  async fetchUserStats(userId: string) {
    // Fetch followers and following counts
    const [followers, following] = await Promise.all([
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId)
        .eq('status', 'accepted'),
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId)
        .eq('status', 'accepted')
    ]);

    // Fetch user's media IDs first to count likes accurately
    const { data: userMedia } = await supabase
      .from('media')
      .select('id')
      .eq('user_id', userId);
    
    const mediaIds = userMedia?.map(m => m.id) || [];
    
    let likesCount = 0;
    if (mediaIds.length > 0) {
      const { count } = await supabase
        .from('likes')
        .select('id', { count: 'exact', head: true })
        .in('media_id', mediaIds);
      likesCount = count || 0;
    }

    return {
      followers: followers.count || 0,
      following: following.count || 0,
      likes: likesCount
    };
  },

  async deleteAccount(userId: string) {
    // 1. Intentar limpiar el almacenamiento físico antes de borrar el registro
    try {
      const { data: files } = await supabase.storage
        .from('media')
        .list(userId);

      if (files && files.length > 0) {
        const pathsToRemove = files.map(f => `${userId}/${f.name}`);
        await supabase.storage.from('media').remove(pathsToRemove);
      }
    } catch (err) {
      console.error('Error cleaning up storage during account deletion:', err);
    }

    // 2. Llamamos a la función RPC que borra al usuario de auth.users
    const { error } = await supabase.rpc('delete_own_user');

    if (error) {
      console.error('Error calling delete_own_user RPC:', error);
      // Intento de respaldo: borrar solo el perfil si el RPC falla
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
        
      if (profileError) throw profileError;
    }
  }
};
