import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Check, X, Lock, ExternalLink } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { Link } from 'react-router-dom';

export default function AgeGateModal() {
  const [isVerified, setIsVerified] = useState<boolean>(true);

  useEffect(() => {
    const ageVerified = localStorage.getItem('pasiones_age_verified');
    if (!ageVerified) {
      setIsVerified(false);
    }
  }, []);

  const handleConfirmAge = () => {
    localStorage.setItem('pasiones_age_verified', 'true');
    localStorage.setItem('pasiones_age_verified_at', new Date().toISOString());
    setIsVerified(true);
  };

  const handleDeclineAge = () => {
    window.location.href = 'https://www.google.com';
  };

  if (isVerified) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-zinc-950 border border-red-500/30 rounded-3xl p-6 md:p-8 shadow-2xl text-center space-y-6 relative overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Logo & Warning Icon */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <Logo size={100} className="scale-105" />
            <div className="flex items-center space-x-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-xs font-semibold tracking-wider uppercase">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span>Verificación de Edad +18 Obligatoria</span>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-white tracking-wide">
              Contenido para Adultos (+18)
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Este sitio web contiene material explícito y servicios destinados exclusivamente a mayores de edad según las leyes aplicables en su jurisdicción.
            </p>
          </div>

          <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl text-left text-xs text-zinc-400 space-y-2">
            <div className="flex items-center space-x-2 text-zinc-200 font-semibold">
              <Lock className="w-3.5 h-3.5 text-red-400" />
              <span>Al continuar aceptas y confirmas que:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400 text-[11px] leading-normal">
              <li>Tienes al menos 18 años de edad (o la mayoría de edad legal en tu país).</li>
              <li>No te sientes ofendido por material para adultos ni por la presencia de modelos independientes.</li>
              <li>Aceptas nuestros <Link to="/terms" onClick={() => setIsVerified(true)} className="text-red-400 hover:underline inline-flex items-center gap-0.5">Términos de Servicio <ExternalLink className="w-2.5 h-2.5 inline" /></Link> y <Link to="/privacy" onClick={() => setIsVerified(true)} className="text-red-400 hover:underline inline-flex items-center gap-0.5">Política de Privacidad <ExternalLink className="w-2.5 h-2.5 inline" /></Link>.</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleConfirmAge}
              className="w-full sm:w-1/2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-sm tracking-wide hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-red-900/30 flex items-center justify-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Soy mayor de 18 años</span>
            </button>
            <button
              onClick={handleDeclineAge}
              className="w-full sm:w-1/2 py-3.5 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold text-sm hover:text-white transition-all flex items-center justify-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Salir del sitio</span>
            </button>
          </div>

          <p className="text-[10px] text-zinc-600 pt-1">
            Cumplimiento legal y normativo internacional de protección a menores (18 U.S.C. § 2257 / Leyes de Servicios Digitales).
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
