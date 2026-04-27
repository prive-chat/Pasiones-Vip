import { supabase } from '@/src/lib/supabase';
import { Ad } from '@/src/types';

export const publicAdService = {
  async getActiveAds(placement: 'feed' | 'sidebar' | 'interstitial' = 'feed'): Promise<Ad[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('ads')
        .select(`
          *,
          ad_likes(count),
          shares_count
        `)
        .eq('status', 'active')
        .eq('placement', placement)
        .lte('starts_at', new Date().toISOString())
        .or(`ends_at.is.null,ends_at.gte."${new Date().toISOString()}"`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching ads:', error.message);
        return [];
      }

      let ads = (data || []).map(ad => ({
        ...ad,
        likes_count: ad.ad_likes?.[0]?.count || 0,
        is_liked: false,
        reaction_type: null
      }));

      // If user is logged in, fetch their reactions
      if (user && ads.length > 0) {
        const adIds = ads.map(a => a.id);
        const { data: userReactions } = await supabase
          .from('ad_likes')
          .select('ad_id, type')
          .eq('user_id', user.id)
          .in('ad_id', adIds);

        if (userReactions) {
          const reactionsMap = new Map(userReactions.map(r => [r.ad_id, r.type]));
          ads = ads.map(ad => ({
            ...ad,
            is_liked: reactionsMap.has(ad.id),
            reaction_type: reactionsMap.get(ad.id) || null
          }));
        }
      }

      return ads;
    } catch (err) {
      console.warn('Unexpected error in ad service:', err);
      return [];
    }
  },

  async toggleReaction(userId: string, adId: string, reactionType: string) {
    const { error } = await supabase.rpc('toggle_ad_reaction', { 
      p_user_id: userId, 
      p_ad_id: adId, 
      p_reaction_type: reactionType 
    });
    if (error) throw error;
  },

  async unlikeAd(userId: string, adId: string) {
    const { error } = await supabase
      .from('ad_likes')
      .delete()
      .match({ user_id: userId, ad_id: adId });
    if (error) throw error;
  },

  async shareAd(adId: string) {
    const { error } = await supabase.rpc('increment_ad_share', { p_ad_id: adId });
    if (error) throw error;
  },

  async trackImpression(adId: string) {
    const { error } = await supabase.rpc('increment_ad_metric', { 
      ad_id: adId, 
      metric_type: 'impression' 
    });
    if (error) console.error('Error tracking ad impression:', error);
  },

  async trackClick(adId: string) {
    const { error } = await supabase.rpc('increment_ad_metric', { 
      ad_id: adId, 
      metric_type: 'click' 
    });
    if (error) console.error('Error tracking ad click:', error);
  }
};
