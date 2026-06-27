import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { notificationService } from '../services/notificationService';
import { useNotificationStore } from '../store/notificationStore';
import { useBookingSync } from '../hooks/useBookingSync';
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
  Phone,
  RefreshCw,
  Filter,
  Trash2,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BookingsPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const addToast = useNotificationStore((state) => state.addToast);

  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('sent');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'cancelled'>('all');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { bookings, profilesMap, loading, refresh } = useBookingSync();

  // Default tab based on role
  useEffect(() => {
    if (profile?.is_verified) {
      setActiveTab('received');
    } else {
      setActiveTab('sent');
    }
  }, [profile]);

  // Manual pull-to-refresh style helper
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      addToast({
        type: 'success',
        message: 'Agenda Sincronizada 🔄',
        description: 'Tus citas y solicitudes han sido actualizadas en tiempo real.'
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Actions
  const handleAccept = async (booking: any) => {
    try {
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
      refresh();
      if (selectedBooking?.id === booking.id) {
        setSelectedBooking((prev: any) => prev ? { ...prev, status: 'accepted' } : null);
      }
    } catch (err) {
      console.error('Error accepting booking:', err);
      addToast({ type: 'error', message: 'Error', description: 'No se pudo aceptar la cita.' });
    }
  };

  const handleReject = async (booking: any) => {
    try {
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
      refresh();
      if (selectedBooking?.id === booking.id) {
        setSelectedBooking((prev: any) => prev ? { ...prev, status: 'rejected' } : null);
      }
    } catch (err) {
      console.error('Error rejecting booking:', err);
      addToast({ type: 'error', message: 'Error', description: 'No se pudo rechazar la cita.' });
    }
  };

  const handleCancel = async (booking: any) => {
    try {
      const recipientId = user?.id === booking.clientId ? booking.profileId : booking.clientId;
      
      // Send real-time notification to the other party
      await notificationService.createNotification({
        user_id: recipientId,
        sender_id: user?.id,
        type: 'system',
        title: `[BOOKING_CANCEL] Cita Cancelada`,
        content: JSON.stringify({ id: booking.id, status: 'cancelled' }),
        link: `/citas`
      });

      addToast({
        type: 'info',
        message: 'Cita Cancelada ❌',
        description: 'La reservación ha sido cancelada correctamente.'
      });
      refresh();
      if (selectedBooking?.id === booking.id) {
        setSelectedBooking((prev: any) => prev ? { ...prev, status: 'cancelled' } : null);
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      addToast({ type: 'error', message: 'Error', description: 'No se pudo cancelar la cita.' });
    }
  };

  const copyBookingDetails = (booking: any) => {
    const participant = activeTab === 'received' 
      ? profilesMap[booking.clientId] 
      : profilesMap[booking.profileId];
    
    const text = `=== DETALLES DE CITA VIP ===\n` +
      `Participante: ${participant?.full_name || booking.clientName || 'Usuario VIP'}\n` +
      `Fecha: ${booking.date}\n` +
      `Horario: ${booking.slot}\n` +
      `Estado: ${booking.status === 'accepted' ? 'Aceptada' : booking.status === 'rejected' ? 'Rechazada' : booking.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}\n` +
      (booking.notes ? `Notas: ${booking.notes}\n` : '') +
      `=============================`;

    navigator.clipboard.writeText(text);
    addToast({
      type: 'success',
      message: 'Detalles Copiados 📋',
      description: 'Los detalles de la cita se han copiado al portapapeles.'
    });
  };

  // Filters
  const receivedBookings = bookings
    .filter((b: any) => b.profileId === user?.id)
    .sort((a, b) => (b.created_at || 0) - (a.created_at || 0));

  const sentBookings = bookings
    .filter((b: any) => b.clientId === user?.id)
    .sort((a, b) => (b.created_at || 0) - (a.created_at || 0));

  const activeBookingsList = activeTab === 'received' ? receivedBookings : sentBookings;

  const filteredBookingsList = activeBookingsList.filter((b: any) => {
    if (statusFilter === 'all') return true;
    return b.status === statusFilter;
  });

  const statusColors = {
    pending: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    accepted: 'bg-green-500/10 border-green-500/20 text-green-400',
    rejected: 'bg-red-500/10 border-red-500/20 text-red-400',
    cancelled: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400',
  };

  const statusLabels = {
    pending: 'Pendiente',
    accepted: 'Aceptada',
    rejected: 'Rechazada',
    cancelled: 'Cancelada',
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12 pb-32">
      {/* Header Banner */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-black italic tracking-wider uppercase text-white font-display flex items-center justify-center md:justify-start gap-3">
            <Calendar className="text-passion-red animate-pulse" size={32} />
            Mis Citas VIP
          </h1>
          <p className="text-xs text-white/50 font-bold uppercase tracking-widest mt-2 max-w-xl">
            Gestiona todas tus citas discretas solicitadas y recibidas en un solo lugar en tiempo real.
          </p>
        </div>
        <div className="flex justify-center md:justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={handleManualRefresh}
            disabled={isRefreshing || loading}
            className="border-white/10 hover:bg-white/5 text-white/80 font-black uppercase tracking-widest text-[10px] h-10 px-4 flex items-center gap-2 rounded-xl"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            Sincronizar Agenda
          </Button>
        </div>
      </div>

      {/* Tabs Controller */}
      {profile?.is_verified && (
        <div className="flex bg-zinc-950/80 p-1.5 rounded-2xl border border-white/5 mb-8 max-w-md mx-auto md:mx-0">
          <button
            onClick={() => {
              setActiveTab('received');
              setStatusFilter('all');
            }}
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
            onClick={() => {
              setActiveTab('sent');
              setStatusFilter('all');
            }}
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

      {/* Filters Controller */}
      <div className="flex flex-wrap items-center gap-2 mb-8 bg-zinc-950/40 p-3 rounded-2xl border border-white/5">
        <span className="text-[10px] font-black uppercase tracking-wider text-white/40 px-2 flex items-center gap-1">
          <Filter size={12} className="text-passion-red" />
          Filtrar:
        </span>
        {[
          { key: 'all', label: 'Todas' },
          { key: 'pending', label: 'Pendientes' },
          { key: 'accepted', label: 'Aceptadas' },
          { key: 'rejected', label: 'Rechazadas' },
          { key: 'cancelled', label: 'Canceladas' }
        ].map((item) => {
          const isActive = statusFilter === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key as any)}
              className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-white/10 text-white border border-white/20 shadow-md' 
                  : 'text-white/40 hover:text-white/70 border border-transparent'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-passion-red border-t-transparent animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Sincronizando agenda...</p>
        </div>
      ) : filteredBookingsList.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-950/40 border border-white/5 rounded-3xl p-12 text-center max-w-xl mx-auto flex flex-col items-center"
        >
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 text-white/20">
            <Calendar size={28} />
          </div>
          <h3 className="text-lg font-bold text-white uppercase tracking-wider italic font-display">
            No tienes citas {statusFilter !== 'all' ? 'con este estado' : 'registradas'}
          </h3>
          <p className="text-xs text-white/40 leading-relaxed mt-2 max-w-sm">
            {statusFilter !== 'all' 
              ? 'Intenta seleccionar otro filtro en la barra superior.'
              : activeTab === 'received'
                ? 'Aún no has recibido solicitudes de reserva. Los clientes interesados te contactarán agendando una cita desde tu perfil.'
                : 'Aún no has solicitado ninguna cita discreta. Busca el perfil de tu preferencia y solicítale una cita en su pestaña de reservas.'}
          </p>
          {activeTab === 'sent' && statusFilter === 'all' && (
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
            {filteredBookingsList.map((booking, index) => {
              // Participant is the companion if looking at sent tab, or the client if looking at received tab
              const participantProfile = activeTab === 'received' 
                ? profilesMap[booking.clientId] 
                : profilesMap[booking.profileId];

              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative cursor-pointer"
                  onClick={() => setSelectedBooking(booking)}
                >
                  <Card className="glass-card border-none overflow-hidden p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between hover:bg-white/[0.04] transition-all duration-300">
                    {/* Left details & Profile */}
                    <div className="flex items-start gap-4 flex-1 w-full">
                      {/* Avatar preview */}
                      <Link 
                        to={participantProfile ? `/profile/${participantProfile.id}` : '#'}
                        className="relative shrink-0 block"
                        onClick={(e) => e.stopPropagation()}
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
                            onClick={(e) => e.stopPropagation()}
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
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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

      {/* Booking Detail Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            {/* Modal backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              onClick={() => setSelectedBooking(null)}
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-950/95 border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10 p-6 md:p-8"
            >
              {/* Close Icon */}
              <button
                onClick={() => setSelectedBooking(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
              >
                <X size={16} />
              </button>

              {/* Header Participant Profile */}
              {(() => {
                const participant = activeTab === 'received' 
                  ? profilesMap[selectedBooking.clientId] 
                  : profilesMap[selectedBooking.profileId];

                return (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      {participant?.avatar_url ? (
                        <img
                          src={participant.avatar_url}
                          alt={participant.full_name || 'Usuario'}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-2xl object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-white/30">
                          <User size={28} />
                        </div>
                      )}
                      
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-passion-red block mb-1">
                          {activeTab === 'received' ? 'Cliente VIP' : 'Acompañante VIP'}
                        </span>
                        <h3 className="text-xl font-bold text-white font-display truncate">
                          {participant?.full_name || selectedBooking.clientName || 'Usuario VIP'}
                        </h3>
                        {participant?.city && (
                          <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5">
                            <MapPin size={12} className="text-passion-red" />
                            {participant.city}
                          </p>
                        )}
                      </div>
                    </div>

                    <hr className="border-white/5" />

                    {/* Booking metadata */}
                    <div className="grid grid-cols-2 gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40 block">Fecha</span>
                        <p className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Calendar size={14} className="text-passion-red" />
                          {selectedBooking.date}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40 block">Horario</span>
                        <p className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Clock size={14} className="text-passion-red" />
                          {selectedBooking.slot}
                        </p>
                      </div>
                    </div>

                    {/* State info */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/40 block">Estado de la reserva</span>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${statusColors[selectedBooking.status as keyof typeof statusColors] || statusColors.pending}`}>
                          {statusLabels[selectedBooking.status as keyof typeof statusLabels] || statusLabels.pending}
                        </span>
                        
                        {selectedBooking.status === 'pending' && (
                          <span className="text-xs text-amber-400/80 italic flex items-center gap-1">
                            <AlertCircle size={12} />
                            Esperando respuesta
                          </span>
                        )}
                        {selectedBooking.status === 'accepted' && (
                          <span className="text-xs text-green-400/80 italic flex items-center gap-1">
                            <Check size={12} />
                            Confirmada
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Discreet notes */}
                    {selectedBooking.notes && (
                      <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40 block">Notas adicionales</span>
                        <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 text-xs text-white/70 leading-relaxed italic flex gap-2">
                          <FileText size={16} className="text-passion-red shrink-0 mt-0.5" />
                          <p>{selectedBooking.notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Action buttons footer inside modal */}
                    <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
                      {/* Copy summary button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyBookingDetails(selectedBooking)}
                        className="w-full border-white/10 hover:bg-white/5 text-white/80 font-black uppercase tracking-widest text-[10px] py-4 rounded-xl flex items-center justify-center gap-1.5"
                      >
                        <Copy size={12} />
                        Copiar Detalles de Cita
                      </Button>

                      {/* External profile link */}
                      {participant && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedBooking(null);
                            navigate(`/profile/${participant.id}`);
                          }}
                          className="w-full border-white/10 hover:bg-white/5 text-white/80 font-black uppercase tracking-widest text-[10px] py-4 rounded-xl flex items-center justify-center gap-1.5"
                        >
                          <User size={12} />
                          Ver Perfil del Participante
                        </Button>
                      )}

                      {/* Accept/Reject actions for companions */}
                      {activeTab === 'received' && selectedBooking.status === 'pending' && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <Button
                            size="sm"
                            onClick={() => handleAccept(selectedBooking)}
                            className="bg-green-500 hover:bg-green-600 text-black font-black uppercase tracking-widest text-[10px] py-4 rounded-xl flex items-center justify-center gap-1"
                          >
                            <Check size={13} />
                            Aceptar Cita
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(selectedBooking)}
                            className="border-red-500/30 hover:bg-red-500/10 text-red-400 font-black uppercase tracking-widest text-[10px] py-4 rounded-xl flex items-center justify-center gap-1"
                          >
                            <X size={13} />
                            Rechazar Cita
                          </Button>
                        </div>
                      )}

                      {/* Chat action for accepted bookings */}
                      {selectedBooking.status === 'accepted' && participant && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(null);
                            navigate(`/messages?to=${participant.id}`);
                          }}
                          className="w-full bg-passion-red hover:bg-passion-red/80 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-xl flex items-center justify-center gap-1.5 mt-2"
                        >
                          <MessageSquare size={13} />
                          Abrir Chat Privado
                        </Button>
                      )}

                      {/* Cancellation action for pending or accepted bookings */}
                      {(selectedBooking.status === 'pending' || selectedBooking.status === 'accepted') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (window.confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
                              handleCancel(selectedBooking);
                              setSelectedBooking(null);
                            }
                          }}
                          className="w-full border-red-500/20 hover:bg-red-500/10 text-red-400/80 hover:text-red-400 font-black uppercase tracking-widest text-[10px] py-4 rounded-xl flex items-center justify-center gap-1.5 mt-2"
                        >
                          <Trash2 size={12} />
                          Cancelar Reservación
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
