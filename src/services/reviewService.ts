import { supabase } from '@/src/lib/supabase';
import { Review } from '@/src/types';

export const reviewService = {
  async fetchUserReviews(targetUserId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, author:profiles(*)')
      .eq('target_user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Review[];
  },

  async addReview(review: Omit<Review, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('reviews')
      .insert(review)
      .select('*, author:profiles(*)')
      .single();

    if (error) throw error;
    return data as Review;
  }
};
