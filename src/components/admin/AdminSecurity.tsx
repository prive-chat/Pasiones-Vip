import React from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { History } from 'lucide-react';
import { AuditLog } from '@/src/services/adminService';
import { cn } from '@/src/lib/utils';

interface AdminSecurityProps {
  auditLogs: AuditLog[];
  onRefresh: () => void;
}

export function AdminSecurity({ auditLogs, onRefresh }: AdminSecurityProps) {
  return (
    <Card className="glass-card border-none overflow-hidden">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <History size={20} className="text-primary-400" />
          Logs de Auditoría Global
        </h3>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          Actualizar
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40">
              <th className="px-6 py-4">Usuario</th>
              <th className="px-6 py-4">Acción</th>
              <th className="px-6 py-4">Tabla</th>
              <th className="px-6 py-4">Registro ID</th>
              <th className="px-6 py-4">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-white/10 overflow-hidden">
                      <img src={log.profiles?.avatar_url || undefined} className="h-full w-full object-cover" />
                    </div>
                    <span className="text-xs font-bold text-white">{log.profiles?.full_name || 'Sistema'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "text-[10px] font-black px-2 py-0.5 rounded uppercase",
                    log.action === 'DELETE' ? "bg-red-500/20 text-red-400" :
                    log.action === 'UPDATE' ? "bg-blue-500/20 text-blue-400" :
                    "bg-green-500/20 text-green-400"
                  )}>
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-white/60 font-mono">{log.table_name}</td>
                <td className="px-6 py-4 text-[10px] text-white/20 font-mono">{log.record_id}</td>
                <td className="px-6 py-4 text-[10px] text-white/40 font-bold">
                  {new Date(log.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
