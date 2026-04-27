import React, { useState, useRef } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Ad } from '@/src/types';
import { adminService } from '@/src/services/adminService';

interface AdModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  ad?: Ad | null;
}

export default function AdModal({ onClose, onSuccess, ad }: AdModalProps) {
  const [formData, setFormData] = useState<Partial<Ad>>(() => {
    if (!ad) return {
      title: '',
      description: '',
      link_url: '',
      placement: 'feed',
      status: 'active',
      type: 'image',
      starts_at: new Date().toISOString().split('T')[0],
      ends_at: '',
      cost_per_click: 0,
      cost_per_impression: 0,
      total_budget: 0,
      priority: 0,
    };
    
    // Clean ad object to remove any UI-only properties like onSuccess
    const { onSuccess: _, ...cleanAd } = ad as any;
    return cleanAd;
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(ad?.image_url || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/')) {
      setError('Solo se permiten imágenes y videos.');
      return;
    }

    setFile(selectedFile);
    setFormData(prev => ({ ...prev, type: selectedFile.type.startsWith('video/') ? 'video' : 'image' }));
    
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
        setError('El título es obligatorio.');
        return;
    }
    if (!preview) {
        setError('Debes subir una imagen o video.');
        return;
    }

    setUploading(true);
    setError(null);

    try {
      let imageUrl = formData.image_url;

      if (file) {
        const uploadRes = await adminService.uploadAdMedia(file);
        imageUrl = uploadRes.url;
      }

      // Prepare data for database (Strip non-column properties like onSuccess if they snuck in)
      const { onSuccess: _, ...dbData } = formData as any;

      const adData = {
        ...dbData,
        image_url: imageUrl,
        cta_text: formData.cta_text || null,
        starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : new Date().toISOString(),
        ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
      };

      if (ad?.id) {
        await adminService.updateAd(ad.id, adData);
      } else {
        await adminService.createAd(adData as any);
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Ad saving error:', err);
      setError(err.message || 'Error al guardar el anuncio.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Input
            label="Título del Anuncio"
            placeholder="Ej: Oferta VIP"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            required
          />
          
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-passion-red/80">Descripción</label>
            <textarea
              placeholder="Brief del anuncio..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl bg-white/5 border border-white/10 p-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all min-h-[80px] resize-none text-sm"
            />
          </div>

          <Input
            label="URL de Destino"
            placeholder="https://..."
            value={formData.link_url}
            onChange={e => setFormData({ ...formData, link_url: e.target.value })}
          />

          <Input
            label="Texto del Botón (CTA)"
            placeholder="Ej: Ver más, Comprar, Registrarse..."
            value={formData.cta_text || ''}
            onChange={e => setFormData({ ...formData, cta_text: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-passion-red/80">Ubicación</label>
              <select
                value={formData.placement}
                onChange={e => setFormData({ ...formData, placement: e.target.value as any })}
                className="w-full h-10 rounded-lg bg-zinc-800 border border-white/10 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                <option value="feed">Feed (Muro)</option>
                <option value="sidebar">Sidebar (Lateral)</option>
                <option value="interstitial">Interstitial (Emergente)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-passion-red/80">Estado</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full h-10 rounded-lg bg-zinc-800 border border-white/10 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                <option value="active">Activo</option>
                <option value="paused">Pausado</option>
                <option value="scheduled">Programado</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
           <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-passion-red/80">Material Creativo</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square w-full rounded-2xl border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary-500/50 transition-all cursor-pointer flex flex-col items-center justify-center space-y-2 overflow-hidden group relative"
              >
                {preview ? (
                  <>
                    {formData.type === 'video' ? (
                      <video src={preview} className="h-full w-full object-cover" />
                    ) : (
                      <img src={preview} className="h-full w-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-bold text-xs uppercase tracking-widest">
                      Cambiar Archivo
                    </div>
                  </>
                ) : (
                  <>
                    <Upload size={32} className="text-white/20 group-hover:text-primary-400 group-hover:scale-110 transition-all" />
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-center px-4">Click para subir foto o video</p>
                  </>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,video/*"
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Inicio"
                type="date"
                value={formData.starts_at?.split('T')[0]}
                onChange={e => setFormData({ ...formData, starts_at: e.target.value })}
              />
              <Input
                label="Fin (Opcional)"
                type="date"
                value={formData.ends_at?.split('T')[0] || ''}
                onChange={e => setFormData({ ...formData, ends_at: e.target.value })}
              />
            </div>

            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10 space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-green-400">Configuración Comercial</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Costo por Click ($)"
                  type="number"
                  step="0.01"
                  value={formData.cost_per_click}
                  onChange={e => setFormData({ ...formData, cost_per_click: parseFloat(e.target.value) })}
                />
                <Input
                  label="Costo por 1000 Imp. ($)"
                  type="number"
                  step="0.01"
                  value={formData.cost_per_impression}
                  onChange={e => setFormData({ ...formData, cost_per_impression: parseFloat(e.target.value) })}
                />
              </div>

              <Input
                label="Presupuesto Total Meta ($)"
                type="number"
                step="1"
                value={formData.total_budget}
                onChange={e => setFormData({ ...formData, total_budget: parseFloat(e.target.value) })}
                placeholder="Ej: 500"
              />

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-green-400">Prioridad / Peso</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={formData.priority || 0}
                  onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  className="w-full accent-green-500"
                />
                <div className="flex justify-between text-[10px] font-bold text-white/20 uppercase">
                  <span>Normal (0)</span>
                  <span>Destacado (10)</span>
                </div>
              </div>
            </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20">
          <AlertCircle size={18} className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="flex-1"
          disabled={uploading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1"
          isLoading={uploading}
          disabled={uploading}
        >
          {ad?.id ? 'Guardar Cambios' : 'Crear Anuncio'}
        </Button>
      </div>
    </form>
  );
}
