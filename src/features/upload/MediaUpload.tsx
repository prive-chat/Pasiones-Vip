import React, { useState, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { mediaService } from '@/src/services/mediaService';
import { Button } from '@/src/components/ui/Button';
import { Upload, X, AlertCircle, Loader2, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/src/hooks/useAuth';
import { useNotificationStore } from '@/src/store/notificationStore';
import imageCompression from 'browser-image-compression';
import { cn } from '@/src/lib/utils';

interface MediaUploadProps {
  onUploadComplete: () => void;
}

export default function MediaUpload({ onUploadComplete }: MediaUploadProps) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { addToast, updateToast } = useNotificationStore();
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (selectedFile: File) => {
    const isImage = selectedFile.type.startsWith('image/');
    const isVideo = selectedFile.type.startsWith('video/');

    if (!isImage && !isVideo) {
      setError('Solo se permiten imágenes y videos.');
      return;
    }

    const maxSize = isVideo ? 100 * 1024 * 1024 : 20 * 1024 * 1024; // Increased limits slightly
    if (selectedFile.size > maxSize) {
      setError(`El archivo es demasiado grande. Máximo ${isVideo ? '100MB' : '20MB'}.`);
      return;
    }

    let fileToUpload = selectedFile;

    if (isImage) {
      setIsCompressing(true);
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        fileToUpload = await imageCompression(selectedFile, options);
      } catch (err) {
        console.error('Compression error:', err);
      } finally {
        setIsCompressing(false);
      }
    }

    setFile(fileToUpload);
    setError(null);
    const url = URL.createObjectURL(fileToUpload);
    setPreview(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) processFile(droppedFile);
  }, []);

  const handleUpload = async () => {
    if (!file || !user) return;

    setIsUploading(true);
    setError(null);
    
    // Close modal immediately for "background" feel
    onUploadComplete();
    
    // Create toast with progress
    const toastId = addToast({
      type: 'progress',
      message: 'Subiendo contenido...',
      description: caption || 'Preparando publicación',
      progress: 0,
      duration: 0
    });

    try {
      await mediaService.uploadMedia(
        user.id,
        file,
        file.type.startsWith('video') ? 'video' : 'image',
        caption,
        (progress) => {
          setUploadProgress(progress);
          updateToast(toastId, { progress });
        }
      );

      // Success toast
      updateToast(toastId, {
        type: 'success',
        message: '¡Publicación exitosa!',
        description: 'Tu contenido ya está disponible en el feed.',
        duration: 4000
      });

      queryClient.invalidateQueries({ queryKey: ['media'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats', user.id] });
    } catch (err: any) {
      console.error('Upload error:', err);
      updateToast(toastId, {
        type: 'error',
        message: 'Error en la subida',
        description: err.message || 'No se pudo publicar el contenido.',
        duration: 6000
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!profile?.is_verified) {
    return (
      <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-12 text-center backdrop-blur-xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-500">
          <AlertCircle size={40} />
        </div>
        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Acceso Restringido</h3>
        <p className="mt-4 text-sm font-medium text-white/40 leading-relaxed max-w-xs mx-auto">
          Solo los perfiles verificados pueden compartir contenido. 
          Un administrador revisará tu cuenta pronto.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          "relative flex min-h-[320px] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-all duration-500 group overflow-hidden",
          isDragging ? "border-primary-500 bg-primary-500/10 scale-[0.98]" : "border-white/10 bg-white/5",
          preview ? "border-transparent" : "hover:border-white/20 hover:bg-white/10 cursor-pointer",
          isUploading && "cursor-not-allowed opacity-50"
        )}
      >
        {preview ? (
          <div className="relative h-full w-full p-4 flex items-center justify-center group/preview">
            {file?.type.startsWith('video') ? (
              <video src={preview} className="max-h-[400px] w-full rounded-2xl object-contain shadow-2xl z-10" controls={false} muted loop autoPlay />
            ) : (
              <img src={preview} alt="Vista previa" className="max-h-[400px] w-full rounded-2xl object-contain shadow-2xl z-10" referrerPolicy="no-referrer" />
            )}
            
            {/* Overlay Actions */}
            <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm rounded-2xl">
               <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setPreview(null);
                  setError(null);
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-600 text-white font-bold text-sm shadow-xl hover:bg-red-700 transition-colors"
              >
                <X size={18} />
                Remover Archivo
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4 text-center p-8">
             <div className={cn(
               "p-6 rounded-3xl bg-white/5 transition-all duration-500",
               isDragging ? "scale-110 bg-primary-600/20 text-primary-400" : "group-hover:bg-primary-600/10 text-white/40 group-hover:text-primary-400"
             )}>
              {isCompressing ? (
                <Loader2 size={48} className="animate-spin" />
              ) : (
                <Upload size={48} strokeWidth={1.5} />
              )}
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">
                {isDragging ? '¡Suéltalo aquí!' : 'Sube tu pasión'}
              </h4>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest leading-relaxed max-w-[240px]">
                Arrastra archivos o haz clic para seleccionar (MP4, PNG, JPG)
              </p>
            </div>
            
            <div className="flex gap-4 pt-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-white/20 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                <ImageIcon size={12} />
                Imágenes <span className="text-primary-400/50">20MB</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-white/20 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                <VideoIcon size={12} />
                Videos <span className="text-primary-400/50">100MB</span>
              </div>
            </div>
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,video/*"
          className="hidden"
          disabled={isUploading || isCompressing}
        />
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 rounded-2xl bg-red-500/10 p-5 text-sm font-bold text-red-400 border border-red-500/20"
          >
            <AlertCircle size={20} className="shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {file && !error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Descripción de la publicación</label>
              <textarea
                placeholder="¿Qué está pasando ahora?..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-base text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all min-h-[120px] resize-none"
                disabled={isUploading}
              />
            </div>

            <Button 
              onClick={handleUpload} 
              className="w-full h-16 text-lg font-black uppercase italic tracking-tighter shadow-[0_0_30px_rgba(230,0,0,0.15)] hover:shadow-primary-600/30 transition-shadow" 
              isLoading={isUploading}
              disabled={isUploading || isCompressing}
            >
              Compartir ahora
            </Button>
            
            <p className="text-center text-[10px] font-bold text-white/20 uppercase tracking-widest pb-4">
              Al publicar, aceptas nuestras normas de seguridad y exclusividad.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
