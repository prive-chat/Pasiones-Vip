import React from 'react';
import { ShieldCheck, ShieldAlert, Lock, CreditCard, UserCheck, Eye, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import LegalFooter from '../components/legal/LegalFooter';

export default function LegalInfoPage() {
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
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Cumplimiento Normativo Global</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white">Aviso de Cumplimiento Legal y Seguridad</h1>
          <p className="text-xs md:text-sm text-zinc-400">
            Resumen de medidas de cumplimiento, protección a creadores y estándares de seguridad aplicados en Pasiones VIP.
          </p>
        </div>

        <div className="space-y-8 text-sm text-zinc-300 leading-relaxed">
          {/* Anti Trafficking */}
          <section id="antitrafficking" className="space-y-3 p-6 bg-zinc-950 border border-zinc-800 rounded-3xl">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <span>Política Anti-Trata y Protección de Menores (Tolerancia Cero)</span>
            </h2>
            <p>
              Pasiones VIP mantiene una política de tolerancia cero frente a cualquier forma de explotación, tráfico humano o presencia de personas menores de edad. Todas las cuentas de creadores de contenido requieren verificación KYC con documento oficial previo a la publicación.
            </p>
            <p className="text-xs text-zinc-400">
              Colaboramos proactivamente con las autoridades internacionales encargadas de la protección cibernética.
            </p>
          </section>

          {/* Payments */}
          <section id="payments" className="space-y-3 p-6 bg-zinc-950 border border-zinc-800 rounded-3xl">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-red-500" />
              <span>Seguridad en Transacciones y Cumplimiento PCI-DSS</span>
            </h2>
            <p>
              Todos los cobros de membresías VIP, compras de contenido y propinas se canalizan mediante procesadores de pago que cumplen con la certificación PCI-DSS Nivel 1. Ningún dato sensible de tarjeta bancaria es almacenado en nuestros servidores.
            </p>
          </section>

          {/* Verification */}
          <section className="space-y-3 p-6 bg-zinc-950 border border-zinc-800 rounded-3xl">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-red-500" />
              <span>Verificación de Identidad de Modelos (KYC 18+)</span>
            </h2>
            <p>
              Conforme a los estándares 18 U.S.C. § 2257 y la Ley de Servicios Digitales (DSA EE.UU. / UE), conservamos registros custodiados de verificación de edad e identidad de todos los modelos independientes activos en la plataforma.
            </p>
          </section>
        </div>
      </div>
      <LegalFooter />
    </div>
  );
}
