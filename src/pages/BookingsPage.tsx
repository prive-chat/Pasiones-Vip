import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { notificationService } from '../services/notificationService';
import { useNotificationStore } from '../store/notificationStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { 
  Calendar, 
  Clock, 
  MessageSquare, 
  Check, 
  X, 
  User, 
  MapPin, 
  ExternalLink, 
  FileText, 
  AlertCircle, 
  ChevronRight, 
  Compass,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BookingsPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const addToast = useNotificationStore((state) => state.addToast);

  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('sent');
  const [bookings, setBookings] = useState<any[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Default tab based on role
  useEffect(() => {
    if (profile?.is_verified) {
      setActiveTab('received');
    } else {
      setActiveTab('sent');
    }
  }, [profile]);

  // Load bookings from localStorage & sync from database notifications
  const loadBookings = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Get raw local bookings
      const allBookings = JSON.parse(localStorage.getItem('pasiones_vip_bookings') || '[]');

      // 2. Query system notifications to fetch any pending or missing bookings not yet in localStorage
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'system')
        .order('created_at', { ascending: false })
        .limit(50);

      const syncedBookings = [...allBookings];
      let hasChanges = false;

      if (notifications && notifications.length > 0) {
        for (const notif of notifications) {
          try {
            if (notif.title.startsWith('[BOOKING_REQUEST]')) {
              const bookingData = JSON.parse(notif.content);
              const exists = syncedBookings.some((b: any) => b.id === bookingData.id);
              if (!exists) {
                syncedBookings.push(bookingData);
                hasChanges = true;
              }
            } else if (notif.title.startsWith('[BOOKING_ACCEPT]') || notif.title.startsWith('[BOOKING_REJECT]')) {
              const statusData = JSON.parse(notif.content);
              const localIndex = syncedBookings.findIndex((b: any) => b.id === statusData.id);
              if (localIndex !== -1 && syncedBookings[localIndex].status !== statusData.status) {
                syncedBookings[localIndex].status = statusData.status;
                hasChanges = true;
              }
            }
          } catch (e) {
            console.error('Error parsing notification booking content:', e);
          }
        }
      }

      if (hasChanges) {
        localStorage.setItem('pasiones_vip_bookings', JSON.stringify(syncedBookings));
      }

      setBookings(syncedBookings);

      // 3. Fetch user profiles of all participants to display full details (city, category, avatar, etc.)
      const participantIds = Array.from(
        new Set(
          syncedBookings.flatMap((b: any) => [b.profileId, b.clientId])
        )
      ).filter(Boolean);

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
      console.error('Error loading bookings or profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();

    // Listen to database real-time notifications to update instantly
    if (!user) return;
    const channelId = `bookings_page_sync:${user.id}:${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Actions
  const handleAccept = async (booking: any) => {
    try {
      const allBookings = JSON.parse(localStorage.getItem('pasiones_vip_bookings') || '[]');
      const updated = allBookings.map((b: any) => b.id === booking.id ? { ...b, status: 'accepted' } : b);
      localStorage.setItem('pasiones_vip_bookings', JSON.stringify(updated));

      // Send real-time notification to client
      await notificationService.createNotification({
        user_id: booking.clientId,
        sender_id: user?.id,
        type: 'system',
        title: `[BOOKING_ACCEPT] Cita Aceptada`,
        content: JSON.stringify({ id: booking.id, status: 'accepted' }),
        link: `/citas`
      });

      addToast({
        type: 'success',
        message: 'Cita Aceptada 🎉',
        description: 'Has aceptado la reservación. Se notificará al cliente.'
      });
      loadBookings();
    } catch (err) {
      console.error('Error accepting booking:', err);
      addToast({ type: 'error', message: 'Error', description: 'No se pudo aceptar la cita.' });
    }
  };

  const handleReject = async (booking: any) => {
    try {
      const allBookings = JSON.parse(localStorage.getItem('pasiones_vip_bookings') || '[]');
      const updated = allBookings.map((b: any) => b.id === booking.id ? { ...b, status: 'rejected' } : b);
      localStorage.setItem('pasiones_vip_bookings', JSON.stringify(updated));

      // Send real-time notification to client
      await notificationService.createNotification({
        user_id: booking.clientId,
        sender_id: user?.id,
        type: 'system',
        title: `[BOOKING_REJECT] Cita Rechazada`,
        content: JSON.stringify({ id: booking.id, status: 'rejected' }),
        link: `/citas`
      });

      addToast({
        type: 'info',
        message: 'Cita Rechazada 💔',
        description: 'Has rechazado la reservación.'
      });
      loadBookings();
    } catch (err) {
      console.error('Error rejecting booking:', err);
      addToast({ type: 'error', message: 'Error', description: 'No se pudo rechazar la cita.' });
    }
  };

  // Filters
  const receivedBookings = bookings
    .filter((b: any) => b.profileId === user?.id)
    .sort((a, b) => (b.created_at || 0) - (a.created_at || 0));

  const sentBookings = bookings
    .filter((b: any) => b.clientId === user?.id)
    .sort((a, b) => (b.created_at || 0) - (a.created_at || 0));

  const activeBookingsList = activeTab === 'received' ? receivedBookings : sentBookings;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12 pb-32">
      {/* Header Banner */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-black italic tracking-wider uppercase text-white font-display flex items-center justify-center md:justify-start gap-3">
          <Calendar className="text-passion-red animate-pulse" size={32} />
          Mis Citas VIP
        </h1>
        <p className="text-xs text-white/50 font-bold uppercase tracking-widest mt-2 max-w-xl">
          Gestiona todas tus citas discretas solicitadas y recibidas en un solo lugar en tiempo real.
        </p>
      </div>

      {/* Tabs Controller */}
      {profile?.is_verified && (
        <div className="flex bg-zinc-950/80 p-1.5 rounded-2xl border border-white/5 mb-8 max-w-md mx-auto md:mx-0">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 py-3 px-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'received'
                ? 'bg-passion-red text-white shadow-lg'
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            Citas Recibidas
            {receivedBookings.filter(b => b.status === 'pending').length > 0 && (
              <span className="bg-white text-passion-red text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-passion-red">
                {receivedBookings.filter(b => b.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 py-3 px-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'sent'
                ? 'bg-passion-red text-white shadow-lg'
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            Mis Solicitudes
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-passion-red border-t-transparent animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Sincronizando agenda...</p>
        </div>
      ) : activeBookingsList.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-950/40 border border-white/5 rounded-3xl p-12 text-center max-w-xl mx-auto flex flex-col items-center"
        >
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 text-white/20">
            <Calendar size={28} />
          </div>
          <h3 className="text-lg font-bold text-white uppercase tracking-wider italic">No tienes citas registradas</h3>
          <p className="text-xs text-white/40 leading-relaxed mt-2 max-w-sm">
            {activeTab === 'received'
              ? 'Aún no has recibido solicitudes de reserva. Los clientes interesados te contactarán agendando una cita desde tu perfil.'
              : 'Aún no has solicitado ninguna cita discreta. Busca el perfil de tu preferencia y solicítale una cita en su pestaña de reservas.'}
          </p>
          {activeTab === 'sent' && (
            <Link to="/" className="mt-6">
              <Button size="sm" className="font-black uppercase tracking-widest text-[10px] px-8 py-5">
                Explorar Perfiles
              </Button>
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {activeBookingsList.map((booking, index) => {
              // Participant is the companion if looking at sent tab, or the client if looking at received tab
              const participantProfile = activeTab === 'received' 
                ? profilesMap[booking.clientId] 
                : profilesMap[booking.profileId];

              const statusColors = {
                pending: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
                accepted: 'bg-green-500/10 border-green-500/20 text-green-400',
                rejected: 'bg-red-500/10 border-red-500/20 text-red-400',
              };

              const statusLabels = {
                pending: 'Pendiente',
                accepted: 'Aceptada',
                rejected: 'Rechazada',
              };

              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative"
                >
                  <Card className="glass-card border-none overflow-hidden p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    {/* Left details & Profile */}
                    <div className="flex items-start gap-4 flex-1">
                      {/* Avatar preview */}
                      <Link 
                        to={participantProfile ? `/profile/${participantProfile.id}` : '#'}
                        className="relative shrink-0 block"
                      >
                        {participantProfile?.avatar_url ? (
                          <img
                            src={participantProfile.avatar_url}
                            alt="Avatar"
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 md:w-16 md:h-16 rounded-2xl object-cover border border-white/10 group-hover:border-passion-red/50 transition-all duration-300"
                          />
                        ) : (
                          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-white/30">
                            <User size={24} />
                          </div>
                        )}
                        {/* Interactive glow border */}
                        <div className="absolute inset-0 rounded-2xl bg-passion-red/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>

                      {/* Info lines */}
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <Link 
                            to={participantProfile ? `/profile/${participantProfile.id}` : '#'}
                            className="text-base font-bold text-white hover:text-passion-red transition-colors flex items-center gap-1 font-display"
                          >
                            {participantProfile?.full_name || booking.clientName || 'Usuario VIP'}
                            <ChevronRight size={14} className="opacity-40" />
                          </Link>
                          
                          {participantProfile?.city && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-white/5 text-white/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <MapPin size={10} className="text-passion-red" />
                              {participantProfile.city}
                            </span>
                          )}

                          {participantProfile?.category && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-passion-red/10 text-passion-red px-2 py-0.5 rounded-full">
                              {participantProfile.category}
                            </span>
                          )}
                        </div>

                        {/* Booking Schedule Details */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1.5 pt-1 text-[11px] text-white/70">
                          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-white/90">
                            <Calendar size={13} className="text-passion-red" />
                            {booking.date}
                          </span>
                          <span className="flex items-center gap-1.5 text-white/60">
                            <Clock size={13} className="text-passion-red" />
                            {booking.slot}
                          </span>
                        </div>

                        {/* Optional notes */}
                        {booking.notes && (
                          <div className="mt-3 bg-white/[0.02] border border-white/5 rounded-xl p-3 text-xs text-white/50 italic flex gap-2">
                            <FileText size={14} className="text-passion-red shrink-0 mt-0.5" />
                            <p className="line-clamp-2">{booking.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right details & Actions */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                      {/* Status pill badge */}
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${statusColors[booking.status as keyof typeof statusColors] || statusColors.pending}`}>
                        {statusLabels[booking.status as keyof typeof statusLabels] || statusLabels.pending}
                      </span>

                      {/* Quick action triggers */}
                      <div className="flex items-center gap-2">
                        {activeTab === 'received' && booking.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleAccept(booking)}
                              className="bg-green-500 hover:bg-green-600 text-black font-black uppercase tracking-widest text-[9px] h-9 px-3"
                            >
                              <Check size={12} className="mr-1" />
                              Aceptar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(booking)}
                              className="border-red-500/30 hover:bg-red-500/10 text-red-400 font-black uppercase tracking-widest text-[9px] h-9 px-3"
                            >
                              <X size={12} className="mr-1" />
                              Rechazar
                            </Button>
                          </>
                        )}

                        {/* Chat Link Action */}
                        {booking.status === 'accepted' && participantProfile && (
                          <Button
                            size="sm"
                            onClick={() => navigate(`/messages?to=${participantProfile.id}`)}
                            className="bg-passion-red hover:bg-passion-red/80 text-white font-black uppercase tracking-widest text-[9px] h-9 px-4"
                          >
                            <MessageSquare size={12} className="mr-1.5" />
                            Chat Privado
                          </Button>
                        )}

                        {/* External Contact link option for accepted bookings */}
                        {booking.status === 'accepted' && participantProfile?.bio?.toLowerCase().includes('whatsapp') && (
                          <a
                            href={`https://wa.me/${participantProfile.bio.match(/\d+/)?.[0] || ''}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-xl transition-all"
                          >
                            <Phone size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
