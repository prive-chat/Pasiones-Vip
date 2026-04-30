import { supabase } from '@/src/lib/supabase';
import { UserProfile, MediaItem, Ad } from '@/src/types';
import { optimizeImage } from '@/src/lib/imageOptimization';

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string;
  old_data: any;
  new_data: any;
  created_at: string;
  profiles?: UserProfile;
}

export interface UserReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reported_content_id?: string;
  content_type: 'profile' | 'media' | 'message';
  reason: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  admin_notes?: string;
  created_at: string;
  reporter?: UserProfile;
  reported_user?: UserProfile;
}

export interface GlobalConfig {
  key: string;
  value: any;
  description?: string;
  updated_at: string;
}

export interface SystemStats {
  totalUsers: number;
  totalMedia: number;
  totalMessages: number;
  verifiedUsers: number;
  pendingReports: number;
  growthData: { date: string; users: number; media: number }[];
}

export const adminService = {
  async fetchStats(): Promise<SystemStats> {
    const [usersCount, mediaCount, messagesCount, verifiedCount, reportsCount] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('media').select('*', { count: 'exact', head: true }),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true),
      supabase.from('user_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    ]);

    // Mock growth data for the last 7 days
    const growthData = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        users: Math.floor(Math.random() * 50) + 10,
        media: Math.floor(Math.random() * 100) + 20
      };
    });

    return {
      totalUsers: usersCount.count || 0,
      totalMedia: mediaCount.count || 0,
      totalMessages: messagesCount.count || 0,
      verifiedUsers: verifiedCount.count || 0,
      pendingReports: reportsCount.count || 0,
      growthData
    };
  },

  async fetchAuditLogs(limit = 50): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, profiles:user_id(*)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Reports Management
  async fetchReports(): Promise<UserReport[]> {
    const { data, error } = await supabase
      .from('user_reports')
      .select('*, reporter:reporter_id(*), reported_user:reported_user_id(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateReport(id: string, updates: Partial<UserReport>) {
    const { data, error } = await supabase
      .from('user_reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Global Config Management
  async fetchGlobalConfig(): Promise<GlobalConfig[]> {
    const { data, error } = await supabase
      .from('global_config')
      .select('*')
      .order('key', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async updateGlobalConfig(key: string, value: any) {
    const { data, error } = await supabase
      .from('global_config')
      .upsert({ key, value, updated_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async broadcastMessage(title: string, content: string, senderId: string) {
    const { error } = await supabase.rpc('broadcast_global_message', {
      p_title: title,
      p_content: content,
      p_sender_id: senderId
    });

    if (error) throw error;
  },

  // Ad Management
  async fetchAds(): Promise<Ad[]> {
    const { data, error } = await supabase
      .from('ads')
      .select('id, title, description, cta_text, image_url, link_url, type, placement, status, impressions, clicks, cost_per_click, cost_per_impression, total_budget, spent_budget, priority, starts_at, ends_at, created_at')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createAd(ad: Partial<Ad>) {
    const { data, error } = await supabase
      .from('ads')
      .insert([ad])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateAd(id: string, updates: Partial<Ad>) {
    const { data, error } = await supabase
      .from('ads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteAd(id: string) {
    try {
      // 1. Fetch the ad first to get the media URL
      const { data: ad, error: fetchError } = await supabase
        .from('ads')
        .select('image_url')
        .eq('id', id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (ad?.image_url) {
        // 2. Extract path from URL
        const urlParts = ad.image_url.split('/storage/v1/object/public/media/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          // 3. Delete from storage
          const { error: storageError } = await supabase.storage
            .from('media')
            .remove([filePath]);
          
          if (storageError) {
            console.error('Error deleting ad file from storage:', storageError);
          }
        }
      }

      // 4. Delete from database
      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (err) {
      console.error('Error in deleteAd:', err);
      throw err;
    }
  },

  async uploadAdMedia(file: File): Promise<{ url: string; type: 'image' | 'video' }> {
    const fileExt = file.name.split('.').pop();
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    
    let fileToUpload: File | Blob = file;
    if (type === 'image') {
      try {
        fileToUpload = await optimizeImage(file, { maxWidth: 1000, maxHeight: 1000, quality: 0.75 });
      } catch (err) {
        console.error('Error optimizing ad image, using original:', err);
      }
    }

    const fileName = `ads/${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, fileToUpload);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    return { url: publicUrl, type };
  }
};
