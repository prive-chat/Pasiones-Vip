import React, { useState, useMemo } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Search, Filter, CheckCircle2, Eye, Download, UserCheck, ShieldAlert, SlidersHorizontal, RefreshCw, Clock, XCircle, ShieldCheck } from 'lucide-react';
import { UserProfile } from '@/src/types';
import { Link } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/src/lib/supabase';

interface AdminUsersProps {
  profiles: UserProfile[];
  onToggleVerification: (id: string, status: boolean) => void;
  onRefresh?: () => void;
}

export function AdminUsers({ profiles, onToggleVerification, onRefresh }: AdminUsersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'unverified' | 'pending'>('all');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'super_admin'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'alphabetical'>('newest');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedProfileForSelfie, setSelectedProfileForSelfie] = useState<UserProfile | null>(null);
  const [localProfiles, setLocalProfiles] = useState<UserProfile[]>([]);

  // Keep a local profiles copy and sync when source change
  const currentProfiles = useMemo(() => {
    return profiles.map(p => {
      const match = localProfiles.find(lp => lp.id === p.id);
      return match ? { ...p, ...match } : p;
    });
  }, [profiles, localProfiles]);

  const handleUpdateStatus = async (userId: string, isVerified: boolean, status: 'none' | 'pending' | 'verified' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_verified: isVerified,
          verification_status: status
        })
        .eq('id', userId);

      if (error) throw error;
      
      // Update local profiles state to trigger instantaneous UI feedback
      setLocalProfiles(prev => {
        const existing = prev.filter(p => p.id !== userId);
        return [...existing, { id: userId, is_verified: isVerified, verification_status: status } as any];
      });
      setSelectedProfileForSelfie(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // 1. Fully-functional Search & Filter logic
  const filteredProfiles = useMemo(() => {
    return currentProfiles
      .filter((profile) => {
        const matchesSearch = 
          (profile.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (profile.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (profile.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (profile.city || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
          filterStatus === 'all' ||
          (filterStatus === 'verified' && profile.is_verified) ||
          (filterStatus === 'pending' && profile.verification_status === 'pending') ||
          (filterStatus === 'unverified' && !profile.is_verified && profile.verification_status !== 'pending');

        const matchesRole =
          filterRole === 'all' ||
          profile.role === filterRole;

        return matchesSearch && matchesStatus && matchesRole;
      })
      .sort((a, b) => {
        if (sortBy === 'alphabetical') {
          return (a.full_name || '').localeCompare(b.full_name || '');
        }
        // Default: Newest first (using created_at)
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
  }, [currentProfiles, searchTerm, filterStatus, filterRole, sortBy]);

  // 2. Real CSV Exporter
  const handleExportCSV = () => {
    const headers = ['ID', 'Nombre Completo', 'Email', 'Rol', 'Verificado', 'Ciudad', 'Categoría', 'Fecha Registro'];
    const rows = filteredProfiles.map((p) => [
      p.id,
      p.full_name || 'Sin Nombre',
      p.email || 'N/A',
      p.role || 'user',
      p.is_verified ? 'Verificado' : 'No Verificado',
      p.city || '',
      p.category || '',
      p.created_at ? new Date(p.created_at).toLocaleString('es-ES') : ''
    ]);

    // Format fields with quotes to prevent issues with commas inside the fields
    const csvRows = [
      headers.join(','),
      ...rows.map((row) => row.map((field) => `"${field.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `RedPasiones_Usuarios_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterRole('all');
    setSortBy('newest');
  };

  return (
    <div className="space-y-6">
      {/* Search and control room actions */}
      <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between mb-2">
        <div className="relative flex-1">
          <Input 
            placeholder="Buscar por nombre, email, ciudad o ID de usuario..." 
            variant="glass" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftElement={<Search size={18} className="text-white/40" />}
            className="w-full text-sm font-medium"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white text-xs font-black uppercase tracking-widest px-2"
            >
              Borrar
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant={showAdvancedFilters ? 'primary' : 'outline'} 
            size="sm" 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex-1 sm:flex-none uppercase tracking-wider font-black text-[10px] h-10 px-4"
          >
            <SlidersHorizontal size={14} className="mr-2" />
            Filtros {showAdvancedFilters ? 'Abiertos' : 'Avanzados'}
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportCSV}
            disabled={filteredProfiles.length === 0}
            className="flex-1 sm:flex-none uppercase tracking-wider font-black text-[10px] h-10 px-4 border-white/10 text-white/80 hover:text-white"
          >
            <Download size={14} className="mr-2 text-primary-500" /> 
            Exportar ({filteredProfiles.length})
          </Button>
          
          {(searchTerm || filterStatus !== 'all' || filterRole !== 'all') && (
            <button 
              onClick={handleResetFilters}
              className="flex items-center text-[10px] font-black uppercase text-primary-500 hover:text-primary-400 px-2 tracking-widest gap-1"
            >
              <RefreshCw size={10} /> Restablecer
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filter drawer */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="space-y-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Filtro de Verificación</span>
                <div className="flex bg-black/40 p-1 rounded-xl">
                  {([
                    { id: 'all', label: 'Todos' },
                    { id: 'verified', label: 'Verificados' },
                    { id: 'pending', label: 'Pendientes' },
                    { id: 'unverified', label: 'Sin Verificar' }
                  ] as const).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setFilterStatus(opt.id)}
                      className={cn(
                        "flex-1 text-[10px] py-1.5 rounded-lg font-black uppercase tracking-wider transition-all whitespace-nowrap px-1",
                        filterStatus === opt.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/80"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Filtro de Rol</span>
                <div className="flex bg-black/40 p-1 rounded-xl">
                  {([
                    { id: 'all', label: 'Todos' },
                    { id: 'user', label: 'Miembro' },
                    { id: 'super_admin', label: 'Admin' }
                  ] as const).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setFilterRole(opt.id)}
                      className={cn(
                        "flex-1 text-[10px] py-1.5 rounded-lg font-black uppercase tracking-wider transition-all",
                        filterRole === opt.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/80"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Orden de Visualización</span>
                <div className="flex bg-black/40 p-1 rounded-xl">
                  {([
                    { id: 'newest', label: 'Más Reciente' },
                    { id: 'alphabetical', label: 'A - Z' }
                  ] as const).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSortBy(opt.id)}
                      className={cn(
                        "flex-1 text-[10px] py-1.5 rounded-lg font-black uppercase tracking-wider transition-all",
                        sortBy === opt.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/80"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results summary bar */}
      <div className="flex items-center justify-between px-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
        <span>Mostrando {filteredProfiles.length} de {profiles.length} usuarios registrados en total</span>
        {filteredProfiles.filter(p => p.is_verified).length > 0 && (
          <span className="text-primary-500">{filteredProfiles.filter(p => p.is_verified).length} verificados</span>
        )}
      </div>

      {/* Profile listing */}
      <div className="grid grid-cols-1 gap-4">
        {filteredProfiles.length === 0 ? (
          <Card className="p-12 glass-card border-none flex flex-col items-center justify-center text-center">
            <UserCheck size={36} className="text-white/10 mb-3" />
            <p className="text-white font-bold mb-1">Sin resultados encontrados</p>
            <p className="text-white/40 text-xs">Ajusta los filtros de seguridad o la búsqueda para encontrar lo que necesitas.</p>
          </Card>
        ) : (
          filteredProfiles.map((profile) => (
            <Card key={profile.id} className="p-4 glass-card border-none group hover:bg-white/5 transition-all">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4 w-full sm:w-auto overflow-hidden">
                  <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden ring-1 ring-white/10 relative shrink-0">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-xl font-black text-white/20">{profile.full_name?.[0] || 'U'}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-white font-bold truncate">{profile.full_name || 'Sin Nombre'}</h4>
                      {profile.is_verified && <CheckCircle2 size={14} className="text-primary-400" />}
                      
                      {profile.verification_status === 'pending' && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider bg-amber-500/25 text-amber-400 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                          <Clock size={10} /> Selfie VIP Pendiente
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/40 font-mono truncate">{profile.email}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className={cn(
                        "text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider",
                        profile.role === 'super_admin' ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-blue-500/20 text-blue-400"
                      )}>
                        {profile.role === 'super_admin' ? 'Super Admin' : 'Usuario'}
                      </span>
                      {profile.city && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-white/5 text-white/50 border border-white/5 uppercase">
                          📍 {profile.city}
                        </span>
                      )}
                      {profile.category && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-primary-600/10 text-primary-400 border border-primary-500/20 uppercase">
                          🏷️ {profile.category}
                        </span>
                      )}
                      <span className="text-[9px] text-white/20 font-bold font-mono">
                        ID: {profile.id.substring(0, 8)}...
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                  {profile.verification_status === 'pending' && profile.verification_id_url && (
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => setSelectedProfileForSelfie(profile)}
                      className="font-black text-[10px] uppercase tracking-widest h-10 px-4 bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-black border border-amber-500/30 shrink-0"
                    >
                      Revisar Selfie
                    </Button>
                  )}
                  
                  <Button
                    variant={profile.is_verified ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => {
                      if (profile.is_verified) {
                        handleUpdateStatus(profile.id, false, 'none');
                      } else {
                        handleUpdateStatus(profile.id, true, 'verified');
                      }
                    }}
                    className="flex-1 sm:flex-none font-black text-[10px] uppercase tracking-widest h-10 px-4 whitespace-nowrap"
                  >
                    {profile.is_verified ? 'Revocar Acceso' : 'Verificar'}
                  </Button>
                  
                  <Link to={`/profile/${profile.id}`}>
                    <Button variant="outline" size="sm" className="h-10 w-10 p-0 border-white/10 hover:border-white/30 text-white/60 hover:text-white shrink-0">
                      <Eye size={18} />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Selfie Verification Approval Modal */}
      <AnimatePresence>
        {selectedProfileForSelfie && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl overflow-hidden rounded-[2.5rem] p-8 glass-card border border-white/10 shadow-2xl relative"
            >
              <h3 className="text-xl font-black text-white italic uppercase tracking-widest text-center mb-1">
                Verificación de Sello VIP
              </h3>
              <p className="text-xs text-white/40 text-center uppercase tracking-widest font-bold mb-6">
                Compara las fotografías cuidadosamente antes de aprobar el sello
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Profile Pic Card */}
                <div className="flex flex-col items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-3">Foto de Perfil</span>
                  <div className="h-48 w-48 rounded-2xl overflow-hidden bg-black/40 ring-1 ring-white/10">
                    {selectedProfileForSelfie.avatar_url ? (
                      <img 
                        src={selectedProfileForSelfie.avatar_url} 
                        alt="Profile avatar" 
                        className="h-full w-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-white/20 text-xs italic font-bold">Sin foto</div>
                    )}
                  </div>
                  <span className="text-sm font-black text-white mt-4">{selectedProfileForSelfie.full_name}</span>
                  <span className="text-xs text-white/40">@{selectedProfileForSelfie.username || 'sin_usuario'}</span>
                </div>

                {/* Verification Real-time Selfie Card */}
                <div className="flex flex-col items-center p-4 bg-white/5 rounded-2xl border border-amber-500/20">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                    <Clock size={12} className="animate-pulse" /> Selfie en Tiempo Real
                  </span>
                  <div className="h-48 w-48 rounded-2xl overflow-hidden bg-black/40 ring-1 ring-amber-500/25">
                    {selectedProfileForSelfie.verification_id_url ? (
                      <img 
                        src={selectedProfileForSelfie.verification_id_url} 
                        alt="Verification Selfie" 
                        className="h-full w-full object-cover cursor-pointer hover:scale-105 transition-transform" 
                        referrerPolicy="no-referrer"
                        onClick={() => window.open(selectedProfileForSelfie.verification_id_url, '_blank')}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-white/20 text-xs italic font-bold">Sin selfie</div>
                    )}
                  </div>
                  <span className="text-xs text-amber-500 font-bold mt-4 italic">Confirmar que corresponde al usuario</span>
                  <span className="text-[10px] text-white/20 font-mono mt-1 select-all">{selectedProfileForSelfie.id}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => handleUpdateStatus(selectedProfileForSelfie.id, true, 'verified')}
                  className="flex-1 h-12 bg-green-500 hover:bg-green-600 text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={16} />
                  Aprobar Sello VIP
                </Button>
                <Button
                  onClick={() => handleUpdateStatus(selectedProfileForSelfie.id, false, 'rejected')}
                  variant="outline"
                  className="flex-1 h-12 border-red-500/30 hover:border-red-500 text-red-400 hover:bg-red-500/10 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                >
                  <XCircle size={16} />
                  Rechazar Solicitud
                </Button>
                <Button
                  onClick={() => setSelectedProfileForSelfie(null)}
                  variant="ghost"
                  className="h-12 text-white/40 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-xs"
                >
                  Cancelar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

