
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card max-w-md w-full p-8 text-center space-y-6"
      >
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-primary-600/20 border border-primary-600/30">
            <AlertCircle className="w-12 h-12 text-primary-500" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">404</h1>
          <p className="text-xl font-medium text-white/80">Página no encontrada</p>
          <p className="text-sm text-white/60">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </p>
        </div>

        <Link 
          to="/" 
          className="glass-button inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-medium w-full justify-center"
        >
          <Home className="w-4 h-4" />
          <span>Volver al Inicio</span>
        </Link>
      </motion.div>
    </div>
  );
}
