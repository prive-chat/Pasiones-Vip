import { Suspense, lazy } from 'react';
import { useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/layout/Navbar';
import ModalCenter from './components/layout/ModalCenter';
import ScrollToTop from './components/layout/ScrollToTop';
import { InstallPrompt } from './components/ui/InstallPrompt';
import NotificationManager from './components/notifications/NotificationManager';
import ToastContainer from './components/notifications/ToastContainer';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from './components/layout/PageTransition';

// Import pages directly to prevent lazy loading context issues
import AuthPage from './pages/AuthPage';
import SettingsPage from './pages/SettingsPage';
import HomePage from './pages/HomePage';
import MessagesPage from './pages/MessagesPage';
import UserProfilePage from './pages/UserProfilePage';
import PostPage from './pages/PostPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminPage from './pages/AdminPage';

import { Logo } from './components/ui/Logo';

const LoadingScreen = ({ message = "Cargando..." }) => (
  <div className="flex min-h-screen items-center justify-center bg-black">
    <div className="flex flex-col items-center space-y-6">
      <Logo size={140} className="scale-110" />
      <div className="flex flex-col items-center space-y-3">
        <div className="h-1 w-40 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="h-full w-1/2 bg-gradient-to-r from-transparent via-passion-red to-transparent"
          />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] passion-text opacity-80">{message}</p>
      </div>
    </div>
  </div>
);

export default function App() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen message="Cargando Pasiones Vip..." />;
  }

  return (
    <>
      <ScrollToTop />
      <InstallPrompt />
      <div className="min-h-screen bg-black text-white">
        <ToastContainer />
        <Suspense fallback={<LoadingScreen />}>
          <Navbar />
          <NotificationManager />
          <ModalCenter />
          <main>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                {/* Public Routes */}
                <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/" replace />} />
                <Route path="/profile/:userId" element={<PageTransition><UserProfilePage /></PageTransition>} />
                <Route path="/post/:postId" element={<PageTransition><PostPage /></PageTransition>} />
                
                {/* Protected Routes */}
                <Route path="/" element={user ? <PageTransition><HomePage /></PageTransition> : <Navigate to="/auth" replace />} />
                <Route path="/messages" element={user ? <PageTransition><MessagesPage /></PageTransition> : <Navigate to="/auth" replace />} />
                <Route path="/settings" element={user ? <PageTransition><SettingsPage /></PageTransition> : <Navigate to="/auth" replace />} />
                
                {profile?.role?.toLowerCase().trim() === 'super_admin' && (
                  <Route path="/admin" element={user ? <PageTransition><AdminPage /></PageTransition> : <Navigate to="/auth" replace />} />
                )}
                
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </AnimatePresence>
          </main>
        </Suspense>
      </div>
    </>
  );
}
