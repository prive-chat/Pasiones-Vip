import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/src/services/profileService';
import { OptimizedImage } from '@/src/components/ui/OptimizedImage';
import { BadgeCheck, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/hooks/useAuth';
import { useUIStore } from '@/src/store/uiStore';

export function HighlightStories() {
  const { profile: currentUser } = useAuth();
  const setActiveModal = useUIStore((state) => state.setActiveModal);
  
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['profiles', 'highlights'],
    queryFn: () => profileService.searchProfiles(''),
  });

  if (isLoading && users.length === 0) return (
    <div className="flex gap-4 overflow-hidden mb-12 py-2">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="shrink-0 w-24 h-24 rounded-full bg-white/5 animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="relative mb-12 group">
      <div className="flex items-center gap-3 mb-6 px-4">
        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Perfiles Destacados</h3>
        <div className="h-px flex-1 bg-white/5" />
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 px-4 no-scrollbar scroll-smooth">
        {/* Your Story Trigger */}
        <button 
          onClick={() => currentUser?.is_verified ? setActiveModal('upload') : window.location.href = '/auth'}
          className="flex flex-col items-center gap-3 shrink-0 group/story"
        >
          <div className="relative p-1 rounded-[2rem] bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-xl ring-2 ring-white/10 group-hover/story:ring-primary-500 transition-all duration-500">
            <div className="h-20 w-20 rounded-[1.8rem] overflow-hidden bg-black/40 flex items-center justify-center">
              {currentUser?.avatar_url ? (
                <OptimizedImage src={currentUser.avatar_url} alt="" className="w-full h-full object-cover opacity-60 grayscale group-hover/story:grayscale-0 group-hover/story:opacity-100 transition-all duration-500" />
              ) : (
                <div className="h-full w-full bg-white/5 flex items-center justify-center text-white/20">
                  <Plus size={32} />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/story:opacity-100 transition-opacity bg-primary-600/20">
                <Plus size={24} className="text-white drop-shadow-xl" />
              </div>
            </div>
          </div>
          <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter italic">Publicar</span>
        </button>

        {/* User Stories */}
        {users.map((user, idx) => (
          <Link 
            key={user.id} 
            to={`/profile/${user.id}`}
            className="flex flex-col items-center gap-3 shrink-0 group/item"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "relative p-1 rounded-[2rem] bg-gradient-to-br from-primary-600 to-primary-900 shadow-[0_10px_30px_-10px_rgba(230,0,0,0.3)] ring-2 ring-primary-500/50 group-hover/item:scale-105 transition-all duration-500",
                !user.is_verified && "from-zinc-800 to-zinc-900 border-white/10 ring-transparent"
              )}
            >
              <div className="h-20 w-20 rounded-[1.8rem] overflow-hidden bg-black">
                {user.avatar_url ? (
                  <OptimizedImage src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-white/5 flex items-center justify-center text-xl font-black text-white/20">
                    {user.full_name?.[0] || 'U'}
                  </div>
                )}
              </div>
              {user.is_verified && (
                <div className="absolute -bottom-1 -right-1 rounded-full bg-primary-600 p-0.5 border-2 border-[#0A0A0A] shadow-xl">
                  <BadgeCheck size={14} className="text-white" />
                </div>
              )}
            </motion.div>
            <span className="text-[10px] font-black text-white/60 uppercase tracking-tighter truncate w-24 text-center italic group-hover/item:text-primary-400 transition-colors">
              {user.full_name?.split(' ')[0] || 'Usuario'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
