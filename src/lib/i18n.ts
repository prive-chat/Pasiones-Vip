import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      common: {
        loading: 'Loading...',
        error: 'Error',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        search: 'Search',
        upload: 'Upload',
      },
      nav: {
        home: 'Home',
        messages: 'Messages',
        profile: 'Profile',
        settings: 'Settings',
        admin: 'Admin',
      },
      auth: {
        login: 'Login',
        register: 'Register',
        logout: 'Logout',
        welcome: 'Welcome to Pasiones Vip',
        subtitle: 'Secure and modular enterprise messaging',
      }
    }
  },
  es: {
    translation: {
      common: {
        loading: 'Cargando...',
        error: 'Error',
        save: 'Guardar',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        search: 'Buscar',
        upload: 'Subir',
      },
      nav: {
        home: 'Inicio',
        messages: 'Mensajes',
        profile: 'Perfil',
        settings: 'Ajustes',
        admin: 'Admin',
      },
      auth: {
        login: 'Iniciar Sesión',
        register: 'Registrarse',
        logout: 'Cerrar Sesión',
        welcome: 'Bienvenido a Pasiones Vip',
        subtitle: 'Mensajería empresarial segura y modular',
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    }
  });

export default i18n;
