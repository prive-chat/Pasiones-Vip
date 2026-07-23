import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { storyService } from '@/src/services/storyService';
import { useAuth } from '@/src/hooks/useAuth';
import { optimizeImage } from '@/src/lib/imageOptimization';
import { useNotificationStore } from '@/src/store/notificationStore';

interface StoryUploadModalProps {
  onComplete: () => void;
}

export default function StoryUploadModal({ onComplete }: StoryUploadModalProps) {
  const { user } = useAuth();
  const { addToast } = useNotificationStore();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 20 * 1024 * 1024) {
        addToast({ type: 'error', message: 'El archivo es demasiado grande (Máx 20MB)' });
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!user || !file) return;
    setLoading(true);

    try {
      let finalFile: File | Blob = file;
      const isVideo = file.type.startsWith('video');

      if (!isVideo) {
        finalFile = await optimizeImage(file, { maxWidth: 1080, maxHeight: 1920, quality: 0.8 });
      }

      await storyService.uploadStory(
        user.id,
        finalFile,
        isVideo ? 'video' : 'image'
      );

      addToast({ type: 'success', message: '¡Historia publicada!', description: 'Estará visible por 24 horas.' });
      onComplete();
    } catch (error) {
      console.error('Error uploading story:', error);
      addToast({ type: 'error', message: 'Error al subir la historia' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!preview ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="aspect-[9/16] w-64 mx-auto border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary-500/50 hover:bg-white/[0.02] transition-all group"
        >
          <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Upload size={32} className="text-white/20 group-hover:text-primary-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-black uppercase text-white/40 tracking-widest">Seleccionar Media</p>
            <p className="text-[10px] text-white/20 mt-1 uppercase italic">Imagen o Video VIP</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative aspect-[9/16] w-64 mx-auto rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
            {file?.type.startsWith('video') ? (
              <video src={preview} className="w-full h-full object-contain" autoPlay muted loop />
            ) : (
              <img src={preview} className="w-full h-full object-contain" alt="Preview" />
            )}
            <button 
              onClick={() => { setFile(null); setPreview(null); }}
              className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-passion-red transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex gap-4">
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl font-black uppercase tracking-widest italic"
              onClick={() => { setFile(null); setPreview(null); }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              className="flex-[2] rounded-xl font-black uppercase tracking-widest italic"
              onClick={handleUpload}
              isLoading={loading}
            >
              Publicar Historia
            </Button>
          </div>
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,video/*"
        className="hidden"
      />

      <div className="p-4 rounded-xl bg-primary-600/10 border border-primary-600/20 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary-400 italic">
          Las historias son efímeras y se eliminarán automáticamente después de 24 horas.
        </p>
      </div>
    </div>
  );
}
