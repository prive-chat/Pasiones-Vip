import React from 'react';
import { Shield, FileText, AlertTriangle, Scale, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import LegalFooter from '../components/legal/LegalFooter';

export default function TermsOfServicePage() {
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
            <Scale className="w-3.5 h-3.5" />
            <span>Condiciones Legales de Contratación y Uso</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white">Términos y Condiciones de Uso</h1>
          <p className="text-xs md:text-sm text-zinc-400">
            Vigente desde el 23 de Julio de 2026. Al acceder o registrarse en Pasiones VIP, usted acepta vincularse legalmente por las presentes condiciones.
          </p>
        </div>

        <div className="space-y-8 text-sm text-zinc-300 leading-relaxed">
          {/* Section 1: Requisito de Edad */}
          <section className="space-y-3 p-6 bg-zinc-950 border border-red-500/30 rounded-3xl">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>1. Requisito Estricto de Mayoría de Edad (+18 Años)</span>
            </h2>
            <p>
              Está estrictamente prohibido el acceso, registro o uso de Pasiones VIP a cualquier persona menor de 18 años de edad (o la mayoría de edad legal establecida en su jurisdicción de residencia). La violación de esta norma resulta en la terminación inmediata y permanente de la cuenta, así como el bloqueo de la dirección IP y el reporte a las autoridades competentes.
            </p>
          </section>

          {/* Section 2: Naturaleza de la Plataforma */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <FileText className="w-5 h-5 text-red-500" />
              <span>2. Naturaleza del Servicio y Creadores de Contenido</span>
            </h2>
            <p>
              Pasiones VIP opera como un proveedor de servicios de intermediación técnica y alojamiento que permite a creadores de contenido independientes, modelos e influyentes publicar contenido exclusivo, interactuar con sus seguidores y gestionar anuncios.
            </p>
            <p className="text-xs text-zinc-400">
              Pasiones VIP no actúa como empleador o agencia de representación de los creadores. Cada modelo actúa de forma totalmente autónoma e independiente.
            </p>
          </section>

          {/* Section 3: Reglas de Conducta */}
          <section className="space-y-3 p-6 bg-zinc-950 border border-zinc-800 rounded-3xl">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Shield className="w-5 h-5 text-red-500" />
              <span>3. Conductas Prohibidas y Tolerancia Cero</span>
            </h2>
            <p>Queda expresamente prohibido en la plataforma:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-zinc-400 text-xs">
              <li>Cualquier tipo de contenido relacionado con menores de edad o que pueda inducir a error sobre la edad de los participantes.</li>
              <li>Publicación o compartición de contenido íntimo no consentido (revenge porn o filtraciones).</li>
              <li>Promoción de violencia, discurso de odio, acoso o discriminación.</li>
              <li>Actividades ilícitas, trata de personas o facilitación de delitos.</li>
              <li>Uso de bots, scrapers o raspado de datos para descargar contenido protegido por derechos de autor de los creadores.</li>
            </ul>
          </section>

          {/* Section 4: Propiedad Intelectual */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-red-500" />
              <span>4. Propiedad Intelectual y Licencias</span>
            </h2>
            <p>
              Los creadores retienen el 100% de la propiedad intelectual de las fotografías, vídeos y textos que publiquen. Al cargar contenido en Pasiones VIP, el usuario otorga a la plataforma una licencia limitada no exclusiva para alojar, transmitir y mostrar dicho contenido dentro de la aplicación.
            </p>
          </section>

          {/* Section 5: Pagos y Membresías */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Scale className="w-5 h-5 text-red-500" />
              <span>5. Pagos, Suscripciones y Devoluciones</span>
            </h2>
            <p>
              Las suscripciones y productos digitales se procesan de forma segura a través de pasarelas con certificación PCI-DSS. Debido a la naturaleza del contenido digital de acceso inmediato, no se ofrecen reembolsos una vez consumido o desbloqueado el contenido, salvo en casos exigidos por la ley.
            </p>
          </section>
        </div>
      </div>
      <LegalFooter />
    </div>
  );
}
