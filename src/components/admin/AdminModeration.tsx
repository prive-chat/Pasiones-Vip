import React from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Trash2 } from 'lucide-react';
import { MediaItem } from '@/src/types';

interface AdminModerationProps {
  media: MediaItem[];
  onDelete: (id: string) => void;
  onInspect: (media: { url: string; type: 'image' | 'video' }) => void;
}

export function AdminModeration({ media, onDelete, onInspect }: AdminModerationProps) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {media.map((item) => (
          <Card key={item.id} className="glass-card border-none overflow-hidden group relative aspect-[3/4]">
            <div className="absolute inset-0">
              {item.url && (
                item.type === 'image' ? (
                  <img src={item.url} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <video src={item.url} className="h-full w-full object-cover" />
                )
              )}
            </div>
            
            {/* Overlay Actions */}
            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col p-4">
              <div className="flex justify-between items-start">
                <div className="h-8 w-8 rounded-lg overflow-hidden ring-1 ring-white/20">
                  <img src={item.profiles?.avatar_url || undefined} className="h-full w-full object-cover" />
                </div>
                <Button 
                  variant="danger" 
                  size="sm" 
                  className="h-8 w-8 p-0 rounded-lg"
                  onClick={() => onDelete(item.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              
              <div className="mt-auto space-y-2">
                <p className="text-[10px] text-white font-bold line-clamp-2">{item.caption || 'Sin pie de foto'}</p>
                <p className="text-[8px] text-white/40 uppercase font-black">Por: {item.profiles?.full_name}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full h-8 text-[10px] font-black uppercase tracking-widest"
                  onClick={() => onInspect({ url: item.url, type: item.type as 'image' | 'video' })}
                >
                  Inspeccionar
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
