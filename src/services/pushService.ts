import { supabase } from '@/src/lib/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const pushService = {
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registrado con éxito:', registration);
        return registration;
      } catch (error) {
        console.error('Error al registrar el Service Worker:', error);
        return null;
      }
    }
    return null;
  },

  async subscribeUser(userId: string) {
    if (!VAPID_PUBLIC_KEY) {
      console.warn('VITE_VAPID_PUBLIC_KEY no está configurado. Las notificaciones push en segundo plano no funcionarán, pero las notificaciones en primer plano sí.');
      return { endpoint: 'local-only' }; // Return a dummy object to indicate local success
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      const subJSON = subscription.toJSON();
      
      if (!subJSON.endpoint || !subJSON.keys?.p256dh || !subJSON.keys?.auth) {
        throw new Error('Suscripción incompleta.');
      }

      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: userId,
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys.p256dh,
        auth: subJSON.keys.auth
      }, { onConflict: 'endpoint' });

      if (error) throw error;

      return subscription;
    } catch (error) {
      console.error('Error al suscribir al usuario:', error);
      return null;
    }
  },

  async unsubscribeUser(userId: string) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
      }
    } catch (error) {
      console.error('Error al desuscribir al usuario:', error);
    }
  }
};
