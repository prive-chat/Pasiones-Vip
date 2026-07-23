import { useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/hooks/useAuth';
import { usePushNotifications } from '@/src/hooks/usePushNotifications';

export default function NotificationManager() {
  const { user } = useAuth();
  const { permission } = usePushNotifications(user?.id);

  useEffect(() => {
    if (!user || permission !== 'granted') return;

    const channel = supabase
      .channel('notification_alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const notification = payload.new;
          
          // Show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            const n = new Notification(notification.title, {
              body: notification.content,
              icon: '/icon.svg',
              tag: notification.id,
            });

            n.onclick = () => {
              window.focus();
              if (notification.link) {
                window.location.href = notification.link;
              }
              n.close();
            };
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, permission]);

  return null;
}
