import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Users, Flame, Star } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { useUIStore } from '@/src/store/uiStore';
import { useAuth } from '@/src/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/src/services/profileService';
import { cn } from '@/src/lib/utils';

export function HomeHero() {
  const setActiveModal = useUIStore((state) => state.setActiveModal);
  const { profile } = useAuth();

  const { data: platformStats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => profileService.fetchPlatformStats(),
    refetchInterval: 60000, // Refresh every minute
  });

  const stats = [
    { 
      label: 'Modelos VIP', 
      value: platformStats ? platformStats.total.toLocaleString() : '...', 
      icon: Star, 
      color: 'text-amber-400' 
    },
    { 
      label: 'Verificadas', 
      value: platformStats ? platformStats.verified.toLocaleString() : '...', 
      icon: ShieldCheck, 
      color: 'text-green-400' 
    },
    { 
      label: 'En Línea', 
      value: platformStats ? platformStats.online.toLocaleString() : '...', 
      icon: Users, 
      color: 'text-blue-400' 
    },
    { 
      label: 'Nuevas Hoy', 
      value: platformStats ? platformStats.newsToday.toLocaleString() : '...', 
      icon: Flame, 
      color: 'text-orange-500' 
    },
  ];

  return (
    <div className="relative mb-16 rounded-[3rem] overflow-hidden">
      {/* Background with Gradient and Pattern */}
      <div className="absolute inset-0 bg-[#0A0A0A]">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-transparent to-transparent opacity-50" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      </div>

      <div className="relative px-8 py-16 lg:py-24 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
            <div className="h-2 w-2 rounded-full bg-primary-600 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 italic">Red Exclusiva de Pasiones VIP</span>
          </div>
          
          <h1 className="text-5xl lg:text-8xl font-black text-white italic uppercase tracking-tighter leading-[0.8] mb-8 drop-shadow-2xl">
            La Élite de la <span className="text-primary-600">PASIÓN</span>
          </h1>
          
          <p className="text-lg lg:text-xl text-white/50 mb-12 max-w-2xl mx-auto font-medium leading-relaxed italic">
            Conecta con los perfiles más exclusivos y verificados. Una experiencia premium diseñada para los gustos más exigentes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {profile?.is_verified ? (
              <Button
                variant="primary"
                size="lg"
                className="h-16 px-10 text-lg font-black uppercase italic tracking-widest shadow-2xl shadow-primary-600/20 hover:scale-105 active:scale-95 transition-all"
                onClick={() => setActiveModal('upload')}
              >
                Publicar Ahora
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                className="h-16 px-10 text-lg font-black uppercase italic tracking-widest shadow-2xl shadow-primary-600/20 hover:scale-105 active:scale-95 transition-all"
                onClick={() => window.location.href = '/auth'}
              >
                Únete a la Red
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              className="h-16 px-10 text-lg font-black uppercase italic tracking-widest border-white/10 hover:bg-white/5 transition-all"
              onClick={() => {
                const feed = document.getElementById('main-feed');
                feed?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Explorar Feed
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-20 w-full max-w-5xl">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className="flex flex-col items-center bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-sm hover:bg-white/[0.05] transition-all group"
            >
              <stat.icon className={cn("mb-4 h-8 w-8 transition-transform group-hover:scale-110", stat.color)} />
              <span className="text-3xl font-black text-white italic tabular-nums">{stat.value}</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mt-2">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Decorative Blur */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-600/20 blur-[120px] rounded-full" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary-900/20 blur-[120px] rounded-full" />
    </div>
  );
}
