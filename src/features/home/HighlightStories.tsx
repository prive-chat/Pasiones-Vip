import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { storyService, Story } from '@/src/services/storyService';
import { OptimizedImage } from '@/src/components/ui/OptimizedImage';
import { BadgeCheck, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/hooks/useAuth';
import { useUIStore } from '@/src/store/uiStore';

export function HighlightStories() {
  const { profile: currentUser } = useAuth();
  const setActiveModal = useUIStore((state) => state.setActiveModal);
  
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['stories', 'active'],
    queryFn: () => storyService.fetchActiveStories(),
    refetchInterval: 60000 * 5, // Refresh every 5 minutes
  });

  // Group stories by user (optional, but requested behavior is "Stories that delete in 24h")
  // For the UI, we'll show each story as an item for now, or just unique users.
  // Let's show the most recent story from each user to avoid clutter.
  const uniqueUserStories = stories.reduce((acc: Story[], curr) => {
    if (!acc.find(s => s.user_id === curr.user_id)) {
      acc.push(curr);
    }
    return acc;
  }, []);

  if (isLoading && stories.length === 0) return (
    <div className="flex gap-4 overflow-hidden mb-12 py-2 px-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="shrink-0 w-24 h-24 rounded-full bg-white/5 animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="relative mb-12 group">
      <div className="flex items-center gap-3 mb-6 px-4">
        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Historias VIP</h3>
        <div className="h-px flex-1 bg-white/5" />
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 px-4 no-scrollbar scroll-smooth">
        {/* Story Upload Trigger */}
        <button 
          onClick={() => currentUser?.is_verified ? setActiveModal('story_upload') : window.location.href = '/auth'}
          className="flex flex-col items-center gap-3 shrink-0 group/story"
        >
          <div className="relative p-1 rounded-[2rem] bg-zinc-950 ring-2 ring-white/5 group-hover/story:ring-primary-500/50 transition-all duration-500">
            <div className="h-20 w-20 rounded-[1.8rem] overflow-hidden bg-white/[0.02] flex items-center justify-center">
              {currentUser?.avatar_url ? (
                <OptimizedImage src={currentUser.avatar_url} alt="" className="w-full h-full object-cover opacity-40 grayscale group-hover/story:grayscale-0 group-hover/story:opacity-100 transition-all duration-500" />
              ) : (
                <Plus size={32} className="text-white/10" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-primary-600/20 opacity-0 group-hover/story:opacity-100 transition-opacity">
                <Plus size={24} className="text-white drop-shadow-xl" />
              </div>
            </div>
          </div>
          <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter italic">Historias +</span>
        </button>

        {/* Active Stories */}
        {uniqueUserStories.map((story, idx) => (
          <button 
            key={story.id} 
            onClick={() => setActiveModal('story_view', { stories: stories.filter(s => s.user_id === story.user_id), index: 0 })}
            className="flex flex-col items-center gap-3 shrink-0 group/item"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="relative p-1 rounded-[2rem] bg-gradient-to-br from-primary-600 to-primary-900 ring-2 ring-primary-500 shadow-[0_0_20px_rgba(230,0,0,0.3)] group-hover/item:scale-105 transition-all duration-500"
            >
              <div className="h-20 w-20 rounded-[1.8rem] overflow-hidden bg-black flex items-center justify-center">
                {story.media_type === 'video' ? (
                  <video 
                    src={story.media_url + '#t=0.1'} 
                    className="w-full h-full object-cover min-w-full min-h-full"
                    muted
                    playsInline
                  />
                ) : (
                  <OptimizedImage 
                    src={story.media_url} 
                    alt="" 
                    className="w-full h-full object-cover" 
                    containerClassName="w-full h-full"
                  />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 rounded-full bg-primary-600 p-0.5 border-2 border-black shadow-xl">
                <BadgeCheck size={14} className="text-white" />
              </div>
            </motion.div>
            <span className="text-[10px] font-black text-white/60 uppercase tracking-tighter truncate w-24 text-center italic group-hover/item:text-primary-400 transition-colors">
              {story.profiles?.full_name?.split(' ')[0]}
            </span>
          </button>
        ))}

        {uniqueUserStories.length === 0 && (
          <div className="flex items-center gap-4 py-4 px-4 bg-white/[0.02] rounded-3xl border border-white/5 border-dashed">
             <p className="text-[10px] font-black text-white/10 uppercase tracking-widest whitespace-nowrap">No hay historias activas de modelos verificadas</p>
          </div>
        )}
      </div>
    </div>
  );
}
