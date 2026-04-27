import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageSquare, Trash2, Maximize2, CheckCircle2, Share2, Flame, Laugh, Heart as HeartIcon, Copy, Facebook, Twitter, Send } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaService } from '../services/mediaService';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent } from './ui/Card';
import { cn } from '../lib/utils';
import { MediaItem } from '../types';
import { OptimizedImage } from './ui/OptimizedImage';
import { IMAGE_SIZES } from '../lib/images';
import { Button } from './ui/Button';

interface MediaCardProps {
  item: MediaItem;
  index: number;
  onView: (url: string, type: 'image' | 'video') => void;
  onDelete?: (id: string) => void;
  queryKey: any[];
}

const REACTIONS = [
  { type: 'heart', icon: HeartIcon, color: 'text-red-500', fill: 'fill-red-500' },
  { type: 'fire', icon: Flame, color: 'text-orange-500', fill: 'fill-orange-500' },
  { type: 'laugh', icon: Laugh, color: 'text-yellow-500', fill: 'fill-yellow-500' },
];

const MediaCard = memo(({ item, index, onView, onDelete, queryKey }: MediaCardProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showReactions, setShowReactions] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const shareUrl = `${window.location.origin}/post/${item.id}`;
  const shareText = item.caption || '¡Mira esta publicación en Pasiones Vip!';

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

  const likeMutation = useMutation({
    mutationFn: ({ mediaId, reactionType, currentReaction }: { mediaId: string; reactionType: string; currentReaction?: string | null }) => {
      // If it's already liked with the SAME reaction, unlike it. Otherwise, react/update reaction.
      if (item.is_liked && currentReaction === reactionType) {
        return mediaService.unlikeMedia(user!.id, mediaId);
      }
      return mediaService.likeMedia(user!.id, mediaId, reactionType);
    },
    onMutate: async ({ reactionType, currentReaction }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);

      const isSameReaction = item.is_liked && currentReaction === reactionType;

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;

        const updateItem = (post: MediaItem) => {
          if (post.id !== item.id) return post;
          
          let newLikesCount = post.likes_count || 0;
          if (isSameReaction) {
            newLikesCount = Math.max(0, newLikesCount - 1);
          } else if (!post.is_liked) {
            newLikesCount += 1;
          }

          return {
            ...post,
            is_liked: !isSameReaction,
            reaction_type: isSameReaction ? null : reactionType,
            likes_count: newLikesCount
          };
        };

        if (old.pages) {
          return {
            ...old,
            pages: old.pages.map((page: any) => page.map(updateItem))
          };
        }
        return old.map(updateItem);
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const shareMutation = useMutation({
    mutationFn: async () => {
      await mediaService.shareMedia(item.id);
      const shareUrl = `${window.location.origin}/post/${item.id}`;
      const shareData = {
        title: item.caption || 'Publicación en Pasiones Vip',
        text: 'Mira esta publicación en Pasiones Vip',
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
        if (!old) return old;
        const updateItem = (post: MediaItem) => 
          post.id === item.id ? { ...post, shares_count: (post.shares_count || 0) + 1 } : post;

        if (old.pages) {
          return {
            ...old,
            pages: old.pages.map((page: any) => page.map(updateItem))
          };
        }
        return old.map(updateItem);
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

  const currentReaction = REACTIONS.find(r => r.type === item.reaction_type) || REACTIONS[0];
  const ReactionIcon = currentReaction.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="overflow-hidden bg-[#0A0A0A] border border-white/5 group/card shadow-2xl rounded-3xl transition-all duration-500 hover:border-primary-600/30">
        <div 
          className="aspect-[4/5] w-full bg-black/40 relative cursor-pointer overflow-hidden flex items-center justify-center"
          onClick={() => onView(item.url, item.type as 'image' | 'video')}
        >
          <div 
            className="absolute inset-0 opacity-20 blur-3xl scale-150 transition-transform duration-700 group-hover/card:scale-100"
            style={{ 
              backgroundImage: item.type === 'image' ? `url(${item.url})` : 'none',
              backgroundColor: item.type === 'video' ? 'rgba(0,0,0,0.5)' : 'transparent',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          
          {item.url && (
            item.type === 'video' ? (
              <video src={item.url} className="relative z-10 h-full w-full object-contain" />
            ) : (
              <OptimizedImage 
                src={item.url} 
                alt={item.caption || ''} 
                className="relative z-10 h-full w-full object-contain transition-all duration-700 group-hover/card:scale-105" 
                containerClassName="h-full w-full"
                transform={IMAGE_SIZES.FEED_POST}
              />
            )
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
          
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center z-20">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="rounded-full bg-primary-600/80 p-4 backdrop-blur-md border border-white/20 shadow-2xl"
            >
              <Maximize2 size={24} className="text-white" />
            </motion.div>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <Link to={`/profile/${item.user_id}`} className="flex items-center space-x-3 group/user">
              <div className="h-10 w-10 rounded-full bg-primary-600/10 flex items-center justify-center text-primary-400 font-black text-sm overflow-hidden ring-2 ring-white/5 transition-all group-hover/user:ring-primary-600/50 group-hover/user:scale-110 shadow-lg">
                {item.profiles?.avatar_url ? (
                  <OptimizedImage 
                    src={item.profiles.avatar_url} 
                    alt="" 
                    className="h-full w-full object-cover" 
                    containerClassName="h-full w-full"
                    transform={IMAGE_SIZES.AVATAR_SM}
                  />
                ) : (
                  item.profiles?.full_name?.[0] || 'U'
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm font-black text-white group-hover/user:text-primary-400 transition-colors uppercase tracking-tight italic">
                    {item.profiles?.full_name || 'Miembro de la Red'}
                  </span>
                  {item.profiles?.is_verified && (
                    <CheckCircle2 size={14} className="text-primary-400 fill-primary-400/10" />
                  )}
                </div>
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </span>
              </div>
            </Link>
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
                            onClick={() => {
                              likeMutation.mutate({ 
                                mediaId: item.id, 
                                reactionType: reaction.type,
                                currentReaction: item.reaction_type
                              });
                              setShowReactions(false);
                            }}
                            className={cn(
                              "p-2 rounded-full transition-colors",
                              item.reaction_type === reaction.type ? "bg-white/10" : "hover:bg-white/5"
                            )}
                          >
                            <reaction.icon 
                              size={20} 
                              className={cn(
                                reaction.color,
                                item.reaction_type === reaction.type && reaction.fill
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
                  onClick={() => likeMutation.mutate({ 
                    mediaId: item.id, 
                    reactionType: item.reaction_type || 'heart',
                    currentReaction: item.reaction_type
                  })}
                  className={cn(
                    "flex items-center space-x-2 rounded-xl px-4 py-2 transition-all duration-300 group/like",
                    item.is_liked ? "bg-primary-600/10 text-primary-400" : "text-white/40 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <motion.div
                    animate={item.is_liked ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <ReactionIcon 
                      size={20} 
                      className={cn(
                        item.is_liked ? currentReaction.fill : "group-hover/like:text-primary-400"
                      )} 
                    />
                  </motion.div>
                  <span className="text-xs font-black italic tracking-wider">{item.likes_count || 0}</span>
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
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className={cn(
                    "flex items-center space-x-2 rounded-xl px-4 py-2 transition-all duration-300",
                    isSharing ? "bg-primary-600/10 text-primary-400" : "text-white/40 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Share2 size={20} className={cn(isSharing && "animate-pulse")} />
                  <span className="text-xs font-black italic tracking-wider">{item.shares_count || 0}</span>
                </button>
              </div>

              {item.profiles?.is_verified && item.user_id !== user?.id && (
                <Link
                  to={`/messages?to=${item.user_id}&ref=${item.id}`}
                  className="rounded-xl p-2 text-white/20 hover:bg-white/5 hover:text-primary-400 transition-colors"
                >
                  <MessageSquare size={20} />
                </Link>
              )}

              {item.user_id === user?.id && onDelete && (
                <button
                  onClick={() => onDelete(item.id)}
                  className="rounded-xl p-2 text-white/20 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          </div>
          {item.caption && (
            <p className="text-sm text-white/50 line-clamp-3 leading-relaxed font-medium bg-white/5 p-4 rounded-2xl border border-white/5">
              {item.caption}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});

MediaCard.displayName = 'MediaCard';

export default MediaCard;
