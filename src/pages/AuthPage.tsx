import { useState, useEffect, FormEvent, MouseEvent } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/src/components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useNotificationStore } from '@/src/store/notificationStore';

import { Logo } from '@/src/components/ui/Logo';

export default function AuthPage() {
  const { isRecovery, setIsRecovery } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showForgotConfirmation, setShowForgotConfirmation] = useState(false);
  const [isOver18, setIsOver18] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const { addToast } = useNotificationStore();

  useEffect(() => {
    if (isRecovery) {
      setMode('reset');
    }
  }, [isRecovery]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (mode === 'reset' && password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: fullName,
            }
          }
        });
        if (error) throw error;
        setShowConfirmation(true);
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?type=recovery`,
        });
        if (error) throw error;
        
        addToast({
          type: 'success',
          message: 'Enlace Envíado ✉️',
          description: 'Hemos enviado un enlace de recuperación a tu correo electrónico.'
        });
        setShowForgotConfirmation(true);
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        
        addToast({
          type: 'success',
          message: 'Contraseña Actualizada 🔒',
          description: 'Tu contraseña se ha restablecido con éxito. Ya puedes iniciar sesión.'
        });
        
        // Sign out recovery session and return to login
        setIsRecovery(false);
        await supabase.auth.signOut({ scope: 'local' });
        window.history.replaceState({}, document.title, '/auth');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (e: MouseEvent) => {
    e.preventDefault();
    setShowPassword(!showPassword);
  };

  const passwordToggle = (
    <button
      type="button"
      onClick={togglePasswordVisibility}
      className="focus:outline-none hover:text-slate-600 transition-colors"
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );

  if (showConfirmation) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="text-center p-8 bg-zinc-900 border border-white/5 shadow-2xl">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-passion-red/10 text-passion-red shadow-[0_0_20px_rgba(230,0,0,0.1)]">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <CardTitle className="mb-2 passion-text font-black text-2xl">VERIFICA TU CORREO</CardTitle>
            <p className="text-white/60 mb-6">
              Hemos enviado un enlace de verificación a <span className="font-semibold text-white">{email}</span>. 
              Por favor, haz clic en el enlace del correo para completar tu registro.
            </p>
            <Button variant="outline" className="w-full" onClick={() => setShowConfirmation(false)}>
              Volver al Inicio de Sesión
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (showForgotConfirmation) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="text-center p-8 bg-zinc-900 border border-white/5 shadow-2xl">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-passion-red/10 text-passion-red shadow-[0_0_20px_rgba(230,0,0,0.1)]">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <CardTitle className="mb-2 passion-text font-black text-2xl">ENLACE ENVIADO</CardTitle>
            <p className="text-white/60 mb-6 text-sm">
              Hemos enviado un enlace para restablecer tu contraseña a <span className="font-semibold text-white">{email}</span>. 
              Por favor, revisa tu bandeja de entrada y sigue las instrucciones para cambiar tu contraseña.
            </p>
            <Button variant="outline" className="w-full font-bold uppercase tracking-widest text-xs py-4" onClick={() => { setShowForgotConfirmation(false); setMode('login'); }}>
              Volver al Inicio de Sesión
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-zinc-900/80 border border-white/5 shadow-2xl overflow-hidden backdrop-blur-xl">
          <CardHeader className="pb-2">
            <div className="mx-auto mb-4 scale-110">
              <Logo size={100} />
            </div>
            <CardTitle className="text-center text-3xl font-black tracking-tighter passion-text uppercase">
              {mode === 'login' ? 'Pasiones Vip' : mode === 'signup' ? 'Crear Cuenta' : mode === 'forgot' ? 'Recuperar Contraseña' : 'Nueva Contraseña'}
            </CardTitle>
            <p className="text-center text-xs font-bold tracking-widest text-white/40 uppercase">
              {mode === 'login' ? 'Acceso Exclusivo' : mode === 'signup' ? 'Únete a la élite de mensajería' : mode === 'forgot' ? 'Ingresa tu correo registrado' : 'Restablece tu contraseña de forma segura'}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {mode === 'signup' && (
                  <motion.div
                    key="signup-fields-1"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Input
                      label="Nombre Completo"
                      labelClassName="text-passion-red/80 font-bold text-xs uppercase tracking-widest"
                      type="text"
                      placeholder="Juan Pérez"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-passion-red/50"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
                <Input
                  label="Correo Electrónico"
                  labelClassName="text-passion-red/80 font-bold text-xs uppercase tracking-widest"
                  type="email"
                  placeholder="tu@email.com"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-passion-red/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              )}

              {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
                <Input
                  label={mode === 'reset' ? 'Nueva Contraseña' : 'Contraseña'}
                  labelClassName="text-passion-red/80 font-bold text-xs uppercase tracking-widest"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-passion-red/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  rightElement={passwordToggle}
                  required
                />
              )}

              <AnimatePresence mode="wait">
                {mode === 'signup' && (
                  <motion.div
                    key="signup-fields-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <Input
                      label="Confirmar Contraseña"
                      labelClassName="text-passion-red/80 font-bold text-xs uppercase tracking-widest"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-passion-red/50"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      rightElement={passwordToggle}
                      required
                    />

                    <div className="pt-2 space-y-3">
                      {/* Checkbox 1: Over 18 */}
                      <label className="flex items-start gap-2.5 text-xs text-white/70 select-none cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={isOver18}
                          onChange={(e) => setIsOver18(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded text-passion-red bg-zinc-800 border-white/10 focus:ring-passion-red focus:outline-none accent-passion-red cursor-pointer"
                        />
                        <span>
                          Confirmo que soy <span className="text-white font-bold">mayor de 18 años</span> y tengo la edad legal para acceder a esta plataforma.
                        </span>
                      </label>

                      {/* Checkbox 2: Accept Terms */}
                      <label className="flex items-start gap-2.5 text-xs text-white/70 select-none cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded text-passion-red bg-zinc-800 border-white/10 focus:ring-passion-red focus:outline-none accent-passion-red cursor-pointer"
                        />
                        <span>
                          Acepto los{' '}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowTermsModal(true);
                            }}
                            className="text-passion-red hover:text-white font-black underline transition-colors"
                          >
                            Términos y Condiciones
                          </button>{' '}
                          y la Política de Privacidad de Pasiones VIP.
                        </span>
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {mode === 'reset' && (
                <Input
                  label="Confirmar Nueva Contraseña"
                  labelClassName="text-passion-red/80 font-bold text-xs uppercase tracking-widest"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-passion-red/50"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  rightElement={passwordToggle}
                  required
                />
              )}

              {error && (
                <p className="text-xs font-bold text-neon-scarlet bg-neon-scarlet/10 p-3 rounded border border-neon-scarlet/20">
                  {error}
                </p>
              )}
              <Button 
                type="submit" 
                className="w-full py-6 text-lg uppercase tracking-widest disabled:opacity-50" 
                isLoading={loading}
                disabled={
                  (mode === 'signup' && (!isOver18 || !acceptTerms || !fullName || !email || !password || !confirmPassword)) ||
                  (mode === 'login' && (!email || !password)) ||
                  (mode === 'forgot' && !email) ||
                  (mode === 'reset' && (!password || !confirmPassword || password !== confirmPassword))
                }
              >
                {mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Registrarse' : mode === 'forgot' ? 'Enviar Enlace' : 'Actualizar Contraseña'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <div className="text-xs font-bold text-white/40 uppercase tracking-widest text-center flex flex-col items-center justify-center gap-3 w-full">
              {mode === 'login' && (
                <div className="flex flex-col space-y-3 w-full items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode('forgot');
                    }}
                    className="text-white/60 hover:text-passion-red transition-colors text-xs font-bold cursor-pointer hover:underline uppercase tracking-wider"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                  <span className="w-full border-t border-white/5 my-1" />
                  <span>
                    ¿No tienes cuenta?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setMode('signup');
                      }}
                      className="text-passion-red hover:text-white transition-all underline decoration-passion-red/50 hover:decoration-white font-black cursor-pointer px-2.5 py-1 bg-passion-red/10 hover:bg-passion-red/20 border border-passion-red/25 rounded-md shadow-[0_0_15px_rgba(230,0,0,0.1)] hover:shadow-[0_0_20px_rgba(230,0,0,0.35)] ml-1"
                    >
                      Regístrate
                    </button>
                  </span>
                </div>
              )}
              {mode === 'signup' && (
                <span>
                  ¿Ya tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode('login');
                    }}
                    className="text-white hover:text-passion-red transition-colors underline decoration-white/30 hover:decoration-passion-red ml-1 font-bold cursor-pointer"
                  >
                    Inicia sesión
                  </button>
                </span>
              )}
              {(mode === 'forgot' || mode === 'reset') && (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('login');
                  }}
                  className="text-passion-red hover:text-white transition-colors underline font-black cursor-pointer uppercase tracking-wider text-xs"
                >
                  Volver al Inicio de Sesión
                </button>
              )}
            </div>
          </CardFooter>
        </Card>
      </motion.div>

      {/* Terms and Conditions Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            {/* Modal backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTermsModal(false)}
              className="absolute inset-0 cursor-pointer"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10 p-6 md:p-8 flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-passion-red rounded-full"></span>
                    Términos y Condiciones
                  </h3>
                  <p className="text-[10px] text-white/40 font-bold uppercase mt-0.5 tracking-wider">Por favor, lee detalladamente antes de continuar</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto py-6 pr-2 space-y-4 text-xs text-white/70 font-sans leading-relaxed">
                <section className="space-y-2">
                  <h4 className="text-white font-bold uppercase tracking-wide text-[11px]">1. Aceptación de los Términos</h4>
                  <p>
                    Al registrarse y acceder a Pasiones VIP, usted declara ser mayor de 18 años (o la mayoría de edad legal aplicable en su jurisdicción) y acepta cumplir con estos Términos y Condiciones en su totalidad. Si no está de acuerdo con alguna parte, debe abstenerse de usar nuestra plataforma.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-white font-bold uppercase tracking-wide text-[11px]">2. Requisito de Mayoría de Edad</h4>
                  <p>
                    Este sitio web contiene material e interacciones para adultos. Queda terminantemente prohibido el acceso o registro a cualquier persona menor de 18 años. Pasiones VIP se reserva el derecho de verificar la identidad y edad de los usuarios en cualquier momento, suspendiendo de inmediato las cuentas sospechosas de falsificación.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-white font-bold uppercase tracking-wide text-[11px]">3. Conducta de la Comunidad</h4>
                  <p>
                    Promovemos un entorno de respeto mutuo, seguridad y consentimiento libre de violencia. No toleramos el acoso, las amenazas, la discriminación ni cualquier conducta ilegal o abusiva en los mensajes o perfiles de la plataforma. El incumplimiento de estas normas resultará en la expulsión definitiva del servicio sin reembolso de saldos o suscripciones activas.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-white font-bold uppercase tracking-wide text-[11px]">4. Privacidad de los Datos</h4>
                  <p>
                    Su privacidad es nuestra máxima prioridad. La información recolectada durante el registro y uso del servicio se procesa con encriptación avanzada de extremo a extremo. Nunca venderemos ni divulgaremos sus datos personales a terceros, salvo requerimiento judicial legal explícito.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-white font-bold uppercase tracking-wide text-[11px]">5. Modificaciones y Actualizaciones</h4>
                  <p>
                    Pasiones VIP se reserva el derecho de modificar estos términos periódicamente para adaptarlos a nuevas regulaciones o mejoras en la plataforma. Las modificaciones entrarán en vigor a partir de su publicación en el portal.
                  </p>
                </section>
              </div>

              {/* Accept Button at bottom of Modal */}
              <div className="pt-4 border-t border-white/10 flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 py-3 text-xs uppercase font-bold tracking-widest" 
                  onClick={() => {
                    setAcceptTerms(false);
                    setShowTermsModal(false);
                  }}
                >
                  Rechazar
                </Button>
                <Button 
                  type="button" 
                  variant="primary" 
                  className="flex-1 py-3 text-xs uppercase font-bold tracking-widest" 
                  onClick={() => {
                    setAcceptTerms(true);
                    setShowTermsModal(false);
                  }}
                >
                  Aceptar Términos
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
