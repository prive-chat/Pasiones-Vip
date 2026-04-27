import React from 'react';
import { Card } from '@/src/components/ui/Card';
import { Users, Image as ImageIcon, Send, CheckCircle2, TrendingUp, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SystemStats } from '@/src/services/adminService';
import { UserProfile } from '@/src/types';
import { motion } from 'framer-motion';
import { cn } from '@/src/lib/utils';

interface AdminDashboardProps {
  stats: SystemStats;
  profiles: UserProfile[];
}

export function AdminDashboard({ stats, profiles }: AdminDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Usuarios Totales', value: stats.totalUsers, icon: Users, color: 'text-blue-400' },
          { label: 'Contenido Multimedia', value: stats.totalMedia, icon: ImageIcon, color: 'text-purple-400' },
          { label: 'Mensajes Enviados', value: stats.totalMessages, icon: Send, color: 'text-green-400' },
          { label: 'Cuentas Verificadas', value: stats.verifiedUsers, icon: CheckCircle2, color: 'text-primary-400' },
        ].map((stat, i) => (
          <Card key={i} className="glass-card border-none p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon size={64} />
            </div>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black text-white">{stat.value.toLocaleString()}</h3>
            <div className="mt-4 flex items-center text-[10px] font-bold text-green-400">
              <TrendingUp size={12} className="mr-1" />
              <span>+12.5% vs mes anterior</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 glass-card border-none p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity size={20} className="text-primary-400" />
              Crecimiento de la Red
            </h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400">
                <span className="h-2 w-2 rounded-full bg-blue-400" /> Usuarios
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-primary-400">
                <span className="h-2 w-2 rounded-full bg-primary-400" /> Contenido
              </span>
            </div>
          </div>
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
              <AreaChart data={stats.growthData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMedia" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E60000" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#E60000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="date" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff20', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="users" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={3} />
                <Area type="monotone" dataKey="media" stroke="#E60000" fillOpacity={1} fill="url(#colorMedia)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="glass-card border-none p-6">
          <h3 className="text-lg font-bold text-white mb-6">Distribución de Roles</h3>
          <div className="space-y-6">
            {[
              { label: 'Usuarios Estándar', count: stats.totalUsers - stats.verifiedUsers, color: 'bg-zinc-800' },
              { label: 'Miembros Verificados', count: stats.verifiedUsers, color: 'bg-primary-600' },
              { label: 'Administradores', count: profiles.filter(p => p.role === 'super_admin').length, color: 'bg-blue-600' },
            ].map((role, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-white/60">{role.label}</span>
                  <span className="text-white">{role.count}</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(role.count / stats.totalUsers) * 100}%` }}
                    className={cn("h-full rounded-full", role.color)}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
