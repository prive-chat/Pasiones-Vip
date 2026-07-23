import { useState, useEffect, FormEvent, ChangeEvent, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Camera, Check, AlertCircle, ShieldCheck, Mail, Calendar, Bell, BellOff, Trash2, Key, Lock, BarChart3, BadgeCheck, MapPin, Tag, UploadCloud, Smartphone, Download, ExternalLink, Share2 } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { profileService } from '../services/profileService';
import { useUserStats } from '../hooks/useUserStats';
import { optimizeImage } from '../lib/imageOptimization';
import { WORLD_COUNTRIES } from '../utils/worldData';
import { parseProfileBio, serializeProfileBio } from '../utils/profileMetadata';

export default function SettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { stats } = useUserStats(user?.id);
  const navigate = useNavigate();
  const { isSubscribed, subscribe, unsubscribe, isSupported, permission } = usePushNotifications(user?.id);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  
  // VIP Social Networks states
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [telegram, setTelegram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [onlyfans, setOnlyfans] = useState('');
  const [facebook, setFacebook] = useState('');
  const [stripchat, setStripchat] = useState('');
  const [kick, setKick] = useState('');
  const [clapper, setClapper] = useState('');
  
  // Advanced biological and location specifications
  const [age, setAge] = useState<number>(25);
  const [birthDate, setBirthDate] = useState<string>('');
  const [hair, setHair] = useState<string>('Rubio');
  const [eyes, setEyes] = useState<string>('Oscuro');
  const [service, setService] = useState<string>('GFe (Novia)');
  const [country, setCountry] = useState<string>('espana');
  const [province, setProvince] = useState<string>('');

  const [customHair, setCustomHair] = useState('');
  const [showCustomHair, setShowCustomHair] = useState(false);
  const [customEyes, setCustomEyes] = useState('');
  const [showCustomEyes, setShowCustomEyes] = useState(false);
  const [customService, setCustomService] = useState('');
  const [showCustomService, setShowCustomService] = useState(false);
  const [isCountryUnlocked, setIsCountryUnlocked] = useState(false);
  const [detectedCountryCode, setDetectedCountryCode] = useState<string>('');
  const [detectedCountryName, setDetectedCountryName] = useState<string>('');
  const [isDetectingCountry, setIsDetectingCountry] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingVerif, setUploadingVerif] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // PWA mobile app state
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  const [isCameraSelectOpen, setIsCameraSelectOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const inIframe = window.self !== window.top;
    setIsInIframe(inIframe);

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(standalone);

    // Grab globally captured prompt if any
    if ((window as any).deferredPrompt) {
      setPwaPrompt((window as any).deferredPrompt);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setPwaPrompt(e);
    };

    const customHandler = (e: any) => {
      if (e.detail) {
        setPwaPrompt(e.detail);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('pwa-prompt-available', customHandler as EventListener);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('pwa-prompt-available', customHandler as EventListener);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!pwaPrompt) return;
    pwaPrompt.prompt();
    const { outcome } = await pwaPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsStandalone(true);
      setPwaPrompt(null);
      (window as any).deferredPrompt = null;
    }
  };

  // Automatically detect user's country from server IP geo API for security
  useEffect(() => {
    if (!profile) return;

    async function detectUserCountry() {
      // Parse profile bio to check if there is already a stored country key
      const { metadata } = parseProfileBio(profile.bio || '');
      
      if (metadata && metadata.country) {
        // Use previously saved country from profile settings (protect it from live overwrite)
        setCountry(metadata.country);
        
        // Still fetch the country code from IP to render the verified badge correctly
        try {
          const response = await fetch('/api/detect-country');
          const data = await response.json();
          if (data && data.countryCode) {
            setDetectedCountryCode(data.countryCode);
            setDetectedCountryName(data.country);
          }
        } catch (err) {
          console.error('Error fetching verification IP:', err);
        }
        return;
      }

      // If no country has been set in the profile yet, run auto-fill based on live IP
      setIsDetectingCountry(true);
      try {
        const response = await fetch('/api/detect-country');
        const data = await response.json();
        if (data && data.countryCode) {
          setDetectedCountryCode(data.countryCode);
          setDetectedCountryName(data.country);
          
          const mappings: Record<string, string> = {
            'ES': 'espana',
            'EC': 'ecuador',
            'CO': 'colombia',
            'MX': 'mexico',
            'US': 'usa',
            'AR': 'argentina',
            'PE': 'peru',
            'VE': 'venezuela',
            'CL': 'chile'
          };
          
          const mappedKey = mappings[data.countryCode.toUpperCase()];
          if (mappedKey) {
            setCountry(mappedKey);
          } else {
            setCountry('otros');
          }
        }
      } catch (err) {
        console.error('Error auto-detecting country:', err);
      } finally {
        setIsDetectingCountry(false);
      }
    }
    
    detectUserCountry();
  }, [profile]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setUsername(profile.username || '');
      setAvatarUrl(profile.avatar_url || '');
      setCoverUrl(profile.cover_url || '');
      
      const { cleanBio, metadata } = parseProfileBio(profile.bio || '');
      setBio(cleanBio);
      
      setCity(profile.city || metadata.city || '');
      setCategory(profile.category || metadata.service || '');
      setIsPrivate(profile.is_private || false);

      if (metadata.age) setAge(metadata.age);
      if (metadata.birthDate) setBirthDate(metadata.birthDate);
      
      if (metadata.hair) {
        const standardHairOptions = ['Rubio', 'Castaño', 'Negro', 'Pelirrojo', 'Platino', 'Gris / Cano', 'Calvo', 'Fantasía'];
        if (standardHairOptions.includes(metadata.hair)) {
          setHair(metadata.hair);
          setShowCustomHair(false);
        } else {
          setHair('Otro');
          setCustomHair(metadata.hair);
          setShowCustomHair(true);
        }
      }
      
      if (metadata.eyes) {
        const standardEyesOptions = ['Azul', 'Verde', 'Miel', 'Oscuro', 'Marrón Claro', 'Gris'];
        if (standardEyesOptions.includes(metadata.eyes)) {
          setEyes(metadata.eyes);
          setShowCustomEyes(false);
        } else {
          setEyes('Otro');
          setCustomEyes(metadata.eyes);
          setShowCustomEyes(true);
        }
      }
      
      if (metadata.service) {
        const standardServiceOptions = [
          'Amistad',
          'Pasatiempo',
          'Conversación',
          'Acompañante de Eventos',
          'Relación Seria',
          'Guía de Viajes',
          'Ocio',
          'GFe (Novia)',
          'BDSM Premium',
          'Masaje Sensual',
          'Cena VIP',
          'Viajes Exóticos'
        ];
        if (standardServiceOptions.includes(metadata.service)) {
          setService(metadata.service);
          setShowCustomService(false);
        } else {
          setService('Otro');
          setCustomService(metadata.service);
          setShowCustomService(true);
        }
      }
      
      if (metadata.country) setCountry(metadata.country);
      if (metadata.province) setProvince(metadata.province);
      setInstagram(metadata.instagram || '');
      setTwitter(metadata.twitter || '');
      setTiktok(metadata.tiktok || '');
      setTelegram(metadata.telegram || '');
      setWhatsapp(metadata.whatsapp || '');
      setOnlyfans(metadata.onlyfans || '');
      setFacebook(metadata.facebook || '');
      setStripchat(metadata.stripchat || '');
      setKick(metadata.kick || '');
      setClapper(metadata.clapper || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Basic username validation
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (username && !usernameRegex.test(username)) {
      setMessage({ type: 'error', text: 'El nombre de usuario solo puede contener letras, números y guiones bajos.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const finalHair = hair === 'Otro' ? (customHair.trim() || 'Otro') : hair;
      const finalEyes = eyes === 'Otro' ? (customEyes.trim() || 'Otro') : eyes;
      const finalService = service === 'Otro' ? (customService.trim() || 'Otro') : service;

      const metadataBlock = {
        age,
        birthDate: birthDate || undefined,
        hair: finalHair,
        eyes: finalEyes,
        service: finalService,
        country,
        province,
        city,
        instagram: instagram.trim() || undefined,
        twitter: twitter.trim() || undefined,
        tiktok: tiktok.trim() || undefined,
        telegram: telegram.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        onlyfans: onlyfans.trim() || undefined,
        facebook: facebook.trim() || undefined,
        stripchat: stripchat.trim() || undefined,
        kick: kick.trim() || undefined,
        clapper: clapper.trim() || undefined
      };
      const finalBio = serializeProfileBio(bio, metadataBlock);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          username: username.toLowerCase(),
          avatar_url: avatarUrl,
          cover_url: coverUrl,
          bio: finalBio,
          city: city,
          category: finalService, // Keep category in sync with the current service specialty preference
          is_private: isPrivate,
        })
        .eq('id', user.id);

      if (error) {
        if (error.code === '23505') {
          throw new Error('Este nombre de usuario ya está en uso. Por favor, elige otro.');
        }
        throw error;
      }

      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
      await refreshProfile();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setMessage(null);

    try {
      let fileToUpload: File | Blob = file;
      try {
        fileToUpload = await optimizeImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.8 });
      } catch (err) {
        console.error('Error optimizing avatar:', err);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, fileToUpload);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      
      // Auto-update profile with new avatar
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      setMessage({ type: 'success', text: 'Foto de perfil actualizada' });
      await refreshProfile();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error al subir imagen: ' + error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingCover(true);
    setMessage(null);

    try {
      let fileToUpload: File | Blob = file;
      try {
        fileToUpload = await optimizeImage(file, { maxWidth: 1200, maxHeight: 400, quality: 0.8 });
      } catch (err) {
        console.error('Error optimizing cover:', err);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `cover-${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, fileToUpload);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      setCoverUrl(publicUrl);
      
      // Auto-update profile with new cover
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cover_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      setMessage({ type: 'success', text: 'Foto de portada actualizada' });
      await refreshProfile();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error al subir portada: ' + error.message });
    } finally {
      setUploadingCover(false);
    }
  };

  const sendTestNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('¡Prueba Exitosa!', {
        body: 'Así es como recibirás las notificaciones en Pasiones Vip.',
        icon: '/icon.svg',
      });
    } else {
      setMessage({ type: 'error', text: 'Por favor, activa las notificaciones primero.' });
    }
  };
  const handleDeleteAccount = async () => {
    if (!user || !deletePassword) {
      setDeleteError('Por favor, ingresa tu contraseña.');
      return;
    }
    
    setDeleteLoading(true);
    setDeleteError(null);
    
    try {
      // Re-authenticate user to verify password
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: deletePassword,
      });

      if (authError) {
        throw new Error('Contraseña incorrecta. Por favor, inténtalo de nuevo.');
      }

      await profileService.deleteAccount(user.id);
      await signOut();
      navigate('/auth', { replace: true });
    } catch (error: any) {
      setDeleteError(error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setPasswordMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setPasswordMessage({ type: 'error', text: error.message });
    } finally {
      setPasswordLoading(false);
    }
  };

  const uploadSelfieFile = async (file: File) => {
    if (!user) return;
    setUploadingVerif(true);
    setMessage(null);

    try {
      const fileExt = file.name.split('.').pop() || 'jpeg';
      const fileName = `verif-${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `verifications/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          verification_status: 'pending',
          verification_id_url: publicUrl 
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      setMessage({ type: 'success', text: 'Selfie enviada correctamente. El administrador validará tu Sello VIP.' });
      await refreshProfile();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error al enviar verificación: ' + error.message });
    } finally {
      setUploadingVerif(false);
    }
  };

  const handleVerificationUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadSelfieFile(file);
  };

  const startCamera = async () => {
    setMessage(null);
    setSnapshot(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 480, facingMode: 'user' }
      });
      setCameraStream(stream);
      setCameraActive(true);
      setIsCameraSelectOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err: any) {
      setMessage({ type: 'error', text: 'No se pudo acceder a la cámara: ' + err.message });
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null);
    setCameraActive(false);
    setIsCameraSelectOpen(false);
    setSnapshot(null);
  };

  const captureSnapshot = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 480;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setSnapshot(dataUrl);
      }
    }
  };

  const handleConfirmSnapshot = async () => {
    if (!snapshot || !user) return;
    try {
      const res = await fetch(snapshot);
      const blob = await res.blob();
      const file = new File([blob], `selfie-${user.id}.jpg`, { type: 'image/jpeg' });
      stopCamera();
      await uploadSelfieFile(file);
    } catch (err: any) {
      setMessage({ type: 'error', text: 'No se pudo procesar la selfie en tiempo real: ' + err.message });
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Configuración</h1>
        <p className="text-white/60">Administra tu perfil y preferencias de cuenta.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="overflow-hidden glass-card border-none">
            <div className="h-24 w-full relative">
              {coverUrl ? (
                <img src={coverUrl} alt="Portada" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="h-full w-full bg-primary-600/40" />
              )}
            </div>
            <div className="px-6 pb-6">
              <div className="relative -mt-12 mb-4">
                <div className="h-24 w-24 rounded-full border-4 border-black/20 bg-white/10 shadow-xl overflow-hidden backdrop-blur-md">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white/40">
                      <User size={40} />
                    </div>
                  )}
                </div>
                {profile?.is_verified && (
                  <div className="absolute bottom-0 right-0 rounded-full bg-primary-600 p-1 shadow-lg">
                    <ShieldCheck size={20} className="text-white" />
                  </div>
                )}
              </div>
              <Link to={`/profile/${user?.id}`}>
                <h2 className="text-xl font-bold text-white hover:text-primary-400 transition-colors">{fullName || 'Usuario'}</h2>
              </Link>
              {username && (
                <p className="text-sm font-medium text-primary-400">@{username}</p>
              )}
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 flex items-center">
                  <Calendar size={12} className="mr-1.5" />
                  Miembro desde {profile ? new Date(profile.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : '...'}
                </p>
              </div>
            </div>
          </Card>

          <div className="rounded-xl bg-black/40 p-6 text-white shadow-xl border border-white/10 backdrop-blur-xl">
            <h3 className="mb-2 font-bold">Estado de Cuenta</h3>
            <div className="flex items-center space-x-2">
              <div className={`h-2.5 w-2.5 rounded-full ${profile?.is_verified ? 'bg-green-400' : 'bg-amber-400'}`} />
              <span className="text-sm font-bold">
                {profile?.is_verified ? 'Verificada' : 'Pendiente de Verificación'}
              </span>
            </div>
            <p className="mt-3 text-xs text-white/50 leading-relaxed">
              {profile?.is_verified 
                ? 'Tu cuenta tiene acceso completo a todas las funciones de la plataforma.' 
                : 'Un administrador debe verificar tu identidad para habilitar la carga de medios.'}
            </p>
          </div>
        </div>

        {/* Main Form */}
        <div className="md:col-span-2">
          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle className="font-bold text-white">Editar Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                {/* Avatar Upload Section */}
                <div className="flex items-center space-x-6">
                  <div className="relative group">
                    <div className="h-20 w-20 rounded-full bg-white/10 overflow-hidden ring-2 ring-white/10 ring-offset-2 ring-offset-black/20">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-white/20">
                          <User size={32} />
                        </div>
                      )}
                    </div>
                    <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <Camera className="text-white" size={24} />
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleAvatarUpload}
                        disabled={uploading}
                      />
                    </label>
                    {uploading && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Foto de Perfil</h4>
                    <p className="text-xs text-white/50 mt-1">Haz clic en la imagen para subir una nueva foto. Formatos: JPG, PNG.</p>
                  </div>
                </div>

                {/* Cover Upload Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-white">Foto de Portada</h4>
                  <div 
                    className="relative h-32 w-full rounded-xl border-2 border-dashed border-white/10 bg-white/5 overflow-hidden group cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => document.getElementById('cover-input')?.click()}
                  >
                    {coverUrl ? (
                      <img src={coverUrl} alt="Portada" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-white/20">
                        <Camera size={24} className="mb-1" />
                        <span className="text-xs">Subir foto de portada</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="text-white" size={24} />
                    </div>
                    {uploadingCover && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                      </div>
                    )}
                    <input 
                      id="cover-input"
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleCoverUpload}
                      disabled={uploadingCover}
                    />
                  </div>
                  <p className="text-xs text-white/50">Recomendado: 1200x400px. Formatos: JPG, PNG.</p>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Nombre Completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Tu nombre real"
                    variant="glass"
                    required
                  />

                  <Input
                    label="Nombre de Usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ejemplo_123"
                    leftElement={<span className="text-primary-400 font-bold">@</span>}
                    description="Tu identificador único en la plataforma. Solo letras, números y guiones bajos."
                    variant="glass"
                    required
                  />

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-white/60 ml-1">Descripción / Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Cuéntanos algo sobre ti..."
                      className="w-full min-h-[100px] rounded-xl bg-white/5 border border-white/10 p-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all resize-none"
                      maxLength={200}
                    />
                    <div className="flex justify-end">
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                        {bio.length}/200
                      </span>
                    </div>
                  </div>

                  {/* Automatic Location Geotagging Block */}
                  <div className="p-4 bg-zinc-950/40 border border-white/5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-white/50 flex items-center">
                        <MapPin size={14} className="mr-1.5 text-[#E60000]" /> Ubicación Verificada (Seguridad de la App)
                      </span>
                      {isDetectingCountry ? (
                        <span className="text-[10px] text-primary-400 animate-pulse font-bold">Detección de IP activa...</span>
                      ) : (
                        <span className="text-[10px] text-green-400 bg-green-500/10 px-2.5 py-0.5 rounded-full border border-green-500/20 font-black uppercase tracking-widest">
                          🛡️ Verificado por IP: {detectedCountryCode || 'ES'}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {/* Country Selection (Dynamic Autodetected or Manual selection) */}
                      <div className="space-y-1.5 ">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-black uppercase tracking-wider text-white/40 ml-1">País de Residencia</label>
                          {!isCountryUnlocked && (
                            <button
                              type="button"
                              onClick={() => setIsCountryUnlocked(true)}
                              className="text-[10px] text-primary-400 hover:text-primary-300 font-bold tracking-wider uppercase cursor-pointer hover:underline focus:outline-none"
                            >
                              Cambiar manualmente
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <select
                            disabled={!isCountryUnlocked} // Unlocked if manually requested
                            value={country}
                            onChange={(e) => {
                              setCountry(e.target.value);
                              setProvince('');
                              setCity('');
                            }}
                            className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold transition-all ${
                              !isCountryUnlocked 
                                ? "opacity-75 cursor-not-allowed" 
                                : "focus:outline-none focus:ring-2 focus:ring-[#E60000]/50"
                            }`}
                          >
                            {Object.entries(WORLD_COUNTRIES).map(([key, item]) => (
                              <option key={key} value={key} className="bg-zinc-900 text-white font-bold">
                                {item.flag} {item.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <p className="text-[10px] text-white/30 italic">Autodetectado automáticamente por IP para la seguridad y transparencia de la Red.</p>
                      </div>

                      {/* Province Selection based on the country */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-white/40 ml-1">Provincia / Región</label>
                        <select
                          value={province}
                          onChange={(e) => {
                            setProvince(e.target.value);
                            setCity('');
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold focus:outline-none focus:ring-2 focus:ring-[#E60000]/50"
                        >
                          <option value="" className="bg-zinc-900 text-white">-- Seleccionar Región --</option>
                          {country && WORLD_COUNTRIES[country]?.provinces && 
                            Object.keys(WORLD_COUNTRIES[country].provinces).sort().map((prov) => (
                              <option key={prov} value={prov} className="bg-zinc-900 text-white font-bold">
                                {prov}
                              </option>
                            ))
                          }
                        </select>
                      </div>
                    </div>

                    {/* City Selection dropdown from the selected province */}
                    {province && country && WORLD_COUNTRIES[country]?.provinces[province] && (
                      <div className="space-y-1.5 animate-in slide-in-from-top duration-300">
                        <label className="text-xs font-black uppercase tracking-wider text-white/40 ml-1">Ciudad de Encuentro</label>
                        <select
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold focus:outline-none focus:ring-2 focus:ring-[#E60000]/50"
                        >
                          <option value="" className="bg-zinc-900 text-white">-- Seleccionar Ciudad --</option>
                          {WORLD_COUNTRIES[country].provinces[province].map((c) => (
                            <option key={c} value={c} className="bg-zinc-900 text-white font-bold">
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Physical Specs & Services Block */}
                  <div className="p-4 bg-zinc-950/40 border border-white/5 rounded-2xl space-y-4">
                    <span className="text-xs font-black uppercase tracking-wider text-white/50 flex items-center border-b border-white/5 pb-2">
                      <Tag size={14} className="mr-1.5 text-[#E60000]" /> Características Físicas y Servicios
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Age & birthdate */}
                      <div className="space-y-3 col-span-1 sm:col-span-2 bg-white/5 p-4 rounded-xl border border-white/5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* DOB Input */}
                          <div className="space-y-1.5 justify-center flex flex-col">
                            <label className="text-xs font-black uppercase tracking-wider text-white/40 ml-1">Fecha de Nacimiento (Opcional)</label>
                            <input
                              type="date"
                              value={birthDate}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBirthDate(val);
                                if (val) {
                                  const today = new Date();
                                  const birth = new Date(val);
                                  let calculatedAge = today.getFullYear() - birth.getFullYear();
                                  const m = today.getMonth() - birth.getMonth();
                                  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                                    calculatedAge--;
                                  }
                                  if (calculatedAge >= 18 && calculatedAge <= 80) {
                                    setAge(calculatedAge);
                                  } else if (calculatedAge < 18) {
                                    setAge(18);
                                  } else {
                                    setAge(80);
                                  }
                                }
                              }}
                              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-bold focus:outline-none focus:ring-2 focus:ring-[#E60000]/50"
                            />
                            <p className="text-[10px] text-white/30 ml-1 italic">Calcula tu edad automáticamente al ingresar tu fecha de nacimiento.</p>
                          </div>

                          {/* Slider / Display */}
                          <div className="space-y-1.5 flex flex-col justify-center">
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-xs font-black uppercase tracking-wider text-white/40 ml-1">Edad de Trabajo</label>
                              <span className="text-sm font-black text-white bg-[#E60000]/10 px-2.5 py-0.5 rounded-md text-[#E60000] border border-[#E60000]/20">{age} años</span>
                            </div>
                            <input
                              type="range"
                              min="18"
                              max="80"
                              value={age}
                              onChange={(e) => setAge(parseInt(e.target.value))}
                              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#E60000]"
                            />
                            <div className="flex justify-between text-[10px] text-white/30 font-bold">
                              <span>18 años</span>
                              <span>80 años</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Hair Color */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-white/40 ml-1">Color de Cabello</label>
                        <select
                          value={hair}
                          onChange={(e) => {
                            const val = e.target.value;
                            setHair(val);
                            if (val === 'Otro') {
                              setShowCustomHair(true);
                            } else {
                              setShowCustomHair(false);
                            }
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold focus:outline-none focus:ring-2 focus:ring-[#E60000]/50"
                        >
                          {['Rubio', 'Castaño', 'Negro', 'Pelirrojo', 'Platino', 'Gris / Cano', 'Calvo', 'Fantasía', 'Otro'].map((h) => (
                            <option key={h} value={h} className="bg-zinc-900 text-white font-bold">
                              {h === 'Otro' ? 'Otro / Personalizado...' : h}
                            </option>
                          ))}
                        </select>

                        {/* Custom Hair color manual input */}
                        {hair === 'Otro' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="pt-1.5"
                          >
                            <input
                              type="text"
                              value={customHair}
                              onChange={(e) => setCustomHair(e.target.value)}
                              placeholder="Escribe tu color de cabello..."
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-bold placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#E60000]/50"
                            />
                          </motion.div>
                        )}
                      </div>

                      {/* Eye Color */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-white/40 ml-1">Color de Ojos</label>
                        <select
                          value={eyes}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEyes(val);
                            if (val === 'Otro') {
                              setShowCustomEyes(true);
                            } else {
                              setShowCustomEyes(false);
                            }
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold focus:outline-none focus:ring-2 focus:ring-[#E60000]/50"
                        >
                          {['Azul', 'Verde', 'Miel', 'Oscuro', 'Marrón Claro', 'Gris', 'Otro'].map((ey) => (
                            <option key={ey} value={ey} className="bg-zinc-900 text-white font-bold">
                              {ey === 'Otro' ? 'Otro / Personalizado...' : ey}
                            </option>
                          ))}
                        </select>

                        {/* Custom Eye color manual input */}
                        {eyes === 'Otro' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="pt-1.5"
                          >
                            <input
                              type="text"
                              value={customEyes}
                              onChange={(e) => setCustomEyes(e.target.value)}
                              placeholder="Escribe tu color de ojos..."
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-bold placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#E60000]/50"
                            />
                          </motion.div>
                        )}
                      </div>

                      {/* Favorite/Premium Specialty Service */}
                      <div className="space-y-1.5 col-span-1 sm:col-span-2">
                        <label className="text-xs font-black uppercase tracking-wider text-white/40 ml-1">Especialidad o Servicio VIP Principal</label>
                        <select
                          value={service}
                          onChange={(e) => {
                            const val = e.target.value;
                            setService(val);
                            if (val === 'Otro') {
                              setShowCustomService(true);
                              setCategory(''); // Custom input will update category state
                            } else {
                              setShowCustomService(false);
                              setCategory(val); // Sync with category
                            }
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold focus:outline-none focus:ring-2 focus:ring-[#E60000]/50"
                        >
                          {[
                            'Amistad',
                            'Pasatiempo',
                            'Conversación',
                            'Acompañante de Eventos',
                            'Relación Seria',
                            'Guía de Viajes',
                            'Ocio',
                            'GFe (Novia)',
                            'BDSM Premium',
                            'Masaje Sensual',
                            'Cena VIP',
                            'Viajes Exóticos',
                            'Otro'
                          ].map((s) => (
                            <option key={s} value={s} className="bg-zinc-900 text-white font-bold">
                              {s === 'Otro' ? 'Otro / Personalizado...' : s}
                            </option>
                          ))}
                        </select>

                        {/* Custom service manual input */}
                        {service === 'Otro' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="pt-1.5"
                          >
                            <input
                              type="text"
                              value={customService}
                              onChange={(e) => {
                                setCustomService(e.target.value);
                                setCategory(e.target.value); // Keep sync
                              }}
                              placeholder="Escribe tu especialidad o servicio personalizado..."
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-bold placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#E60000]/50"
                            />
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Redes Sociales VIP Section */}
                  <div className="bg-zinc-950/40 border border-white/5 p-5 md:p-6 rounded-3xl space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <Share2 size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-wider text-white">Redes Sociales VIP</h4>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-0.5">
                          Exclusivo para Perfiles Verificados • Solo visible para tus Suscriptores VIP
                        </p>
                      </div>
                    </div>

                    {!profile?.is_verified && (
                      <div className="text-xs text-amber-500/80 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-2">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold uppercase tracking-wider text-[10px]">Función Restringida</p>
                          <p className="text-white/60 mt-1">
                            Para activar tus enlaces de Redes Sociales, tu cuenta debe estar certificada con el <strong>Sello VIP</strong>. Puedes solicitar la verificación más abajo en esta misma página.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Instagram */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-white/60 ml-1 flex items-center gap-1.5">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" alt="Instagram" className="w-4 h-4" />
                          Instagram
                        </label>
                        <Input
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          placeholder="https://instagram.com/tu_usuario"
                          variant="glass"
                          className="text-xs"
                          disabled={!profile?.is_verified}
                        />
                      </div>

                      {/* Twitter/X */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-white/60 ml-1 flex items-center gap-1.5">
                          <span className="text-white text-xs font-black bg-black w-4 h-4 rounded flex items-center justify-center border border-white/20">X</span>
                          Twitter / X
                        </label>
                        <Input
                          value={twitter}
                          onChange={(e) => setTwitter(e.target.value)}
                          placeholder="https://x.com/tu_usuario"
                          variant="glass"
                          className="text-xs"
                          disabled={!profile?.is_verified}
                        />
                      </div>

                      {/* TikTok */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-white/60 ml-1 flex items-center gap-1.5">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/3/34/Ionicons_logo-tiktok.svg" alt="TikTok" className="w-4 h-4 invert" />
                          TikTok
                        </label>
                        <Input
                          value={tiktok}
                          onChange={(e) => setTiktok(e.target.value)}
                          placeholder="https://tiktok.com/@tu_usuario"
                          variant="glass"
                          className="text-xs"
                          disabled={!profile?.is_verified}
                        />
                      </div>

                      {/* OnlyFans */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-white/60 ml-1 flex items-center gap-1.5">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Onlyfans_logo.svg" alt="OnlyFans" className="w-4 h-4 object-contain" />
                          OnlyFans
                        </label>
                        <Input
                          value={onlyfans}
                          onChange={(e) => setOnlyfans(e.target.value)}
                          placeholder="https://onlyfans.com/tu_usuario"
                          variant="glass"
                          className="text-xs"
                          disabled={!profile?.is_verified}
                        />
                      </div>

                      {/* Telegram */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-white/60 ml-1 flex items-center gap-1.5">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" alt="Telegram" className="w-4 h-4" />
                          Telegram
                        </label>
                        <Input
                          value={telegram}
                          onChange={(e) => setTelegram(e.target.value)}
                          placeholder="https://t.me/tu_usuario"
                          variant="glass"
                          className="text-xs"
                          disabled={!profile?.is_verified}
                        />
                      </div>

                      {/* WhatsApp */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-white/60 ml-1 flex items-center gap-1.5">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-4 h-4" />
                          WhatsApp
                        </label>
                        <Input
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          placeholder="https://wa.me/34600000000 o enlace directo"
                          variant="glass"
                          className="text-xs"
                          disabled={!profile?.is_verified}
                        />
                      </div>

                      {/* Facebook */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-white/60 ml-1 flex items-center gap-1.5">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt="Facebook" className="w-4 h-4" />
                          Facebook
                        </label>
                        <Input
                          value={facebook}
                          onChange={(e) => setFacebook(e.target.value)}
                          placeholder="https://facebook.com/tu_usuario"
                          variant="glass"
                          className="text-xs"
                          disabled={!profile?.is_verified}
                        />
                      </div>

                      {/* Stripchat */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-white/60 ml-1 flex items-center gap-1.5">
                          <img src="https://stripchat.com/favicon.ico" alt="Stripchat" className="w-4 h-4 rounded-sm" />
                          Stripchat
                        </label>
                        <Input
                          value={stripchat}
                          onChange={(e) => setStripchat(e.target.value)}
                          placeholder="https://stripchat.com/tu_usuario"
                          variant="glass"
                          className="text-xs"
                          disabled={!profile?.is_verified}
                        />
                      </div>

                      {/* Kick */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-white/60 ml-1 flex items-center gap-1.5">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Kick_logo.svg" alt="Kick" className="w-4 h-4" />
                          Kick
                        </label>
                        <Input
                          value={kick}
                          onChange={(e) => setKick(e.target.value)}
                          placeholder="https://kick.com/tu_usuario"
                          variant="glass"
                          className="text-xs"
                          disabled={!profile?.is_verified}
                        />
                      </div>

                      {/* Clapper */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-white/60 ml-1 flex items-center gap-1.5">
                          <img src="https://clapperapp.com/favicon.ico" alt="Clapper" className="w-4 h-4 rounded-sm" />
                          Clapper
                        </label>
                        <Input
                          value={clapper}
                          onChange={(e) => setClapper(e.target.value)}
                          placeholder="https://clapperapp.com/tu_usuario"
                          variant="glass"
                          className="text-xs"
                          disabled={!profile?.is_verified}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-white/5 p-4 border border-white/10">
                    <div>
                      <h4 className="text-sm font-bold text-white">Perfil Privado</h4>
                      <p className="text-xs text-white/50">Solo tus seguidores podrán ver tus publicaciones.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPrivate(!isPrivate)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        isPrivate ? 'bg-primary-600' : 'bg-white/10'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isPrivate ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`flex items-center space-x-2 rounded-lg p-3 text-sm ${
                        message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                      <span>{message.text}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button type="submit" className="w-full" isLoading={loading}>
                  Guardar Cambios
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Stats Panel */}
          <div className="mt-8">
            <h3 className="text-sm font-bold text-white mb-4 px-1 flex items-center">
              <BarChart3 size={16} className="mr-2 text-primary-500" />
              Estadísticas de mi Perfil
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Seguidores', value: stats?.followers || 0, color: 'bg-blue-500' },
                { label: 'Likes Recibidos', value: stats?.likes || 0, color: 'bg-green-500' },
                { label: 'Mensajes', value: stats?.messagesReceived || 0, color: 'bg-purple-500' },
                { label: 'Valoración', value: profile?.rating?.toFixed(1) || '0.0', color: 'bg-amber-500' },
              ].map((stat, i) => (
                <Card key={i} className="glass-card p-4 border-none flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-white italic">{stat.value}</span>
                  <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider mt-1">{stat.label}</span>
                  <div className={`w-8 h-1 ${stat.color} rounded-full mt-3 opacity-20`} />
                </Card>
              ))}
            </div>
            <p className="text-[10px] text-white/20 mt-4 italic text-center uppercase tracking-widest font-bold">Resumen de los últimos 30 días</p>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-bold text-white mb-4 px-1">Notificaciones</h3>
            <Card className="glass-card border-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${isSubscribed ? 'bg-primary-600/20 text-primary-400' : 'bg-white/5 text-white/40'}`}>
                      {isSubscribed ? <Bell size={24} /> : <BellOff size={24} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">Notificaciones Push</h4>
                      <p className="text-sm text-white/60">
                        {!isSupported 
                          ? 'Tu navegador no soporta notificaciones push.' 
                          : permission === 'denied' 
                            ? 'Has bloqueado las notificaciones. Cámbialo en los ajustes del navegador.'
                            : isSubscribed 
                              ? 'Recibirás avisos en tu dispositivo incluso con la app cerrada.' 
                              : 'Activa para recibir avisos de nuevos mensajes en tu dispositivo.'}
                      </p>
                    </div>
                  </div>
                  {isSupported && permission !== 'denied' && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      {isSubscribed && (
                        <Button 
                          variant="outline"
                          onClick={sendTestNotification}
                          className="border-white/10 text-white/60"
                        >
                          Probar
                        </Button>
                      )}
                      <Button 
                        variant={isSubscribed ? "outline" : "primary"}
                        onClick={isSubscribed ? unsubscribe : subscribe}
                        className={isSubscribed ? "border-white/10 text-white/60" : ""}
                      >
                        {isSubscribed ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-bold text-white mb-4 px-1">Seguridad</h3>
            
            <div className="space-y-4">
              {/* Verification Section */}
              <Card className="glass-card border-none bg-gradient-to-br from-primary-600/5 to-transparent">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-white flex items-center">
                    <BadgeCheck size={18} className="mr-2 text-primary-400" />
                    Solicitar Verificación de Identidad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg shrink-0 ${
                            profile?.verification_status === 'verified' ? 'bg-green-500/20 text-green-400' :
                            profile?.verification_status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            <ShieldCheck size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">
                              Estado: {
                                profile?.verification_status === 'verified' ? 'Verificado' :
                                profile?.verification_status === 'pending' ? 'Pendiente de Revisión' :
                                profile?.verification_status === 'rejected' ? 'Rechazado' : 'No Iniciado'
                              }
                            </p>
                            <p className="text-xs text-white/40 mt-1">
                              {profile?.verification_status === 'verified' 
                                ? 'Tu identidad ha sido confirmada. Disfrutas de máxima confianza.'
                                : profile?.verification_status === 'pending'
                                ? 'Estamos revisando tu documento. Te avisaremos pronto.'
                                : 'Para verificar tu perfil, sube una foto de tu documento de identidad o una selfie sosteniendo un cartel con la fecha.'}
                            </p>
                          </div>
                        </div>

                        {profile?.verification_status === 'pending' && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (!user) return;
                              setUploadingVerif(true);
                              try {
                                await supabase
                                  .from('profiles')
                                  .update({ 
                                    verification_status: 'verified',
                                    is_verified: true 
                                  })
                                  .eq('id', user.id);
                                setMessage({ type: 'success', text: '¡Bypass de Administrador VIP Aprobado! Tu cuenta ahora posee el Sello VIP oficial verificado.' });
                                await refreshProfile();
                              } catch (err: any) {
                                setMessage({ type: 'error', text: err.message });
                              } finally {
                                setUploadingVerif(false);
                              }
                            }}
                            className="shrink-0 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all shadow-xl animate-pulse"
                          >
                            Aprobar Sello VIP (Admin)
                          </button>
                        )}
                      </div>
                    </div>

                    {(!profile?.verification_status || profile.verification_status === 'none' || profile.verification_status === 'rejected') && (
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Option 1: Live Webcam Snapshot */}
                        <button
                          type="button"
                          onClick={startCamera}
                          disabled={uploadingVerif}
                          className="flex-1 py-4 px-6 rounded-2xl border-2 border-dashed border-primary-500/30 bg-primary-500/5 hover:bg-primary-500/10 transition-colors flex flex-col items-center justify-center gap-2 group cursor-pointer"
                        >
                          <Camera size={26} className="text-primary-400 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-black text-white uppercase tracking-widest">Tomar Selfie en Vivo</span>
                          <span className="text-[10px] text-white/40 font-semibold uppercase tracking-tight">Captura instantánea real</span>
                        </button>

                        {/* Option 2: Upload File */}
                        <button
                          type="button"
                          onClick={() => document.getElementById('verif-input')?.click()}
                          disabled={uploadingVerif}
                          className="flex-1 py-4 px-6 rounded-2xl border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex flex-col items-center justify-center gap-2 group cursor-pointer"
                        >
                          <UploadCloud size={26} className="text-white/40 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-black text-white uppercase tracking-widest">Subir de Galería</span>
                          <span className="text-[10px] text-white/40 font-semibold uppercase tracking-tight">Formatos: JPG, PNG, WEBP</span>
                        </button>

                        <input 
                          id="verif-input"
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          onChange={handleVerificationUpload}
                          disabled={uploadingVerif}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-none">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-white flex items-center">
                    <Key size={18} className="mr-2 text-primary-400" />
                    Actualizar Contraseña
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        type="password"
                        label="Nueva Contraseña"
                        placeholder="Mínimo 6 caracteres"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        variant="glass"
                        required
                      />
                      <Input
                        type="password"
                        label="Confirmar Contraseña"
                        placeholder="Repite la contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        variant="glass"
                        required
                      />
                    </div>

                    <AnimatePresence>
                      {passwordMessage && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={`flex items-center space-x-2 rounded-lg p-3 text-sm ${
                            passwordMessage.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {passwordMessage.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                          <span>{passwordMessage.text}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button type="submit" className="w-full sm:w-auto" isLoading={passwordLoading}>
                      Actualizar Contraseña
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-red-500/20 bg-red-500/5 glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-red-400">Cerrar Sesión en otros dispositivos</h4>
                      <p className="text-sm text-red-400/60">Esto desconectará tu cuenta de todos los navegadores activos.</p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      onClick={async () => {
                        try {
                          await supabase.auth.signOut({ scope: 'others' });
                          setMessage({ type: 'success', text: 'Sesiones cerradas en otros dispositivos' });
                        } catch (error: any) {
                          setMessage({ type: 'error', text: error.message });
                        }
                      }}
                    >
                      Desconectar otros
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10">
            <h3 className="text-sm font-bold text-red-500 mb-4 px-1 uppercase tracking-widest">Zona de Peligro</h3>
            <Card className="border-red-900/50 bg-red-950/20 glass-card">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-red-500">Eliminar Cuenta Permanentemente</h4>
                    <p className="text-sm text-red-500/60">Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, ten la seguridad de que quieres hacer esto.</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300"
                    onClick={() => {
                      setDeletePassword('');
                      setDeleteError(null);
                      setIsDeleteModalOpen(true);
                    }}
                  >
                    Eliminar Perfil
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md overflow-hidden rounded-3xl border border-red-500/20 bg-zinc-950 p-8 shadow-2xl"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 mb-6 mx-auto">
                <Trash2 size={32} />
              </div>
              
              <h3 className="text-2xl font-black text-white mb-3 text-center">
                ¿Eliminar cuenta permanentemente?
              </h3>
              
              <p className="text-white/60 mb-8 text-center leading-relaxed">
                Esta acción es <span className="text-red-500 font-bold">irreversible</span>. Se borrarán todas tus publicaciones, mensajes, seguidores y toda tu actividad en <span className="text-primary-400 font-bold italic">Pasiones Vip</span>.
              </p>

              <div className="mb-6">
                <Input
                  type="password"
                  label="Confirma tu contraseña"
                  placeholder="Ingresa tu contraseña actual"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  variant="glass"
                  className="bg-white/5 border-white/10"
                  error={deleteError || undefined}
                />
              </div>
              
              <div className="flex flex-col space-y-3">
                <Button
                  className="w-full bg-red-600 hover:bg-red-700 text-white h-12 font-bold text-lg rounded-xl shadow-lg shadow-red-600/20"
                  onClick={handleDeleteAccount}
                  isLoading={deleteLoading}
                >
                  Sí, eliminar todo
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-white/40 hover:text-white hover:bg-white/5 h-12 font-bold"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={deleteLoading}
                >
                  Cancelar y volver
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Live Selfie Capture Modal */}
        {isCameraSelectOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md overflow-hidden rounded-[2.5rem] bg-zinc-950 border border-primary-500/10 p-8 shadow-2xl relative text-center"
            >
              <h3 className="text-xl font-black text-white italic uppercase tracking-wider mb-2">Tomar Selfie en Vivo</h3>
              <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-6">Coloca tu rostro en el óvalo de la pantalla</p>
              
              <div className="relative h-64 w-64 mx-auto rounded-full overflow-hidden border-4 border-dashed border-primary-500/50 bg-black flex items-center justify-center shadow-lg mb-6 ring-4 ring-primary-500/10">
                {!snapshot ? (
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    muted 
                    className="h-full w-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <img 
                    src={snapshot} 
                    alt="Captured selfie" 
                    className="h-full w-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                )}
                {/* Circular face guide overlay when camera is live */}
                {!snapshot && (
                   <div className="absolute inset-0 border-[24px] border-zinc-950/70 pointer-events-none rounded-full" />
                )}
              </div>

              <div className="flex flex-col space-y-3">
                {!snapshot ? (
                  <Button
                    onClick={captureSnapshot}
                    className="w-full h-12 bg-primary-600 hover:bg-primary-500 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                  >
                    📸 Capturar Foto
                  </Button>
                ) : (
                  <div className="flex gap-2 w-full">
                    <Button
                      onClick={handleConfirmSnapshot}
                      className="flex-1 h-12 bg-green-500 hover:bg-green-600 text-black font-black uppercase tracking-widest text-xs"
                    >
                      ✓ Enviar Selfie
                    </Button>
                    <Button
                      onClick={() => setSnapshot(null)}
                      variant="outline"
                      className="flex-1 h-12 border-white/10 hover:bg-white/5 text-white/80 font-black uppercase tracking-widest text-xs"
                    >
                      Repetir
                    </Button>
                  </div>
                )}
                <Button
                  onClick={stopCamera}
                  variant="ghost"
                  className="w-full text-white/40 hover:text-white"
                >
                  Cancelar y cerrar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
