import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Users, 
  Image as ImageIcon, 
  Send, 
  AlertTriangle,
  LayoutDashboard,
  Lock,
  Megaphone
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { adminService } from '../services/adminService';
import { mediaService } from '../services/mediaService';
import type { SystemStats, AuditLog } from '../services/adminService';
import type { UserProfile, MediaItem, Ad } from '../types';
import { cn } from '../lib/utils';
import { ConfirmModal } from '../components/ui/ConfirmModal';

// Modular Components
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { AdminUsers } from '../components/admin/AdminUsers';
import { AdminModeration } from '../components/admin/AdminModeration';
import { AdminSecurity } from '../components/admin/AdminSecurity';
import { AdminBroadcast } from '../components/admin/AdminBroadcast';
import { AdminAds } from '../components/admin/AdminAds';

type AdminTab = 'dashboard' | 'users' | 'moderation' | 'ads' | 'security' | 'broadcast';

const tabs: { id: AdminTab; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'moderation', label: 'Moderación', icon: ImageIcon },
  { id: 'ads', label: 'Publicidad', icon: Megaphone },
  { id: 'security', label: 'Seguridad', icon: Lock },
  { id: 'broadcast', label: 'Broadcast', icon: Send },
];

export default function AdminPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [viewerMedia, setViewerMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'media' | 'ad', id: string, title: string } | null>(null);
  const [broadcastStatus, setBroadcastStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profilesRes, mediaRes, statsRes, logsRes, adsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('media').select('*, profiles(*)').order('created_at', { ascending: false }),
        adminService.fetchStats(),
        adminService.fetchAuditLogs(20),
        adminService.fetchAds()
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (mediaRes.error) throw mediaRes.error;

      if (profilesRes.data) setProfiles(profilesRes.data);
      if (mediaRes.data) setMedia(mediaRes.data);
      setStats(statsRes);
      setAuditLogs(logsRes);
      setAds(adsRes);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      setError(err.message || 'Error al conectar con la base de datos');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerification = async (userId: string, currentStatus: boolean) => {
    const previousProfiles = [...profiles];
    setProfiles(profiles.map(p => p.id === userId ? { ...p, is_verified: !currentStatus } : p));

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
    } catch (err) {
      console.error('Error toggling verification:', err);
      setProfiles(previousProfiles);
    }
  };

  const handleDeleteMedia = (mediaId: string) => {
    setConfirmDelete({ type: 'media', id: mediaId, title: '¿Eliminar contenido?' });
  };

  const handleBroadcast = async (title: string, content: string) => {
    if (!profile) return;
    setIsBroadcasting(true);
    setBroadcastStatus(null);
    try {
      await adminService.broadcastMessage(title, content, profile.id);
      setBroadcastStatus({ type: 'success', message: 'Comunicado enviado con éxito a todos los usuarios.' });
    } catch (err) {
      console.error('Error broadcasting message:', err);
      setBroadcastStatus({ type: 'error', message: 'Error al enviar el comunicado.' });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleDeleteAd = (adId: string) => {
    setConfirmDelete({ type: 'ad', id: adId, title: '¿Eliminar anuncio?' });
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    const { type, id } = confirmDelete;
    
    try {
      if (type === 'media') {
        await mediaService.deleteMedia(id);
        setMedia(media.filter(m => m.id !== id));
      } else {
        await adminService.deleteAd(id);
        setAds(ads.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
    } finally {
      setConfirmDelete(null);
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 font-black uppercase tracking-widest text-xs">Accediendo al Núcleo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20 pt-24 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 text-primary-500 mb-2">
              <Shield size={32} strokeWidth={2.5} />
              <span className="text-xs font-black uppercase tracking-[0.3em]">Central de Inteligencia</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic leading-none">
              Panel de <span className="text-primary-600">Control</span>
            </h1>
          </div>
          
          <nav className="flex bg-white/5 p-1 rounded-2xl overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  activeTab === tab.id 
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20" 
                    : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {broadcastStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                "mb-6 p-4 rounded-xl border flex items-center justify-between",
                broadcastStatus.type === 'success' ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"
              )}
            >
              <p className="text-xs font-bold uppercase tracking-widest">{broadcastStatus.message}</p>
              <button onClick={() => setBroadcastStatus(null)} className="text-xs hover:text-white opacity-50 underline">Cerrar</button>
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex flex-col items-center text-center"
            >
              <AlertTriangle size={48} className="text-red-400 mb-4" />
              <h3 className="text-xl font-black text-white uppercase italic mb-2">Error de Conexión</h3>
              <p className="text-white/60 text-sm max-w-md mb-6">{error}</p>
              <Button variant="outline" onClick={fetchData}>Reintentar Conexión</Button>
            </motion.div>
          )}

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && stats && (
              <AdminDashboard stats={stats} profiles={profiles} />
            )}

            {activeTab === 'users' && (
              <AdminUsers 
                profiles={profiles} 
                onToggleVerification={handleToggleVerification} 
              />
            )}

            {activeTab === 'moderation' && (
              <AdminModeration 
                media={media} 
                onDelete={handleDeleteMedia} 
                onInspect={setViewerMedia} 
              />
            )}

            {activeTab === 'ads' && (
              <AdminAds ads={ads} onDeleteAd={handleDeleteAd} onRefresh={fetchData} />
            )}

            {activeTab === 'security' && (
              <AdminSecurity auditLogs={auditLogs} onRefresh={fetchData} />
            )}

            {activeTab === 'broadcast' && (
              <AdminBroadcast onBroadcast={handleBroadcast} isBroadcasting={isBroadcasting} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modals & Confirmation */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        title={confirmDelete?.title || ''}
        message="Esta acción no se puede deshacer. El registro se eliminará permanentemente de los servidores."
        confirmText="Eliminar permanentemente"
        variant="danger"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Media Viewer Modal */}
      <AnimatePresence>
        {viewerMedia && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95"
            onClick={() => setViewerMedia(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {viewerMedia.type === 'image' ? (
                <img src={viewerMedia.url} className="w-full h-full object-contain" />
              ) : (
                <video src={viewerMedia.url} controls autoPlay className="w-full h-full" />
              )}
              <Button 
                variant="outline" 
                className="absolute top-4 right-4 h-10 w-10 p-0 rounded-full bg-black/50 backdrop-blur-xl border-white/20"
                onClick={() => setViewerMedia(null)}
              >
                ×
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
