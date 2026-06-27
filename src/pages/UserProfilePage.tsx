import { useState, useEffect, useRef, useCallback } from 'react';
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
  Camera,
  Star,
  DollarSign,
  ShieldCheck,
  MapPin,
  Tag,
  Share2,
  Plus,
  Trash,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MediaViewer } from '@/src/components/ui/MediaViewer';
import { mediaService } from '@/src/services/mediaService';
import { profileService } from '@/src/services/profileService';
import { reviewService } from '@/src/services/reviewService';
import { subscriptionService } from '@/src/services/subscriptionService';
import { useAuth } from '@/src/hooks/useAuth';
import { useUIStore } from '@/src/store/uiStore';
import { cn } from '@/src/lib/utils';
import { useMutation, useQueryClient, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import MediaCard from '@/src/components/MediaCard';
import { Loader2 } from 'lucide-react';
import { VisitorBookingForm } from '@/src/components/VisitorBookingForm';
import { useBookingSync } from '@/src/hooks/useBookingSync';
import { notificationService } from '@/src/services/notificationService';
import { ProfileSkeleton } from '@/src/components/Skeletons';
import { useUserStats } from '@/src/hooks/useUserStats';
import { Input } from '@/src/components/ui/Input';
import { useNotificationStore } from '@/src/store/notificationStore';
import { parseProfileBio } from '@/src/utils/profileMetadata';
import { WORLD_COUNTRIES } from '@/src/utils/worldData';

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
  const { user: currentUser, profile: currentUserProfile } = useAuth();
  const isMe = currentUser?.id === userId;
  const { bookings: myBookings, refresh: refreshBookings } = useBookingSync(userId, isMe);
  const observerTarget = useRef(null);
  const addToast = useNotificationStore((state) => state.addToast);

  const [activeTab, setActiveTab] = useState<'posts' | 'reviews' | 'agenda' | 'about'>('posts');
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Subscription States & Effects
  const [isSubConfigModalOpen, setIsSubConfigModalOpen] = useState(false);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  
  const [subConfig, setSubConfig] = useState<any>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isCheckingSub, setIsCheckingSub] = useState(true);

  // Config Form States
  const [configEnabled, setConfigEnabled] = useState(false);
  const [configPrice, setConfigPrice] = useState(100);
  const [configBenefits, setConfigBenefits] = useState<string[]>([]);
  const [newBenefit, setNewBenefit] = useState('');

  // Fetch subscription data
  const fetchSubData = useCallback(async () => {
    if (!userId) return;
    setIsCheckingSub(true);
    try {
      const config = await subscriptionService.getSubscriptionConfig(userId);
      setSubConfig(config);
      if (config) {
        setConfigEnabled(config.enabled);
        setConfigPrice(config.price);
        setConfigBenefits(config.benefits || []);
      }

      if (currentUser?.id && currentUser.id !== userId) {
        const sub = await subscriptionService.isUserSubscribed(currentUser.id, userId);
        setIsSubscribed(sub);
      }
    } catch (err) {
      console.error('Error fetching subscription data:', err);
    } finally {
      setIsCheckingSub(false);
    }
  }, [userId, currentUser?.id]);

  useEffect(() => {
    fetchSubData();
  }, [fetchSubData]);

  const handleSaveSubConfig = async () => {
    if (!userId) return;
    try {
      const success = await subscriptionService.saveSubscriptionConfig(userId, {
        enabled: configEnabled,
        price: Number(configPrice),
        benefits: configBenefits
      });

      if (success) {
        addToast({
          type: 'success',
          message: 'Configuración Guardada',
          description: 'Los planes de suscripción han sido actualizados.',
          duration: 3000
        });
        setIsSubConfigModalOpen(false);
        fetchSubData();
      }
    } catch (err) {
      addToast({
        type: 'error',
        message: 'Error',
        description: 'No se pudo guardar la configuración.',
        duration: 3000
      });
    }
  };

  const handleSubscribe = async () => {
    if (!currentUser?.id || !userId) return;
    try {
      const success = await subscriptionService.subscribeToCreator(currentUser.id, userId, subConfig?.price || 150);
      if (success) {
        addToast({
          type: 'success',
          message: '¡Suscripción Exitosa!',
          description: `Te has suscrito correctamente a este creador.`,
          duration: 3000
        });
        setIsSubscribeModalOpen(false);
        fetchSubData();
      } else {
        addToast({
          type: 'error',
          message: 'Saldo Insuficiente',
          description: `No tienes suficientes créditos para suscribirte. Requiere ${subConfig?.price} créditos.`,
          duration: 4000
        });
      }
    } catch (err) {
      addToast({
        type: 'error',
        message: 'Error',
        description: 'Hubo un problema al procesar la suscripción.',
        duration: 3000
      });
    }
  };

  const handleUnsubscribe = async () => {
    if (!currentUser?.id || !userId) return;
    try {
      const success = await subscriptionService.unsubscribeFromCreator(currentUser.id, userId);
      if (success) {
        addToast({
          type: 'success',
          message: 'Suscripción Cancelada',
          description: 'Has cancelado tu suscripción a este creador.',
          duration: 3000
        });
        fetchSubData();
      }
    } catch (err) {
      addToast({
        type: 'error',
        message: 'Error',
        description: 'No se pudo cancelar la suscripción.',
        duration: 3000
      });
    }
  };
  
  // Review state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const queryKey = ['user-media', userId, currentUser?.id];
  const reviewsQueryKey = ['user-reviews', userId];

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

  const { data: reviews = [], isLoading: loadingReviews } = useQuery({
    queryKey: reviewsQueryKey,
    queryFn: () => reviewService.fetchUserReviews(userId!),
    enabled: !!userId,
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

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userId || !profile) return;
    
    setSubmittingReview(true);
    try {
      await reviewService.addReview({
        target_user_id: userId,
        author_id: currentUser.id,
        rating,
        comment
      });
      setComment('');
      setRating(5);
      setIsReviewModalOpen(false);
      queryClient.invalidateQueries({ queryKey: reviewsQueryKey });
      // Update local profile rating if needed or invalidate profile query
    } catch (err) {
      console.error('Error adding review:', err);
    } finally {
      setSubmittingReview(false);
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
            {profile.bio && parseProfileBio(profile.bio).cleanBio && (
              <p className="mt-3 text-sm text-white/80 leading-relaxed max-w-md mx-auto md:mx-0">
                {parseProfileBio(profile.bio).cleanBio}
              </p>
            )}
            
            <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
              {profile.city && (
                <span className="inline-flex items-center rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[10px] font-black text-white/60 uppercase tracking-widest italic">
                  <MapPin size={12} className="mr-1 text-primary-500" />
                  {profile.city}
                </span>
              )}
              {profile.category && (
                <span className="inline-flex items-center rounded-full bg-primary-600/10 border border-primary-600/30 px-3 py-1 text-[10px] font-black text-primary-400 uppercase tracking-widest italic">
                  <Tag size={12} className="mr-1 text-primary-500" />
                  {profile.category}
                </span>
              )}
            </div>

            <div className="mt-4 flex items-center justify-center space-x-6 md:justify-start">
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

            {(() => {
              const { metadata } = parseProfileBio(profile.bio || '');
              const hasSocials = !!(metadata.instagram || metadata.twitter || metadata.tiktok || metadata.telegram || metadata.whatsapp || metadata.onlyfans || metadata.facebook || metadata.stripchat || metadata.kick || metadata.clapper);
              
              if (!profile.is_verified || !hasSocials) return null;
              
              return (
                <div className="mt-6 border-t border-white/5 pt-5 w-full max-w-md mx-auto md:mx-0">
                  <div className="flex items-center gap-2 mb-3 justify-center md:justify-start">
                    <div className="w-5 h-5 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Share2 size={11} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/50">Redes VIP</span>
                  </div>

                  {(isMe || isSubscribed) ? (
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      {metadata.instagram && (
                        <a
                          href={metadata.instagram.startsWith('http') ? metadata.instagram : `https://instagram.com/${metadata.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          referrerPolicy="no-referrer"
                          className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-zinc-950/80 border border-white/10 hover:border-pink-500/50 shadow-lg hover:shadow-pink-500/10 transition-all duration-300"
                          title="Sigue en Instagram"
                        >
                          <img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" alt="Instagram" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </a>
                      )}
                      {metadata.twitter && (
                        <a
                          href={metadata.twitter.startsWith('http') ? metadata.twitter : `https://x.com/${metadata.twitter.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          referrerPolicy="no-referrer"
                          className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-zinc-950/80 border border-white/10 hover:border-white/50 shadow-lg hover:shadow-white/10 transition-all duration-300"
                          title="Sigue en X"
                        >
                          <img src="https://upload.wikimedia.org/wikipedia/commons/5/57/X_logo_2023_original.svg" alt="X / Twitter" className="w-4 h-4 invert group-hover:scale-110 transition-transform" />
                        </a>
                      )}
                      {metadata.tiktok && (
                        <a
                          href={metadata.tiktok.startsWith('http') ? metadata.tiktok : `https://tiktok.com/@${metadata.tiktok.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          referrerPolicy="no-referrer"
                          className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-zinc-950/80 border border-white/10 hover:border-teal-400/50 shadow-lg hover:shadow-teal-400/10 transition-all duration-300"
                          title="Sigue en TikTok"
                        >
                          <img src="https://upload.wikimedia.org/wikipedia/commons/3/34/Ionicons_logo-tiktok.svg" alt="TikTok" className="w-5 h-5 invert group-hover:scale-110 transition-transform" />
                        </a>
                      )}
                      {metadata.onlyfans && (
                        <a
                          href={metadata.onlyfans.startsWith('http') ? metadata.onlyfans : `https://onlyfans.com/${metadata.onlyfans}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          referrerPolicy="no-referrer"
                          className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-zinc-950/80 border border-white/10 hover:border-sky-400/50 shadow-lg hover:shadow-sky-400/10 transition-all duration-300"
                          title="Sigue en OnlyFans"
                        >
                          <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Onlyfans_logo.svg" alt="OnlyFans" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </a>
                      )}
                      {metadata.facebook && (
                        <a
                          href={metadata.facebook.startsWith('http') ? metadata.facebook : `https://facebook.com/${metadata.facebook}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          referrerPolicy="no-referrer"
                          className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-zinc-950/80 border border-white/10 hover:border-blue-600/50 shadow-lg hover:shadow-blue-600/10 transition-all duration-300"
                          title="Sigue en Facebook"
                        >
                          <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt="Facebook" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </a>
                      )}
                      {metadata.stripchat && (
                        <a
                          href={metadata.stripchat.startsWith('http') ? metadata.stripchat : `https://stripchat.com/${metadata.stripchat}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          referrerPolicy="no-referrer"
                          className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-zinc-950/80 border border-white/10 hover:border-red-500/50 shadow-lg hover:shadow-red-500/10 transition-all duration-300"
                          title="Sigue en Stripchat"
                        >
                          <img src="https://stripchat.com/favicon.ico" alt="Stripchat" className="w-5 h-5 rounded-full group-hover:scale-110 transition-transform" />
                        </a>
                      )}
                      {metadata.kick && (
                        <a
                          href={metadata.kick.startsWith('http') ? metadata.kick : `https://kick.com/${metadata.kick}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          referrerPolicy="no-referrer"
                          className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-zinc-950/80 border border-white/10 hover:border-green-500/50 shadow-lg hover:shadow-green-500/10 transition-all duration-300"
                          title="Sigue en Kick"
                        >
                          <img src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Kick_logo.svg" alt="Kick" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </a>
                      )}
                      {metadata.clapper && (
                        <a
                          href={metadata.clapper.startsWith('http') ? metadata.clapper : `https://clapperapp.com/${metadata.clapper}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          referrerPolicy="no-referrer"
                          className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-zinc-950/80 border border-white/10 hover:border-amber-500/50 shadow-lg hover:shadow-amber-500/10 transition-all duration-300"
                          title="Sigue en Clapper"
                        >
                          <img src="https://clapperapp.com/favicon.ico" alt="Clapper" className="w-5 h-5 rounded-full group-hover:scale-110 transition-transform" />
                        </a>
                      )}
                      {metadata.telegram && (
                        <a
                          href={metadata.telegram.startsWith('http') ? metadata.telegram : `https://t.me/${metadata.telegram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          referrerPolicy="no-referrer"
                          className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-zinc-950/80 border border-white/10 hover:border-blue-400/50 shadow-lg hover:shadow-blue-400/10 transition-all duration-300"
                          title="Contacto en Telegram"
                        >
                          <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" alt="Telegram" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </a>
                      )}
                      {metadata.whatsapp && (
                        <a
                          href={metadata.whatsapp.startsWith('http') ? metadata.whatsapp : (metadata.whatsapp.match(/^\d+$/) ? `https://wa.me/${metadata.whatsapp}` : `https://wa.me/${metadata.whatsapp.replace(/\D/g, '')}`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          referrerPolicy="no-referrer"
                          className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-zinc-950/80 border border-white/10 hover:border-green-500/50 shadow-lg hover:shadow-green-500/10 transition-all duration-300"
                          title="Contacto en WhatsApp"
                        >
                          <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <div 
                      onClick={() => setIsSubscribeModalOpen(true)}
                      className="group cursor-pointer relative overflow-hidden bg-gradient-to-r from-zinc-950 to-zinc-900 border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-white/[0.02] hover:border-amber-500/20 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform duration-300">
                          <Lock size={16} />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1">
                            Redes Sociales Bloqueadas
                            <Star size={10} className="fill-amber-400 text-amber-400 animate-pulse" />
                          </p>
                          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">
                            Disponible solo para Suscriptores VIP
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 opacity-30 group-hover:opacity-100 transition-opacity duration-300 filter blur-[2px] group-hover:blur-0">
                        {metadata.instagram && <div className="w-6 h-6 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center"><img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" className="w-3 h-3 grayscale" /></div>}
                        {metadata.twitter && <div className="w-6 h-6 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center"><img src="https://upload.wikimedia.org/wikipedia/commons/5/57/X_logo_2023_original.svg" className="w-3 h-3 invert" /></div>}
                        {metadata.tiktok && <div className="w-6 h-6 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center"><img src="https://upload.wikimedia.org/wikipedia/commons/3/34/Ionicons_logo-tiktok.svg" className="w-3 h-3 invert" /></div>}
                        {metadata.onlyfans && <div className="w-6 h-6 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center"><img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Onlyfans_logo.svg" className="w-3 h-3 grayscale" /></div>}
                        {metadata.facebook && <div className="w-6 h-6 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center"><img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" className="w-3 h-3 grayscale" /></div>}
                        {metadata.stripchat && <div className="w-6 h-6 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center"><img src="https://stripchat.com/favicon.ico" className="w-3 h-3 rounded-full grayscale" /></div>}
                        {metadata.kick && <div className="w-6 h-6 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center"><img src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Kick_logo.svg" className="w-3 h-3" /></div>}
                        {metadata.clapper && <div className="w-6 h-6 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center"><img src="https://clapperapp.com/favicon.ico" className="w-3 h-3 rounded-full grayscale" /></div>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3 md:mt-0 md:pb-4">
            {isMe ? (
              <div className="flex gap-2">
                <Link to="/settings">
                  <Button variant="glass" className="h-11 px-6">
                    Editar Perfil
                  </Button>
                </Link>
                {profile.is_verified && (
                  <Button 
                    variant="glass" 
                    className="h-11 px-4 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white"
                    onClick={() => setIsSubConfigModalOpen(true)}
                  >
                    <Settings size={18} className="mr-1.5" />
                    Suscripción VIP
                  </Button>
                )}
              </div>
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
                
                {/* Subscription Action Button (for visitors viewing a verified user) */}
                {profile.is_verified && subConfig?.enabled && (
                  isSubscribed ? (
                    <Button 
                      variant="glass" 
                      onClick={handleUnsubscribe} 
                      className="h-11 px-4 bg-emerald-500/10 text-emerald-400 hover:bg-red-500/10 hover:text-red-400 border border-emerald-500/20"
                    >
                      <Star size={16} className="mr-1.5 fill-emerald-400 text-emerald-400" />
                      Suscrito
                    </Button>
                  ) : (
                    <Button 
                      variant="glass" 
                      onClick={() => setIsSubscribeModalOpen(true)} 
                      className="h-11 px-4 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black border border-amber-500/20 animate-pulse"
                    >
                      <Star size={16} className="mr-1.5" />
                      Suscribirse ({subConfig.price} cr)
                    </Button>
                  )
                )}

                <Link to={`/messages?to=${profile.id}`}>
                  <Button variant="glass" className="h-11 px-4">
                    <MessageSquare size={20} />
                  </Button>
                </Link>
                {profile.is_verified && (
                  <Button 
                    variant="glass" 
                    className="h-11 px-4 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white"
                    onClick={() => setIsTipModalOpen(true)}
                  >
                    <DollarSign size={20} />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mb-8 h-px bg-white/10" />

        {/* Tabs */}
        <div className="flex items-center space-x-8 mb-8 overflow-x-auto pb-2 scrollbar-none text-white">
          {[
            { id: 'posts', label: 'Publicaciones', icon: LayoutGrid },
            { id: 'reviews', label: 'Reseñas', icon: Star },
            { id: 'agenda', label: 'Agenda VIP', icon: Calendar },
            { id: 'about', label: 'Información', icon: UserIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center space-x-2 py-2 border-b-2 transition-all font-black uppercase text-xs tracking-[0.2em] italic whitespace-nowrap",
                activeTab === tab.id 
                  ? "border-primary-600 text-white" 
                  : "border-transparent text-white/30 hover:text-white/60"
              )}
            >
              <tab.icon size={16} className={activeTab === tab.id ? "text-primary-600" : ""} />
              <span>{tab.label}</span>
              {tab.id === 'reviews' && reviews.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/10 text-[8px]">
                  {reviews.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content Section */}
        <section>
          {activeTab === 'posts' && (
            !canViewContent ? (
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
            )
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white italic uppercase">Reseñas y Calificaciones</h2>
                  <div className="mt-1 flex items-center">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={14} className={cn("mr-0.5", s <= Math.round(profile.rating || 0) ? "text-amber-500 fill-amber-500" : "text-white/10")} />
                    ))}
                    <span className="ml-2 text-xs font-bold text-white/40 uppercase tracking-widest">
                      {profile.rating?.toFixed(1) || '0.0'} de 5 ({reviews.length} opiniones)
                    </span>
                  </div>
                </div>
                {!isMe && currentUser && (
                  <Button onClick={() => setIsReviewModalOpen(true)} variant="glass" className="h-10 text-xs font-black uppercase tracking-widest italic">
                    Escribir Reseña
                  </Button>
                )}
              </div>

              {reviews.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {reviews.map((review) => (
                    <Card key={review.id} className="glass-card border-none p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full overflow-hidden bg-white/5">
                            {review.author?.avatar_url ? (
                              <img src={review.author.avatar_url} alt={review.author.full_name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-white/20">
                                <UserIcon size={20} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">
                              {review.author?.full_name || 'Usuario'}
                              {review.author?.is_verified && <BadgeCheck size={14} className="inline ml-1 text-primary-500" />}
                            </p>
                            <div className="flex items-center mt-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} size={10} className={cn("mr-0.5", s <= review.rating ? "text-amber-500 fill-amber-500" : "text-white/10")} />
                              ))}
                              <span className="ml-2 text-[10px] text-white/20 font-bold uppercase tracking-widest">
                                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: es })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-white/70 leading-relaxed italic">
                        "{review.comment}"
                      </p>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-white/5 rounded-2xl border-2 border-dashed border-white/10">
                  <Star size={40} className="text-white/10 mb-4" />
                  <p className="text-white/40 font-bold uppercase tracking-widest text-xs italic">Aún no hay reseñas para este usuario.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'agenda' && (
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white italic uppercase">Agenda y Reservas VIP</h2>
                  <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Reserva de citas seguras y discretas 100%</p>
                </div>
              </div>

              {isMe ? (
                // Owner view: see requested appointments
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest italic px-1">Solicitudes de Citas Recibidas</h3>
                  {(() => {
                    if (myBookings.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-12 text-center bg-white/5 rounded-2xl border border-white/5">
                          <Calendar size={40} className="text-white/10 mb-4" />
                          <p className="text-white/40 font-bold uppercase tracking-widest text-xs italic">Aún no has recibido solicitudes de citas.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 gap-4">
                        {myBookings.map((b: any) => (
                          <Card key={b.id} className="p-6 glass-card border-none flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-white">{b.clientName || 'Cliente Discreto'}</span>
                                <span className={cn(
                                  "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                                  b.status === 'accepted' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                  b.status === 'rejected' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                  "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse"
                                )}>
                                  {b.status === 'accepted' ? 'Aceptada' : b.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                                </span>
                              </div>
                              <div className="text-xs text-white/60 flex flex-wrap gap-x-4 gap-y-1 font-mono">
                                <span className="text-primary-400 font-bold">📅 {b.date}</span>
                                <span className="text-primary-400 font-bold">🕒 {b.slot}</span>
                              </div>
                              {b.notes && (
                                <p className="text-xs text-white/50 italic bg-black/20 p-2.5 rounded-xl border border-white/5 mt-1">
                                  "{b.notes}"
                                </p>
                              )}
                            </div>

                            {b.status === 'pending' && (
                              <div className="flex items-center gap-2 shrink-0 md:justify-end">
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    const allBookings = JSON.parse(localStorage.getItem('pasiones_vip_bookings') || '[]');
                                    const updated = allBookings.map((item: any) => item.id === b.id ? { ...item, status: 'accepted' } : item);
                                    localStorage.setItem('pasiones_vip_bookings', JSON.stringify(updated));
                                    
                                    try {
                                      await notificationService.createNotification({
                                        user_id: b.clientId,
                                        sender_id: currentUser?.id,
                                        type: 'system',
                                        title: `[BOOKING_ACCEPT] Cita Aceptada`,
                                        content: JSON.stringify({ id: b.id, status: 'accepted' }),
                                        link: `/profile/${profile?.id}?tab=agenda`
                                      });
                                    } catch (err) {
                                      console.error('Error sending accept notification:', err);
                                    }

                                    addToast({ type: 'success', message: 'Cita Aceptada 🎉', description: 'Has aceptado la reservación. Se notificará al cliente.' });
                                    refreshBookings();
                                  }}
                                  className="bg-green-500 hover:bg-green-600 text-black font-black uppercase tracking-widest text-[9px] h-9 px-3"
                                >
                                  Aceptar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    const allBookings = JSON.parse(localStorage.getItem('pasiones_vip_bookings') || '[]');
                                    const updated = allBookings.map((item: any) => item.id === b.id ? { ...item, status: 'rejected' } : item);
                                    localStorage.setItem('pasiones_vip_bookings', JSON.stringify(updated));

                                    try {
                                      await notificationService.createNotification({
                                        user_id: b.clientId,
                                        sender_id: currentUser?.id,
                                        type: 'system',
                                        title: `[BOOKING_REJECT] Cita Rechazada`,
                                        content: JSON.stringify({ id: b.id, status: 'rejected' }),
                                        link: `/profile/${profile?.id}?tab=agenda`
                                      });
                                    } catch (err) {
                                      console.error('Error sending reject notification:', err);
                                    }

                                    addToast({ type: 'info', message: 'Cita Rechazada 💔', description: 'Has rechazado la reservación.' });
                                    refreshBookings();
                                  }}
                                  className="border-red-500/30 hover:bg-red-500/10 text-red-400 font-black uppercase tracking-widest text-[9px] h-9 px-3"
                                >
                                  Rechazar
                                </Button>
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <VisitorBookingForm profile={profile} setActiveTab={setActiveTab} />
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-500">
              <Card className="glass-card border-none p-8">
                <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-widest italic">Acerca de {profile.full_name?.split(' ')[0]}</h3>
                <div className="space-y-6">
                  {(() => {
                    const { cleanBio, metadata } = parseProfileBio(profile.bio);
                    const countryName = metadata.country ? (WORLD_COUNTRIES[metadata.country]?.name || metadata.country) : '';
                    const displayCountryFlag = metadata.country ? (WORLD_COUNTRIES[metadata.country]?.flag || '🌍') : '🌍';

                    return (
                      <>
                        <div className="flex items-start space-x-4">
                          <div className="p-3 bg-primary-600/20 rounded-xl text-primary-400">
                            <UserIcon size={24} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-white/30 uppercase tracking-[0.2em] mb-1">Descripción</p>
                            <p className="text-white/80 leading-relaxed italic">
                              {cleanBio || 'Sin descripción disponible.'}
                            </p>
                          </div>
                        </div>

                        {/* Hierarchical metadata specification grid */}
                        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10 text-xs text-left">
                          <div className="flex flex-col bg-white/5 p-3.5 rounded-2xl border border-white/5">
                            <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">País de Origen</span>
                            <span className="text-white font-bold text-sm mt-1 flex items-center gap-1.5">
                              <span>{displayCountryFlag}</span> {countryName || 'España'}
                            </span>
                          </div>

                          <div className="flex flex-col bg-white/5 p-3.5 rounded-2xl border border-white/5">
                            <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">Provincia / Región</span>
                            <span className="text-white font-bold text-sm mt-1">{metadata.province || 'No especificada'}</span>
                          </div>

                          <div className="flex flex-col bg-white/5 p-3.5 rounded-2xl border border-white/5">
                            <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">Ciudad de Encuentro</span>
                            <span className="text-white font-bold text-sm mt-1 flex items-center gap-1.5 text-primary-400">
                              <MapPin size={12} /> {profile.city || metadata.city || 'No especificada'}
                            </span>
                          </div>

                          <div className="flex flex-col bg-white/5 p-3.5 rounded-2xl border border-white/5">
                            <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">Edad Verificada</span>
                            <span className="text-white font-bold text-sm mt-1">{metadata.age ? `${metadata.age} años` : '25 años'}</span>
                          </div>

                          <div className="flex flex-col bg-white/5 p-3.5 rounded-2xl border border-white/5">
                            <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">Color de Cabello</span>
                            <span className="text-white font-bold text-sm mt-1">{metadata.hair || 'Rubio'}</span>
                          </div>

                          <div className="flex flex-col bg-white/5 p-3.5 rounded-2xl border border-white/5">
                            <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">Color de Ojos</span>
                            <span className="text-white font-bold text-sm mt-1">{metadata.eyes || 'Oscuro'}</span>
                          </div>

                          <div className="flex flex-col bg-white/5 col-span-2 p-3.5 rounded-2xl border border-white/5">
                            <span className="text-[10px] font-black uppercase text-white/20 tracking-widest">Especialidad Principal</span>
                            <span className="text-[#E60000] font-black text-sm mt-1 uppercase tracking-wider flex items-center gap-1.5">
                              <Tag size={12} /> {metadata.service || profile.category || 'GFe (Novia)'}
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </Card>

              {/* Identity Verification Banner */}
              <div className="rounded-2xl overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-primary-800/20 pointer-events-none" />
                <div className="relative p-8 bg-black/40 backdrop-blur-xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center space-x-4">
                    <div className={cn(
                      "p-4 rounded-full shadow-2xl",
                      profile.is_verified ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/20"
                    )}>
                      <ShieldCheck size={40} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white uppercase italic tracking-wider">Identidad Verificada</h4>
                      <p className="text-sm text-white/40 font-medium">
                        {profile.is_verified 
                          ? 'Este usuario ha confirmado su identidad oficialmente.'
                          : 'Este usuario aún no ha verificado su cuenta.'}
                      </p>
                    </div>
                  </div>
                  {profile.is_verified && (
                    <div className="px-4 py-2 bg-green-500/10 rounded-full border border-green-500/30 text-green-400 text-xs font-black uppercase tracking-widest italic">
                      Verificado 100%
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Tip Modal */}
      <AnimatePresence>
        {isTipModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm overflow-hidden rounded-[3rem] p-8 glass-card border border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.1)]"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-500 mb-6 mx-auto">
                <DollarSign size={32} />
              </div>
              <h3 className="text-2xl font-black text-white text-center italic uppercase mb-2">Enviar Propina</h3>
              <p className="text-white/40 text-center text-sm mb-8 italic">Apoya a {profile.full_name?.split(' ')[0]} por su contenido.</p>
              
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[5, 10, 20, 50, 100].map((amount) => (
                  <button
                    key={amount}
                    className="py-3 px-2 rounded-2xl bg-white/5 border border-white/10 text-white font-black hover:bg-amber-500 hover:border-amber-400 hover:scale-105 transition-all duration-300"
                    onClick={() => {
                      addToast({
                        type: 'success',
                        message: 'Procesando Propina',
                        description: `Redirigiendo a pasarela exclusiva para propina de ${amount}$.`
                      });
                      setIsTipModalOpen(false);
                    }}
                  >
                    {amount}$
                  </button>
                ))}
              </div>

              <div className="flex flex-col space-y-3">
                <Button 
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black uppercase"
                  onClick={() => {
                    addToast({
                      type: 'info',
                      message: 'Propina Personalizada',
                      description: 'Para montos e interacciones premium personalizadas, contacta directamente a través de Mensaje Privado.'
                    });
                    setIsTipModalOpen(false);
                  }}
                >
                  Personalizado
                </Button>
                <Button variant="ghost" className="text-white/20 hover:text-white" onClick={() => setIsTipModalOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Review Modal */}
        {isReviewModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg overflow-hidden rounded-[2.5rem] p-8 glass-card border border-primary-500/20 shadow-2xl"
            >
              <h3 className="text-2xl font-black text-white italic uppercase mb-2">Calificar a {profile.full_name?.split(' ')[0]}</h3>
              <p className="text-white/40 text-sm mb-8 uppercase tracking-widest font-black">Tu opinión ayuda a la comunidad</p>
              
              <form onSubmit={handleAddReview} className="space-y-6">
                <div className="flex justify-center space-x-3 mb-8">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star 
                        size={36} 
                        className={cn(
                          "transition-all",
                          s <= rating ? "text-amber-500 fill-amber-500" : "text-white/10"
                        )} 
                      />
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-white/40 uppercase tracking-widest italic ml-1">Tu experiencia</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Cuéntanos qué tal fue el servicio..."
                    className="w-full min-h-[120px] rounded-2xl bg-white/5 border border-white/10 p-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all resize-none italic"
                    required
                  />
                  <div className="flex justify-end">
                    <span className="text-[10px] font-black text-white/10 uppercase italic">
                      {comment.length}/300
                    </span>
                  </div>
                </div>

                <div className="flex flex-col space-y-3 pt-4">
                  <Button type="submit" className="w-full h-12 text-lg italic" isLoading={submittingReview}>
                    Enviar Reseña
                  </Button>
                  <Button variant="ghost" className="text-white/40 hover:text-white" onClick={() => setIsReviewModalOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Subscription Configuration Modal */}
        {isSubConfigModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg overflow-hidden rounded-[2.5rem] p-8 glass-card border border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.1)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-500 mb-6">
                <Settings size={24} />
              </div>
              <h3 className="text-2xl font-black text-white italic uppercase mb-2">Configurar Plan de Suscripción</h3>
              <p className="text-white/40 text-sm mb-6 uppercase tracking-widest font-black">Define los beneficios y el costo mensual de tu club VIP</p>

              <div className="space-y-6">
                {/* Enabled Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-tight">Activar Suscripciones</h4>
                    <p className="text-[10px] text-white/40 uppercase mt-0.5 tracking-wider font-bold">Permitir que los usuarios se suscriban</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={configEnabled}
                    onChange={(e) => setConfigEnabled(e.target.checked)}
                    className="w-5 h-5 rounded text-amber-500 bg-zinc-800 border-zinc-700/50 focus:ring-amber-500 text-amber-400 focus:outline-none"
                  />
                </div>

                {/* Price and Period settings */}
                {configEnabled && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest italic ml-1">Tarifa Mensual (Créditos)</label>
                      <input
                        type="number"
                        min="50"
                        max="10000"
                        value={configPrice}
                        onChange={(e) => setConfigPrice(Number(e.target.value))}
                        className="w-full rounded-2xl bg-white/5 border border-white/10 p-3 text-white font-mono text-center focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-sm font-bold"
                      />
                    </div>

                    {/* Benefits Section */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest italic ml-1">Beneficios del Club VIP</label>
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Ej: Contenido explícito sin censura..."
                          value={newBenefit}
                          onChange={(e) => setNewBenefit(e.target.value)}
                          className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all italic"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newBenefit.trim()) {
                              setConfigBenefits([...configBenefits, newBenefit.trim()]);
                              setNewBenefit('');
                            }
                          }}
                          className="px-3 rounded-xl bg-amber-500 text-black text-xs font-black uppercase hover:bg-amber-600 active:scale-95 transition-all flex items-center justify-center"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className="space-y-2 max-h-[120px] overflow-y-auto scrollbar-none">
                        {configBenefits.map((benefit, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                            <span className="text-white/80 font-medium italic">{benefit}</span>
                            <button
                              type="button"
                              onClick={() => setConfigBenefits(configBenefits.filter((_, i) => i !== idx))}
                              className="text-red-400 hover:text-red-500 transition-colors"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        ))}
                        {configBenefits.length === 0 && (
                          <p className="text-[10px] text-white/20 uppercase font-black tracking-widest text-center py-2 italic">
                            No se han agregado beneficios aún
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="flex flex-col space-y-3 pt-4">
                  <Button 
                    className="w-full h-12 text-lg italic bg-amber-500 hover:bg-amber-600 text-black font-black uppercase"
                    onClick={handleSaveSubConfig}
                  >
                    Guardar Configuración
                  </Button>
                  <Button variant="ghost" className="text-white/40 hover:text-white" onClick={() => setIsSubConfigModalOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Subscribe Modal (for visitors to subscribe) */}
        {isSubscribeModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md overflow-hidden rounded-[2.5rem] p-8 glass-card border border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.15)]"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/20 text-amber-500 mb-6 mx-auto">
                <Star size={32} className="fill-amber-500 text-amber-400" />
              </div>
              <h3 className="text-2xl font-black text-white text-center italic uppercase mb-2">Suscripción VIP</h3>
              <p className="text-white/40 text-center text-sm mb-6 uppercase tracking-widest font-black">Apoya a {profile.full_name?.split(' ')[0]} y obtén beneficios exclusivos</p>

              <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 mb-6 text-center">
                <span className="text-xs font-black text-amber-400 uppercase tracking-widest block mb-1">Costo de Membresía</span>
                <span className="text-3xl font-black text-white font-mono">{subConfig?.price} <span className="text-lg text-amber-400">cr/mes</span></span>
              </div>

              {subConfig?.benefits && subConfig.benefits.length > 0 && (
                <div className="space-y-3 mb-8">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-1 ml-1">Beneficios incluidos:</span>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto scrollbar-none">
                    {subConfig.benefits.map((benefit: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <span className="text-amber-500 mt-0.5 font-bold">✓</span>
                        <span className="text-white/70 italic font-medium">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col space-y-3">
                <Button 
                  className="w-full h-12 text-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-black font-black uppercase tracking-wider italic animate-pulse"
                  onClick={handleSubscribe}
                >
                  Confirmar Suscripción
                </Button>
                <Button variant="ghost" className="text-white/20 hover:text-white" onClick={() => setIsSubscribeModalOpen(false)}>
                  Volver
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <MediaViewer
        isOpen={!!viewerMedia}
        url={viewerMedia?.url || null}
        type={viewerMedia?.type || null}
        onClose={() => setViewerMedia(null)}
      />
    </div>
  );
}
