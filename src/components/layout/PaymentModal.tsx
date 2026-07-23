import React, { useState } from 'react';
import { useUIStore } from '@/src/store/uiStore';
import { creditsManager } from '@/src/lib/credits';
import { useNotificationStore } from '@/src/store/notificationStore';
import { CreditCard, Coins, ShieldCheck, Lock, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PACKAGES = [
  { id: 'pack-starter', name: 'Pack Iniciación VIP', credits: 50, bonus: 0, price: 4.99, color: 'from-amber-600/20 to-orange-600/10' },
  { id: 'pack-popular', name: 'Pack Popular VIP', credits: 120, bonus: 20, price: 9.99, color: 'from-pink-600/20 to-purple-600/10', popular: true },
  { id: 'pack-premium', name: 'Pack Premium VIP', credits: 250, bonus: 50, price: 19.99, color: 'from-indigo-600/20 to-violet-600/10' },
  { id: 'pack-emperor', name: 'Pack Emperador VIP', credits: 600, bonus: 150, price: 39.99, color: 'from-yellow-500/20 to-amber-500/15' }
];

export default function PaymentModal() {
  const { closeModal, modalData } = useUIStore();
  const { addToast } = useNotificationStore();
  
  const [selectedPack, setSelectedPack] = useState(PACKAGES[1]); // Default to popular 9.99
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [inputError, setInputError] = useState('');

  // Handle auto-formatting for Card Number
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formatted = value.substring(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
    setInputError('');
  };

  // Handle auto-formatting for Expiry (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    setCardExpiry(value.substring(0, 5));
    setInputError('');
  };

  // Handle CVC (digits only)
  const handleCVCChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setCardCVC(value.substring(0, 4));
    setInputError('');
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInputError('');

    if (!cardName.trim()) {
      setInputError('Por favor, ingresa el nombre del titular.');
      return;
    }
    if (cardNumber.replace(/\s/g, '').length < 16) {
      setInputError('El número de tarjeta debe tener 16 dígitos.');
      return;
    }
    if (cardExpiry.length < 5) {
      setInputError('Ingresa una fecha de expiración válida (MM/AA).');
      return;
    }
    if (cardCVC.length < 3) {
      setInputError('El código CVC debe tener al menos 3 dígitos.');
      return;
    }

    setIsProcessing(true);

    // Simulate safe API gateway delay
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      
      const totalCreditsGained = selectedPack.credits + selectedPack.bonus;
      creditsManager.addCredits(totalCreditsGained);
      
      addToast({
        type: 'success',
        message: '¡Depósito VIP Confirmado!',
        description: `Se han acreditado ${totalCreditsGained} tokens a tu Cartera VIP.`,
        duration: 5000
      });
    }, 2800);
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-green-500/10 border border-green-500/30 p-5 rounded-full text-green-400"
        >
          <CheckCircle2 size={48} className="animate-pulse" />
        </motion.div>
        
        <div className="space-y-2">
          <h3 className="text-2xl font-black uppercase italic tracking-tight text-white leading-tight">TRANSPORTE COMPLETADO</h3>
          <p className="text-xs text-white/50 max-w-sm mx-auto uppercase tracking-wider">
            La pasarela de pruebas de Pasiones VIP ha verificado y conciliado tu pago de forma segura.
          </p>
        </div>

        <div className="bg-black/40 border border-white/5 p-4 rounded-2xl w-full max-w-sm">
          <p className="text-[10px] uppercase font-black tracking-widest text-white/30">Tokens Añadidos</p>
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <Coins size={16} className="text-amber-400 animate-spin-slow" />
            <span className="text-xl font-bold font-mono text-white">+{selectedPack.credits + selectedPack.bonus} Cr.</span>
          </div>
          <p className="text-[9px] uppercase font-black tracking-widest text-[#E60000] mt-1 italic">Operación con éxito</p>
        </div>

        <button
          onClick={closeModal}
          className="w-full h-12 bg-gradient-to-r from-red-600 to-primary-600 hover:opacity-90 text-white font-black uppercase tracking-widest text-xs rounded-xl"
        >
          Sintonizar Contenido VIP
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Intro Warning */}
      {modalData?.price && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/[0.03] border border-amber-500/10 rounded-2xl">
          <AlertTriangle size={20} className="text-amber-500 shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-black text-amber-500 uppercase tracking-tight">Saldo Insuficiente detectado</p>
            <p className="text-[10px] text-white/50 leading-relaxed uppercase">
              Intentaste desbloquear un contenido premium que requiere {modalData.price} créditos. Por favor, selecciona un paquete de tokens premium VIP de abajo para recargar tu cuenta.
            </p>
          </div>
        </div>
      )}

      {/* Credit Packages grid Selector */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block">1. Selecciona un Paquete de Créditos VIP</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PACKAGES.map((pack) => {
            const isSelected = selectedPack.id === pack.id;
            return (
              <button
                key={pack.id}
                onClick={() => setSelectedPack(pack)}
                className={`relative p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${
                  isSelected 
                    ? 'bg-gradient-to-r ' + pack.color + ' border-amber-500 shadow-xl' 
                    : 'bg-black/30 border-white/5 hover:bg-black/45 hover:border-white/10'
                }`}
              >
                {pack.popular && (
                  <div className="absolute top-0 right-4 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-purple-600 text-[8px] font-black uppercase tracking-widest text-white px-2 py-0.5 rounded-full border border-pink-400/20">
                    Súper Popular
                  </div>
                )}
                
                <div className="space-y-1 min-w-0">
                  <span className="text-xs font-black uppercase text-white tracking-widest truncate block">{pack.name}</span>
                  <div className="flex items-center gap-1.5">
                    <Coins size={12} className="text-amber-500" />
                    <span className="text-sm font-black font-mono text-white leading-none">
                      {pack.credits} Cr.
                    </span>
                    {pack.bonus > 0 && (
                      <span className="text-[9px] font-black text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        +{pack.bonus} Gratis
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-black font-mono text-amber-500">
                    {pack.price} $
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stripe look-alike Form form layout */}
      <form onSubmit={handlePaymentSubmit} className="space-y-4">
        <div className="space-y-3 border-t border-white/5 pt-5">
          <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block">
            2. Información de Pago (Pasarela de Pruebas SSL Segura)
          </label>

          {inputError && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-500 italic bg-red-500/5 p-2 rounded">
              {inputError}
            </p>
          )}

          <div className="space-y-3 bg-black/40 border border-white/5 p-4 rounded-2xl">
            {/* Owner name */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">Titular de la Tarjeta</span>
              <input
                type="text"
                placeholder="Nombre Completo"
                value={cardName}
                onChange={(e) => { setCardName(e.target.value); setInputError(''); }}
                className="bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Simulated Card inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">Número de Tarjeta</span>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="4000 1234 5678 9010"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                  <CreditCard size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">Expira</span>
                  <input
                    type="text"
                    placeholder="MM/AA"
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    className="bg-zinc-950 border border-white/10 rounded-xl px-2 py-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-center"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">CVC</span>
                  <input
                    type="password"
                    placeholder="•••"
                    value={cardCVC}
                    onChange={handleCVCChange}
                    className="bg-zinc-950 border border-white/10 rounded-xl px-2 py-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-center"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Stripe Secure details and Submit btn */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 justify-center text-[9px] font-black uppercase text-white/30 tracking-widest leading-none">
            <Lock size={10} className="text-amber-500" />
            <span>Encriptación Segura de Pruebas AES-256 SSL Activa</span>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Validando con el Banco Simulado...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={14} />
                <span>Proceder al Pago de {selectedPack.price} $</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
