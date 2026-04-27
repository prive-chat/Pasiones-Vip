import React from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Search, Filter, CheckCircle2, Eye } from 'lucide-react';
import { UserProfile } from '@/src/types';
import { Link } from 'react-router-dom';
import { cn } from '@/src/lib/utils';

interface AdminUsersProps {
  profiles: UserProfile[];
  onToggleVerification: (id: string, status: boolean) => void;
}

export function AdminUsers({ profiles, onToggleVerification }: AdminUsersProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">
        <div className="relative w-full sm:w-96">
          <Input 
            placeholder="Buscar por nombre, email o ID..." 
            variant="glass" 
            leftElement={<Search size={18} />}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Filter size={16} className="mr-2" /> Filtrar
          </Button>
          <Button variant="primary" size="sm" className="flex-1 sm:flex-none">
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {profiles.map((profile) => (
          <Card key={profile.id} className="p-4 glass-card border-none group hover:bg-white/5 transition-all">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4 w-full sm:w-auto">
                <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden ring-1 ring-white/10">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-xl font-black text-white/20">{profile.full_name?.[0] || 'U'}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-white font-bold truncate">{profile.full_name || 'Sin Nombre'}</h4>
                    {profile.is_verified && <CheckCircle2 size={14} className="text-primary-400" />}
                  </div>
                  <p className="text-xs text-white/40 font-mono truncate">{profile.email}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={cn(
                      "text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter",
                      profile.role === 'super_admin' ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"
                    )}>
                      {profile.role}
                    </span>
                    <span className="text-[10px] text-white/20 font-bold">
                      ID: {profile.id.substring(0, 8)}...
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant={profile.is_verified ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => onToggleVerification(profile.id, profile.is_verified)}
                  className="flex-1 sm:flex-none font-black text-[10px] uppercase tracking-widest h-10"
                >
                  {profile.is_verified ? 'Revocar Verificación' : 'Verificar Cuenta'}
                </Button>
                <Link to={`/profile/${profile.id}`}>
                  <Button variant="outline" size="sm" className="h-10 w-10 p-0">
                    <Eye size={18} />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
