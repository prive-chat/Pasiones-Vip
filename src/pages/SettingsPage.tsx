import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Camera, Check, AlertCircle, ShieldCheck, Mail, Calendar, Bell, BellOff, Trash2 } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { profileService } from '../services/profileService';

export default function SettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const { isSubscribed, subscribe, unsubscribe, isSupported, permission } = usePushNotifications(user?.id);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [bio, setBio] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setUsername(profile.username || '');
      setAvatarUrl(profile.avatar_url || '');
      setCoverUrl(profile.cover_url || '');
      setBio(profile.bio || '');
      setIsPrivate(profile.is_private || false);
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
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          username: username.toLowerCase(),
          avatar_url: avatarUrl,
          cover_url: coverUrl,
          bio: bio,
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
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

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
      const fileExt = file.name.split('.').pop();
      const fileName = `cover-${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

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
      </AnimatePresence>
    </div>
  );
}
