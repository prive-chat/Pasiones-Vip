import { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Send } from 'lucide-react';

interface AdminBroadcastProps {
  onBroadcast: (title: string, content: string) => Promise<void>;
  isBroadcasting: boolean;
}

export function AdminBroadcast({ onBroadcast, isBroadcasting }: AdminBroadcastProps) {
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');

  const handleSend = async () => {
    if (!broadcastTitle || !broadcastContent) return;
    await onBroadcast(broadcastTitle, broadcastContent);
    setBroadcastTitle('');
    setBroadcastContent('');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="glass-card border-none p-8">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-16 w-16 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 mb-4">
            <Send size={32} />
          </div>
          <h3 className="text-2xl font-black text-white uppercase italic">Broadcast Global</h3>
          <p className="text-white/40 text-sm mt-2">
            Envía un anuncio oficial a todos los miembros de la red. Este mensaje aparecerá en sus notificaciones instantáneamente.
          </p>
        </div>

        <div className="space-y-6">
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
              className="w-full h-40 bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 transition-all resize-none"
              placeholder="Escribe aquí el comunicado oficial..."
              value={broadcastContent}
              onChange={(e) => setBroadcastContent(e.target.value)}
            />
          </div>
          <Button 
            variant="primary" 
            className="w-full h-14 font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary-600/20"
            onClick={handleSend}
            disabled={isBroadcasting || !broadcastTitle || !broadcastContent}
          >
            {isBroadcasting ? 'Transmitiendo...' : 'Emitir Comunicado Global'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
