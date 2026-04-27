import React from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/src/hooks/useAuth';
import { Heart, Users, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { OptimizedImage } from '../ui/OptimizedImage';
import { IMAGE_SIZES } from '@/src/lib/images';
import { useUserStats } from '@/src/hooks/useUserStats';
import { useUIStore } from '@/src/store/uiStore';

export default function UserIdentityBar() {
  const { profile } = useAuth();
  const { stats } = useUserStats(profile?.id);
  const setActiveModal = useUIStore((state) => state.setActiveModal);

  if (!profile) return null;

  const openModal = (type: 'followers' | 'following' | 'likes') => {
    setActiveModal('stats', { type, userId: profile.id });
  };

  return (
    <div className="relative w-full overflow-hidden border-b border-white/5">
      {/* Cover Photo Background */}
      {profile.cover_url ? (
        <div className="absolute inset-0 z-0">
          <OptimizedImage 
            src={profile.cover_url} 
            alt="Portada" 
            className="h-full w-full object-cover" 
            containerClassName="h-full w-full"
            transform={IMAGE_SIZES.COVER}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent backdrop-blur-[1px]" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-zinc-950/50 backdrop-blur-md" />
      )}

      <div className="relative z-10 container mx-auto max-w-6xl px-4 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <Link to={`/profile/${profile.id}`} className="flex items-center space-x-4 group min-w-0">
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="h-14 w-14 rounded-2xl bg-zinc-900 border border-white/10 shadow-xl overflow-hidden neon-glow shrink-0 group-hover:scale-105 transition-transform"
          >
            {profile.avatar_url ? (
              <OptimizedImage 
                src={profile.avatar_url} 
                alt={profile.full_name || 'Perfil'} 
                className="h-full w-full object-cover" 
                containerClassName="h-full w-full"
                transform={IMAGE_SIZES.AVATAR_MD}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-passion-red/20 text-passion-red font-bold text-2xl">
                {profile.full_name?.[0] || 'U'}
              </div>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col min-w-0"
          >
            <h2 className="text-xl font-black text-white truncate uppercase italic tracking-tight group-hover:text-passion-red transition-colors">
              {profile.full_name || 'Usuario Privé'}
            </h2>
            <span className="text-xs font-bold text-white/40 lowercase tracking-wide truncate">
              @{profile.username || 'usuario'}
            </span>
          </motion.div>
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-around sm:justify-start gap-4 sm:gap-8 border-t border-white/5 pt-4 sm:border-t-0 sm:pt-0"
        >
          <button 
            onClick={() => openModal('followers')}
            className="flex flex-col items-center sm:items-start group/stat"
          >
            <div className="flex items-center gap-1.5 text-white/40 mb-1 group-hover/stat:text-passion-red transition-colors">
              <Users size={14} className="text-passion-red" />
              <span className="text-[10px] font-black uppercase tracking-widest">Seguidores</span>
            </div>
            <span className="text-lg font-black text-white group-hover/stat:scale-110 transition-transform origin-left">{stats?.followers || 0}</span>
          </button>

          <button 
            onClick={() => openModal('following')}
            className="flex flex-col items-center sm:items-start group/stat"
          >
            <div className="flex items-center gap-1.5 text-white/40 mb-1 group-hover/stat:text-passion-red transition-colors">
              <UserPlus size={14} className="text-passion-red" />
              <span className="text-[10px] font-black uppercase tracking-widest">Siguiendo</span>
            </div>
            <span className="text-lg font-black text-white group-hover/stat:scale-110 transition-transform origin-left">{stats?.following || 0}</span>
          </button>

          <button 
            onClick={() => openModal('likes')}
            className="flex flex-col items-center sm:items-start group/stat"
          >
            <div className="flex items-center gap-1.5 text-white/40 mb-1 group-hover/stat:text-passion-red transition-colors">
              <Heart size={14} className="text-passion-red" />
              <span className="text-[10px] font-black uppercase tracking-widest">Me gusta</span>
            </div>
            <span className="text-lg font-black text-white group-hover/stat:scale-110 transition-transform origin-left">{stats?.likes || 0}</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
