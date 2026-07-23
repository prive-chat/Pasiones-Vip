import { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Send, AlertTriangle, Info, ShieldAlert, Eye, MessageSquareText } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminBroadcastProps {
  onBroadcast: (title: string, content: string, type: string, priority: string) => Promise<void>;
  isBroadcasting: boolean;
}

const BROADCAST_TYPES = [
  { id: 'info', label: 'Informativo', icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  { id: 'alert', label: 'Alerta', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  { id: 'maint', label: 'Mantenimiento', icon: ShieldAlert, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
];

const PRIORITIES = [
  { id: 'normal', label: 'Normal', color: 'text-white/40' },
  { id: 'high', label: 'Alta Prioridad', color: 'text-red-500' },
];

export function AdminBroadcast({ onBroadcast, isBroadcasting }: AdminBroadcastProps) {
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [selectedType, setSelectedType] = useState('info');
  const [priority, setPriority] = useState('normal');
  const [showPreview, setShowPreview] = useState(false);

  const handleSend = async () => {
    if (!broadcastTitle || !broadcastContent) return;
    await onBroadcast(
      broadcastTitle, 
      broadcastContent, 
      selectedType, 
      priority
    );
    setBroadcastTitle('');
    setBroadcastContent('');
    setShowPreview(false);
  };

  const currentType = BROADCAST_TYPES.find(t => t.id === selectedType) || BROADCAST_TYPES[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <Card className="glass-card border-none p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-primary-600/20 flex items-center justify-center text-primary-400">
              <MessageSquareText size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase italic">Redactar Mensaje</h3>
              <p className="text-white/40 text-[10px] items-center uppercase tracking-widest font-black">Emisión de Comunicados Globales</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Tipo de Comunicado</label>
              <div className="grid grid-cols-3 gap-2">
                {BROADCAST_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all gap-2",
                      selectedType === type.id 
                        ? cn(type.bg, type.border, type.color) 
                        : "bg-white/5 border-white/5 text-white/20 hover:bg-white/10"
                    )}
                  >
                    <type.icon size={20} />
                    <span className="text-[9px] font-black uppercase tracking-tighter">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Prioridad</label>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPriority(p.id)}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                      priority === p.id 
                        ? p.id === 'high' ? "bg-red-500/10 border-red-500/30 text-red-500" : "bg-white/10 border-white/20 text-white"
                        : "bg-white/5 border-white/5 text-white/20"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Título del Anuncio</label>
              <Input 
                placeholder="Ej: Nueva actualización de seguridad" 
                variant="glass"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Contenido del Mensaje</label>
              <textarea 
                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 transition-all resize-none italic"
                placeholder="Escribe aquí el comunicado oficial..."
                value={broadcastContent}
                onChange={(e) => setBroadcastContent(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button 
                variant="glass"
                className="flex-1 h-12 text-xs font-black uppercase tracking-widest italic"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye size={16} className="mr-2" />
                {showPreview ? 'Ocultar Previsualización' : 'Previsualizar'}
              </Button>
              <Button 
                variant="primary" 
                className={cn(
                  "flex-[2] h-12 font-black uppercase tracking-[0.2em] shadow-xl",
                  priority === 'high' && "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                )}
                onClick={handleSend}
                disabled={isBroadcasting || !broadcastTitle || !broadcastContent}
              >
                {isBroadcasting ? 'Transmitiendo...' : 'Emitir Comunicado'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Preview Panel */}
        <div className="space-y-6">
          <AnimatePresence>
            {(showPreview || (broadcastTitle && broadcastContent)) && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2">Así se verá en la App</h4>
                
                {/* Notification Preview */}
                <div className="glass-card p-4 rounded-3xl border-none relative overflow-hidden group">
                  <div className={cn("absolute inset-y-0 left-0 w-1.5", priority === 'high' ? 'bg-red-500' : 'bg-primary-600')} />
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
                      currentType.bg, currentType.color
                    )}>
                      <currentType.icon size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border", currentType.bg, currentType.border, currentType.color)}>
                          {currentType.label}
                        </span>
                        {priority === 'high' && (
                          <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
                            Alta Prioridad
                          </span>
                        )}
                        <span className="text-[8px] text-white/20 ml-auto font-bold">AHORA</span>
                      </div>
                      <h5 className="text-sm font-black text-white uppercase italic tracking-tight">{broadcastTitle || 'Título de ejemplo'}</h5>
                      <p className="text-xs text-white/60 mt-1 leading-relaxed italic">
                        {broadcastContent || 'Aquí se mostrará el contenido del mensaje que redactes en el panel izquierdo.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Banner Preview */}
                <div className={cn(
                  "p-6 rounded-[2.5rem] relative overflow-hidden",
                  priority === 'high' ? "bg-red-600 shadow-xl shadow-red-600/20" : "bg-zinc-900 border border-white/5"
                )}>
                  {priority === 'high' && (
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <ShieldAlert size={120} />
                    </div>
                  )}
                  <h5 className={cn(
                    "text-xl font-black uppercase italic leading-tight",
                    priority === 'high' ? "text-white" : "text-white"
                  )}>
                    {broadcastTitle || 'Comunicado Especial'}
                  </h5>
                  <p className={cn(
                    "text-sm mt-3 leading-relaxed italic",
                    priority === 'high' ? "text-white/90" : "text-white/50"
                  )}>
                    {broadcastContent || 'Este es un ejemplo de cómo se vería un aviso importante directamente en el feed de noticias.'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {!showPreview && !broadcastTitle && (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
              <Eye size={48} className="text-white/5 mb-4" />
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Comienza a escribir para ver la previsualización</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
