import { useState } from 'react';
import MediaFeed from '../features/feed/MediaFeed';
import UserDirectory from '../features/users/UserDirectory';
import HomeActionArea from '../features/home/HomeActionArea';
import TrendingSidebar from '../features/feed/TrendingSidebar';
import { Button } from '../components/ui/Button';
import { Plus, LayoutGrid, ShieldAlert, Users, Megaphone, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { useUIStore } from '../store/uiStore';
import { cn } from '../lib/utils';
import { publicAdService } from '../services/publicAdService';
import { AdCard } from '../components/ui/AdCard';
import UserIdentityBar from '../components/layout/UserIdentityBar';
import { useQuery } from '@tanstack/react-query';
import { HighlightStories } from '../features/home/HighlightStories';

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
    <div className="min-h-screen bg-[#0A0A0A]">
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
                className="h-12 px-3 sm:px-6 w-full sm:w-auto rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] italic"
              >
                <Users className={cn("mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4", view === 'users' ? "text-primary-500" : "text-white/40")} />
                {view === 'users' ? 'Volver' : 'Directorio'}
              </Button>
              {profile?.is_verified && (
                <Button
                  onClick={() => setActiveModal('upload')}
                  variant="primary"
                  className="h-12 px-3 sm:px-6 w-full sm:w-auto rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] italic shadow-xl shadow-primary-600/20"
                >
                  <Plus className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Publicar
                </Button>
              )}
            </>
          }
        />

        <AnimatePresence mode="wait">
          {view === 'users' ? (
            <motion.div
              key="users-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="mb-12"
            >
              <div className="mb-8 flex items-center justify-between border-b border-white/5 pb-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary-600/20 flex items-center justify-center text-primary-400">
                    <Users size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">Directorio Exclusivo</h2>
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Encuentra a las mejores modelos verificadas</p>
                  </div>
                </div>
              </div>
              <UserDirectory />
            </motion.div>
          ) : (
            <motion.div
              key="feed-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <HighlightStories />

              <div id="main-feed" className="flex flex-col lg:flex-row justify-center gap-12">
                {/* Centered Content Section */}
                <section className="w-full max-w-2xl space-y-12">
                  <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <div className="flex items-center space-x-3">
                      <LayoutGrid size={20} className="text-primary-600" />
                      <h2 className="text-xl font-black tracking-widest text-white uppercase italic">Feed de Actividad</h2>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                       <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">En vivo</span>
                    </div>
                  </div>
                  
                  {/* Featured Content Spot */}
                  {ads.length > 0 && (
                    <div className="lg:hidden">
                      <div className="mb-4 flex items-center gap-2">
                        <Sparkles size={14} className="text-amber-400" />
                        <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest">Recomendación Premium</span>
                      </div>
                      <AdCard ad={ads[0]} />
                    </div>
                  )}

                  <MediaFeed />
                </section>

                {/* Right Sidebar (Desktop only) */}
                <aside className="hidden lg:block w-80 shrink-0 space-y-10">
                  <TrendingSidebar />
                  
                  <div className="sticky top-24 space-y-10">
                    <div className="p-8 rounded-[2.5rem] bg-zinc-950 border border-white/5 shadow-2xl relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      
                      <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                        <Megaphone size={14} className="text-primary-500" />
                        Espacio Publicitario
                      </h3>
                      
                      <div className="space-y-10 relative z-10">
                        {ads.length > 0 ? (
                          ads.map((ad) => (
                            <div key={ad.id} className="transition-transform duration-500 hover:scale-[1.02]">
                              <AdCard ad={ad} />
                            </div>
                          ))
                        ) : (
                          <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.01]">
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] px-8">Tu anuncio podría estar aquí resaltado</p>
                            <Button variant="ghost" size="sm" className="mt-4 text-[8px] font-black uppercase tracking-widest text-primary-400">Consultar Tarifas</Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Community Banner */}
                    <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-primary-600 to-primary-900 border border-white/10 shadow-2xl shadow-primary-600/10 group overflow-hidden relative">
                      <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <ShieldAlert size={140} />
                      </div>
                      <h4 className="text-xl font-black text-white uppercase italic mb-4 leading-none relative z-10">Conviértete en VIP</h4>
                      <p className="text-sm text-white/80 leading-relaxed italic relative z-10 font-medium">
                        Disfruta de visibilidad máxima, insignias de verificación y acceso a herramientas exclusivas de promoción.
                      </p>
                      <Button variant="outline" className="mt-8 w-full border-white/20 bg-white/10 hover:bg-white/20 text-[10px] font-black uppercase tracking-widest italic rounded-xl h-12 relative z-10">
                        Saber Más
                      </Button>
                    </div>
                  </div>
                </aside>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
