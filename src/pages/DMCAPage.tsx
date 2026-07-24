import React, { useState } from 'react';
import { Shield, AlertTriangle, FileText, CheckCircle2, Send, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import LegalFooter from '../components/legal/LegalFooter';
import ReportContentModal from '../components/legal/ReportContentModal';

export default function DMCAPage() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

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
            <Shield className="w-3.5 h-3.5" />
            <span>Digital Millennium Copyright Act (DMCA)</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white">Política de Derechos de Autor y Retirada DMCA</h1>
          <p className="text-xs md:text-sm text-zinc-400">
            Pasiones VIP respeta rigurosamente los derechos de propiedad intelectual de los creadores y actúa con máxima celeridad ante avisos de infracción de copyright.
          </p>
        </div>

        <div className="space-y-8 text-sm text-zinc-300 leading-relaxed">
          <section className="space-y-3 p-6 bg-zinc-950 border border-zinc-800 rounded-3xl">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <FileText className="w-5 h-5 text-red-500" />
              <span>Procedimiento de Notificación de Infracción</span>
            </h2>
            <p>
              Si usted es titular de derechos de autor o un agente autorizado y considera que algún material alojado en Pasiones VIP infringe sus derechos, puede enviar una notificación formal conteniendo los siguientes requisitos indispensables:
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-xs text-zinc-400">
              <li>Firma física o electrónica del titular del derecho o representante autorizado.</li>
              <li>Identificación de la obra protegida que se alega infringida (o enlace directo al contenido original).</li>
              <li>Ubicación exacta y URL dentro de Pasiones VIP del contenido presuntamente infractor.</li>
              <li>Información de contacto (correo electrónico, dirección física y teléfono).</li>
              <li>Declaración de buena fe afirmando que el uso no está autorizado por el propietario ni por la ley.</li>
              <li>Declaración bajo pena de perjurio de que la información provista es exacta.</li>
            </ol>
          </section>

          <section className="p-6 bg-zinc-950 border border-red-500/30 rounded-3xl space-y-4 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">¿Necesitas enviar una denuncia DMCA de inmediato?</h3>
              <p className="text-xs text-zinc-400">
                Utiliza nuestro formulario en línea de canal rápido para que el equipo de moderación revise y retire el material en menos de 24 horas.
              </p>
            </div>
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="shrink-0 px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 text-white font-bold text-xs transition-all shadow-lg shadow-red-900/30 flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Abrir Formulario DMCA</span>
            </button>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">Agente Designado de Derechos de Autor</h2>
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs space-y-1 font-mono text-zinc-300">
              <p className="font-bold text-white">Pasiones VIP Copyright Agent</p>
              <p>Email directo: dmca@pasionesvip.com</p>
              <p>Atención: Departamento de Moderación y Asuntos Legales</p>
            </div>
          </section>
        </div>
      </div>

      <ReportContentModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetType="post"
        targetId="dmca_page_request"
        targetTitle="Denuncia DMCA General"
      />

      <LegalFooter />
    </div>
  );
}
