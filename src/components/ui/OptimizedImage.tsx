import { useState, useMemo, ImgHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon } from 'lucide-react';
import { getOptimizedImageUrl, ImageTransformOptions } from '@/src/lib/images';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  fallbackIcon?: ReactNode;
  transform?: ImageTransformOptions;
}

export function OptimizedImage({ 
  src, 
  alt, 
  className, 
  containerClassName,
  fallbackIcon,
  transform,
  ...props 
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const optimizedSrc = useMemo(() => {
    if (!src) return null;
    return getOptimizedImageUrl(src, transform);
  }, [src, transform]);

  return (
    <div className={cn("relative overflow-hidden bg-zinc-900/50", containerClassName)}>
      <AnimatePresence>
        {!isLoaded && !hasError && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-full h-full animate-pulse bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800" />
          </motion.div>
        )}
      </AnimatePresence>

      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20 gap-2">
          {fallbackIcon || <ImageIcon className="w-8 h-8" />}
          <span className="text-xs font-medium">Error al cargar</span>
        </div>
      ) : (
        <motion.img
          src={optimizedSrc || ''}
          alt={alt}
          className={cn("w-full h-full", className)}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          initial={false}
          animate={isLoaded ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : { opacity: 0, scale: 1.05, filter: 'blur(20px)' }}
          transition={{ duration: 0.7 }}
        />
      )}
    </div>
  );
}
