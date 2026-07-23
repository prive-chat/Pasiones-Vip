import { supabase } from '@/src/lib/supabase';
import { Notification } from '@/src/types';

export const notificationService = {
  async fetchNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*, sender:profiles!sender_id(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data as Notification[];
  },

  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  },

  async markMessageNotificationsRead(userId: string, senderId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('sender_id', senderId)
      .eq('type', 'message')
      .eq('is_read', false);

    if (error) throw error;
  },

  async deleteNotification(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  },

  async deleteAllNotifications(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  },

  async createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>) {
    const { error } = await supabase
      .from('notifications')
      .insert(notification);

    if (error) throw error;
  }
};
