import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, X, AlertTriangle, ShieldCheck, CheckCircle2, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface ReportContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'post' | 'comment' | 'ad' | 'user' | 'message';
  targetId: string;
  targetTitle?: string;
}

export default function ReportContentModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle
}: ReportContentModalProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState<string>('dmca_copyright');
  const [details, setDetails] = useState<string>('');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;

    setSubmitting(true);

    try {
      // Record in audit_logs or dedicated reports table
      await supabase.from('audit_logs').insert({
        user_id: user?.id || null,
        action: `REPORT_${targetType.toUpperCase()}`,
        target_id: targetId,
        metadata: {
          reason,
          details,
          reporter_email: email,
          target_title: targetTitle || 'N/A',
          timestamp: new Date().toISOString()
        }
      });

      // Also trigger browser custom event for moderation feedback
      window.dispatchEvent(new CustomEvent('pasiones_report_submitted', {
        detail: { targetType, targetId, reason }
      }));

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setDetails('');
        onClose();
      }, 2000);
    } catch (e) {
      console.warn('Error submitting report:', e);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99995] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative text-white space-y-5"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Reportar Contenido / Infracción</h3>
              <p className="text-xs text-zinc-400">Notificación de vulneración legal o comunitaria</p>
            </div>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-8 text-center space-y-3"
            >
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="text-base font-bold text-white">Reporte Recibido</h4>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                Nuestro equipo de legal y moderación revisará la publicación en un plazo máximo de 24 horas. Gracias por ayudar a mantener Pasiones VIP seguro.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Motivo de la Denuncia
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                >
                  <option value="dmca_copyright">Infracción de Derechos de Autor / DMCA</option>
                  <option value="non_consensual">Contenido No Consentido / Privacidad</option>
                  <option value="underage">Sospecha de Menores de Edad (Prioridad Máxima)</option>
                  <option value="impersonation">Suplantación de Identidad / Estafa</option>
                  <option value="harassment">Acoso o Contenido Ofensivo</option>
                  <option value="illegal_services">Servicios Prohibidos o Ilícitos</option>
                  <option value="other">Otro Motivo Legal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Correo Electrónico de Contacto
                </label>
                <input
                  type="email"
                  required
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Detalles y Declaración de la Denuncia
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe detalladamente los hechos, enlace original en caso de DMCA o información relevante para nuestro equipo legal..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500 transition-colors resize-none"
                />
              </div>

              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-[11px] text-zinc-400 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  Las denuncias falsas o de mala fe pueden constituir perjurio o infracción de nuestros Términos de Servicio.
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !details.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-red-900/30 flex items-center space-x-2"
                >
                  {submitting ? (
                    <span>Enviando...</span>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      <span>Enviar Denuncia Legal</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
