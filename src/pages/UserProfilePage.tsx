import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';
import { UserProfile, MediaItem } from '@/src/types';
import { Card, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { 
  BadgeCheck, 
  Mail, 
  Calendar, 
  User as UserIcon, 
  MessageSquare, 
  ArrowLeft, 
  LayoutGrid, 
  Maximize2,
  Lock,
  UserPlus,
  UserMinus,
  UserCheck,
  Clock,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { MediaViewer } from '@/src/components/ui/MediaViewer';
import { mediaService } from '@/src/services/mediaService';
import { profileService } from '@/src/services/profileService';
import { useAuth } from '@/src/hooks/useAuth';
import { cn } from '@/src/lib/utils';
import { useMutation, useQueryClient, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import MediaCard from '@/src/components/MediaCard';
import { Loader2 } from 'lucide-react';
import { ProfileSkeleton } from '@/src/components/Skeletons';
import { useUserStats } from '@/src/hooks/useUserStats';

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { stats: followCounts } = useUserStats(userId);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerMedia, setViewerMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [followStatus, setFollowStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const { user: currentUser } = useAuth();
  const isMe = currentUser?.id === userId;
  const observerTarget = useRef(null);

  const queryKey = ['user-media', userId, currentUser?.id];

  const {
    data: mediaData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 0 }) => mediaService.fetchUserMedia(userId!, currentUser?.id, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 12 ? allPages.length : undefined;
    },
    enabled: !!userId && (isMe || !profile?.is_private || followStatus === 'accepted'),
  });

  const media = mediaData?.pages.flat() || [];

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      setLoading(true);
      setError(null);

      try {
        // Fetch profile
        const profileData = await profileService.fetchProfile(userId);
        setProfile(profileData);

        // Fetch follow status
        if (currentUser && !isMe) {
          const status = await profileService.fetchFollowStatus(currentUser.id, userId);
          setFollowStatus(status);
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err.message);
        setError('No se pudo cargar el perfil del usuario.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, currentUser, isMe]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage]);

  const handleFollow = async () => {
    if (!currentUser || !userId || !profile) return;
    try {
      await profileService.followUser(currentUser.id, userId, profile.is_private);
      setFollowStatus(profile.is_private ? 'pending' : 'accepted');
      queryClient.invalidateQueries({ queryKey: ['user-stats', userId] });
    } catch (err) {
      console.error('Error following user:', err);
    }
  };

  const handleUnfollow = async () => {
    if (!currentUser || !userId) return;
    try {
      await profileService.unfollowUser(currentUser.id, userId);
      setFollowStatus('none');
      queryClient.invalidateQueries({ queryKey: ['user-stats', userId] });
    } catch (err) {
      console.error('Error unfollowing user:', err);
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12 text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-500/10 p-4 text-red-400 border border-red-500/20">
            <ArrowLeft size={48} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white">Perfil no encontrado</h1>
        <p className="mt-2 text-white/60">{error || 'El usuario que buscas no existe o ha sido eliminado.'}</p>
        <Link to="/">
          <Button className="mt-8">Volver al Inicio</Button>
        </Link>
      </div>
    );
  }

  const canViewContent = isMe || !profile.is_private || followStatus === 'accepted';

  return (
    <div className="min-h-screen pb-20">
      {/* Header/Cover Area */}
      <div 
        className={cn(
          "h-48 w-full relative md:h-64 overflow-hidden",
          profile.cover_url && "cursor-pointer group"
        )}
        onClick={() => profile.cover_url && setViewerMedia({ url: profile.cover_url, type: 'image' })}
      >
        {profile.cover_url ? (
          <img 
            src={profile.cover_url} 
            alt="Portada" 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-primary-600 to-primary-800 opacity-40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>
      
      <div className="container mx-auto max-w-5xl px-4">
        <div className="relative -mt-24 mb-8 flex flex-col items-center md:flex-row md:items-end md:space-x-6">
          {/* Avatar */}
          <div className="relative">
            <div className="h-40 w-40 rounded-full border-4 border-black/20 bg-white/10 shadow-2xl overflow-hidden backdrop-blur-md">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.full_name} 
                  className="h-full w-full object-cover cursor-pointer transition-opacity duration-300 hover:opacity-90"
                  referrerPolicy="no-referrer"
                  onClick={() => setViewerMedia({ url: profile.avatar_url!, type: 'image' })}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white/20">
                  <UserIcon size={64} />
                </div>
              )}
            </div>
            {profile.is_verified && (
              <div className="absolute bottom-2 right-2 rounded-full bg-primary-600 p-1 shadow-lg">
                <BadgeCheck size={28} className="text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="mt-6 flex-1 text-center md:mt-0 md:pb-4 md:text-left">
            <Link to={`/profile/${profile.id}`}>
              <h1 className="text-3xl font-bold text-white md:text-4xl drop-shadow-lg hover:text-primary-400 transition-colors">
                {profile.full_name || 'Usuario sin nombre'}
              </h1>
            </Link>
            {profile.username && (
              <p className="text-lg font-medium text-primary-400">@{profile.username}</p>
            )}
            {profile.bio && (
              <p className="mt-3 text-sm text-white/80 leading-relaxed max-w-md mx-auto md:mx-0">
                {profile.bio}
              </p>
            )}
            <div className="mt-3 flex items-center justify-center space-x-6 md:justify-start">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-1.5">
                <span className="text-lg font-black text-white">{followCounts?.followers || 0}</span>
                <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Seguidores</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:space-x-1.5">
                <span className="text-lg font-black text-white">{followCounts?.following || 0}</span>
                <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Siguiendo</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:space-x-1.5">
                <span className="text-lg font-black text-white">{followCounts?.likes || 0}</span>
                <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Likes</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-white/70 md:justify-start">
              <span className="flex items-center">
                <Calendar size={16} className="mr-1.5 text-white/40" />
                Miembro desde {new Date(profile.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex space-x-3 md:mt-0 md:pb-4">
            {isMe ? (
              <Link to="/settings">
                <Button variant="glass" className="h-11 px-6">
                  Editar Perfil
                </Button>
              </Link>
            ) : (
              <>
                {followStatus === 'accepted' ? (
                  <Button variant="glass" onClick={handleUnfollow} className="h-11 px-6 text-white/60">
                    <UserCheck size={18} className="mr-2" />
                    Siguiendo
                  </Button>
                ) : followStatus === 'pending' ? (
                  <Button variant="glass" disabled className="h-11 px-6 opacity-60">
                    <Clock size={18} className="mr-2" />
                    Pendiente
                  </Button>
                ) : (
                  <Button onClick={handleFollow} className="h-11 px-6">
                    <UserPlus size={18} className="mr-2" />
                    Seguir
                  </Button>
                )}
                <Link to={`/messages?to=${profile.id}`}>
                  <Button variant="glass" className="h-11 px-4">
                    <MessageSquare size={20} />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mb-8 h-px bg-white/10" />

        {/* Content Section */}
        <section>
          {!canViewContent ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-white/5 py-20 text-center">
              <div className="mb-4 rounded-full bg-white/5 p-4 text-white/20">
                <Lock size={48} />
              </div>
              <h3 className="text-xl font-bold text-white">Esta cuenta es privada</h3>
              <p className="mt-1 text-white/50">Sigue a este usuario para ver sus publicaciones.</p>
              <Button onClick={handleFollow} className="mt-6" disabled={followStatus === 'pending'}>
                {followStatus === 'pending' ? 'Solicitud enviada' : 'Solicitar seguimiento'}
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-8 flex items-center space-x-2">
                <LayoutGrid size={24} className="text-primary-400" />
                <h2 className="text-2xl font-bold text-white">Publicaciones ({media.length})</h2>
              </div>

              {media.length > 0 ? (
                <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full">
                  {media.map((item, index) => (
                    <MediaCard
                      key={item.id}
                      item={item}
                      index={index}
                      queryKey={queryKey}
                      onView={(url, type) => setViewerMedia({ url, type })}
                    />
                  ))}
                  
                  {/* Infinite Scroll Trigger */}
                  <div ref={observerTarget} className="h-20 flex items-center justify-center">
                    {isFetchingNextPage && <Loader2 className="h-6 w-6 animate-spin text-primary-600" />}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-white/5 py-20 text-center">
                  <div className="mb-4 rounded-full bg-white/5 p-4 text-white/20">
                    <LayoutGrid size={48} />
                  </div>
                  <h3 className="text-lg font-bold text-white">Sin publicaciones aún</h3>
                  <p className="mt-1 text-white/50">Este usuario todavía no ha compartido ningún medio.</p>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <MediaViewer
        isOpen={!!viewerMedia}
        url={viewerMedia?.url || null}
        type={viewerMedia?.type || null}
        onClose={() => setViewerMedia(null)}
      />
    </div>
  );
}
