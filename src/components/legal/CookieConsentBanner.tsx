import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Settings, Check, X, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CookiePreferences {
  necessary: boolean; // Always true
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
}

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [showPreferences, setShowPreferences] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: true,
    functional: true,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('pasiones_cookie_consent');
    if (!consent) {
      // Delay slightly for smooth initial page render
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      functional: true,
      marketing: true,
    };
    saveConsent(allAccepted);
  };

  const handleAcceptNecessary = () => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      analytics: false,
      functional: false,
      marketing: false,
    };
    saveConsent(onlyNecessary);
  };

  const handleSaveCustom = () => {
    saveConsent(preferences);
  };

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem('pasiones_cookie_consent', JSON.stringify(prefs));
    localStorage.setItem('pasiones_cookie_consent_date', new Date().toISOString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-0 inset-x-0 z-[99990] p-4 md:p-6 pointer-events-none flex justify-center">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="pointer-events-auto w-full max-w-4xl bg-zinc-950/95 border border-zinc-800 backdrop-blur-2xl rounded-3xl p-5 md:p-6 shadow-2xl text-white space-y-4"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 shrink-0 mt-0.5">
                <Cookie className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-white">Privacidad y Uso de Cookies</h3>
                  <span className="text-[10px] bg-zinc-800 text-zinc-300 font-semibold px-2 py-0.5 rounded-full border border-zinc-700">
                    GDPR / RGPD Compliant
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
                  Utilizamos cookies estrictamente necesarias para autenticación segura, mantener tu sesión y almacenar tus preferencias. También podemos usar analíticas para mejorar la plataforma.{' '}
                  <Link to="/cookies" className="text-red-400 hover:underline inline font-medium">
                    Leer Política de Cookies completa
                  </Link>.
                </p>
              </div>
            </div>

            {/* Main Action Buttons */}
            {!showPreferences && (
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0 justify-end">
                <button
                  onClick={() => setShowPreferences(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-all flex items-center space-x-1.5"
                >
                  <Settings className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Configurar</span>
                </button>
                <button
                  onClick={handleAcceptNecessary}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold transition-all"
                >
                  Solo Necesarias
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 text-white text-xs font-bold transition-all shadow-md shadow-red-900/30 flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Aceptar Todas</span>
                </button>
              </div>
            )}
          </div>

          {/* Preferences Settings Modal Drawer inside banner */}
          {showPreferences && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-4 border-t border-zinc-800 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Strictly Necessary */}
                <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">Estrictamente Necesarias</span>
                      <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-mono font-semibold">Requerido</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">Autenticación, seguridad, sesiones y gestión de pagos.</p>
                  </div>
                  <input type="checkbox" checked disabled className="w-4 h-4 accent-red-600 cursor-not-allowed opacity-80" />
                </div>

                {/* Functional */}
                <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-bold text-white">Preferencias y Funcionales</span>
                    <p className="text-[11px] text-zinc-400">Recordar idioma, modo de reproducción e interfaz personalizada.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.functional}
                    onChange={(e) => setPreferences(prev => ({ ...prev, functional: e.target.checked }))}
                    className="w-4 h-4 accent-red-600 cursor-pointer"
                  />
                </div>

                {/* Analytics */}
                <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-bold text-white">Rendimiento y Analítica</span>
                    <p className="text-[11px] text-zinc-400">Medición anónima de rendimiento de carga y diagnóstico de errores.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                    className="w-4 h-4 accent-red-600 cursor-pointer"
                  />
                </div>

                {/* Marketing */}
                <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-bold text-white">Publicidad y Marketing</span>
                    <p className="text-[11px] text-zinc-400">Personalización de anuncios y contenido patrocinado de anunciantes VIP.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                    className="w-4 h-4 accent-red-600 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setShowPreferences(false)}
                  className="text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Volver atras
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleAcceptAll}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all"
                  >
                    Aceptar Todo
                  </button>
                  <button
                    onClick={handleSaveCustom}
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-900/30"
                  >
                    Guardar Preferencias
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
