import { useState, useEffect } from 'react';
import { pushService } from '@/src/services/pushService';

export function usePushNotifications(userId: string | undefined) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(
    'default'
  );

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    
    const checkSubscription = async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      }
    };
    
    checkSubscription();
  }, []);

  const subscribe = async () => {
    if (!userId) return;
    
    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === 'granted') {
      const sub = await pushService.subscribeUser(userId);
      setIsSubscribed(true); // Always set to true if permission is granted and we tried to subscribe
      return true;
    }
    return false;
  };

  const unsubscribe = async () => {
    if (!userId) return;
    await pushService.unsubscribeUser(userId);
    setIsSubscribed(false);
  };

  return {
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator
  };
}
