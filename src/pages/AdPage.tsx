import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowLeft, Megaphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/src/components/ui/Button';
import { AdCard } from '@/src/components/ui/AdCard';
import { publicAdService } from '@/src/services/publicAdService';

export default function AdPage() {
  const { adId } = useParams<{ adId: string }>();
  const navigate = useNavigate();

  // Track page impression on load
  useEffect(() => {
    if (adId) {
      publicAdService.trackImpression(adId);
    }
  }, [adId]);

  const queryKey = ['ad', adId];

  const { data: ad, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => {
      if (!adId) return Promise.reject('No adId provided');
      return publicAdService.getAdById(adId);
    },
    enabled: !!adId,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
          <p className="text-xs uppercase tracking-widest text-white/40 font-bold">Cargando publicidad...</p>
        </div>
      </div>
    );
  }

  if (error || !ad) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-500/10 p-4 text-red-400 border border-red-500/20">
            <ArrowLeft size={48} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Publicidad no encontrada</h1>
        <p className="mt-2 text-white/60 text-sm">El anuncio o publicidad que buscas no existe, ha expirado o no está disponible.</p>
        <Button className="mt-8 font-bold uppercase tracking-wider" variant="primary" onClick={() => navigate('/')}>
          Volver al Inicio
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      {/* Back Button & Header */}
      <div className="mb-6 flex items-center justify-between">
        <Button 
          variant="ghost" 
          className="text-white/60 hover:text-white hover:bg-white/5"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Volver
        </Button>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary-600/10 border border-primary-600/20 text-primary-400">
          <Megaphone size={14} className="fill-primary-600/10" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Publicidad Oficial</span>
        </div>
      </div>

      {/* Main Ad Content */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <AdCard ad={ad} queryKey={queryKey} />
      </motion.div>
    </div>
  );
}
