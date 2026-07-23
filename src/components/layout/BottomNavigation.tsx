import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { notificationService } from '../../services/notificationService';
import { supabase } from '../../lib/supabase';
import { Home, MessageSquare, Bell, User, Settings, X, Check, Trash2, ShieldCheck, Heart, UserPlus, UserCheck, Info, Loader2, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // If user is not logged in, do not render the bottom navigation
  if (!user) return null;

  // Query notifications to show real-time unread badge
  const { data: notifications = [], isLoading: loadingNotifications } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationService.fetchNotifications(user.id),
    enabled: !!user?.id,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Realtime subscription for real-time updates on bottom bar
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications:bottom_bar:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const handleHomeClick = (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      queryClient.invalidateQueries({ queryKey: ['media'] });
    }
  };

  // Mutation operations for Notifications
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(user.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => notificationService.deleteAllNotifications(user.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare size={15} className="text-primary-400 shrink-0" />;
      case 'verification': return <ShieldCheck size={15} className="text-green-400 shrink-0" />;
      case 'like': return <Heart size={15} className="text-red-400 fill-red-400/20 shrink-0" />;
      case 'follow_request': return <UserPlus size={15} className="text-blue-400 shrink-0" />;
      case 'follow_accept': return <UserCheck size={15} className="text-green-400 shrink-0" />;
      default: return <Info size={15} className="text-blue-400 shrink-0" />;
    }
  };

  const menuItems = [
    {
      label: 'Citas',
      icon: Calendar,
      path: '/citas',
      active: location.pathname === '/citas',
    },
    {
      label: 'Chat',
      icon: MessageSquare,
      path: '/messages',
      active: location.pathname === '/messages',
    },
    // Home button goes in center separately
    {
      label: 'Alertas',
      icon: Bell,
      onClick: () => setIsNotificationsOpen(true),
      active: isNotificationsOpen,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      label: 'Perfil',
      icon: User,
      path: `/profile/${user.id}`,
      active: location.pathname.startsWith('/profile/'),
    },
  ];

  return (
    <>
      {/* Bottom Bar Container */}
      <div className="fixed bottom-0 left-0 right-0 z-40 block md:hidden bg-zinc-950/90 border-t border-white/5 backdrop-blur-2xl px-4 py-2 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.9)]">
        <div className="relative flex items-center justify-between max-w-lg mx-auto h-12">
          
          {/* Left Items (Ajustes, Chat) */}
          <div className="flex w-[40%] justify-around items-center">
            {menuItems.slice(0, 2).map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={idx}
                  to={item.path!}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 relative",
                    item.active 
                      ? "text-passion-red scale-105" 
                      : "text-white/40 hover:text-white"
                  )}
                >
                  <IconComponent size={20} className={cn("transition-transform duration-300", item.active && "drop-shadow-[0_0_6px_rgba(230,0,0,0.4)]")} />
                  <span className="text-[9px] font-black uppercase tracking-widest mt-1 scale-90">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Central Home Button */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-5 flex flex-col items-center justify-center">
            <Link
              to="/"
              onClick={handleHomeClick}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 relative shadow-2xl group",
                location.pathname === '/'
                  ? "bg-passion-red text-white shadow-[0_0_20px_rgba(230,0,0,0.5)] scale-105 border-2 border-white/10"
                  : "bg-zinc-900 text-white/70 border border-white/5 hover:bg-zinc-800"
              )}
            >
              {/* Home glow element */}
              {location.pathname === '/' && (
                <div className="absolute inset-0 rounded-full bg-passion-red blur-md opacity-30 group-hover:opacity-50 transition-opacity" />
              )}
              <Home size={22} className="relative z-10" />
            </Link>
            <span className={cn(
              "text-[9px] font-black uppercase tracking-widest mt-1 scale-90",
              location.pathname === '/' ? "text-passion-red font-bold" : "text-white/30"
            )}>
              Inicio
            </span>
          </div>

          {/* Right Items (Alertas, Perfil) */}
          <div className="flex w-[40%] justify-around items-center">
            {menuItems.slice(2).map((item, idx) => {
              const IconComponent = item.icon;
              const content = item.onClick ? (
                <button
                  onClick={item.onClick}
                  type="button"
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 relative cursor-pointer",
                    item.active 
                      ? "text-passion-red scale-105" 
                      : "text-white/40 hover:text-white"
                  )}
                >
                  {item.badge !== undefined && (
                    <span className="absolute -top-0.5 -right-0.5 bg-passion-red text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-zinc-950 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                  <IconComponent size={20} className={cn("transition-transform duration-300", item.active && "drop-shadow-[0_0_6px_rgba(230,0,0,0.4)]")} />
                  <span className="text-[9px] font-black uppercase tracking-widest mt-1 scale-90">{item.label}</span>
                </button>
              ) : (
                <Link
                  to={item.path!}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 relative",
                    item.active 
                      ? "text-passion-red scale-105" 
                      : "text-white/40 hover:text-white"
                  )}
                >
                  <IconComponent size={20} className={cn("transition-transform duration-300", item.active && "drop-shadow-[0_0_6px_rgba(230,0,0,0.4)]")} />
                  <span className="text-[9px] font-black uppercase tracking-widest mt-1 scale-90">{item.label}</span>
                </Link>
              );

              return <div key={idx}>{content}</div>;
            })}
          </div>

        </div>
      </div>

      {/* Drawer Móvil de Notificaciones */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotificationsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-h-[85vh] bg-zinc-950 border-t border-white/10 rounded-t-[2.5rem] flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.8)] z-10"
            >
              {/* Drag Handle Accent */}
              <div className="w-12 h-1 bg-white/15 rounded-full mx-auto my-3" />

              {/* Header */}
              <div className="px-6 pb-4 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white uppercase italic tracking-tight font-display flex items-center gap-2">
                    <Bell size={16} className="text-passion-red" />
                    Notificaciones
                    {unreadCount > 0 && (
                      <span className="bg-passion-red text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                        {unreadCount} nuevas
                      </span>
                    )}
                  </h3>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">Alertas de tu cuenta en tiempo real</p>
                </div>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="p-2 rounded-full bg-white/5 text-white/60 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Actions Quick Header */}
              {notifications.length > 0 && (
                <div className="px-6 py-2.5 bg-white/[0.02] border-b border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-white/40">
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending || unreadCount === 0}
                    className="flex items-center gap-1.5 hover:text-white disabled:pointer-events-none disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <Check size={12} />
                    Marcar todo leído
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("¿Seguro de eliminar todas tus alertas?")) {
                        deleteAllMutation.mutate();
                      }
                    }}
                    disabled={deleteAllMutation.isPending}
                    className="flex items-center gap-1.5 hover:text-passion-red text-white/40 disabled:pointer-events-none disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} />
                    Limpiar panel
                  </button>
                </div>
              )}

              {/* Notifications Scroll Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar pb-10">
                {loadingNotifications ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-3">
                    <Loader2 size={24} className="animate-spin text-passion-red" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Sincronizando alertas...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-20 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/20">
                      <Bell size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">Sin Notificaciones</h4>
                      <p className="text-[10px] text-white/40 leading-relaxed max-w-xs mx-auto mt-1">
                        Estás al día. Cuando recibas me gustas, nuevos seguidores o mensajes, se listarán aquí al instante.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5 space-y-3">
                    {notifications.map((notification) => {
                      return (
                        <div
                          key={notification.id}
                          onClick={() => {
                            if (!notification.is_read) {
                              markReadMutation.mutate(notification.id);
                            }
                          }}
                          className={cn(
                            "pt-3 first:pt-0 flex items-start gap-3.5 group cursor-pointer transition-colors"
                          )}
                        >
                          {/* Alert Type Icon status wrapper */}
                          <div className={cn(
                            "relative shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-300",
                            notification.is_read
                              ? "bg-zinc-900/50 border-white/5 text-white/40"
                              : "bg-passion-red/10 border-passion-red/25 text-passion-red"
                          )}>
                            {getIcon(notification.type)}
                            {/* Blue dot indicator for unread */}
                            {!notification.is_read && (
                              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-passion-red ring-2 ring-zinc-950" />
                            )}
                          </div>

                          {/* Detail text details */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex justify-between items-start gap-2">
                              <p className={cn(
                                "text-xs leading-relaxed font-semibold transition-colors",
                                notification.is_read ? "text-white/60" : "text-white font-bold"
                              )}>
                                {notification.content}
                              </p>
                            </div>
                            <span className="text-[9px] text-white/30 font-bold uppercase tracking-wider block">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
                            </span>
                          </div>

                          {/* Quick delete / dismiss */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMutation.mutate(notification.id);
                            }}
                            className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:bg-white/5 transition-all text-white/60 hover:text-passion-red cursor-pointer shrink-0"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
