import { useState, useEffect } from 'react';
import { UserProfile } from '@/src/types';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/hooks/useAuth';
import { useNotificationStore } from '@/src/store/notificationStore';

interface VisitorBookingFormProps {
  profile: UserProfile | null;
  setActiveTab: (tab: 'posts' | 'reviews' | 'agenda' | 'about') => void;
}

export function VisitorBookingForm({ profile, setActiveTab }: VisitorBookingFormProps) {
  const { user: currentUser, profile: currentUserProfile } = useAuth();
  const addToast = useNotificationStore((state) => state.addToast);

  const [bookingDay, setBookingDay] = useState('');
  const [bookingSlot, setBookingSlot] = useState('Noche/VIP (19:00 - 02:00)');
  const [bookingNotes, setBookingNotes] = useState('');

  // Generate next 7 days starting from tomorrow
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + 1 + i);
    return {
      fullStr: d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }),
      dayNum: d.getDate(),
      dayName: d.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase(),
      dateKey: d.toISOString().split('T')[0]
    };
  });

  // Set default booking day if empty
  useEffect(() => {
    if (!bookingDay && days.length > 0) {
      setBookingDay(days[0].fullStr);
    }
  }, [bookingDay, days]);

  const handleCreateBooking = () => {
    if (!currentUser) {
      addToast({ type: 'error', message: 'Inicia Sesión', description: 'Debes tener una cuenta registrada para reservar.' });
      return;
    }

    const allBookings = JSON.parse(localStorage.getItem('pasiones_vip_bookings') || '[]');
    
    // Check for duplicates
    if (allBookings.some((b: any) => b.profileId === profile?.id && b.clientId === currentUser?.id && b.date === bookingDay && b.status === 'pending')) {
      addToast({ type: 'info', message: 'Reserva Existente', description: 'Ya tienes una reserva pendiente para esta fecha.' });
      return;
    }

    const newBooking = {
      id: 'book-' + Math.random().toString(36).substring(2, 11),
      profileId: profile?.id,
      clientId: currentUser.id,
      clientName: currentUserProfile?.full_name || currentUserProfile?.username || currentUser?.email || 'Cliente VIP',
      date: bookingDay,
      slot: bookingSlot,
      notes: bookingNotes,
      status: 'pending',
      created_at: Date.now()
    };

    allBookings.push(newBooking);
    localStorage.setItem('pasiones_vip_bookings', JSON.stringify(allBookings));
    
    addToast({
      type: 'success',
      message: '¡Cita Reservada Enviada!',
      description: `Tu solicitud para el ${bookingDay} está pendiente de aprobación.`
    });
    
    setBookingNotes('');
    setActiveTab('agenda'); // Force re-render
  };

  const visitorBookings = JSON.parse(localStorage.getItem('pasiones_vip_bookings') || '[]')
    .filter((b: any) => b.profileId === profile?.id && b.clientId === currentUser?.id);

  return (
    <Card className="glass-card border-none p-6 md:p-8">
      <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-widest italic">Nueva Solicitud de Cita Discreta</h3>
      
      <div className="space-y-6">
        {/* Day selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-white/40 uppercase tracking-widest italic ml-1">1. Selecciona la Fecha</label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {days.map((day) => (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => setBookingDay(day.fullStr)}
                className={cn(
                  "py-3 px-1 rounded-xl flex flex-col items-center justify-center border transition-all duration-300",
                  bookingDay === day.fullStr
                    ? "bg-primary-600 border-primary-500 scale-105 shadow-lg shadow-primary-600/30 font-black text-white"
                    : "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10 text-white/70"
                )}
              >
                <span className="text-[9px] font-bold text-white/30 uppercase">{day.dayName}</span>
                <span className={cn("text-lg font-black mt-0.5", bookingDay === day.fullStr ? 'text-white' : 'text-white/80')}>{day.dayNum}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Slot selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-white/40 uppercase tracking-widest italic ml-1">2. Jornada / Turno deseado</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              'Mañana (09:00 - 13:00)',
              'Tarde (14:00 - 18:00)',
              'Noche/VIP (19:00 - 02:00)'
            ].map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setBookingSlot(slot)}
                className={cn(
                  "py-3 px-4 rounded-xl text-xs font-bold border text-center transition-all",
                  bookingSlot === slot
                    ? "bg-primary-600/25 border-primary-500 text-white shadow-md font-black"
                    : "bg-white/5 border-white/5 text-white/40 hover:text-white/60"
                )}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Description notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-white/40 uppercase tracking-[0.15em] italic ml-1">3. Detalles adicionales (opcional)</label>
          <textarea
            value={bookingNotes}
            onChange={(e) => setBookingNotes(e.target.value)}
            placeholder="Detalles sobre el punto de encuentro, duración deseada o preferencias..."
            className="w-full min-h-[100px] rounded-2xl bg-white/5 border border-white/10 p-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all resize-none italic"
          />
        </div>

        <Button
          onClick={handleCreateBooking}
          className="w-full h-12 bg-primary-600 hover:bg-primary-500 text-white font-black uppercase text-xs italic tracking-widest"
        >
          Solicitar Reserva Discreta 🔒
        </Button>

        {/* Client history with this creator */}
        {visitorBookings.length > 0 && (
          <div className="pt-6 border-t border-white/10 mt-6 text-left">
            <h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">Mis reservas anteriores con {profile?.full_name?.split(' ')[0]}</h4>
            <div className="space-y-3">
              {visitorBookings.map((vb: any) => (
                <div key={vb.id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white">📅 {vb.date}</span>
                      <span className="text-white/40 font-mono">({vb.slot})</span>
                    </div>
                    {vb.notes && <p className="text-[10px] text-white/30 truncate max-w-xs italic">"{vb.notes}"</p>}
                  </div>
                  <span className={cn(
                    "font-black tracking-widest text-[8px] uppercase px-2 py-0.5 rounded border shrink-0",
                    vb.status === 'accepted' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                    vb.status === 'rejected' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                    "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  )}>
                    {vb.status === 'accepted' ? 'Aceptada' : vb.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
