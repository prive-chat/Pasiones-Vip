import React, { useState } from 'react';
import { X, Megaphone, CheckCircle2, TrendingUp, Send, Trophy, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './Button';

interface AdRatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdRatesModal({ isOpen, onClose }: AdRatesModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    whatsappOrTelegram: '',
    package: 'Feed Principal',
    comments: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const packages = [
    {
      id: 'Banner Lateral',
      name: 'Banner Lateral',
      icon: Megaphone,
      badge: 'Básico',
      badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
      price: '$50',
      period: 'semana',
      features: [
        'Aparición en la barra lateral del escritorio',
        'Rotación estándar de anuncios',
        'Hasta 15,000 impresiones garantizadas',
        'Estadísticas básicas de clics',
      ],
      color: 'from-zinc-900 to-zinc-950',
      border: 'border-white/5 hover:border-white/10',
      glow: '',
    },
    {
      id: 'Feed Principal',
      name: 'Feed Principal',
      icon: Flame,
      badge: 'Popular',
      badgeColor: 'bg-passion-red/20 text-passion-red border-passion-red/30',
      price: '$90',
      period: 'semana',
      features: [
        'Ubicación destacada en el Feed Principal',
        'Prioridad de visualización media',
        'Soporte completo para banners interactivos',
        'Sello de patrocinio oficial',
        'Estadísticas detalladas en tiempo real',
      ],
      color: 'from-[#1a0505] to-[#0d0202] border-passion-red/25',
      border: 'border-passion-red/30 hover:border-passion-red/50 shadow-[0_0_20px_rgba(230,0,0,0.05)]',
      glow: 'shadow-[0_0_25px_rgba(230,0,0,0.08)]',
    },
    {
      id: 'Booster Premium',
      name: 'Booster VIP',
      icon: Trophy,
      badge: 'Recomendado',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      price: '$150',
      period: 'semana',
      features: [
        'Ubicación fija superior en Feed y Directorio',
        'Broadcast push masivo a usuarios activos (1 por semana)',
        'Inclusión en carrusel de Historias VIP',
        'Prioridad absoluta (10x más impresiones)',
        'Soporte priority 24/7 para diseño creativo',
      ],
      color: 'from-zinc-900/90 via-zinc-950 to-amber-950/10',
      border: 'border-amber-500/20 hover:border-amber-500/40 shadow-[0_0_25px_rgba(212,175,55,0.05)]',
      glow: 'shadow-[0_0_35px_rgba(212,175,55,0.1)]',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.whatsappOrTelegram) return;

    setLoading(true);
    // Simulate API request
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1200);
  };

  const handleReset = () => {
    setFormData({
      name: '',
      whatsappOrTelegram: '',
      package: 'Feed Principal',
      comments: '',
    });
    setSubmitted(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-[2.5rem] bg-zinc-950 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-10"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors z-20 cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Content Grid */}
            <div className="p-6 sm:p-10 lg:p-12">
              {/* Header */}
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase text-passion-red bg-passion-red/10 border border-passion-red/20 tracking-widest mb-4">
                  <Megaphone size={12} className="animate-pulse" />
                  Espacio Publicitario de Élite
                </span>
                <h2 className="text-2xl sm:text-3.5xl font-black text-white uppercase italic tracking-tight font-display mb-3">
                  Tarifas de Publicidad
                </h2>
                <p className="text-sm text-white/50 leading-relaxed italic">
                  Maximiza tus conversiones capturando la atención de miles de usuarios interesados. Elige el paquete que mejor se adapte a tus objetivos comerciales.
                </p>
              </div>

              {/* Rate Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {packages.map((pkg) => {
                  const IconComponent = pkg.icon;
                  const isSelected = formData.package === pkg.name;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setFormData({ ...formData, package: pkg.name })}
                      className={`relative flex flex-col p-6 rounded-[2rem] bg-gradient-to-b ${pkg.color} border-2 ${pkg.border} ${pkg.glow} transition-all duration-300 cursor-pointer group ${
                        isSelected ? 'ring-2 ring-passion-red/70 border-passion-red/50 scale-[1.01]' : 'opacity-85 hover:opacity-100'
                      }`}
                    >
                      {/* Badge */}
                      <div className="flex justify-between items-start mb-6">
                        <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider border ${pkg.badgeColor}`}>
                          {pkg.badge}
                        </span>
                        <div className="p-2 rounded-xl bg-white/5 text-white/80 group-hover:bg-white/10 transition-colors">
                          <IconComponent size={18} />
                        </div>
                      </div>

                      {/* Info */}
                      <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 italic">
                        {pkg.name}
                      </h3>
                      
                      <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-3xl font-black text-white tracking-tighter font-display">{pkg.price}</span>
                        <span className="text-xs text-white/40 font-bold uppercase tracking-widest">USD / {pkg.period}</span>
                      </div>

                      {/* Features */}
                      <div className="space-y-3.5 flex-1 mb-8">
                        {pkg.features.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2.5">
                            <CheckCircle2 size={13} className="text-passion-red shrink-0 mt-0.5" />
                            <span className="text-xs text-white/70 leading-relaxed font-medium">{feat}</span>
                          </div>
                        ))}
                      </div>

                      {/* Select Indicator */}
                      <div className={`w-full py-2.5 text-center rounded-xl font-black text-[9px] uppercase tracking-widest border transition-all duration-300 ${
                        isSelected
                          ? 'bg-passion-red text-white border-passion-red shadow-[0_0_15px_rgba(230,0,0,0.4)]'
                          : 'bg-white/5 text-white/60 border-white/5 group-hover:bg-white/10 group-hover:text-white'
                      }`}>
                        {isSelected ? 'Seleccionado' : 'Seleccionar Plan'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action / Contact Form */}
              <div className="border border-white/5 rounded-[2.5rem] bg-zinc-950/60 p-6 sm:p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-passion-red/10 rounded-full blur-[80px]" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-amber-500/5 rounded-full blur-[80px]" />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                  <div className="lg:col-span-5 space-y-4">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight italic">
                      ¿Listo para anunciarte?
                    </h3>
                    <p className="text-xs text-white/50 leading-relaxed font-medium">
                      Completa el formulario en unos segundos para enviar una solicitud formal de presupuesto. Nuestro equipo comercial se comunicará contigo de inmediato para gestionar el diseño de tu banner y coordinar la activación.
                    </p>
                    <div className="space-y-2.5 pt-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-passion-red/10 flex items-center justify-center text-passion-red">
                          <TrendingUp size={14} />
                        </div>
                        <span className="text-xs text-white/80 font-bold uppercase tracking-widest">Retorno de inversión garantizado</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-passion-red/10 flex items-center justify-center text-passion-red">
                          <CheckCircle2 size={14} />
                        </div>
                        <span className="text-xs text-white/80 font-bold uppercase tracking-widest">Activación en menos de 1 hora</span>
                      </div>
                    </div>
                    
                    {/* Telegram Direct Link */}
                    <div className="pt-4">
                      <a 
                        href="https://t.me/PasionesVIP" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#229ED9] hover:bg-[#1f8fc4] text-xs font-black uppercase tracking-widest italic text-white transition-all duration-300 shadow-lg shadow-[#229ED9]/15 hover:shadow-[#229ED9]/25 hover:scale-[1.02]"
                      >
                        <Send size={14} />
                        Contacto Directo Telegram
                      </a>
                    </div>
                  </div>

                  {/* Form Container */}
                  <div className="lg:col-span-7 bg-[#0a0a0a] border border-white/5 p-6 sm:p-8 rounded-[2rem]">
                    {submitted ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-6 space-y-4"
                      >
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                          <CheckCircle2 size={24} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white uppercase tracking-wider">¡Solicitud Enviada con Éxito!</h4>
                          <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">
                            Hemos recibido tu interés en el paquete <span className="text-passion-red font-bold font-display italic">{formData.package}</span>. Nos pondremos en contacto contigo por Telegram / WhatsApp en breve.
                          </p>
                        </div>
                        <Button onClick={handleReset} variant="outline" className="text-[9px] font-black uppercase tracking-widest italic rounded-lg h-10">
                          Enviar otra consulta
                        </Button>
                      </motion.div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Tu Nombre completo</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej: Sofía Martínez"
                              value={formData.name}
                              onChange={e => setFormData({ ...formData, name: e.target.value })}
                              className="w-full text-xs rounded-xl bg-white/5 border border-white/5 p-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-passion-red/40 transition-all font-medium"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/40">WhatsApp o Telegram</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej: @sofia_models o +34 600..."
                              value={formData.whatsappOrTelegram}
                              onChange={e => setFormData({ ...formData, whatsappOrTelegram: e.target.value })}
                              className="w-full text-xs rounded-xl bg-white/5 border border-white/5 p-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-passion-red/40 transition-all font-medium"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Plan Seleccionado</label>
                            <select
                              value={formData.package}
                              onChange={e => setFormData({ ...formData, package: e.target.value })}
                              className="w-full text-xs rounded-xl bg-zinc-950 border border-white/5 p-4 text-white focus:outline-none focus:ring-2 focus:ring-passion-red/40 transition-all font-medium cursor-pointer"
                            >
                              <option value="Banner Lateral">Banner Lateral ($50/sem)</option>
                              <option value="Feed Principal">Feed Principal ($90/sem)</option>
                              <option value="Booster Premium">Booster VIP ($150/sem)</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Comentarios Adicionales (Opcional)</label>
                            <textarea
                              placeholder="Detalles sobre tu anuncio, fechas, etc."
                              value={formData.comments}
                              onChange={e => setFormData({ ...formData, comments: e.target.value })}
                              className="w-full text-xs rounded-xl bg-white/5 border border-white/5 p-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-passion-red/40 transition-all min-h-[48px] max-h-[100px] resize-y font-medium"
                            />
                          </div>
                        </div>

                        <Button
                          disabled={loading}
                          type="submit"
                          variant="primary"
                          className="w-full h-12 bg-passion-red hover:bg-[#b30000] rounded-xl font-black uppercase tracking-widest italic text-[10px] shadow-lg shadow-passion-red/25 relative overflow-hidden"
                        >
                          {loading ? 'Procesando...' : (
                            <span className="flex items-center justify-center gap-2">
                              Enviar Solicitud
                              <Send size={12} />
                            </span>
                          )}
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
