import { supabase } from '@/src/lib/supabase';
import { Review } from '@/src/types';

export const reviewService = {
  async fetchUserReviews(targetUserId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, author:profiles(*)')
      .eq('target_user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (error) {
      // postgres 42P01/404 means the table doesn't exist yet
      if (error.code === '42P01' || error.message?.includes('relation "reviews" does not exist')) {
        console.warn('La tabla "reviews" no existe en Supabase. Ejecuta el archivo "supabase_schema.sql" en la consola SQL de Supabase para crearla.');
        return [] as Review[];
      }
      throw error;
    }
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
