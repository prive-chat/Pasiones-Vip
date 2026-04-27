import { useState, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { Ad } from '@/src/types';
import { publicAdService } from '@/src/services/publicAdService';
import { ExternalLink, Megaphone, X, Maximize2, Share2, Flame, Laugh, Heart, CheckCircle2, Copy, Facebook, Twitter, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Button } from './Button';
import { useAuth } from '@/src/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface AdCardProps {
  ad: Ad;
  queryKey?: any[];
}

const REACTIONS = [
  { type: 'heart', icon: Heart, color: 'text-red-500', fill: 'fill-red-500' },
  { type: 'fire', icon: Flame, color: 'text-orange-500', fill: 'fill-orange-500' },
  { type: 'laugh', icon: Laugh, color: 'text-yellow-500', fill: 'fill-yellow-500' },
];

export const AdCard = memo(({ ad, queryKey = ['active-ads', 'feed'] }: AdCardProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const shareUrl = ad.link_url || `${window.location.origin}/ad/${ad.id}`;
  const shareText = `¡Mira esta oferta!: ${ad.title}`;

  const shareActions = [
    { 
      name: 'WhatsApp', 
      icon: Send, 
      color: 'bg-[#25D366]', 
      action: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank') 
    },
    { 
      name: 'Facebook', 
      icon: Facebook, 
      color: 'bg-[#1877F2]', 
      action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank') 
    },
    { 
      name: 'Twitter', 
      icon: Twitter, 
      color: 'bg-[#1DA1F2]', 
      action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank') 
    },
    { 
      name: 'Copiar', 
      icon: Copy, 
      color: 'bg-gray-600', 
      action: async () => {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } 
    },
  ];

  const reactionMutation = useMutation({
    mutationFn: ({ reactionType, isLiked }: { reactionType: string; isLiked: boolean }) => {
      const currentUserId = user?.id;
      if (!currentUserId) {
        // Redirect to login or show modal
        return Promise.reject('No authenticated user');
      }
      if (isLiked && ad.reaction_type === reactionType) {
        return publicAdService.unlikeAd(currentUserId, ad.id);
      }
      return publicAdService.toggleReaction(currentUserId, ad.id, reactionType);
    },
    onMutate: async ({ reactionType }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousAds = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        const updateItem = (item: Ad) => {
          if (item.id !== ad.id) return item;
          
          const isSameReaction = item.is_liked && item.reaction_type === reactionType;
          let newLikesCount = item.likes_count || 0;
          
          if (isSameReaction) {
            newLikesCount = Math.max(0, newLikesCount - 1);
          } else if (!item.is_liked) {
            newLikesCount += 1;
          }

          return {
            ...item,
            is_liked: !isSameReaction,
            reaction_type: isSameReaction ? null : reactionType,
            likes_count: newLikesCount
          };
        };

        if (Array.isArray(old)) return old.map(updateItem);
        return old;
      });

      return { previousAds };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousAds);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const shareMutation = useMutation({
    mutationFn: async () => {
      await publicAdService.shareAd(ad.id);
      const shareUrl = ad.link_url || window.location.href;
      const shareData = {
        title: ad.title,
        text: `¡Mira esta oferta!: ${ad.description || ''}`,
        url: shareUrl,
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
        } catch (err) {
          if ((err as Error).name !== 'AbortError') throw err;
        }
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((item: Ad) => 
          item.id === ad.id ? { ...item, shares_count: (item.shares_count || 0) + 1 } : item
        );
      });

      setIsSharing(true);
      setTimeout(() => setIsSharing(false), 2000);
      return { previousData };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  useEffect(() => {
    publicAdService.trackImpression(ad.id);
  }, [ad.id]);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen]);

  const handleLinkClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ad.link_url) return;
    await publicAdService.trackClick(ad.id);
    window.open(ad.link_url, '_blank', 'noopener,noreferrer');
  };

  const handleCardClick = () => {
    setIsFullscreen(true);
  };

  const currentReaction = REACTIONS.find(r => r.type === ad.reaction_type) || REACTIONS[0];
  const ReactionIcon = currentReaction.icon;

  const hasLink = !!ad.link_url;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={cn(
          "relative group overflow-hidden rounded-3xl bg-[#0A0A0A] border border-white/5 transition-all duration-500",
          "cursor-pointer hover:border-primary-600/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]"
        )}
        onClick={handleCardClick}
      >
        {/* Ad Badge */}
        <div className="absolute top-4 left-4 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 shadow-xl">
          <Megaphone size={12} className="text-primary-500 fill-primary-500/20" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Patrocinado</span>
        </div>

        {/* Image/Video Container */}
        <div className="relative overflow-hidden bg-black/40">
          {ad.image_url && (
            ad.type === 'video' ? (
              <video 
                src={ad.image_url} 
                className="w-full h-auto max-h-[600px] object-contain transition-transform duration-700 group-hover:scale-105"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img 
                src={ad.image_url} 
                alt={ad.title}
                loading="lazy"
                decoding="async"
                className="w-full h-auto max-h-[600px] object-contain transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
            )
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-80" />
          
          {/* Fullscreen Hint */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-black/20 backdrop-blur-[2px] z-20">
             <motion.div 
               whileHover={{ scale: 1.1 }}
               whileTap={{ scale: 0.9 }}
               className="p-4 rounded-full bg-primary-600 text-white shadow-[0_0_40px_rgba(230,0,0,0.5)] border border-primary-400/20"
             >
               <Maximize2 size={24} />
             </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex flex-col">
              <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none group-hover:text-primary-400 transition-colors">
                {ad.title}
              </h4>
              {ad.description && (
                <p className="text-sm text-white/50 mt-3 line-clamp-2 leading-relaxed font-medium">
                  {ad.description}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative" onMouseEnter={() => setShowReactions(true)} onMouseLeave={() => setShowReactions(false)}>
                <AnimatePresence>
                  {showReactions && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.8 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-black/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl z-50 mb-2 pb-4"
                    >
                      <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-full border border-white/5">
                        {REACTIONS.map((reaction) => (
                          <motion.button
                            key={reaction.type}
                            whileHover={{ scale: 1.3 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              reactionMutation.mutate({ reactionType: reaction.type, isLiked: !!ad.is_liked });
                              setShowReactions(false);
                            }}
                            className={cn(
                              "p-2 rounded-full transition-colors",
                              ad.reaction_type === reaction.type ? "bg-white/10" : "hover:bg-white/5"
                            )}
                          >
                            <reaction.icon 
                              size={20} 
                              className={cn(
                                reaction.color,
                                ad.reaction_type === reaction.type && reaction.fill
                              )} 
                            />
                          </motion.button>
                        ))}
                      </div>
                      {/* Invisible bridge to prevent closing */}
                      <div className="absolute -bottom-2 left-0 right-0 h-4 bg-transparent" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    reactionMutation.mutate({ 
                      reactionType: ad.reaction_type || 'heart', 
                      isLiked: !!ad.is_liked 
                    });
                  }}
                  className={cn(
                    "flex items-center space-x-2 rounded-xl px-4 py-2 transition-all duration-300 group/like",
                    ad.is_liked ? "bg-primary-600/10 text-primary-400" : "text-white/40 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <motion.div
                    animate={ad.is_liked ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <ReactionIcon 
                      size={20} 
                      className={cn(
                        ad.is_liked ? currentReaction.fill : "group-hover/like:text-primary-400"
                      )} 
                    />
                  </motion.div>
                  <span className="text-xs font-black italic tracking-wider">{ad.likes_count || 0}</span>
                </button>
              </div>

              <div className="relative" onMouseEnter={() => setShowShareMenu(true)} onMouseLeave={() => setShowShareMenu(false)}>
                <AnimatePresence>
                  {showShareMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.8 }}
                      className="absolute right-0 bottom-full flex items-center gap-2 p-1.5 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 mb-2 pb-4"
                    >
                      <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
                        {shareActions.map((action) => (
                          <motion.button
                            key={action.name}
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.action();
                              shareMutation.mutate();
                              if (action.name !== 'Copiar') setShowShareMenu(false);
                            }}
                            className={cn(
                              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all hover:bg-white/10 min-w-[60px]",
                              action.color.replace('bg-', 'text-')
                            )}
                          >
                            <div className={cn("p-2 rounded-lg text-white", action.color)}>
                              {action.name === 'Copiar' && isCopied ? <CheckCircle2 size={18} /> : <action.icon size={18} />}
                            </div>
                            <span className="text-[10px] font-bold text-white/60 uppercase tracking-tighter">
                              {action.name === 'Copiar' && isCopied ? 'Listo' : action.name}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                      {/* Invisible bridge to prevent closing */}
                      <div className="absolute -bottom-2 left-0 right-0 h-4 bg-transparent" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowShareMenu(!showShareMenu);
                  }}
                  className={cn(
                    "flex items-center space-x-2 rounded-xl px-4 py-2 transition-all duration-300",
                    isSharing ? "bg-primary-600/10 text-primary-400" : "text-white/40 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Share2 size={20} className={cn(isSharing && "animate-pulse")} />
                  <span className="text-xs font-black italic tracking-wider">{ad.shares_count || 0}</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-6">
            {hasLink && (
              <Button
                onClick={handleLinkClick}
                variant="primary"
                className="w-full font-black uppercase tracking-[0.2em] italic h-14 rounded-2xl shadow-[0_10px_20px_-5px_rgba(230,0,0,0.3)] hover:shadow-[0_20px_40px_-10px_rgba(230,0,0,0.5)] transition-all group/btn"
              >
                {ad.cta_text || 'Saber más'}
                <ExternalLink size={18} className="ml-3 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
              </Button>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary-600 animate-pulse" />
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                Platinum Partner
              </span>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className={cn(
                  "h-1 w-5 rounded-full bg-white/5 transition-all duration-500 group-hover:bg-primary-600/40",
                  i === 1 && "group-hover:w-8 group-hover:bg-primary-600"
                )} />
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Fullscreen Overlay using Portal */}
      {isFullscreen && createPortal(
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center p-4 lg:p-12 overflow-y-auto"
            onClick={() => setIsFullscreen(false)}
          >
            {/* Close Button */}
            <button 
              className="fixed top-6 right-6 lg:top-12 lg:right-12 p-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all z-[100000] shadow-2xl"
              onClick={(e) => {
                e.stopPropagation();
                setIsFullscreen(false);
              }}
            >
              <X size={32} />
            </button>

            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-8 lg:gap-16 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Media Container */}
              <div className="w-full lg:w-3/5 rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 bg-black flex items-center justify-center shrink-0">
                {ad.image_url && (
                  ad.type === 'video' ? (
                    <video 
                      src={ad.image_url} 
                      className="w-full h-auto max-h-[75vh] object-contain"
                      autoPlay
                      controls
                      loop
                      playsInline
                    />
                  ) : (
                    <img 
                      src={ad.image_url} 
                      alt={ad.title}
                      decoding="async"
                      className="w-full h-auto max-h-[75vh] object-contain shadow-2xl"
                      referrerPolicy="no-referrer"
                    />
                  )
                )}
              </div>

              {/* Text Container */}
              <div className="w-full lg:w-2/5 space-y-10 flex flex-col items-center lg:items-start text-center lg:text-left">
                <div className="space-y-6">
                  <div className="flex items-center justify-center lg:justify-start gap-4 text-primary-400">
                    <div className="p-3 rounded-2xl bg-primary-600/10 backdrop-blur-xl border border-primary-600/20">
                      <Megaphone size={28} />
                    </div>
                    <span className="text-sm font-black uppercase tracking-[0.4em]">Destacado</span>
                  </div>
                  <h2 className="text-5xl lg:text-8xl font-black text-white italic uppercase tracking-tighter leading-[0.8]">
                    {ad.title}
                  </h2>
                  {ad.description && (
                    <p className="text-xl lg:text-2xl text-white/40 leading-relaxed max-w-lg font-medium">
                      {ad.description}
                    </p>
                  )}
                </div>

                {hasLink && (
                  <Button
                    onClick={handleLinkClick}
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto px-16 h-24 text-3xl font-black uppercase tracking-widest italic shadow-[0_0_60px_rgba(230,0,0,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_80px_rgba(230,0,0,0.6)] rounded-[2rem]"
                  >
                    {ad.cta_text || 'Saber más'}
                    <ExternalLink size={32} className="ml-4" />
                  </Button>
                )}

                <div className="pt-10 border-t border-white/5 w-full flex items-center justify-center lg:justify-start gap-6">
                   <div className="h-4 w-4 rounded-full bg-primary-600 animate-pulse shadow-[0_0_20px_rgba(230,0,0,0.5)]" />
                   <span className="text-sm font-black text-white/10 uppercase tracking-[0.5em]">Pasiones Vip Platinum Partner</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
});

AdCard.displayName = 'AdCard';
