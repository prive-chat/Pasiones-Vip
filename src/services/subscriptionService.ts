import { supabase } from '@/src/lib/supabase';
import { creditsManager } from '@/src/lib/credits';
import { UserProfile } from '@/src/types';

export interface SubscriptionConfig {
  creator_id: string;
  enabled: boolean;
  price: number;
  benefits: string[];
}

export interface Subscription {
  id: string;
  subscriber_id: string;
  creator_id: string;
  status: 'active' | 'inactive';
  benefits?: string[];
  created_at: string;
}

const DEFAULT_BENEFITS = [
  "Acceso a Historias VIP y fotos privadas",
  "Mensajes directos gratuitos e ilimitados",
  "Descuento del 10% en citas / reservas VIP",
  "Prioridad de respuesta y videollamadas"
];

export const subscriptionService = {
  // CONFIGURATIONS FOR CREATORS
  async getSubscriptionConfig(creatorId: string): Promise<SubscriptionConfig> {
    try {
      const { data, error } = await supabase
        .from('subscription_configs')
        .select('*')
        .eq('creator_id', creatorId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        return {
          creator_id: data.creator_id,
          enabled: data.enabled,
          price: data.price,
          benefits: Array.isArray(data.benefits) ? data.benefits : JSON.parse(data.benefits || '[]')
        };
      }
    } catch (err) {
      console.warn('DB subscription_configs not available, using localStorage fallback', err);
    }

    // LocalStorage Fallback
    const localConfigs = JSON.parse(localStorage.getItem('pasiones_vip_sub_configs') || '{}');
    if (localConfigs[creatorId]) {
      return localConfigs[creatorId];
    }

    return {
      creator_id: creatorId,
      enabled: false,
      price: 150, // default credits
      benefits: [...DEFAULT_BENEFITS]
    };
  },

  async saveSubscriptionConfig(creatorId: string, config: Partial<SubscriptionConfig>): Promise<SubscriptionConfig> {
    const fullConfig: SubscriptionConfig = {
      creator_id: creatorId,
      enabled: config.enabled ?? false,
      price: config.price ?? 150,
      benefits: config.benefits ?? [...DEFAULT_BENEFITS]
    };

    try {
      const { data, error } = await supabase
        .from('subscription_configs')
        .upsert({
          creator_id: creatorId,
          enabled: fullConfig.enabled,
          price: fullConfig.price,
          benefits: fullConfig.benefits
        })
        .select()
        .single();

      if (!error && data) {
        // Update local storage too to ensure sync
        const localConfigs = JSON.parse(localStorage.getItem('pasiones_vip_sub_configs') || '{}');
        localConfigs[creatorId] = fullConfig;
        localStorage.setItem('pasiones_vip_sub_configs', JSON.stringify(localConfigs));
        return fullConfig;
      }
    } catch (err) {
      console.warn('Could not save to DB subscription_configs, saving to localStorage', err);
    }

    const localConfigs = JSON.parse(localStorage.getItem('pasiones_vip_sub_configs') || '{}');
    localConfigs[creatorId] = fullConfig;
    localStorage.setItem('pasiones_vip_sub_configs', JSON.stringify(localConfigs));
    return fullConfig;
  },

  // USER SUBSCRIPTION STATE
  async isUserSubscribed(subscriberId: string, creatorId: string): Promise<boolean> {
    if (subscriberId === creatorId) return true; // Creator is always subscribed to themselves

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('subscriber_id', subscriberId)
        .eq('creator_id', creatorId)
        .eq('status', 'active')
        .maybeSingle();

      if (!error && data) {
        return true;
      }
    } catch (err) {
      console.warn('DB subscriptions not available, querying localStorage fallback', err);
    }

    // LocalStorage Fallback
    const localSubs = JSON.parse(localStorage.getItem('pasiones_vip_subscriptions') || '[]');
    return localSubs.some((s: any) => 
      s.subscriber_id === subscriberId && 
      s.creator_id === creatorId && 
      s.status === 'active'
    );
  },

  async subscribeToCreator(subscriberId: string, creatorId: string, price: number): Promise<boolean> {
    // 1. Deduct credits
    if (price > 0) {
      const success = creditsManager.deductCredits(price);
      if (!success) {
        throw new Error('Créditos insuficientes para realizar la suscripción.');
      }
    }

    const newSub: Subscription = {
      id: crypto.randomUUID(),
      subscriber_id: subscriberId,
      creator_id: creatorId,
      status: 'active',
      created_at: new Date().toISOString()
    };

    // 2. Try DB
    try {
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          subscriber_id: subscriberId,
          creator_id: creatorId,
          status: 'active',
          created_at: newSub.created_at
        });

      if (!error) {
        // Save locally to ensure sync
        const localSubs = JSON.parse(localStorage.getItem('pasiones_vip_subscriptions') || '[]');
        // Remove existing if any
        const filtered = localSubs.filter((s: any) => !(s.subscriber_id === subscriberId && s.creator_id === creatorId));
        filtered.push(newSub);
        localStorage.setItem('pasiones_vip_subscriptions', JSON.stringify(filtered));

        // Create system notification for creator
        await this.notifyCreatorOfSubscription(subscriberId, creatorId);
        return true;
      }
    } catch (err) {
      console.warn('Could not save subscription to DB, using localStorage', err);
    }

    // LocalStorage fallback
    const localSubs = JSON.parse(localStorage.getItem('pasiones_vip_subscriptions') || '[]');
    const filtered = localSubs.filter((s: any) => !(s.subscriber_id === subscriberId && s.creator_id === creatorId));
    filtered.push(newSub);
    localStorage.setItem('pasiones_vip_subscriptions', JSON.stringify(filtered));

    await this.notifyCreatorOfSubscription(subscriberId, creatorId);
    return true;
  },

  async unsubscribeFromCreator(subscriberId: string, creatorId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'inactive' })
        .eq('subscriber_id', subscriberId)
        .eq('creator_id', creatorId);

      if (!error) {
        const localSubs = JSON.parse(localStorage.getItem('pasiones_vip_subscriptions') || '[]');
        const updated = localSubs.map((s: any) => {
          if (s.subscriber_id === subscriberId && s.creator_id === creatorId) {
            return { ...s, status: 'inactive' };
          }
          return s;
        });
        localStorage.setItem('pasiones_vip_subscriptions', JSON.stringify(updated));
        return true;
      }
    } catch (err) {
      console.warn('Could not update subscription in DB, using localStorage', err);
    }

    const localSubs = JSON.parse(localStorage.getItem('pasiones_vip_subscriptions') || '[]');
    const updated = localSubs.map((s: any) => {
      if (s.subscriber_id === subscriberId && s.creator_id === creatorId) {
        return { ...s, status: 'inactive' };
      }
      return s;
    });
    localStorage.setItem('pasiones_vip_subscriptions', JSON.stringify(updated));
    return true;
  },

  async notifyCreatorOfSubscription(subscriberId: string, creatorId: string) {
    try {
      const { data: subscriber } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', subscriberId)
        .single();

      const name = subscriber?.full_name || 'Un usuario';

      await supabase.from('notifications').insert({
        user_id: creatorId,
        sender_id: subscriberId,
        type: 'system',
        title: '¡Nueva Suscripción! 🎉',
        content: `${name} se ha suscrito a tu perfil VIP para disfrutar de tus beneficios exclusivos.`,
        link: `/profile/${subscriberId}`
      });
    } catch (err) {
      console.warn('Could not create notification for subscription:', err);
    }
  }
};
