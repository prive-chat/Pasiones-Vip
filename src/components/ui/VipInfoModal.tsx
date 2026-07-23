import React, { useState } from 'react';
import { X, ShieldCheck, Heart, Sparkles, Image, Eye, MessageSquare, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './Button';

interface VipInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VipInfoModal({ isOpen, onClose }: VipInfoModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    profileLink: '',
    whatsappOrTelegram: '',
    comments: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const benefits = [
    {
      icon: ShieldCheck,
      title: 'Insignia de Verificación Roja',
      description: 'Genera 5x más confianza con tu sello original verificado por nuestro equipo humano en el listado y perfil.',
      color: 'text-passion-red bg-passion-red/10 border-passion-red/20',
    },
    {
      icon: Sparkles,
      title: 'Publicación de Historias VIP',
      description: 'Comparte momentos efímeros diarios (duración de 24 horas) para mantenerte activo e interactuar directamente con tus clientes.',
      color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    },
    {
      icon: Eye,
      title: 'Visibilidad Booster Máxima',
      description: 'Tus publicaciones se muestran al principio del Feed general y del Directorio Exclusivo de manera inteligente.',
      color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    },
    {
      icon: Image,
      title: 'Galería de Medios Desbloqueada',
      description: 'Sube imágenes y videos ilimitados con la más alta calidad fotográfica y sin límites estrictos de almacenamiento.',
      color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    },
    {
      icon: MessageSquare,
      title: 'Mensajería VIP Blindada',
      description: 'Mensajería privada premium con encriptación, confirmaciones de lectura, filtros de seguridad avanzada y prioridad.',
      color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    },
    {
      icon: Heart,
      title: 'Notificaciones Directas Push',
      description: 'Envía anuncios masivos vía Telegram bot o Push directo a tus fieles seguidores para anunciar que estás en línea.',
      color: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.whatsappOrTelegram) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1200);
  };

  const handleReset = () => {
    setFormData({
      fullName: '',
      profileLink: '',
      whatsappOrTelegram: '',
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
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-[2.5rem] bg-[#0c0505] border border-passion-red/20 shadow-[0_20px_50px_rgba(230,0,0,0.15)] z-10"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors z-20 cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Content Container */}
            <div className="p-6 sm:p-10 lg:p-12">
              {/* Header */}
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-black uppercase text-gold-500 bg-gold-600/10 border border-gold-500/20 tracking-widest mb-4">
                  <Sparkles size={12} className="animate-bounce" />
                  Membresía Exclusiva
                </span>
                <h2 className="text-2xl sm:text-3.5xl font-black text-white uppercase italic tracking-tight font-display mb-3">
                  Únete al Círculo VIP
                </h2>
                <h3 className="text-xs font-black uppercase tracking-widest text-[#FF4D4D] mb-4">
                  Impulsa tu presencia y duplica tus interacciones
                </h3>
                <p className="text-sm text-white/60 leading-relaxed italic">
                  Las creadoras y modelos verificadas obtienen visibilidad destacada, confianza total del cliente y acceso instantáneo a todas las herramientas avanzadas del portal.
                </p>
              </div>

              {/* Benefits Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {benefits.map((benefit, idx) => {
                  const Icon = benefit.icon;
                  return (
                    <div
                      key={idx}
                      className="p-6 rounded-[2rem] bg-zinc-950/60 border border-white/5 hover:border-passion-red/20 transition-all duration-300 group flex gap-4"
                    >
                      <div className={`p-3.5 rounded-2xl shrink-0 h-12 w-12 flex items-center justify-center border ${benefit.color} group-hover:scale-105 transition-transform duration-300`}>
                        <Icon size={18} />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-black text-white uppercase tracking-wide">
                          {benefit.title}
                        </h4>
                        <p className="text-xs text-white/50 leading-relaxed font-medium">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Application Block */}
              <div className="border border-passion-red/10 rounded-[2.5rem] bg-zinc-950 p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-passion-red/10 rounded-full blur-[80px]" />
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                  <div className="lg:col-span-5 space-y-4">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight italic">
                      Solicita tu Membresía VIP
                    </h3>
                    <p className="text-xs text-white/50 leading-relaxed font-medium">
                      La membresía VIP requiere un proceso de validación seguro de tu identidad para proteger a la comunidad y garantizar que solo perfiles reales obtengan el sello verificado.
                    </p>
                    <div className="pt-2">
                      <p className="text-[10px] font-black uppercase text-passion-red tracking-widest mb-1.5">Requisitos:</p>
                      <ul className="text-xs text-white/70 space-y-1 font-semibold">
                        <li className="flex items-center gap-2">✔ Ser mayor de 18 años</li>
                        <li className="flex items-center gap-2">✔ Redes sociales o sitio web activo</li>
                        <li className="flex items-center gap-2">✔ Foto o documento tipo selfie de validación</li>
                      </ul>
                    </div>

                    <div className="pt-4">
                      <a 
                        href="https://t.me/PasionesVIP" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-passion-red hover:bg-[#b00202] text-xs font-black uppercase tracking-widest italic text-white transition-all duration-300 shadow-lg shadow-passion-red/15 hover:shadow-passion-red/30 hover:scale-[1.02]"
                      >
                        <Send size={14} />
                        Soporte Telegram VIP
                      </a>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="lg:col-span-7 bg-[#050505] border border-white/5 p-6 sm:p-8 rounded-[2rem]">
                    {submitted ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-6 space-y-4"
                      >
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                          <CheckCircle2Icon size={24} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white uppercase tracking-wider">¡Solicitud VIP Recibida!</h4>
                          <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">
                            Tu solicitud para el perfil <span className="text-passion-red font-bold font-display italic">{formData.fullName}</span> ha sido ingresada de forma segura. Un agente VIP te atenderá por Telegram o WhatsApp muy pronto.
                          </p>
                        </div>
                        <Button onClick={handleReset} variant="outline" className="text-[9px] font-black uppercase tracking-widest italic rounded-lg h-10">
                          Enviar otra solicitud
                        </Button>
                      </motion.div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Tu Nombre Artístico / Completo</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej: Aimi Darlene"
                            value={formData.fullName}
                            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                            className="w-full text-xs rounded-xl bg-white/5 border border-white/5 p-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-passion-red/40 transition-all font-medium"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Contacto (WhatsApp o Telegram)</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej: @aimidarlene o +34 ..."
                              value={formData.whatsappOrTelegram}
                              onChange={e => setFormData({ ...formData, whatsappOrTelegram: e.target.value })}
                              className="w-full text-xs rounded-xl bg-white/5 border border-white/5 p-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-passion-red/40 transition-all font-medium"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Link de tu Perfil (Opcional)</label>
                            <input
                              type="text"
                              placeholder="Ej: pasiones-vip.com/p/aimidarlene"
                              value={formData.profileLink}
                              onChange={e => setFormData({ ...formData, profileLink: e.target.value })}
                              className="w-full text-xs rounded-xl bg-white/5 border border-white/5 p-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-passion-red/40 transition-all font-medium"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Comentarios o Redes Sociales adicionales</label>
                          <textarea
                            placeholder="Especifica tus objetivos, fotos, verificación previa, enlaces externos..."
                            value={formData.comments}
                            onChange={e => setFormData({ ...formData, comments: e.target.value })}
                            className="w-full text-xs rounded-xl bg-white/5 border border-white/5 p-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-passion-red/40 transition-all min-h-[48px] max-h-[100px] resize-y font-medium"
                          />
                        </div>

                        <Button
                          disabled={loading}
                          type="submit"
                          variant="primary"
                          className="w-full h-12 bg-passion-red hover:bg-[#b50000] rounded-xl font-black uppercase tracking-widest italic text-[10px] shadow-lg shadow-passion-red/25"
                        >
                          {loading ? 'Procesando...' : 'Enviar Solicitud VIP (Gratis)'}
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

// Simple dynamic helper inside the same file for submission icon
function CheckCircle2Icon({ size = 24 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle-2">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
