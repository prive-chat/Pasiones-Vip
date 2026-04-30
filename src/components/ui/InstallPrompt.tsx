import { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    setIsIOS(ios);

    // Show prompt for iOS if not already installed
    if (ios && !isStandalone) {
      const hasDismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (!hasDismissed) {
        setIsVisible(true);
      }
    }

    const handler = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show the install button
      setIsVisible(true);
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
    if (isIOS) {
      localStorage.setItem('pwa_prompt_dismissed', 'true');
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 left-6 right-6 z-[100] md:left-auto md:right-6 md:w-96"
        >
          <div className="glass-card p-4 flex flex-col gap-4 shadow-2xl border-primary-600/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center shadow-lg shadow-passion-red/20 overflow-hidden neon-glow p-0">
                  <img src="/favicon-32.png" alt="Logo" className="h-8 w-8 object-contain" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white italic uppercase tracking-tighter">Pasiones Vip</h3>
                  <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">Acceso rápido VIP</p>
                </div>
              </div>
              <button 
                onClick={handleDismiss}
                className="p-1 text-white/40 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {isIOS ? (
              <div className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-xs text-white/80 leading-relaxed font-medium flex items-center justify-center flex-wrap gap-1">
                  Para instalar: Toca <Share size={16} className="text-primary-400 mx-1" /> y luego selecciona <span className="text-white font-bold italic underline decoration-primary-500/50 underline-offset-4">"Añadir a la pantalla de inicio"</span>
                </p>
              </div>
            ) : (
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  className="bg-primary-600 hover:bg-primary-500 text-white font-bold px-6 py-2 h-auto"
                  onClick={handleInstall}
                >
                  <Download size={14} className="mr-2" />
                  Instalar App
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
