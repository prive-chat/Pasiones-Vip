import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Home, LogOut, ShieldCheck, ShieldAlert, Settings, Menu, X, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import NotificationDropdown from '../notifications/NotificationDropdown';

import { Logo } from '../ui/Logo';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleHomeClick = (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      queryClient.invalidateQueries({ queryKey: ['media'] });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setIsMenuOpen(false);
      navigate('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const menuItems = [
    { label: 'Mensajes', path: '/messages', icon: MessageSquare },
    { label: 'Ajustes', path: '/settings', icon: Settings },
  ];

  if (profile?.role?.toLowerCase().trim() === 'super_admin') {
    menuItems.push({ label: 'Admin', path: '/admin', icon: ShieldAlert });
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/60 backdrop-blur-2xl">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" onClick={handleHomeClick} className="flex items-center space-x-2 group shrink-0">
          <Logo size={40} glow={false} />
          <span className="text-lg sm:text-xl font-black tracking-tighter passion-text drop-shadow-sm truncate max-w-[120px] sm:max-w-none font-display italic transition-all group-hover:drop-shadow-[0_0_8px_rgba(230,0,0,0.5)]">PRIVÉ CHAT</span>
        </Link>

        <div className="flex items-center space-x-2 relative" ref={menuRef}>
          {user ? (
            <>
              {/* Inicio Button */}
              <Link
                to="/"
                onClick={handleHomeClick}
                className={cn(
                  'flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-bold transition-all',
                  location.pathname === '/'
                    ? 'bg-passion-red/10 text-passion-red shadow-[inset_0_0_10px_rgba(230,0,0,0.1)]'
                    : 'text-white/40 hover:bg-white/5 hover:text-white'
                )}
              >
                <Home size={18} />
                <span className="hidden sm:inline">Inicio</span>
              </Link>

              {/* Notificaciones */}
              <NotificationDropdown />

              {/* Hamburger Menu Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={cn(
                  "text-white/60 hover:text-white hover:bg-white/5 font-bold px-3",
                  isMenuOpen && "bg-white/10 text-white"
                )}
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                <span className="ml-2 hidden sm:inline">Menú</span>
              </Button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-black/80 p-2 shadow-2xl backdrop-blur-2xl"
                  >
                    <div className="space-y-1">
                      {menuItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={cn(
                            'flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-bold transition-all',
                            location.pathname === item.path
                              ? 'bg-passion-red/10 text-passion-red'
                              : 'text-white/50 hover:bg-white/5 hover:text-white'
                          )}
                        >
                          <item.icon size={18} />
                          <span>{item.label}</span>
                        </Link>
                      ))}
                      
                      <div className="my-2 h-px bg-white/5" />
                      
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-sm font-bold text-neon-scarlet/70 transition-all hover:bg-neon-scarlet/10 hover:text-neon-scarlet"
                      >
                        <LogOut size={18} />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="font-black uppercase tracking-widest text-[10px] px-6">
                Iniciar Sesión
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
