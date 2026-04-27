import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { mediaService } from '@/src/services/mediaService';
import { MediaItem } from '@/src/types';
import { Card, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Heart, ArrowLeft, MessageSquare, CheckCircle2, Maximize2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { MediaViewer } from '@/src/components/ui/MediaViewer';
import { useAuth } from '@/src/hooks/useAuth';
import { cn } from '@/src/lib/utils';
import { Ad } from '@/src/types';
import { publicAdService } from '@/src/services/publicAdService';
import { AdCard } from '@/src/components/ui/AdCard';

export default function PostPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [viewerMedia, setViewerMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    const fetchAds = async () => {
      const activeAds = await publicAdService.getActiveAds('sidebar');
      setAds(activeAds);
    };
    fetchAds();
  }, []);

  const queryKey = ['post', postId, user?.id];

  const { data: item, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => mediaService.fetchMediaItem(postId!, user?.id),
    enabled: !!postId,
  });

  const likeMutation = useMutation({
    mutationFn: ({ mediaId, isLiked }: { mediaId: string; isLiked: boolean }) => 
      isLiked ? mediaService.unlikeMedia(user!.id, mediaId) : mediaService.likeMedia(user!.id, mediaId),
    onMutate: async ({ isLiked }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousPost = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          is_liked: !isLiked,
          likes_count: (old.likes_count || 0) + (isLiked ? -1 : 1)
        };
      });

      return { previousPost };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousPost);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      // Also invalidate feed and trending since they might contain this post
      queryClient.invalidateQueries({ queryKey: ['media'] });
      queryClient.invalidateQueries({ queryKey: ['trending'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12 text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-500/10 p-4 text-red-400 border border-red-500/20">
            <ArrowLeft size={48} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white">Publicación no encontrada</h1>
        <p className="mt-2 text-white/60">La publicación que buscas no existe o ha sido eliminada.</p>
        <Button className="mt-8" onClick={() => navigate('/')}>Volver al Inicio</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Button 
        variant="ghost" 
        className="mb-6 text-white/60 hover:text-white"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-5 w-5" />
        Volver
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="overflow-hidden glass-card border-none">
          <div 
            className="aspect-square w-full bg-black/40 relative cursor-pointer overflow-hidden flex items-center justify-center"
            onClick={() => setViewerMedia({ url: item.url, type: item.type as 'image' | 'video' })}
          >
            <div 
              className="absolute inset-0 opacity-30 blur-2xl scale-110"
              style={{ 
                backgroundImage: item.type === 'image' ? `url(${item.url})` : 'none',
                backgroundColor: item.type === 'video' ? 'rgba(0,0,0,0.5)' : 'transparent',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            
            {item.url && (
              item.type === 'video' ? (
                <video src={item.url} className="relative z-10 h-full w-full object-contain" controls />
              ) : (
                <img 
                  src={item.url} 
                  alt={item.caption || ''} 
                  className="relative z-10 h-full w-full object-contain" 
                  referrerPolicy="no-referrer" 
                />
              )
            )}
            
            <div className="absolute top-4 right-4 z-20">
              <div className="rounded-full bg-black/40 p-2 backdrop-blur-md border border-white/10">
                <Maximize2 size={20} className="text-white" />
              </div>
            </div>
          </div>

          <CardContent className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <Link to={`/profile/${item.user_id}`} className="flex items-center space-x-3 group">
                <div className="h-12 w-12 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 font-bold overflow-hidden ring-2 ring-white/10 transition-transform group-hover:scale-110">
                  {item.profiles?.avatar_url ? (
                    <img src={item.profiles.avatar_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    item.profiles?.full_name?.[0] || 'U'
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-1">
                    <span className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors">
                      {item.profiles?.full_name || 'Miembro de la Red'}
                    </span>
                    {item.profiles?.is_verified && (
                      <CheckCircle2 size={18} className="text-primary-400" />
                    )}
                  </div>
                  <p className="text-xs text-white/40">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </p>
                </div>
              </Link>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => likeMutation.mutate({ mediaId: item.id, isLiked: !!item.is_liked })}
                  className={cn(
                    "flex items-center space-x-2 rounded-full px-4 py-2 transition-all duration-300",
                    item.is_liked ? "bg-primary-600/20 text-primary-400" : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Heart size={20} className={cn(item.is_liked && "fill-current")} />
                  <span className="text-sm font-bold">{item.likes_count || 0}</span>
                </button>

                {item.user_id !== user?.id && item.profiles?.is_verified && (
                  <Link to={`/messages?to=${item.user_id}&ref=${item.id}`}>
                    <Button variant="primary" size="sm" className="rounded-full">
                      <MessageSquare size={20} className="mr-2" />
                      Mensaje
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {item.caption && (
              <div className="rounded-xl bg-white/5 p-4 border border-white/10">
                <p className="text-white/80 whitespace-pre-wrap">{item.caption}</p>
              </div>
            )}

            {/* Ad below post */}
            {ads.length > 0 && (
              <div className="mt-8 pt-8 border-t border-white/5">
                <AdCard ad={ads[0]} />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <MediaViewer
        isOpen={!!viewerMedia}
        url={viewerMedia?.url || null}
        type={viewerMedia?.type || null}
        onClose={() => setViewerMedia(null)}
      />
    </div>
  );
}
