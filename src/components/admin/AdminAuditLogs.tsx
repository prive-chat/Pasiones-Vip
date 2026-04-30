import React, { useState, useEffect } from 'react';
import { adminService, AuditLog } from '@/src/services/adminService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, Filter, Eye, Clock, User, Database } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await adminService.fetchAuditLogs(100);
      setLogs(data);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(filter.toLowerCase()) ||
    log.table_name.toLowerCase().includes(filter.toLowerCase()) ||
    log.profiles?.username?.toLowerCase().includes(filter.toLowerCase()) ||
    log.profiles?.email?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-red-500" />
            Auditoría de Acciones
          </h2>
          <p className="text-gray-400 text-sm">Registro detallado de cambios en la base de datos</p>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar en logs..."
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:border-red-500 outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-[#121212] rounded-xl border border-[#333] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#333] bg-[#1a1a1a]">
                <th className="px-6 py-4 text-gray-400 font-medium text-sm">Fecha/Hora</th>
                <th className="px-6 py-4 text-gray-400 font-medium text-sm">Usuario</th>
                <th className="px-6 py-4 text-gray-400 font-medium text-sm">Acción</th>
                <th className="px-6 py-4 text-gray-400 font-medium text-sm">Tabla</th>
                <th className="px-6 py-4 text-gray-400 font-medium text-sm text-right">Detalles</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="h-4 bg-[#333] rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No se encontraron registros de auditoría.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-[#333] hover:bg-[#1a1a1a] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-white text-sm">
                        {format(new Date(log.created_at), 'dd MMM, HH:mm', { locale: es })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="font-medium">{log.profiles?.username || 'Sistema'}</div>
                          <div className="text-xs text-gray-500">{log.profiles?.email || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        log.action === 'INSERT' ? 'bg-green-500/10 text-green-500' :
                        log.action === 'UPDATE' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-gray-500" />
                        {log.table_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#121212] border border-[#333] rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
          >
            <div className="p-6 border-b border-[#333] flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Detalle de Acción</h3>
              <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-white">Close</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1a1a1a] p-4 rounded-xl">
                  <div className="text-xs text-gray-500 mb-1">Acción</div>
                  <div className="text-white font-medium">{selectedLog.action}</div>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-xl">
                  <div className="text-xs text-gray-500 mb-1">Tabla</div>
                  <div className="text-white font-medium">{selectedLog.table_name}</div>
                </div>
              </div>

              <div className="bg-[#1a1a1a] p-4 rounded-xl">
                <div className="text-xs text-gray-500 mb-1">ID del Registro</div>
                <div className="text-white font-mono text-xs">{selectedLog.record_id}</div>
              </div>

              {selectedLog.old_data && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-400">Datos Anteriores</div>
                  <pre className="bg-black/50 p-4 rounded-xl text-[10px] text-red-300 overflow-x-auto">
                    {JSON.stringify(selectedLog.old_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_data && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-400">Nuevos Datos</div>
                  <pre className="bg-black/50 p-4 rounded-xl text-[10px] text-green-300 overflow-x-auto">
                    {JSON.stringify(selectedLog.new_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-[#333] flex justify-end">
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogs;
