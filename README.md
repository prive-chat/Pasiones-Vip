# 🛡️ Pasiones Vip: Enclave Digital de Élite

![Pasiones Vip Refined](https://ais-pre-d6m2tqmyydzel37l6tigkn-328810327831.us-east1.run.app/favicon-32.png) 

**Pasiones Vip** es una plataforma de mensajería de grado empresarial orientada a la exclusividad, la privacidad total y una experiencia de usuario inmersiva bajo el concepto de **"Enclave VIP"**. Diseñado para usuarios que exigen hermetismo, elegancia y un rendimiento impecable.

## 🔗 Enlaces Rápidos
- 📱 [Demo en Vivo](https://ais-pre-d6m2tqmyydzel37l6tigkn-328810327831.us-east1.run.app)
- 🧪 [Repositorio GitHub](https://github.com/nexonetworkec-arch/prive-chat.git)

## ✨ Características de Élite

### 💎 Experiencia Visual "Enclave"
- **Branding Refinado:** Nueva identidad visual basada en el **Escudo de Cifrado PV**, proyectando autoridad y exclusividad.
- **Glassmorphism Dinámico:** Interfaz oscura con efectos de desenfoque de fondo y resplandores ambientales en **Rojo Pasión (#C62828)**.
- **Animaciones Motion:** Transiciones fluidas y micro-interacciones que refuerzan la sensación de lujo tecnológico.

### 🛡️ Seguridad y Privacidad
- **Cifrado en Reposo:** Integración robusta con las políticas de seguridad (RLS) de Supabase.
- **Hermetismo Personal:** Mensajería en tiempo real con borrado seguro y gestión de visibilidad de chats.
- **Acceso Exclusivo:** Portal de autenticación blindado con validación de identidad.

### ⚡ Rendimiento de Vanguardia
- **React 19 & Vite:** El stack más moderno para una respuesta instantánea.
- **TanStack Query v5:** Gestión inteligente de caché y sincronización de datos.
- **Optimización de Medios:** Carga diferida y compresión dinámica de imágenes para un feed ágil.

## 🛠️ Stack Tecnológico

- **Core:** React 19, TypeScript, Vite.
- **Estado Global:** Zustand & TanStack Query.
- **Backend as a Service:** Supabase (Auth, Realtime, Database, Storage).
- **Estilos:** Tailwind CSS 4.
- **Animaciones:** Motion / React.
- **Notificaciones:** Web Push API & Service Workers.

## 🚀 Instalación para Desarrolladores

### Requisitos
- Node.js 20+
- PNPM / NPM

### Configuración Local

1. **Clonar y Acceder:**
   ```bash
   git clone https://github.com/nexonetworkec-arch/prive-chat.git
   cd prive-chat
   ```

2. **Instalación:**
   ```bash
   npm install
   ```

3. **Variables de Entorno:**
   Crea un archivo `.env` basado en `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Configura tus credenciales de **Supabase** y tu **VAPID Key**.

4. **Desarrollo:**
   ```bash
   npm run dev
   ```

## 🏗️ Despliegue en Producción

El proyecto está optimizado para despliegues en contenedores o hosting estático:

```bash
npm run build
```

El contenido de `/dist` es estático y de alto rendimiento.

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo `LICENSE` para más detalles.

---
## 🚀 Despliegue en Producción (Vercel + Supabase)

### 1. Variables de Entorno
Configura las siguientes variables en el panel de Vercel:
- `VITE_SUPABASE_URL`: Tu URL del proyecto Supabase.
- `VITE_SUPABASE_ANON_KEY`: Tu llave anónima de Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: Tu llave de servicio (necesaria para el backend).
- `VITE_VAPID_PUBLIC_KEY`: Generada anteriormente.
- `VAPID_PRIVATE_KEY`: Generada anteriormente.
- `VAPID_SUBJECT`: `mailto:tu@email.com`

### 2. Base de Datos
1. Ejecuta `supabase_schema.sql` en Supabase.
2. Configura los Webhooks usando `supabase_webhook_config.sql`.

### 3. Build & Development Settings
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`
