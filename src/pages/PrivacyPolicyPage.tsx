import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, FileText, UserCheck, Eye, Database, Trash2, Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import LegalFooter from '../components/legal/LegalFooter';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back navigation */}
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al inicio</span>
        </Link>

        {/* Header */}
        <div className="space-y-3 pb-6 border-b border-zinc-800">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-xs font-semibold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>Marco de Protección de Datos (RGPD / ARCO)</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white">Política de Privacidad y Tratamiento de Datos</h1>
          <p className="text-xs md:text-sm text-zinc-400">
            Última actualización: 23 de Julio de 2026. Conforme al Reglamento General de Protección de Datos (RGPD UE 2016/679) y normativas de privacidad internacional.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8 text-sm text-zinc-300 leading-relaxed">
          {/* Section 1: Identificación */}
          <section className="space-y-3 p-6 bg-zinc-950 border border-zinc-800 rounded-3xl">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Shield className="w-5 h-5 text-red-500" />
              <span>1. Responsable del Tratamiento de Datos</span>
            </h2>
            <p>
              El responsable del tratamiento de los datos personales recabados a través del sitio web y plataforma <strong className="text-white">Pasiones VIP</strong> es la entidad gestora de la plataforma. Para cualquier consulta referente a la privacidad, ejercicio de derechos ARCO/RGPD o delegado de protección de datos (DPO), puede contactar a nuestro equipo legal en:
            </p>
            <div className="p-3 bg-zinc-900 rounded-xl text-xs font-mono text-red-400 border border-zinc-800">
              Correo DPO / Privacidad: privacidad@pasionesvip.com
            </div>
          </section>

          {/* Section 2: Datos Recopilados */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Database className="w-5 h-5 text-red-500" />
              <span>2. Información y Datos Personales que Recopilamos</span>
            </h2>
            <p>Para la correcta prestación de nuestros servicios VIP, recopilamos las siguientes categorías de datos:</p>
            <ul className="list-disc pl-6 space-y-2 text-zinc-400">
              <li><strong className="text-zinc-200">Datos de Identificación y Cuenta:</strong> Dirección de correo electrónico, nombre de usuario, contraseña cifrada, foto de perfil y biografía.</li>
              <li><strong className="text-zinc-200">Verificación de Edad e Identidad (KYC 18+):</strong> Para creadores y modelos, documentos oficiales de identidad y fotografía selfie de verificación para garantizar la mayoría de edad (18+) y evitar fraude o suplantación.</li>
              <li><strong className="text-zinc-200">Datos de Uso y Navegación:</strong> Dirección IP, registros de acceso, tipo de dispositivo, navegador, ciudad aproximada y logs de auditoría de seguridad.</li>
              <li><strong className="text-zinc-200">Contenido Generado por el Usuario:</strong> Publicaciones, imágenes, vídeos, comentarios, mensajes privados en el chat y preferencias.</li>
            </ul>
          </section>

          {/* Section 3: Finalidad */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Eye className="w-5 h-5 text-red-500" />
              <span>3. Finalidad y Base Jurídica del Tratamiento</span>
            </h2>
            <p>Tratamos sus datos personales con las siguientes finalidades legítimas:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-1">
                <h3 className="font-bold text-white text-xs">Ejecución del Contrato</h3>
                <p className="text-xs text-zinc-400">Gestión de su cuenta de usuario, mensajería privada, publicaciones de contenido y suscripciones VIP.</p>
              </div>
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-1">
                <h3 className="font-bold text-white text-xs">Cumplimiento Legal (18+)</h3>
                <p className="text-xs text-zinc-400">Verificación estricta de la mayoría de edad y prevención de la pornografía infantil o trata de personas.</p>
              </div>
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-1">
                <h3 className="font-bold text-white text-xs">Interés Legítimo</h3>
                <p className="text-xs text-zinc-400">Seguridad de la red, prevención de ciberataques, detección de spam y mejora de la experiencia de usuario.</p>
              </div>
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-1">
                <h3 className="font-bold text-white text-xs">Consentimiento Expreso</h3>
                <p className="text-xs text-zinc-400">Envío de notificaciones push, cookies analíticas o comunicaciones comerciales solicitadas.</p>
              </div>
            </div>
          </section>

          {/* Section 4: Derechos RGPD / ARCO */}
          <section className="space-y-3 p-6 bg-zinc-950 border border-zinc-800 rounded-3xl">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-red-500" />
              <span>4. Sus Derechos de Privacidad (Acceso, Rectificación, Portabilidad y Supresión)</span>
            </h2>
            <p>
              Usted dispone en todo momento de los siguientes derechos garantizados por la legislación vigente:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-zinc-400 text-xs">
              <li><strong className="text-zinc-200">Derecho de Acceso:</strong> Consultar qué datos personales suyos conservamos.</li>
              <li><strong className="text-zinc-200">Derecho de Portabilidad (Descargar mis Datos):</strong> Exportar sus datos en un archivo JSON legible por máquina desde el panel de <Link to="/settings" className="text-red-400 underline">Ajustes de la Cuenta</Link>.</li>
              <li><strong className="text-zinc-200">Derecho al Olvido / Supresión:</strong> Solicitar la eliminación completa y permanente de su cuenta y todos sus contenidos asociados.</li>
              <li><strong className="text-zinc-200">Derecho de Rectificación:</strong> Modificar cualquier información inexacta o desactualizada de su perfil.</li>
            </ul>
          </section>

          {/* Section 5: Conservación y Seguridad */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Lock className="w-5 h-5 text-red-500" />
              <span>5. Conservación y Seguridad de la Información</span>
            </h2>
            <p>
              Implementamos medidas técnicas y organizativas de última generación, incluyendo cifrado SSL/TLS en tránsito y almacenamiento con políticas RLS (Row Level Security) en base de datos. Los datos se mantendrán únicamente durante el tiempo que la cuenta permanezca activa o sea necesario para responder a obligaciones legales o fiscales.
            </p>
          </section>
        </div>
      </div>
      <LegalFooter />
    </div>
  );
}
