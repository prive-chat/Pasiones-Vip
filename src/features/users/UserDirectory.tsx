import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/src/services/profileService';
import { Card } from '@/src/components/ui/Card';
import { BadgeCheck, Calendar, Search, MapPin, Tag, SlidersHorizontal, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { VirtuosoGrid } from 'react-virtuoso';
import { OptimizedImage } from '@/src/components/ui/OptimizedImage';
import { ProfileSkeleton } from '@/src/components/Skeletons';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';

export default function UserDirectory() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['profiles', search, city, category],
    queryFn: () => profileService.searchProfiles(search, {
      city: city.trim() === '' ? undefined : city,
      category: category.trim() === '' ? undefined : category
    }),
  });

  if (isLoading && search === '') {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <ProfileSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-[600px] space-y-8">
      {/* Search and Filters Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o usuario..."
              className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:ring-primary-600/50"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`border-white/10 ${showFilters ? 'bg-primary-600/20 border-primary-600/50 text-white' : 'text-white/60'}`}
          >
            <SlidersHorizontal size={18} className="mr-2" />
            Filtros
          </Button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <Card className="glass-card p-6 border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input
                  label="Filtrar por Ciudad"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ej: Madrid, Tokyo, Londres..."
                  leftElement={<MapPin size={16} className="text-primary-500" />}
                  variant="glass"
                  className="bg-white/5"
                />

                <Input
                  label="Filtrar por Categoría"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ej: Escort, Trans, BDSM..."
                  leftElement={<Tag size={16} className="text-primary-500" />}
                  variant="glass"
                  className="bg-white/5"
                />
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {users.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Search size={40} className="text-white/20" />
          </div>
          <h3 className="text-2xl font-black text-white italic uppercase mb-2">No encontramos a nadie</h3>
          <p className="text-white/40 max-w-xs">Prueba con otros términos de búsqueda o filtros.</p>
        </div>
      ) : (
        <VirtuosoGrid
          useWindowScroll
          data={users}
          listClassName="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          itemContent={(index, user) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (index % 6) * 0.1 }}
            >
              <Card className="group relative overflow-hidden p-6 transition-all duration-500 hover:shadow-2xl glass-card border-none h-full hover:border-[#E60000]/30 hover:scale-[1.02]">
                {/* City Badge */}
                {user.city && (
                  <div className="absolute top-4 left-4 z-10">
                    <span className="bg-black/50 backdrop-blur-md px-2 py-1 rounded text-[8px] font-black text-white/60 uppercase tracking-widest border border-white/10">
                      {user.city}
                    </span>
                  </div>
                )}

                <div className="flex items-start space-x-5">
                  <Link to={`/profile/${user.id}`} className="relative group/avatar shrink-0">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-white/20 ring-2 ring-white/10 transition-all duration-500 group-hover/avatar:ring-primary-600/50 group-hover/avatar:scale-110 overflow-hidden shadow-xl">
                      {user.avatar_url ? (
                        <OptimizedImage 
                          src={user.avatar_url} 
                          alt={user.full_name} 
                          className="h-full w-full rounded-full object-cover"
                          containerClassName="h-full w-full"
                        />
                      ) : (
                        <UserIcon size={28} />
                      )}
                    </div>
                    {user.is_verified && (
                      <div className="absolute -bottom-1 -right-1 rounded-full bg-primary-600 p-1 shadow-[0_0_15px_rgba(230,0,0,0.5)] border-2 border-[#0A0A0A]">
                        <BadgeCheck size={16} className="text-white" />
                      </div>
                    )}
                  </Link>
                  
                  <div className="flex-1 min-w-0 pt-1">
                    <Link to={`/profile/${user.id}`}>
                      <h3 className="truncate text-xl font-black text-white hover:text-primary-400 transition-colors tracking-tight italic uppercase">
                        {user.full_name || 'Miembro de la Red'}
                      </h3>
                    </Link>
                    <div className="flex flex-col space-y-1 mt-1">
                      {user.category && (
                        <div className="text-[10px] font-black text-primary-500 uppercase tracking-wider">
                          {user.category}
                        </div>
                      )}
                      <div className="flex items-center text-[10px] uppercase tracking-[0.2em] font-black text-white/30">
                        <Calendar size={12} className="mr-2 text-primary-600" />
                        Desde {new Date(user.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>
                
                {user.role === 'super_admin' && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center rounded-full bg-primary-600/10 px-3 py-1 text-[9px] font-black text-primary-400 border border-primary-600/30 uppercase tracking-[0.1em] italic">
                      Administrador
                    </span>
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        />
      )}
    </div>
  );
}
