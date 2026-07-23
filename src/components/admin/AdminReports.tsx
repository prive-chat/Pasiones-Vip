import React, { useState, useEffect } from 'react';
import { adminService, UserReport } from '@/src/services/adminService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle, CheckCircle, Clock, Eye, MessageSquare, User, Trash2, Filter, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminReports = () => {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('pending');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await adminService.fetchReports();
      setReports(data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: UserReport['status'], notes: string) => {
    try {
      await adminService.updateReport(id, { status, admin_notes: notes });
      setReports(reports.map(r => r.id === id ? { ...r, status, admin_notes: notes } : r));
      setSelectedReport(null);
    } catch (error) {
      console.error('Error updating report:', error);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesFilter = filter === 'all' || report.status === filter;
    const matchesSearch = report.reporter?.username?.toLowerCase().includes(search.toLowerCase()) ||
                         report.reported_user?.username?.toLowerCase().includes(search.toLowerCase()) ||
                         report.reason.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Reportes de Usuarios
          </h2>
          <p className="text-gray-400 text-sm">Gestiona denuncias y quejas sobre contenido o comportamiento</p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar reporte..."
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:border-red-500 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2 text-white text-sm focus:border-red-500 outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="resolved">Resueltos</option>
            <option value="dismissed">Desestimados</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-[#121212] border border-[#333] rounded-xl animate-pulse"></div>
          ))
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-12 bg-[#121212] border border-[#333] rounded-xl">
            <Eye className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-white font-medium">No se encontraron reportes</h3>
            <p className="text-gray-500 text-sm">Todo parece estar en orden por ahora.</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <motion.div
              layout
              key={report.id}
              className="bg-[#121212] border border-[#333] rounded-xl overflow-hidden hover:border-red-500/30 transition-colors"
            >
              <div className="p-5 flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        report.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                        report.status === 'resolved' ? 'bg-green-500/10 text-green-500' :
                        'bg-gray-500/10 text-gray-500'
                      }`}>
                        {report.status}
                      </span>
                      <span className="text-gray-500 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(report.created_at), 'dd MMM, HH:mm', { locale: es })}
                      </span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Denunciante</div>
                      <div className="flex items-center gap-3">
                        <img 
                          src={report.reporter?.avatar_url || `https://ui-avatars.com/api/?name=${report.reporter?.username}`} 
                          className="w-8 h-8 rounded-full border border-[#333]" 
                        />
                        <div>
                          <p className="text-sm text-white font-medium">{report.reporter?.username}</p>
                          <p className="text-[10px] text-gray-500">{report.reporter?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Denunciado</div>
                      <div className="flex items-center gap-3">
                        <img 
                          src={report.reported_user?.avatar_url || `https://ui-avatars.com/api/?name=${report.reported_user?.username}`} 
                          className="w-8 h-8 rounded-full border border-[#333]" 
                        />
                        <div>
                          <p className="text-sm text-red-500 font-medium">{report.reported_user?.username}</p>
                          <p className="text-[10px] text-gray-500">{report.reported_user?.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-red-500" />
                      <span className="text-xs font-bold text-gray-300">Motivo de la denuncia:</span>
                    </div>
                    <p className="text-white text-sm italic">"{report.reason}"</p>
                  </div>
                </div>

                <div className="md:w-48 flex flex-row md:flex-col justify-center gap-2">
                  <button 
                    onClick={() => setSelectedReport(report)}
                    className="flex-1 md:flex-none px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
                  >
                    Atender Reporte
                  </button>
                  <button className="flex-1 md:flex-none px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded-lg text-sm font-bold hover:text-white hover:bg-[#333] transition-colors border border-[#333]">
                    Ver Perfil
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#121212] border border-[#333] rounded-2xl w-full max-w-lg"
          >
            <div className="p-6 border-b border-[#333]">
              <h3 className="text-xl font-bold text-white">Resolver Denuncia</h3>
              <p className="text-sm text-gray-400 mt-1">Reporte ID: {selectedReport.id.substring(0, 8)}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Notas Administrativas</label>
                <textarea
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-white text-sm focus:border-red-500 outline-none min-h-[120px]"
                  placeholder="Escribe aquí las acciones tomadas o notas adicionales..."
                  id="admin-notes"
                  defaultValue={selectedReport.admin_notes || ''}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => {
                    const notes = (document.getElementById('admin-notes') as HTMLTextAreaElement).value;
                    handleUpdateStatus(selectedReport.id, 'resolved', notes);
                  }}
                  className="px-4 py-3 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Resolver
                </button>
                <button 
                  onClick={() => {
                    const notes = (document.getElementById('admin-notes') as HTMLTextAreaElement).value;
                    handleUpdateStatus(selectedReport.id, 'dismissed', notes);
                  }}
                  className="px-4 py-3 bg-[#333] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#444] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Desestimar
                </button>
              </div>
            </div>

            <div className="p-6 border-t border-[#333] flex justify-end">
              <button 
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-white font-medium"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
