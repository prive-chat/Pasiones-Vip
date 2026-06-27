import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/hooks/useAuth';
import { useNotificationStore } from '@/src/store/notificationStore';

export function useBookingSync(profileId?: string, isMe?: boolean) {
  const { user: currentUser } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const addToast = useNotificationStore((state) => state.addToast);

  const fetchBookings = async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      // 1. Fetch all system notifications related to bookings where the user is sender or receiver
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${currentUser.id},sender_id.eq.${currentUser.id}`)
        .eq('type', 'system')
        .order('created_at', { ascending: true }); // Ascending so updates apply chronologically

      if (error) throw error;

      const bookingsMap: Record<string, any> = {};

      if (notifications) {
        for (const notif of notifications) {
          try {
            if (notif.title.startsWith('[BOOKING_REQUEST]')) {
              const bookingData = JSON.parse(notif.content);
              if (bookingData && bookingData.id) {
                bookingsMap[bookingData.id] = {
                  ...bookingData,
                  clientId: bookingData.clientId || notif.sender_id,
                  profileId: bookingData.profileId || notif.user_id,
                };
              }
            } else if (
              notif.title.startsWith('[BOOKING_ACCEPT]') || 
              notif.title.startsWith('[BOOKING_REJECT]') || 
              notif.title.startsWith('[BOOKING_CANCEL]')
            ) {
              const statusData = JSON.parse(notif.content);
              if (statusData && statusData.id && bookingsMap[statusData.id]) {
                bookingsMap[statusData.id].status = statusData.status;
              }
            }
          } catch (e) {
            console.error('Error parsing booking notification:', e);
          }
        }
      }

      // Convert map to array
      let allBookings = Object.values(bookingsMap);

      // Save to localStorage as a fast-load cache or fallback
      localStorage.setItem('pasiones_vip_bookings', JSON.stringify(allBookings));

      // 2. Filter bookings based on params
      if (profileId !== undefined && isMe !== undefined) {
        if (isMe) {
          // Creator sees bookings for their profile
          allBookings = allBookings.filter((b: any) => b.profileId === profileId);
        } else {
          // Client sees their own bookings with this creator
          allBookings = allBookings.filter((b: any) => b.profileId === profileId && b.clientId === currentUser.id);
        }
      }

      // Sort final bookings by created_at descending (newest first)
      allBookings.sort((a: any, b: any) => (b.created_at || 0) - (a.created_at || 0));

      setBookings(allBookings);

      // 3. Fetch user profiles of all participants to display full details (city, category, avatar, etc.)
      const participantIds = Array.from(
        new Set(
          allBookings.flatMap((b: any) => [b.profileId, b.clientId])
        )
      ).filter((id): id is string => !!id && id !== currentUser.id);

      if (participantIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', participantIds);

        if (!profilesError && profilesData) {
          const map: Record<string, any> = {};
          profilesData.forEach((p) => {
            map[p.id] = p;
          });
          setProfilesMap(map);
        }
      }
    } catch (err) {
      console.error('Error syncing bookings from database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    if (!currentUser?.id) return;

    // Listen to database real-time notifications to update instantly
    const channelId = `bookings_global_sync:${currentUser.id}:${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotif = payload.new as any;
          const oldNotif = payload.old as any;
          const targetNotif = newNotif || oldNotif;

          if (targetNotif && (targetNotif.user_id === currentUser.id || targetNotif.sender_id === currentUser.id)) {
            fetchBookings();

            // Display real-time toasts for new incoming bookings or updates
            if (payload.eventType === 'INSERT' && newNotif && newNotif.type === 'system') {
              try {
                if (newNotif.title.startsWith('[BOOKING_REQUEST]') && newNotif.user_id === currentUser.id) {
                  const bookingData = JSON.parse(newNotif.content);
                  addToast({
                    type: 'info',
                    message: 'Nueva Solicitud de Cita 📅',
                    description: `${bookingData.clientName || 'Un usuario'} ha solicitado una cita.`
                  });
                } else if ((newNotif.title.startsWith('[BOOKING_ACCEPT]') || newNotif.title.startsWith('[BOOKING_REJECT]') || newNotif.title.startsWith('[BOOKING_CANCEL]')) && newNotif.user_id === currentUser.id) {
                  const statusData = JSON.parse(newNotif.content);
                  const isAccepted = statusData.status === 'accepted';
                  const isCancelled = statusData.status === 'cancelled';
                  addToast({
                    type: isAccepted ? 'success' : 'info',
                    message: isAccepted 
                      ? 'Cita Aceptada 🎉' 
                      : isCancelled 
                        ? 'Cita Cancelada ❌' 
                        : 'Cita Rechazada 💔',
                    description: isAccepted 
                      ? 'Tu solicitud de cita discreta ha sido aprobada.' 
                      : isCancelled 
                        ? 'Una cita de tu agenda ha sido cancelada.'
                        : 'Tu solicitud de cita discreta ha sido rechazada.'
                  });
                }
              } catch (e) {
                console.error('Error parsing notification toast content:', e);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, profileId, isMe]);

  return {
    bookings,
    profilesMap,
    loading,
    refresh: fetchBookings
  };
}
