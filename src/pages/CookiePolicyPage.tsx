import React from 'react';
import { Cookie, Shield, Check, Info, Settings, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import LegalFooter from '../components/legal/LegalFooter';

export default function CookiePolicyPage() {
  const handleResetCookies = () => {
    localStorage.removeItem('pasiones_cookie_consent');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al inicio</span>
        </Link>

        <div className="space-y-3 pb-6 border-b border-zinc-800">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-xs font-semibold uppercase tracking-wider">
            <Cookie className="w-3.5 h-3.5" />
            <span>Transparencia en Almacenamiento Local</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white">Política de Cookies y Tecnologías Similares</h1>
          <p className="text-xs md:text-sm text-zinc-400">
            En Pasiones VIP utilizamos cookies y almacenamiento local (localStorage) para garantizar la seguridad de tu sesión y ofrecer una navegación rápida y personalizada.
          </p>
        </div>

        <div className="space-y-8 text-sm text-zinc-300 leading-relaxed">
          <section className="space-y-3 p-6 bg-zinc-950 border border-zinc-800 rounded-3xl">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Info className="w-5 h-5 text-red-500" />
              <span>¿Qué son las Cookies y para qué las usamos?</span>
            </h2>
            <p>
              Una cookie es un pequeño archivo de texto almacenado en tu navegador. Nos permite reconocerte cuando inicias sesión, recordar tu sesión activa con Supabase y proteger la plataforma contra ataques maliciosos CSRF o manipulación de peticiones.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white">Tipos de Cookies y Almacenamiento Utilizados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-xs">Cookies Estrictamente Necesarias</h3>
                  <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-mono font-bold">Obligatorias</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Son indispensables para que la plataforma funcione (autenticación con Supabase, verificación de edad +18 y token de sesión cifrado).
                </p>
              </div>

              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-xs">Cookies de Preferencia y Función</h3>
                  <span className="text-[9px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-mono">Opcionales</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Guardan tus ajustes de interfaz (volumen de vídeos, filtros de búsqueda de creadores y estado de reproductor).
                </p>
              </div>
            </div>
          </section>

          <section className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Settings className="w-5 h-5 text-red-500" />
              <span>Gestionar o Restablecer tus Preferencias de Cookies</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Puedes modificar o eliminar tu consentimiento de cookies en cualquier momento. Si deseas restablecer tu consentimiento actual y volver a configurar el banner:
            </p>
            <button
              onClick={handleResetCookies}
              className="px-5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs transition-all shadow-md"
            >
              Restablecer Preferencias de Cookies
            </button>
          </section>
        </div>
      </div>
      <LegalFooter />
    </div>
  );
}
