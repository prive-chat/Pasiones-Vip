import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/src/store/uiStore';
import { X } from 'lucide-react';

import MediaUpload from '@/src/features/upload/MediaUpload';
import StatsModal from '@/src/components/layout/StatsModal';
import AdModal from '@/src/components/admin/AdModal';

export default function ModalCenter() {
  const { activeModal, modalData, closeModal } = useUIStore();

  if (!activeModal) return null;

  const renderContent = () => {
    switch (activeModal) {
      case 'upload':
        return <MediaUpload onUploadComplete={closeModal} />;
      case 'stats':
        return <StatsModal type={modalData?.type} userId={modalData?.userId} onClose={closeModal} />;
      case 'ad':
        return <AdModal ad={modalData} onClose={closeModal} onSuccess={modalData?.onSuccess} />;
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (activeModal) {
      case 'upload': return 'Subir Contenido';
      case 'stats': return 'Estadísticas';
      case 'ad': return modalData ? 'Editar Anuncio' : 'Nuevo Anuncio';
      default: return '';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-md" 
          onClick={closeModal}
        />

        {/* Modal Shell */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <h2 className="text-xl font-black uppercase tracking-widest passion-text">
              {getTitle()}
            </h2>
            <button
              onClick={closeModal}
              className="p-2 rounded-full hover:bg-white/5 transition-colors text-white/40 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[80vh] overflow-y-auto no-scrollbar">
            {renderContent()}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
