
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2 } from 'lucide-react';

interface MediaViewerProps {
  isOpen: boolean;
  url: string | null;
  type: 'image' | 'video' | null;
  onClose: () => void;
}

export function MediaViewer({ isOpen, url, type, onClose }: MediaViewerProps) {
  if (!url || !type) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-md"
          />

          {/* Close Button */}
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onClick={onClose}
            className="absolute right-6 top-6 z-[110] rounded-full bg-white/10 p-3 text-white/70 hover:bg-white/20 hover:text-white transition-all backdrop-blur-md border border-white/10"
          >
            <X size={24} />
          </motion.button>

          {/* Media Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-[105] flex h-full w-full items-center justify-center p-4 md:p-12"
            onClick={(e) => e.stopPropagation()}
          >
            {type === 'video' ? (
              <video
                src={url}
                controls
                autoPlay
                className="max-h-full max-w-full rounded-lg shadow-2xl ring-1 ring-white/10 object-contain"
              />
            ) : (
              <img
                src={url}
                alt="Full screen view"
                className="max-h-full max-w-full rounded-lg shadow-2xl ring-1 ring-white/10 object-contain"
                referrerPolicy="no-referrer"
              />
            )}
          </motion.div>
          
          {/* Hint */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-xs font-medium flex items-center space-x-2"
          >
            <Maximize2 size={12} />
            <span>Vista de pantalla completa</span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
