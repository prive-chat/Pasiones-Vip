import { useState, FormEvent, MouseEvent } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/src/components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

import { Logo } from '@/src/components/ui/Logo';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isLogin && password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
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
              {isLogin ? 'Pasiones Vip' : 'Crear Cuenta'}
            </CardTitle>
            <p className="text-center text-xs font-bold tracking-widest text-white/40 uppercase">
              {isLogin ? 'Acceso Exclusivo' : 'Únete a la élite de mensajería'}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {!isLogin && (
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
              <Input
                label="Contraseña"
                labelClassName="text-passion-red/80 font-bold text-xs uppercase tracking-widest"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-passion-red/50"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                rightElement={passwordToggle}
                required
              />
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="signup-fields-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
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
                  </motion.div>
                )}
              </AnimatePresence>
              {error && (
                <p className="text-xs font-bold text-neon-scarlet bg-neon-scarlet/10 p-3 rounded border border-neon-scarlet/20">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full py-6 text-lg uppercase tracking-widest" isLoading={loading}>
                {isLogin ? 'Entrar' : 'Registrarse'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-bold text-white/40 hover:text-passion-red transition-colors uppercase tracking-widest"
            >
              {isLogin ? "¿No tienes cuenta? Regístrate" : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
