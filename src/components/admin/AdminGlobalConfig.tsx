import React, { useState, useEffect } from 'react';
import { adminService, GlobalConfig } from '@/src/services/adminService';
import { Settings, Save, RefreshCw, AlertCircle, ShieldAlert, ToggleLeft, ToggleRight, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminGlobalConfig = () => {
  const [configs, setConfigs] = useState<GlobalConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const data = await adminService.fetchGlobalConfig();
      
      // Ensure we have some default configs if empty
      if (data.length === 0) {
        const defaults = [
          { key: 'maintenance_mode', value: false, description: 'Desactiva el acceso a usuarios normales.' },
          { key: 'allow_new_registrations', value: true, description: 'Permite o bloquea el registro de nuevos usuarios.' },
          { key: 'verification_required_to_post', value: true, description: 'Solo usuarios verificados pueden subir contenido.' },
          { key: 'max_upload_size_mb', value: 20, description: 'Limite de tamaño para subida de imagenes en MB.' }
        ];
        
        // In a real app, these would come from the DB. Here we just show them.
        // We'll initialize them in the DB if empty for this demo session.
        for (const def of defaults) {
          await adminService.updateGlobalConfig(def.key, def.value);
        }
        setConfigs(await adminService.fetchGlobalConfig());
      } else {
        setConfigs(data);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: string, currentValue: boolean) => {
    try {
      setSaving(key);
      const newValue = !currentValue;
      await adminService.updateGlobalConfig(key, newValue);
      setConfigs(configs.map(c => c.key === key ? { ...c, value: newValue } : r)); // Typo fixed below
      setConfigs(prev => prev.map(c => c.key === key ? { ...c, value: newValue } : c));
    } catch (error) {
      console.error('Error updating config:', error);
    } finally {
      setSaving(null);
    }
  };

  const handleValueChange = async (key: string, newValue: any) => {
    try {
      setSaving(key);
      await adminService.updateGlobalConfig(key, newValue);
      setConfigs(prev => prev.map(c => c.key === key ? { ...c, value: newValue } : c));
    } catch (error) {
      console.error('Error updating config:', error);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-400" />
            Configuración Global
          </h2>
          <p className="text-gray-400 text-sm">Control centralizado del comportamiento del sistema</p>
        </div>
        <button 
          onClick={loadConfigs}
          className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition-colors border border-[#333]"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-[#121212] border border-[#333] rounded-xl animate-pulse"></div>
          ))
        ) : (
          configs.map((config) => (
            <div 
              key={config.key}
              className="bg-[#121212] border border-[#333] rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:bg-[#151515]"
            >
              <div className="flex gap-4">
                <div className={`p-3 rounded-xl ${
                  config.key.includes('mode') ? 'bg-red-500/10 text-red-500' : 
                  config.key.includes('allow') ? 'bg-green-500/10 text-green-500' :
                  'bg-blue-500/10 text-blue-500'
                }`}>
                  {config.key.includes('maintenance') ? <ShieldAlert className="w-6 h-6" /> : <Settings className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-white font-bold capitalize">{config.key.replace(/_/g, ' ')}</h3>
                  <p className="text-gray-500 text-sm mt-0.5">{config.description || 'Configuración del sistema.'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto self-end md:self-center">
                {typeof config.value === 'boolean' ? (
                  <button 
                    disabled={saving === config.key}
                    onClick={() => handleToggle(config.key, config.value)}
                    className={`relative p-1 rounded-full transition-colors w-14 h-7 ${
                      config.value ? 'bg-red-600' : 'bg-[#333]'
                    } ${saving === config.key ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    <motion.div 
                      animate={{ x: config.value ? 28 : 0 }}
                      className="w-5 h-5 bg-white rounded-full shadow-lg"
                    />
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      defaultValue={config.value}
                      className="w-24 bg-black border border-[#333] rounded-lg px-3 py-1.5 text-white text-sm focus:border-red-500 outline-none"
                      onBlur={(e) => handleValueChange(config.key, Number(e.target.value))}
                    />
                    <span className="text-gray-500 text-xs font-bold uppercase">MB</span>
                  </div>
                )}
                
                {saving === config.key && (
                  <span className="text-xs text-gray-500 animate-pulse">Guardando...</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 flex gap-4">
        <Info className="w-6 h-6 text-red-500 shrink-0" />
        <div>
          <h4 className="text-red-500 font-bold text-sm">Nota de Seguridad</h4>
          <p className="text-gray-400 text-xs mt-1">
            Los cambios en la configuración global impactan a todos los usuarios en tiempo real. 
            El modo de mantenimiento expulsará a todos los usuarios no administradores de la sesión actual.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminGlobalConfig;
