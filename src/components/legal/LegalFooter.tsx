import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, FileText, Cookie, AlertCircle, Sparkles } from 'lucide-react';
import { Logo } from '../ui/Logo';

export default function LegalFooter() {
  return (
    <footer className="w-full bg-zinc-950 border-t border-zinc-900 py-10 px-4 md:px-8 mt-16 text-zinc-400 text-xs">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Age Notice */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2">
              <Logo size={36} />
              <span className="text-sm font-black tracking-wider text-white uppercase">PASIONES VIP</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Plataforma exclusiva para modelos independientes y creadores de contenido para adultos. Estrictamente regulada para mayores de 18 años.
            </p>
            <div className="flex items-center space-x-2 pt-1 text-[10px] text-red-400 font-semibold uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
              <span>Contenido Protegido +18</span>
            </div>
          </div>

          {/* Col 2: Marcos Legales */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Marco Legal y Normativo</h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link to="/privacy" className="hover:text-red-400 transition-colors flex items-center space-x-1.5">
                  <Lock className="w-3 h-3 text-zinc-500" />
                  <span>Política de Privacidad (RGPD / ARCO)</span>
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-red-400 transition-colors flex items-center space-x-1.5">
                  <FileText className="w-3 h-3 text-zinc-500" />
                  <span>Términos y Condiciones de Uso</span>
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="hover:text-red-400 transition-colors flex items-center space-x-1.5">
                  <Cookie className="w-3 h-3 text-zinc-500" />
                  <span>Política de Cookies y Preferencias</span>
                </Link>
              </li>
              <li>
                <Link to="/legal" className="hover:text-red-400 transition-colors flex items-center space-x-1.5">
                  <ShieldCheck className="w-3 h-3 text-zinc-500" />
                  <span>Aviso de Cumplimiento Normativo</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Propiedad Intelectual y Moderación */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Propiedad y Moderación</h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link to="/dmca" className="hover:text-red-400 transition-colors flex items-center space-x-1.5">
                  <AlertCircle className="w-3 h-3 text-zinc-500" />
                  <span>Derechos de Autor y DMCA Takedown</span>
                </Link>
              </li>
              <li>
                <Link to="/legal#antitrafficking" className="hover:text-red-400 transition-colors flex items-center space-x-1.5">
                  <ShieldCheck className="w-3 h-3 text-zinc-500" />
                  <span>Política Anti-Trata y Protección de Menores</span>
                </Link>
              </li>
              <li>
                <Link to="/legal#payments" className="hover:text-red-400 transition-colors flex items-center space-x-1.5">
                  <Sparkles className="w-3 h-3 text-zinc-500" />
                  <span>Seguridad en Pagos PCI-DSS</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Compliance Badge */}
          <div className="space-y-3 p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl">
            <div className="flex items-center space-x-2 text-white font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verificación de Identidad KYC</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Todos los modelos y creadores registrados en Pasiones VIP han pasado por un proceso estricto de verificación de edad de 18 años e identidad según normativas internacionales.
            </p>
            <p className="text-[9px] font-mono text-zinc-500">
              18 U.S.C. 2257 / EU DSA Compliance Active
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between text-[11px] text-zinc-400 gap-4">
          <p>© {new Date().getFullYear()} PASIONES VIP. Todos los derechos reservados. Sitio para mayores de 18 años.</p>
          <div className="flex items-center space-x-4">
            <Link to="/privacy" className="hover:text-zinc-300 transition-colors">Privacidad</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-zinc-300 transition-colors">Términos</Link>
            <span>•</span>
            <Link to="/dmca" className="hover:text-zinc-300 transition-colors">DMCA</Link>
            <span>•</span>
            <Link to="/cookies" className="hover:text-zinc-300 transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
