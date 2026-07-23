import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/src/hooks/useAuth';
import { Heart, Users, UserPlus, Coins, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { OptimizedImage } from '../ui/OptimizedImage';
import { IMAGE_SIZES } from '@/src/lib/images';
import { useUserStats } from '@/src/hooks/useUserStats';
import { useUIStore } from '@/src/store/uiStore';
import { creditsManager } from '@/src/lib/credits';
import { parseProfileBio } from '@/src/utils/profileMetadata';

export default function UserIdentityBar() {
  const { profile } = useAuth();
  const { stats } = useUserStats(profile?.id);
  const setActiveModal = useUIStore((state) => state.setActiveModal);
  const [credits, setCredits] = useState(creditsManager.getCredits());

  useEffect(() => {
    const handleCreditsUpdate = () => {
      setCredits(creditsManager.getCredits());
    };
    window.addEventListener('pasiones_vip_credits_updated', handleCreditsUpdate);
    return () => {
      window.removeEventListener('pasiones_vip_credits_updated', handleCreditsUpdate);
    };
  }, []);

  if (!profile) return null;

  const { metadata } = parseProfileBio(profile.bio || '');
  const hasSocials = !!(
    metadata.instagram ||
    metadata.twitter ||
    metadata.tiktok ||
    metadata.onlyfans ||
    metadata.facebook ||
    metadata.stripchat ||
    metadata.kick ||
    metadata.clapper ||
    metadata.telegram ||
    metadata.whatsapp
  );

  const openModal = (type: 'followers' | 'following' | 'likes') => {
    setActiveModal('stats', { type, userId: profile.id });
  };

  const simulateRecharge = () => {
    setActiveModal('payment');
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

      <div className="relative z-10 container mx-auto max-w-6xl px-4 py-6 md:py-16 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 min-w-0">
          <div className="flex flex-col gap-3 min-w-0">
            <Link to={`/profile/${profile.id}`} className="flex items-center space-x-4 group shrink-0">
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
                  {profile.full_name || 'Usuario VIP'}
                </h2>
                <span className="text-xs font-bold text-white/40 lowercase tracking-wide truncate">
                  @{profile.username || 'usuario'}
                </span>
              </motion.div>
            </Link>

            {/* Social Networks Row */}
            {hasSocials && (
              <div className="flex flex-wrap items-center gap-1.5 pl-1.5 z-20">
                {metadata.instagram && (
                  <a
                    href={metadata.instagram.startsWith('http') ? metadata.instagram : `https://instagram.com/${metadata.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-950/80 border border-white/10 hover:border-pink-600/50 shadow transition-all duration-300"
                    title="Instagram"
                  >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" alt="Instagram" className="w-4 h-4" />
                  </a>
                )}
                {metadata.twitter && (
                  <a
                    href={metadata.twitter.startsWith('http') ? metadata.twitter : `https://x.com/${metadata.twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-950/80 border border-white/10 hover:border-white/50 shadow transition-all duration-300"
                    title="X"
                  >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/57/X_logo_2023_original.svg" alt="X / Twitter" className="w-3.5 h-3.5 invert" />
                  </a>
                )}
                {metadata.tiktok && (
                  <a
                    href={metadata.tiktok.startsWith('http') ? metadata.tiktok : `https://tiktok.com/@${metadata.tiktok.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-950/80 border border-white/10 hover:border-teal-400/50 shadow transition-all duration-300"
                    title="TikTok"
                  >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/34/Ionicons_logo-tiktok.svg" alt="TikTok" className="w-4 h-4 invert" />
                  </a>
                )}
                {metadata.onlyfans && (
                  <a
                    href={metadata.onlyfans.startsWith('http') ? metadata.onlyfans : `https://onlyfans.com/${metadata.onlyfans}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-950/80 border border-white/10 hover:border-sky-400/50 shadow transition-all duration-300"
                    title="OnlyFans"
                  >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Onlyfans_logo.svg" alt="OnlyFans" className="w-4 h-4" />
                  </a>
                )}
                {metadata.facebook && (
                  <a
                    href={metadata.facebook.startsWith('http') ? metadata.facebook : `https://facebook.com/${metadata.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-950/80 border border-white/10 hover:border-blue-600/50 shadow transition-all duration-300"
                    title="Facebook"
                  >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt="Facebook" className="w-4 h-4" />
                  </a>
                )}
                {metadata.stripchat && (
                  <a
                    href={metadata.stripchat.startsWith('http') ? metadata.stripchat : `https://stripchat.com/${metadata.stripchat}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-950/80 border border-white/10 hover:border-red-500/50 shadow transition-all duration-300"
                    title="Stripchat"
                  >
                    <img src="https://stripchat.com/favicon.ico" alt="Stripchat" className="w-4 h-4 rounded-sm" />
                  </a>
                )}
                {metadata.kick && (
                  <a
                    href={metadata.kick.startsWith('http') ? metadata.kick : `https://kick.com/${metadata.kick}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-950/80 border border-white/10 hover:border-green-500/50 shadow transition-all duration-300"
                    title="Kick"
                  >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Kick_logo.svg" alt="Kick" className="w-4 h-4" />
                  </a>
                )}
                {metadata.clapper && (
                  <a
                    href={metadata.clapper.startsWith('http') ? metadata.clapper : `https://clapperapp.com/${metadata.clapper}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-950/80 border border-white/10 hover:border-amber-500/50 shadow transition-all duration-300"
                    title="Clapper"
                  >
                    <img src="https://clapperapp.com/favicon.ico" alt="Clapper" className="w-4 h-4 rounded-sm" />
                  </a>
                )}
                {metadata.telegram && (
                  <a
                    href={metadata.telegram.startsWith('http') ? metadata.telegram : `https://t.me/${metadata.telegram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-950/80 border border-white/10 hover:border-blue-400/50 shadow transition-all duration-300"
                    title="Telegram"
                  >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" alt="Telegram" className="w-4 h-4" />
                  </a>
                )}
                {metadata.whatsapp && (
                  <a
                    href={metadata.whatsapp.startsWith('http') ? metadata.whatsapp : (metadata.whatsapp.match(/^\d+$/) ? `https://wa.me/${metadata.whatsapp}` : `https://wa.me/${metadata.whatsapp.replace(/\D/g, '')}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-950/80 border border-white/10 hover:border-green-500/50 shadow transition-all duration-300"
                    title="WhatsApp"
                  >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Golden Credits Chip */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center space-x-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl px-4 py-2.5 backdrop-blur-md self-start sm:self-auto shadow-lg shadow-amber-500/[0.03]"
          >
            <div className="bg-amber-500/20 p-1.5 rounded-xl text-amber-400">
              <Coins size={14} className="animate-pulse" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-amber-500/60 leading-none tracking-widest font-mono">Cartera Token</p>
              <p className="text-sm font-black text-white leading-none mt-1 font-mono">{credits} <span className="font-sans text-xs font-medium text-white/50">Créditos</span></p>
            </div>
            <button
              onClick={simulateRecharge}
              className="ml-2 flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-black text-[9px] font-black uppercase tracking-wider py-1.5 px-3 rounded-lg transition-all"
              title="Comprar créditos VIP (Pasarela de Pago)"
            >
              <PlusCircle size={11} />
              <span>+ COMPRAR</span>
            </button>
          </motion.div>
        </div>

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
