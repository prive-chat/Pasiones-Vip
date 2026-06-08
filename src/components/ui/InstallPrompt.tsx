import { useState, useEffect } from 'react';
import { Download, X, Share, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './Button';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    // Check if running inside an iframe (AI Studio preview environment)
    const inIframe = window.self !== window.top;
    setIsInIframe(inIframe);

    // Check if it's iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    setIsIOS(ios);

    // If running in an iframe, show a hint about opening in a new tab to enable installation
    if (inIframe) {
      const hasDismissed = localStorage.getItem('pwa_iframe_guide_dismissed');
      if (!hasDismissed) {
        setIsVisible(true);
      }
    } else {
      // Show prompt for iOS if not already installed and not in iframe
      if (ios && !isStandalone) {
        const hasDismissed = localStorage.getItem('pwa_prompt_dismissed');
        if (!hasDismissed) {
          setIsVisible(true);
        }
      }
    }

    const handler = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Only show the install prompt if we are NOT inside an iframe (since browser blocks installation in iframes)
      if (!inIframe) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (isInIframe) {
      localStorage.setItem('pwa_iframe_guide_dismissed', 'true');
    } else {
      localStorage.setItem('pwa_prompt_dismissed', 'true');
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-24 left-6 right-6 z-[100] md:bottom-6 md:left-auto md:right-6 md:w-96"
        >
          <div className="glass-card p-5 flex flex-col gap-4 shadow-2xl border-white/5 bg-zinc-950/95 backdrop-blur-xl rounded-3xl border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center shadow-lg shadow-passion-red/20 overflow-hidden p-0 shrink-0">
                  <img src="/favicon-32.png?v=logo-v2" alt="Logo" className="h-8 w-8 object-contain" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white italic uppercase tracking-tighter">Pasiones Vip</h3>
                  <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">Acceso rápido VIP</p>
                </div>
              </div>
              <button 
                onClick={handleDismiss}
                className="p-1 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {isInIframe ? (
              <div className="space-y-3.5">
                <p className="text-xs text-white/70 leading-relaxed font-medium">
                  Estás visualizando el portal dentro de un marco de previsualización. Para poder instalarlo como una <span className="text-passion-red font-bold font-display italic">App Nativa Mobile</span> con notificaciones push instantáneas, debes abrirlo en una pestaña independiente de tu navegador.
                </p>
                <div className="flex justify-end gap-2.5">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleDismiss} 
                    className="text-[9px] font-black uppercase tracking-widest text-white/45 hover:text-white h-9"
                  >
                    Quizá más tarde
                  </Button>
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleDismiss}
                    className="inline-flex items-center gap-2 px-4 h-9 rounded-xl bg-passion-red hover:bg-[#b00202] text-[9.5px] font-black uppercase tracking-widest italic text-white transition-all shadow-lg shadow-passion-red/20 hover:scale-[1.02]"
                  >
                    <ExternalLink size={12} />
                    Abrir y continuar
                  </a>
                </div>
              </div>
            ) : isIOS ? (
              <div className="text-center p-3.5 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-xs text-white/80 leading-relaxed font-medium flex items-center justify-center flex-wrap gap-1.5">
                  Para instalar en iOS: Toca <Share size={16} className="text-passion-red mx-1" /> en tu navegador Safari y selecciona <span className="text-white font-black italic underline decoration-passion-red/50 underline-offset-4">"Añadir a la pantalla de inicio"</span>
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-white/70 leading-relaxed font-medium">
                  Instala el acceso oficial de <span className="text-passion-red font-bold italic font-display">Pasiones VIP</span> en tu menú de inicio para recibir alertas en tiempo real y disfrutar de pantalla completa.
                </p>
                <div className="flex justify-end gap-2.5">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleDismiss} 
                    className="text-[9px] font-black uppercase tracking-widest text-white/45 hover:text-white h-9"
                  >
                    Descartar
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-passion-red hover:bg-[#b50000] text-white font-black uppercase tracking-widest italic text-[9.5px] px-5 h-9 rounded-xl shadow-lg shadow-passion-red/20"
                    onClick={handleInstall}
                  >
                    <Download size={12} className="mr-2" />
                    Instalar App
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
