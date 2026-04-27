import { useState } from 'react';
import MediaFeed from '../features/feed/MediaFeed';
import UserDirectory from '../features/users/UserDirectory';
import HomeActionArea from '../features/home/HomeActionArea';
import TrendingSidebar from '../features/feed/TrendingSidebar';
import { Button } from '../components/ui/Button';
import { Plus, LayoutGrid, ShieldAlert, Users, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { useUIStore } from '../store/uiStore';
import { cn } from '../lib/utils';
import { publicAdService } from '../services/publicAdService';
import { AdCard } from '../components/ui/AdCard';
import UserIdentityBar from '../components/layout/UserIdentityBar';
import { useQuery } from '@tanstack/react-query';

export default function HomePage() {
  const [view, setView] = useState<'feed' | 'users'>('feed');
  const { profile } = useAuth();
  const setActiveModal = useUIStore((state) => state.setActiveModal);

  const { data: ads = [] } = useQuery({
    queryKey: ['active-ads', 'feed'],
    queryFn: () => publicAdService.getActiveAds('feed'),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <>
      {view === 'feed' && <UserIdentityBar />}
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <HomeActionArea
          leftContent={
            profile && !profile.is_verified && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center space-x-2 text-neon-scarlet bg-neon-scarlet/10 px-4 py-2 rounded-full text-xs font-black border border-neon-scarlet/20 uppercase tracking-widest neon-glow"
              >
                <ShieldAlert size={14} />
                <span>Verificación Pendiente</span>
              </motion.div>
            )
          }
          rightContent={
            <>
              <Button
                onClick={() => setView(view === 'users' ? 'feed' : 'users')}
                variant={view === 'users' ? 'outline' : 'secondary'}
                className="h-12 px-6"
              >
                <Users className={cn("mr-2 h-5 w-5", view === 'users' ? "text-passion-red" : "text-white/40")} />
                {view === 'users' ? 'Ver Feed' : 'Usuarios'}
              </Button>
              {profile?.is_verified && (
                <Button
                  onClick={() => setActiveModal('upload')}
                  variant="primary"
                  className="h-12 px-6 shadow-lg shadow-primary-600/20"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Subir Medios
                </Button>
              )}
            </>
          }
        />

        <AnimatePresence mode="wait">
        {view === 'users' && (
          <motion.div
            key="users-section"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="mb-12"
          >
            <div className="mb-6 flex items-center space-x-3 border-b border-white/5 pb-4">
              <Users size={20} className="text-passion-red" />
              <h2 className="text-xl font-black tracking-widest text-white uppercase">Directorio de Miembros</h2>
            </div>
            <UserDirectory />
          </motion.div>
        )}
      </AnimatePresence>

      {view === 'feed' && (
        <div className="flex flex-col lg:flex-row justify-center gap-12">
          {/* Centered Content Section */}
          <section className="w-full max-w-2xl">
            <div className="mb-6 flex items-center space-x-3 border-b border-white/5 pb-4">
              <LayoutGrid size={20} className="text-passion-red" />
              <h2 className="text-xl font-black tracking-widest text-white uppercase">Feed Global</h2>
            </div>
            
            {/* Featured Ad in Feed (Mobile/Tablet) */}
            {ads.length > 0 && (
              <div className="mb-12 lg:hidden">
                <AdCard ad={ads[0]} />
              </div>
            )}

            <MediaFeed />
          </section>

          {/* Right Sidebar (Desktop only) */}
          <aside className="hidden lg:block w-80 shrink-0 space-y-8">
            <TrendingSidebar />
            
            <div className="sticky top-24 space-y-8">
              <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Megaphone size={14} className="text-primary-400" />
                  Sugerencias Premium
                </h3>
                <div className="space-y-6">
                  {ads.length > 0 ? (
                    ads.map((ad) => (
                      <div key={ad.id}>
                        <AdCard ad={ad} />
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Espacio Publicitario Disponible</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Community Info */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-primary-600/20 to-transparent border border-white/10">
                <h4 className="text-sm font-black text-white uppercase italic mb-2">Comunidad Privé</h4>
                <p className="text-xs text-white/60 leading-relaxed">
                  Únete a la red más exclusiva. Conecta con perfiles verificados y vive la pasión sin límites.
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
    </>
  );
}
