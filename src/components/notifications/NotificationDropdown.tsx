import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../../services/notificationService';
import { useAuth } from '../../hooks/useAuth';
import { Bell, Check, Trash2, Loader2, MessageSquare, ShieldCheck, Info, X, Heart, UserPlus, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

export default function NotificationDropdown() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationService.fetchNotifications(user!.id),
    enabled: !!user?.id,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(user!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => notificationService.deleteAllNotifications(user!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New notification received:', payload);
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status for notifications: ${status}`);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare size={16} className="text-primary-400" />;
      case 'verification': return <ShieldCheck size={16} className="text-green-400" />;
      case 'like': return <Heart size={16} className="text-red-400 fill-red-400/20" />;
      case 'follow_request': return <UserPlus size={16} className="text-blue-400" />;
      case 'follow_accept': return <UserCheck size={16} className="text-green-400" />;
      default: return <Info size={16} className="text-blue-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-lg transition-all hover:bg-white/5",
          isOpen ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
        )}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white shadow-lg ring-2 ring-black animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 overflow-hidden rounded-xl border border-white/10 bg-black/80 shadow-2xl backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-white">Notificaciones</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={() => deleteAllMutation.mutate()}
                    className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider text-left mt-0.5"
                  >
                    Borrar todo
                  </button>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  className="text-xs font-bold text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Marcar leídas
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-white/40">
                  <Bell size={40} strokeWidth={1} className="mb-3 opacity-20" />
                  <p className="text-sm font-medium">No tienes notificaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "group relative flex items-start gap-3 p-4 transition-colors hover:bg-white/5",
                        !notification.is_read && "bg-primary-600/5"
                      )}
                    >
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5">
                        {getIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col space-y-0.5">
                          <p className={cn(
                            "text-sm font-bold leading-tight",
                            notification.is_read ? "text-white/80" : "text-white"
                          )}>
                            {notification.title}
                          </p>
                          <span className="text-[10px] font-medium text-white/30">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
                          </span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-xs text-white/60 leading-relaxed">
                          {notification.content}
                        </p>
                        
                        <div className="mt-3 flex items-center gap-3">
                          {notification.link && (
                            <Link
                              to={notification.link}
                              onClick={() => {
                                if (!notification.is_read) markReadMutation.mutate(notification.id);
                                setIsOpen(false);
                              }}
                              className="text-[10px] font-bold uppercase tracking-wider text-primary-400 hover:text-primary-300 transition-colors"
                            >
                              Ver detalle
                            </Link>
                          )}
                          {!notification.is_read && (
                            <button
                              onClick={() => markReadMutation.mutate(notification.id)}
                              className="text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-white transition-colors"
                            >
                              Leída
                            </button>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => deleteMutation.mutate(notification.id)}
                        className="absolute right-2 top-2 rounded-md p-2 text-white/20 transition-all hover:bg-red-500/10 hover:text-red-400 sm:text-white/0 sm:group-hover:text-white/20"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="border-t border-white/10 p-3 text-center">
               <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">Pasiones Vip v1.0</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
