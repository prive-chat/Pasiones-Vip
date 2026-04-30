import { useState } from 'react';
import { optimizeImage, validateFile } from '../lib/imageOptimization';

interface UseImageUploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxMB?: number;
  allowedTypes?: string[];
}

export const useImageUpload = (options: UseImageUploadOptions = {}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processImage = async (file: File): Promise<Blob | File | null> => {
    setIsOptimizing(true);
    setError(null);

    const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const validation = validateFile(file, allowedTypes, options.maxMB || 10);

    if (!validation.valid) {
      setError(validation.error || 'Archivo no válido');
      setIsOptimizing(false);
      return null;
    }

    try {
      if (file.type === 'image/gif') {
        setIsOptimizing(false);
        return file;
      }

      const optimized = await optimizeImage(file, {
        maxWidth: options.maxWidth || 1200,
        maxHeight: options.maxHeight || 1200,
        quality: options.quality || 0.8
      });

      setIsOptimizing(false);
      return optimized;
    } catch (err: any) {
      console.error('Error in useImageUpload:', err);
      setError('Error al procesar la imagen.');
      setIsOptimizing(false);
      return file; // Fallback to original
    }
  };

  return { processImage, isOptimizing, error, setError };
};
