import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/hooks/useAuth';
import { useNotificationStore } from '@/src/store/notificationStore';

export function useBookingSync(profileId: string | undefined, isMe: boolean) {
  const { user: currentUser } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const addToast = useNotificationStore((state) => state.addToast);

  // Helper to load bookings from localStorage
  const loadLocalBookings = () => {
    const all = JSON.parse(localStorage.getItem('pasiones_vip_bookings') || '[]');
    if (isMe) {
      // Creator sees all bookings for their profile
      return all.filter((b: any) => b.profileId === profileId);
    } else {
      // Client sees only their own bookings with this creator
      return all.filter((b: any) => b.profileId === profileId && b.clientId === currentUser?.id);
    }
  };

  // Sync state with localStorage
  const updateLocalState = () => {
    setBookings(loadLocalBookings());
  };

  useEffect(() => {
    updateLocalState();
  }, [profileId, isMe, currentUser?.id]);

  // Fetch and apply existing notifications from Supabase on load/mount
  useEffect(() => {
    if (!currentUser?.id || !profileId) return;

    const fetchAndSync = async () => {
      try {
        // Fetch last 50 system notifications for the current user
        const { data: notifications, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('type', 'system')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        if (!notifications || notifications.length === 0) return;

        let localChanged = false;
        const allBookings = JSON.parse(localStorage.getItem('pasiones_vip_bookings') || '[]');

        for (const notif of notifications) {
          try {
            if (isMe && notif.title.startsWith('[BOOKING_REQUEST]')) {
              const bookingData = JSON.parse(notif.content);
              // Check if we already have this booking in localStorage
              const exists = allBookings.some((b: any) => b.id === bookingData.id);
              if (!exists) {
                allBookings.push(bookingData);
                localChanged = true;
              }
            } else if (!isMe && (notif.title.startsWith('[BOOKING_ACCEPT]') || notif.title.startsWith('[BOOKING_REJECT]'))) {
              const statusData = JSON.parse(notif.content); // { id: '...', status: 'accepted'|'rejected' }
              const localIndex = allBookings.findIndex((b: any) => b.id === statusData.id);
              if (localIndex !== -1 && allBookings[localIndex].status !== statusData.status) {
                allBookings[localIndex].status = statusData.status;
                localChanged = true;
              }
            }
          } catch (e) {
            console.error('Error parsing booking notification content:', e);
          }
        }

        if (localChanged) {
          localStorage.setItem('pasiones_vip_bookings', JSON.stringify(allBookings));
          updateLocalState();
        }
      } catch (err) {
        console.error('Error syncing bookings from database notifications:', err);
      }
    };

    fetchAndSync();
  }, [currentUser?.id, isMe, profileId]);

  // Setup real-time listener for incoming notifications
  useEffect(() => {
    if (!currentUser?.id || !profileId) return;

    const channel = supabase
      .channel(`bookings_sync:${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          const newNotif = payload.new;
          if (newNotif.type !== 'system') return;

          try {
            const allBookings = JSON.parse(localStorage.getItem('pasiones_vip_bookings') || '[]');
            let updated = false;

            if (isMe && newNotif.title.startsWith('[BOOKING_REQUEST]')) {
              const bookingData = JSON.parse(newNotif.content);
              const exists = allBookings.some((b: any) => b.id === bookingData.id);
              if (!exists) {
                allBookings.push(bookingData);
                localStorage.setItem('pasiones_vip_bookings', JSON.stringify(allBookings));
                updated = true;
                addToast({
                  type: 'info',
                  message: 'Nueva Solicitud de Cita 📅',
                  description: `${bookingData.clientName} ha solicitado una cita para el ${bookingData.date}.`
                });
              }
            } else if (!isMe && (newNotif.title.startsWith('[BOOKING_ACCEPT]') || newNotif.title.startsWith('[BOOKING_REJECT]'))) {
              const statusData = JSON.parse(newNotif.content);
              const localIndex = allBookings.findIndex((b: any) => b.id === statusData.id);
              if (localIndex !== -1 && allBookings[localIndex].status !== statusData.status) {
                allBookings[localIndex].status = statusData.status;
                localStorage.setItem('pasiones_vip_bookings', JSON.stringify(allBookings));
                updated = true;
                
                const isAccepted = statusData.status === 'accepted';
                addToast({
                  type: isAccepted ? 'success' : 'info',
                  message: isAccepted ? 'Cita Aceptada 🎉' : 'Cita Rechazada 💔',
                  description: isAccepted 
                    ? 'Tu solicitud de cita discreta ha sido aprobada.' 
                    : 'Tu solicitud de cita discreta ha sido rechazada.'
                });
              }
            }

            if (updated) {
              updateLocalState();
            }
          } catch (e) {
            console.error('Error handling real-time booking notification:', e);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, isMe, profileId, addToast]);

  return {
    bookings,
    refresh: updateLocalState
  };
}
