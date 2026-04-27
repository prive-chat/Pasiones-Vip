import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore, NotificationType } from '@/src/store/notificationStore';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const icons: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle2 className="text-green-400" size={20} />,
  error: <AlertCircle className="text-red-400" size={20} />,
  info: <Info className="text-blue-400" size={20} />,
  warning: <AlertTriangle className="text-amber-400" size={20} />,
  progress: <Loader2 className="text-primary-400 animate-spin" size={20} />,
};

export default function ToastContainer() {
  const { toasts, removeToast } = useNotificationStore();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="pointer-events-auto"
          >
            <div className={cn(
              "relative overflow-hidden rounded-2xl border bg-black/80 backdrop-blur-xl p-4 shadow-2xl",
              toast.type === 'progress' ? "border-white/10" : "border-white/5"
            )}>
              <div className="flex gap-3">
                <div className="shrink-0 mt-0.5">
                  {icons[toast.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{toast.message}</h4>
                  {toast.description && (
                    <p className="mt-1 text-xs text-white/40 leading-relaxed line-clamp-2">
                      {toast.description}
                    </p>
                  )}
                  {toast.type === 'progress' && typeof toast.progress === 'number' && (
                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/20">
                        <span>Cargando... {toast.progress}%</span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          className="h-full bg-primary-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${toast.progress}%` }}
                          transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="shrink-0 rounded-full p-1 text-white/20 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
