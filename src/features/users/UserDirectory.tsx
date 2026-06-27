import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/src/services/profileService';
import { Card } from '@/src/components/ui/Card';
import { BadgeCheck, Calendar, Search, MapPin, Tag, SlidersHorizontal, User as UserIcon, Compass, Grid, Map, Coins, Eye, Star, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { VirtuosoGrid } from 'react-virtuoso';
import { OptimizedImage } from '@/src/components/ui/OptimizedImage';
import { ProfileSkeleton } from '@/src/components/Skeletons';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { getSimulatedCoords, calculateDistance } from '@/src/utils/geolocation';
import { WORLD_COUNTRIES } from '@/src/utils/worldData';
import { parseProfileBio } from '@/src/utils/profileMetadata';
import { useDebounce } from '@/src/hooks/useDebounce';
import { IMAGE_SIZES } from '@/src/lib/images';

// Deterministic hashing helper to assign specs to profiles so the filters feel lifelike
function getDeterministicSpecs(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const uHash = Math.abs(hash);
  
  const ages = [21, 23, 24, 26, 28, 30, 32, 22, 25, 27, 29, 31, 33];
  const hairColors = ['Rubio', 'Castaño', 'Negro', 'Pelirrojo', 'Platino', 'Gris / Cano', 'Calvo', 'Fantasía'];
  const eyeColors = ['Azul', 'Verde', 'Miel', 'Oscuro', 'Marrón Claro', 'Gris'];
  const services = [
    'Amistad',
    'Pasatiempo',
    'Conversación',
    'Acompañante de Eventos',
    'Relación Seria',
    'Guía de Viajes',
    'Ocio',
    'GFe (Novia)',
    'BDSM Premium',
    'Masaje Sensual',
    'Cena VIP',
    'Viajes Exóticos'
  ];
  const ratings = [4.8, 4.9, 5.0, 4.7, 4.9];

  return {
    age: ages[uHash % ages.length],
    hair: hairColors[uHash % hairColors.length],
    eyes: eyeColors[uHash % eyeColors.length],
    service: services[uHash % services.length],
    rating: ratings[uHash % ratings.length]
  };
}

export default function UserDirectory() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState(''); // Default empty to show all registered users initially without restrictions
  const [category, setCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Hierarchical Location Level states
  const [selectedCountry, setSelectedCountry] = useState<string>('Todos');
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  
  // Advanced Filter state variables
  const [maxDistance, setMaxDistance] = useState(50); // KM slider
  const [selectedHair, setSelectedHair] = useState('any');
  const [selectedEyes, setSelectedEyes] = useState('any');
  const [selectedService, setSelectedService] = useState('any');
  const [maxAge, setMaxAge] = useState(45);
  
  // View mode Toggle
  const [viewMode, setViewMode] = useState<'grid' | 'radar'>('grid');
  
  // Radar Sweeper state
  const [sweepAngle, setSweepAngle] = useState(0);
  const [radarHoveredUser, setRadarHoveredUser] = useState<any | null>(null);

  // Debounced values for performance/API optimization
  const debouncedSearch = useDebounce(search, 400);
  const debouncedCity = useDebounce(city, 400);

  // Rotate sweep beam
  useEffect(() => {
    if (viewMode !== 'radar') return;
    const interval = setInterval(() => {
      setSweepAngle((prev) => (prev + 1.5) % 360);
    }, 15);
    return () => clearInterval(interval);
  }, [viewMode]);

  const { data: rawUsers = [], isLoading } = useQuery({
    queryKey: ['profiles', debouncedSearch, debouncedCity, category],
    queryFn: () => profileService.searchProfiles(debouncedSearch, {
      city: debouncedCity.trim() === '' ? undefined : debouncedCity,
      category: category.trim() === '' ? undefined : category
    }),
  });

  // Calculate base reference coordinates (Madrid/Barcelona/etc.)
  const centerBaseCity = city || 'Madrid';
  const baseSimRef = getSimulatedCoords('center-ref', centerBaseCity);

  // Transform profiles with deterministic location coordinates, distances, and high-spec metadata
  const processedUsers = useMemo(() => {
    return rawUsers.map((u: any) => {
      const { metadata } = parseProfileBio(u.bio);
      const specs = getDeterministicSpecs(u.id);

      const mergedAge = metadata.age !== undefined ? metadata.age : specs.age;
      const mergedHair = metadata.hair || specs.hair;
      const mergedEyes = metadata.eyes || specs.eyes;
      const mergedService = metadata.service || specs.service;
      const mergedCountry = metadata.country || 'espana';
      const mergedProvince = metadata.province || '';
      const mergedCity = metadata.city || u.city || 'Madrid';

      const coords = getSimulatedCoords(u.id, mergedCity);
      const distanceKm = calculateDistance(baseSimRef.lat, baseSimRef.lng, coords.lat, coords.lng);
      
      return {
        ...u,
        age: mergedAge,
        hair: mergedHair,
        eyes: mergedEyes,
        service: mergedService,
        country: mergedCountry,
        province: mergedProvince,
        city: mergedCity,
        coords,
        distanceKm,
        metadata
      };
    });
  }, [rawUsers, baseSimRef.lat, baseSimRef.lng]);

  // Apply all client-side physical and distance filters
  const filteredUsers = useMemo(() => {
    return processedUsers.filter((u: any) => {
      // Country Filter
      if (selectedCountry !== 'Todos' && u.country && u.country.toLowerCase() !== selectedCountry.toLowerCase()) return false;

      // Province Filter
      if (selectedProvince && u.province && u.province.toLowerCase() !== selectedProvince.toLowerCase()) return false;

      // Distance Filter - only apply if a specific city is selected
      if (city && u.distanceKm > maxDistance) return false;
      
      // Age Filter
      if (u.age > maxAge) return false;
      
      // Hair Color Filter
      if (selectedHair !== 'any' && u.hair.toLowerCase() !== selectedHair.toLowerCase()) return false;
      
      // Eye Color Filter
      if (selectedEyes !== 'any' && u.eyes.toLowerCase() !== selectedEyes.toLowerCase()) return false;
      
      // Premium Service Filter
      if (selectedService !== 'any' && u.service.toLowerCase() !== selectedService.toLowerCase()) return false;
      
      return true;
    });
  }, [processedUsers, selectedCountry, selectedProvince, city, maxDistance, maxAge, selectedHair, selectedEyes, selectedService]);

  // Clean filters
  const handleClearFilters = () => {
    setSearch('');
    setCity('');
    setSelectedCountry('Todos');
    setSelectedProvince('');
    setCategory('');
    setMaxDistance(50);
    setSelectedHair('any');
    setSelectedEyes('any');
    setSelectedService('any');
    setMaxAge(45);
  };

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
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o usuario..."
              className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:ring-primary-600/50 h-12 rounded-2xl"
            />
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`border-white/10 shrink-0 h-12 rounded-2xl ${showFilters ? 'bg-primary-600/20 border-primary-600/50 text-white' : 'text-white/60'}`}
          >
            <SlidersHorizontal size={18} className="mr-2" />
            Buscador Avanzado
          </Button>

          {/* Toggle View Mode: Grid (MapPin layout) vs Radar sweep */}
          <div className="flex bg-white/5 border border-white/10 p-1.5 rounded-2xl h-12 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center justify-center px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all gap-1.5 ${viewMode === 'grid' ? 'bg-primary-600 text-white shadow-xl' : 'text-white/40 hover:text-white/75'}`}
            >
              <Grid size={14} />
              Lista
            </button>
            <button
              onClick={() => setViewMode('radar')}
              className={`flex items-center justify-center px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all gap-1.5 ${viewMode === 'radar' ? 'bg-[#E60000] text-white shadow-lg shadow-[#E60000]/20 font-black' : 'text-white/40 hover:text-white/75'}`}
            >
              <Compass size={14} className="animate-spin-slow" />
              Radar Proximidad
            </button>
          </div>

          {(search || city || selectedCountry !== 'Todos' || category || maxDistance !== 50 || selectedHair !== 'any' || selectedEyes !== 'any' || selectedService !== 'any' || maxAge !== 45) && (
            <Button
              variant="ghost"
              onClick={handleClearFilters}
              className="text-primary-500 hover:text-primary-400 text-xs font-black uppercase tracking-wider shrink-0"
            >
              Limpiar
            </Button>
          )}
        </div>

        {/* Hierarchical Coordinates Center Selector */}
        <div className="space-y-4 p-4 bg-zinc-950/40 border border-white/5 rounded-2xl">
          {/* Level 1: Country/Global Selection */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none border-b border-white/5">
            <span className="text-[9px] font-black uppercase tracking-wider text-white/40 whitespace-nowrap mr-2 flex items-center">
              <MapPin size={10} className="mr-1 text-[#E60000]" /> País / Alcance:
            </span>
            
            {/* Todos option */}
            <button
              type="button"
              onClick={() => {
                setSelectedCountry('Todos');
                setSelectedProvince('');
                setCity('');
              }}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${
                selectedCountry === 'Todos'
                  ? 'bg-[#E60000] border-red-500 text-white shadow-lg shadow-red-600/20'
                  : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              🌍 Todo el Mundo
            </button>

            {/* List all other supported countries dynamically */}
            {Object.entries(WORLD_COUNTRIES).map(([key, country]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelectedCountry(key);
                  setSelectedProvince('');
                  setCity('');
                }}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${
                  selectedCountry === key
                    ? 'bg-[#E60000] border-red-500 text-white shadow-lg shadow-red-600/20'
                    : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {country.flag} {country.name}
              </button>
            ))}
          </div>

          {/* Level 2 & 3: Province & City filters based on Selected Country */}
          <AnimatePresence mode="wait">
            {selectedCountry !== 'Todos' && WORLD_COUNTRIES[selectedCountry] && (
              <motion.div
                key={selectedCountry}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4 pt-1 pl-2 border-l-2 border-[#E60000]/50"
              >
                {/* Level 2: Province dropdown selector */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/50 w-24 shrink-0">
                    Provincias:
                  </span>
                  <div className="flex-1 flex flex-wrap gap-2 items-center">
                    <select
                      value={selectedProvince}
                      onChange={(e) => {
                        setSelectedProvince(e.target.value);
                        setCity(''); // Clear selected city when province changes
                      }}
                      className="bg-black/60 text-xs font-bold text-white border border-white/10 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-primary-500/50 w-full sm:w-64"
                    >
                      <option value="">-- Seleccionar Provincia / Estado --</option>
                      {Object.keys(WORLD_COUNTRIES[selectedCountry].provinces).sort().map((prov) => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                    </select>

                    {/* Quick Access chips for major provinces of selected country */}
                    <div className="flex items-center space-x-1.5 overflow-x-auto py-1 scrollbar-none text-[9px]">
                      {selectedCountry === 'espana' && (
                        <>
                          <span className="text-white/25 uppercase text-[8px] mr-1">Rutas Populares:</span>
                          {['Madrid', 'Barcelona', 'Ibiza', 'Marbella', 'Valencia', 'Sevilla', 'Mallorca'].map((pop) => (
                            <button
                              key={pop}
                              type="button"
                              onClick={() => {
                                setSelectedProvince(pop === 'Ibiza' || pop === 'Mallorca' ? 'Baleares' : pop);
                                setCity(pop);
                              }}
                              className={`px-2 py-1 rounded bg-white/5 border border-white/5 hover:bg-white/10 text-white/80 ${city.toLowerCase() === pop.toLowerCase() ? '!bg-amber-500 !border-amber-600 !text-black font-bold' : ''}`}
                            >
                              {pop}
                            </button>
                          ))}
                        </>
                      )}
                      {selectedCountry === 'ecuador' && (
                        <>
                          <span className="text-white/25 uppercase text-[8px] mr-1">Zonas Populares:</span>
                          {['Pichincha', 'Guayas', 'Azuay', 'Manabí', 'Tungurahua', 'Loja'].map((pop) => (
                            <button
                              key={pop}
                              type="button"
                              onClick={() => {
                                setSelectedProvince(pop);
                                setCity('');
                              }}
                              className={`px-2 py-1 rounded bg-white/5 border border-white/5 hover:bg-white/10 text-white/80 ${selectedProvince === pop ? '!bg-amber-500 !border-amber-600 !text-black font-bold' : ''}`}
                            >
                              {pop}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Level 3: Cities Selection */}
                {selectedProvince && WORLD_COUNTRIES[selectedCountry].provinces[selectedProvince] && (
                  <motion.div
                    key={`${selectedCountry}-${selectedProvince}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-white/5"
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/50 w-24 shrink-0">
                      Ciudades:
                    </span>
                    <div className="flex-1 flex flex-wrap gap-1.5 items-center">
                      {WORLD_COUNTRIES[selectedCountry].provinces[selectedProvince].map((cToken) => {
                        const active = city.toLowerCase() === cToken.toLowerCase();
                        return (
                          <button
                            key={cToken}
                            type="button"
                            onClick={() => setCity(cToken)}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${
                              active
                                ? 'bg-primary-600 border-primary-500 text-white shadow-md shadow-primary-500/10'
                                : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {cToken}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Manual typed city override */}
                <div className="flex items-center space-x-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/50 w-24 shrink-0">
                    Buscador Directo:
                  </span>
                  <div className="flex-1 max-w-sm relative">
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Escribe el nombre de cualquier ciudad..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 pl-8 text-xs text-white placeholder:text-white/20 outline-none focus:ring-1 focus:ring-primary-500/50"
                    />
                    <Search size={12} className="absolute left-2.5 top-2.5 text-white/30" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active filters display */}
          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-white/40 pt-1 border-t border-white/5">
            <span>Filtro de Ubicación Activo:</span>
            <span className="text-primary-400 font-mono">
              {city ? `📍 ${city} (${selectedCountry !== 'Todos' ? WORLD_COUNTRIES[selectedCountry]?.name : 'Búsqueda Global'})` : '🌍 Todo el Mundo (Mostrando Todos los Usuarios)'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[9px] font-black uppercase tracking-wider text-white/40 whitespace-nowrap mr-2 flex items-center">
            <Tag size={10} className="mr-1 text-primary-500" /> Categorías VIP:
          </span>
          {['Escort', 'Masajes', 'Trans', 'Acompañante', 'BDSM', 'Fetish', 'VIP'].map((popCat) => {
            const active = category.toLowerCase() === popCat.toLowerCase();
            return (
              <button
                key={popCat}
                type="button"
                onClick={() => {
                  setCategory(active ? '' : popCat);
                }}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${
                  active
                    ? 'bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-600/20'
                    : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {popCat}
              </button>
            );
          })}
        </div>

        {/* Expandable Advanced Filter Panel (Bento Grid) */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <Card className="glass-card p-6 border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
                {/* Distance GPS Proximity Slider */}
                <div className="space-y-2 p-4 rounded-2xl bg-black/30 border border-white/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white/60">
                    <span>GPS Map Rango</span>
                    <span className="text-primary-400 font-mono font-black">{maxDistance} km</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={120}
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#E60000]"
                  />
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-relaxed">Filtra perfiles por radio de proximidad física</span>
                </div>

                {/* Physical traits selectors */}
                <div className="space-y-3 p-4 rounded-2xl bg-black/30 border border-white/5">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-black uppercase text-white/40 tracking-wider">Cabello</span>
                    <select
                      value={selectedHair}
                      onChange={(e) => setSelectedHair(e.target.value)}
                      className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary-500 text-white"
                    >
                      <option value="any">Todos los Colores</option>
                      <option value="Rubio">Rubio</option>
                      <option value="Castaño">Castaño</option>
                      <option value="Negro">Negro</option>
                      <option value="Pelirrojo">Pelirrojo</option>
                      <option value="Platino">Platino</option>
                      <option value="Gris / Cano">Gris / Cano</option>
                      <option value="Calvo">Calvo</option>
                      <option value="Fantasía">Fantasía</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-black uppercase text-white/40 tracking-wider">Ojos</span>
                    <select
                      value={selectedEyes}
                      onChange={(e) => setSelectedEyes(e.target.value)}
                      className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary-500 text-white"
                    >
                      <option value="any">Cualquier Color</option>
                      <option value="Azul">Azul</option>
                      <option value="Verde">Verde</option>
                      <option value="Miel">Miel</option>
                      <option value="Oscuro">Oscuro</option>
                      <option value="Marrón Claro">Marrón Claro</option>
                      <option value="Gris">Gris</option>
                    </select>
                  </div>
                </div>

                {/* Services & Age Limit */}
                <div className="space-y-3 p-4 rounded-2xl bg-black/30 border border-white/5">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-black uppercase text-white/40 tracking-wider">Especialidad</span>
                    <select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary-500 text-white"
                    >
                      <option value="any">Cualquier Especialidad</option>
                      <option value="Amistad">Amistad</option>
                      <option value="Pasatiempo">Pasatiempo</option>
                      <option value="Conversación">Conversación</option>
                      <option value="Acompañante de Eventos">Acompañante de Eventos</option>
                      <option value="Relación Seria">Relación Seria</option>
                      <option value="Guía de Viajes">Guía de Viajes</option>
                      <option value="Ocio">Ocio</option>
                      <option value="GFe (Novia)">GFe (Novia)</option>
                      <option value="BDSM Premium">BDSM Premium</option>
                      <option value="Masaje Sensual">Masaje Sensual</option>
                      <option value="Cena VIP">Cena VIP</option>
                      <option value="Viajes Exóticos">Viajes Exóticos</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase text-white/40 tracking-wider">
                      <span>Edad máxima</span>
                      <span className="font-mono text-primary-400 font-bold">{maxAge} años</span>
                    </div>
                    <input
                      type="range"
                      min={18}
                      max={55}
                      value={maxAge}
                      onChange={(e) => setMaxAge(Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#E60000]"
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Conditionally Render View Modes */}
      {viewMode === 'radar' ? (
        /* MASTERPIECE: Military GPS Sweep Radar Circle (Item 4) */
        <div className="flex flex-col lg:flex-row items-center justify-center p-8 rounded-3xl bg-[#030303] border border-white/5 shadow-2xl relative overflow-hidden gap-12 select-none">
          {/* Dynamic glowing sweeping Radar Disk */}
          <div className="relative shrink-0 w-full max-w-[420px] aspect-square rounded-full border border-red-600/30 bg-black/90 flex items-center justify-center shadow-3xl overflow-hidden radial-grid">
            
            {/* Concentric rings represent distances */}
            <div className="absolute w-[85%] h-[85%] rounded-full border border-red-500/[0.04] flex items-center justify-center text-[8px] font-black font-mono text-red-500/20 align-top pointer-events-none">
              <span className="absolute top-2">{Math.round(maxDistance * 0.8)} km</span>
            </div>
            <div className="absolute w-[60%] h-[60%] rounded-full border border-red-500/[0.04] flex items-center justify-center text-[8px] font-black font-mono text-red-500/10 pointer-events-none">
              <span className="absolute top-2">{Math.round(maxDistance * 0.6)} km</span>
            </div>
            <div className="absolute w-[35%] h-[35%] rounded-full border border-red-500/[0.04] flex items-center justify-center text-[8px] font-black font-mono text-red-500/10 pointer-events-none">
              <span className="absolute top-2">{Math.round(maxDistance * 0.3)} km</span>
            </div>

            {/* Crosshairs axis lines */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-[1px] bg-red-500/[0.04]" />
              <div className="absolute h-full w-[1px] bg-red-500/[0.04]" />
            </div>

            {/* Golden central caller marker */}
            <div className="absolute w-4 h-4 rounded-full bg-amber-500 border-2 border-black shadow-[0_0_20px_rgba(245,158,11,0.9)] z-30 animate-pulse flex items-center justify-center pointer-events-none">
              <div className="w-1.5 h-1.5 rounded-full bg-black" />
            </div>

            {/* Sweeping radar rotating glowing line */}
            <div 
              className="absolute top-1/2 left-1/2 w-1/2 h-[2px] bg-gradient-to-r from-red-600 to-transparent origin-left pointer-events-none z-10"
              style={{ 
                transform: `translate(-50%, -50%) rotate(${sweepAngle - 90}deg)`,
                boxShadow: '0 0 10px rgba(230, 0, 0, 0.4)'
              }}
            />

            {/* Glowing sweep blur overlay section */}
            <div 
              className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-tr from-transparent via-transparent to-red-500/[0.03]"
              style={{
                transform: `rotate(${sweepAngle - 90}deg)`,
                transformOrigin: '50% 50%'
              }}
            />

            {/* Plot Near models coordinates */}
            {filteredUsers.map((u: any, index: number) => {
              // Convert actual distance to proportional bounds
              const maxRangeKm = maxDistance;
              const ratio = Math.min(1.0, u.distanceKm / maxRangeKm);
              // Radial distance percentage (up to 44% to fit profile image within boundaries)
              const offsetPercentage = ratio * 43; 
              
              // Plot offset based on ID index angle skew
              const angleDeg = (index * (360 / Math.max(1, filteredUsers.length))) % 360;
              const angleRad = (angleDeg * Math.PI) / 180;
              
              const xLeft = 50 + offsetPercentage * Math.cos(angleRad);
              const yTop = 50 + offsetPercentage * Math.sin(angleRad);
              
              const isActiveHovered = radarHoveredUser?.id === u.id;

              return (
                <div
                  key={u.id}
                  className="absolute z-20"
                  style={{
                    left: `${xLeft}%`,
                    top: `${yTop}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  onMouseEnter={() => setRadarHoveredUser(u)}
                >
                  <motion.div
                    whileHover={{ scale: 1.25 }}
                    onClick={() => setRadarHoveredUser(u)}
                    className="relative cursor-pointer group/pulsar"
                  >
                    {/* Ring pulsar waves */}
                    <div className="absolute -inset-2.5 rounded-full bg-red-600/20 border border-red-500/40 animate-ping opacity-75 pointer-events-none" />
                    
                    {/* Avatar circle pointer marker */}
                    <div className={`h-11 w-11 rounded-full border bg-[#050505] p-0.5 overflow-hidden shadow-2xl transition-all duration-300 ${isActiveHovered ? 'ring-2 ring-red-600 scale-115' : 'border-white/10 group-hover/pulsar:border-red-500/50'}`}>
                      {u.avatar_url ? (
                        <OptimizedImage 
                          src={u.avatar_url} 
                          alt="" 
                          className="h-full w-full object-cover rounded-full select-none" 
                          containerClassName="h-full w-full"
                          transform={IMAGE_SIZES.AVATAR_SM}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-white/40 uppercase text-[10px] font-black">
                          {u.full_name?.[0] || 'U'}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* Floating detail bento sidebar info for hovered marker */}
          <div className="flex-1 w-full max-w-sm">
            <AnimatePresence mode="wait">
              {radarHoveredUser ? (
                <motion.div
                  key={radarHoveredUser.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-6 rounded-3xl bg-zinc-900 border border-white/5 space-y-5 shadow-2xl text-white relative group"
                >
                  {/* Closer distance ribbon */}
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-red-600/10 border border-red-500/20 rounded-full px-2.5 py-1 text-[9px] font-black uppercase text-red-400 tracking-wider">
                    <Compass size={10} className="animate-spin-slow" />
                    A {radarHoveredUser.distanceKm} km
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="h-14 w-14 rounded-full border border-white/10 overflow-hidden shrink-0">
                      {radarHoveredUser.avatar_url ? (
                        <OptimizedImage 
                          src={radarHoveredUser.avatar_url} 
                          alt="" 
                          className="h-full w-full object-cover select-none" 
                          containerClassName="h-full w-full"
                          transform={IMAGE_SIZES.AVATAR_MD}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-white/5 text-white/30 text-lg uppercase font-bold">
                          {radarHoveredUser.full_name?.[0] || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-lg font-black uppercase tracking-tight italic text-white truncate">{radarHoveredUser.full_name}</h4>
                        {radarHoveredUser.is_verified && (
                          <BadgeCheck size={16} className="text-primary-400 shrink-0 fill-primary-400/10" />
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{radarHoveredUser.category || 'MODELO'}</p>
                    </div>
                  </div>

                  {/* Physical Specs lists */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5 text-xs">
                    <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Información</span>
                      <p className="font-bold text-white leading-tight mt-0.5">{radarHoveredUser.age} años • {radarHoveredUser.city}</p>
                    </div>

                    <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Aspecto Físico</span>
                      <p className="font-bold text-white leading-tight mt-0.5">Cabello {radarHoveredUser.hair}</p>
                    </div>

                    <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-0.5 col-span-2">
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Menú de Especialidad VIP</span>
                      <p className="font-black text-primary-400 leading-tight block mt-0.5 italic">{radarHoveredUser.service}</p>
                    </div>
                  </div>

                  {/* Social Networks on Radar card */}
                  {radarHoveredUser.metadata && (
                    (() => {
                      const hasRadarSocials = !!(
                        radarHoveredUser.metadata.instagram ||
                        radarHoveredUser.metadata.twitter ||
                        radarHoveredUser.metadata.tiktok ||
                        radarHoveredUser.metadata.onlyfans ||
                        radarHoveredUser.metadata.facebook ||
                        radarHoveredUser.metadata.stripchat ||
                        radarHoveredUser.metadata.kick ||
                        radarHoveredUser.metadata.clapper ||
                        radarHoveredUser.metadata.telegram ||
                        radarHoveredUser.metadata.whatsapp
                      );
                      if (!hasRadarSocials) return null;
                      return (
                        <div className="flex flex-wrap items-center gap-1.5 pt-4 border-t border-white/5 justify-center">
                          {radarHoveredUser.metadata.instagram && (
                            <a
                              href={radarHoveredUser.metadata.instagram.startsWith('http') ? radarHoveredUser.metadata.instagram : `https://instagram.com/${radarHoveredUser.metadata.instagram.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              referrerPolicy="no-referrer"
                              className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-950 border border-white/5 hover:border-pink-600/50 shadow transition-all duration-300"
                              title="Instagram"
                            >
                              <img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" alt="Instagram" className="w-4 h-4" />
                            </a>
                          )}
                          {radarHoveredUser.metadata.twitter && (
                            <a
                              href={radarHoveredUser.metadata.twitter.startsWith('http') ? radarHoveredUser.metadata.twitter : `https://x.com/${radarHoveredUser.metadata.twitter.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              referrerPolicy="no-referrer"
                              className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-950 border border-white/5 hover:border-white/50 shadow transition-all duration-300"
                              title="X"
                            >
                              <img src="https://upload.wikimedia.org/wikipedia/commons/5/57/X_logo_2023_original.svg" alt="X / Twitter" className="w-3.5 h-3.5 invert" />
                            </a>
                          )}
                          {radarHoveredUser.metadata.tiktok && (
                            <a
                              href={radarHoveredUser.metadata.tiktok.startsWith('http') ? radarHoveredUser.metadata.tiktok : `https://tiktok.com/@${radarHoveredUser.metadata.tiktok.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              referrerPolicy="no-referrer"
                              className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-950 border border-white/5 hover:border-teal-400/50 shadow transition-all duration-300"
                              title="TikTok"
                            >
                              <img src="https://upload.wikimedia.org/wikipedia/commons/3/34/Ionicons_logo-tiktok.svg" alt="TikTok" className="w-4 h-4 invert" />
                            </a>
                          )}
                          {radarHoveredUser.metadata.onlyfans && (
                            <a
                              href={radarHoveredUser.metadata.onlyfans.startsWith('http') ? radarHoveredUser.metadata.onlyfans : `https://onlyfans.com/${radarHoveredUser.metadata.onlyfans}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              referrerPolicy="no-referrer"
                              className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-950 border border-white/5 hover:border-sky-400/50 shadow transition-all duration-300"
                              title="OnlyFans"
                            >
                              <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Onlyfans_logo.svg" alt="OnlyFans" className="w-4 h-4" />
                            </a>
                          )}
                          {radarHoveredUser.metadata.facebook && (
                            <a
                              href={radarHoveredUser.metadata.facebook.startsWith('http') ? radarHoveredUser.metadata.facebook : `https://facebook.com/${radarHoveredUser.metadata.facebook}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              referrerPolicy="no-referrer"
                              className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-950 border border-white/5 hover:border-blue-600/50 shadow transition-all duration-300"
                              title="Facebook"
                            >
                              <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt="Facebook" className="w-4 h-4" />
                            </a>
                          )}
                          {radarHoveredUser.metadata.stripchat && (
                            <a
                              href={radarHoveredUser.metadata.stripchat.startsWith('http') ? radarHoveredUser.metadata.stripchat : `https://stripchat.com/${radarHoveredUser.metadata.stripchat}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              referrerPolicy="no-referrer"
                              className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-950 border border-white/5 hover:border-red-500/50 shadow transition-all duration-300"
                              title="Stripchat"
                            >
                              <img src="https://stripchat.com/favicon.ico" alt="Stripchat" className="w-4 h-4 rounded-sm" />
                            </a>
                          )}
                          {radarHoveredUser.metadata.kick && (
                            <a
                              href={radarHoveredUser.metadata.kick.startsWith('http') ? radarHoveredUser.metadata.kick : `https://kick.com/${radarHoveredUser.metadata.kick}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              referrerPolicy="no-referrer"
                              className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-950 border border-white/5 hover:border-green-500/50 shadow transition-all duration-300"
                              title="Kick"
                            >
                              <img src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Kick_logo.svg" alt="Kick" className="w-4 h-4" />
                            </a>
                          )}
                          {radarHoveredUser.metadata.clapper && (
                            <a
                              href={radarHoveredUser.metadata.clapper.startsWith('http') ? radarHoveredUser.metadata.clapper : `https://clapperapp.com/${radarHoveredUser.metadata.clapper}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              referrerPolicy="no-referrer"
                              className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-950 border border-white/5 hover:border-amber-500/50 shadow transition-all duration-300"
                              title="Clapper"
                            >
                              <img src="https://clapperapp.com/favicon.ico" alt="Clapper" className="w-4 h-4 rounded-sm" />
                            </a>
                          )}
                          {radarHoveredUser.metadata.telegram && (
                            <a
                              href={radarHoveredUser.metadata.telegram.startsWith('http') ? radarHoveredUser.metadata.telegram : `https://t.me/${radarHoveredUser.metadata.telegram.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              referrerPolicy="no-referrer"
                              className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-950 border border-white/5 hover:border-blue-400/50 shadow transition-all duration-300"
                              title="Telegram"
                            >
                              <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" alt="Telegram" className="w-4 h-4" />
                            </a>
                          )}
                          {radarHoveredUser.metadata.whatsapp && (
                            <a
                              href={radarHoveredUser.metadata.whatsapp.startsWith('http') ? radarHoveredUser.metadata.whatsapp : (radarHoveredUser.metadata.whatsapp.match(/^\d+$/) ? `https://wa.me/${radarHoveredUser.metadata.whatsapp}` : `https://wa.me/${radarHoveredUser.metadata.whatsapp.replace(/\D/g, '')}`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              referrerPolicy="no-referrer"
                              className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-950 border border-white/5 hover:border-green-500/50 shadow transition-all duration-300"
                              title="WhatsApp"
                            >
                              <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      );
                    })()
                  )}

                  <div className="flex gap-2 pt-2">
                    <Link
                      to={`/profile/${radarHoveredUser.id}`}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#E60000] hover:bg-red-700 text-white text-[10px] uppercase font-black tracking-widest py-3 px-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
                    >
                      <UserIcon size={12} />
                      Examinar Perfil
                    </Link>
                    <Link
                      to={`/messages?to=${radarHoveredUser.id}`}
                      className="px-4 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 hover:text-white transition-all"
                      title="Abrir Chat Privado"
                    >
                      <Grid size={14} />
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <div className="p-8 text-center text-white/30 uppercase font-black tracking-widest text-[10px] bg-white/5 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center h-[230px]">
                  <Compass size={32} className="text-white/10 mb-3 animate-pulse" />
                  <span>Posiciona el cursor sobre un avatar para sintonizar su ubicación GPS en el Radar</span>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        /* STANDARD LIST VIEW WITH BADGES (includes computed distances and physical traits) */
        filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <Search size={40} className="text-white/20" />
            </div>
            <h3 className="text-2xl font-black text-white italic uppercase mb-2">No se encontraron resultados</h3>
            <p className="text-white/40 max-w-xs">Prueba ampliando el rango GPS o removiendo rasgos físicos específicos.</p>
          </div>
        ) : (
          <VirtuosoGrid
            useWindowScroll
            data={filteredUsers}
            listClassName="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            itemContent={(index, user) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (index % 6) * 0.05 }}
              >
                <Card className="group relative overflow-hidden p-6 transition-all duration-500 hover:shadow-2xl glass-card border-none h-full hover:border-[#E60000]/30 hover:scale-[1.02]">
                  {/* Distance Proximity computed badge */}
                  <div className="absolute top-4 left-4 z-10 flex gap-1.5">
                    <span className="bg-black/70 backdrop-blur-md px-2 py-1 rounded text-[8px] font-black text-white uppercase tracking-widest border border-white/10 shadow-lg">
                      📍 {user.city || 'Madrid'}
                    </span>
                    <span className="bg-[#E60000]/90 backdrop-blur-md px-2 py-1 rounded text-[8px] font-black text-white uppercase tracking-widest border border-red-500/20 shadow-lg">
                      ⚡ A {user.distanceKm} km
                    </span>
                  </div>

                  <div className="flex items-start space-x-4 pt-4">
                    <Link to={`/profile/${user.id}`} className="relative group/avatar shrink-0">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-white/20 ring-2 ring-white/10 transition-all duration-500 group-hover/avatar:ring-red-600/50 group-hover/avatar:scale-110 overflow-hidden shadow-xl">
                        {user.avatar_url ? (
                          <OptimizedImage 
                            src={user.avatar_url} 
                            alt={user.full_name} 
                            className="h-full w-full rounded-2xl object-cover"
                            containerClassName="h-full w-full"
                          />
                        ) : (
                          <UserIcon size={28} />
                        )}
                      </div>
                      {user.is_verified && (
                        <div className="absolute -bottom-1 -right-1 rounded-full bg-primary-600 p-1 shadow-[0_0_15px_rgba(230,0,0,0.5)] border-2 border-[#0A0A0A]">
                          <BadgeCheck size={14} className="text-white" />
                        </div>
                      )}
                    </Link>
                    
                    <div className="flex-1 min-w-0 pt-1">
                      <Link to={`/profile/${user.id}`}>
                        <h3 className="truncate text-lg font-black text-white hover:text-primary-400 transition-colors tracking-tight italic uppercase">
                          {user.full_name || 'Miembro de la Red'}
                        </h3>
                      </Link>
                      <div className="flex flex-col space-y-1 mt-1 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                        {user.category && (
                          <div className="font-black text-primary-500">
                            {user.category}
                          </div>
                        )}
                        <div className="text-white/40 font-mono text-[9px] lowercase tracking-wide truncate">
                          @{user.username || 'usuario'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detalle de rasgos y servicios en la tarjeta */}
                  <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-white/5 text-[10px] font-bold uppercase tracking-wider text-white/50">
                    <div className="bg-black/15 py-1.5 px-2.5 rounded-lg border border-white/[0.02]">
                      <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block">Rasgos Físicos</span>
                      <p className="text-white mt-0.5 leading-none">{user.age} años • {user.hair}</p>
                    </div>
                    <div className="bg-black/15 py-1.5 px-2.5 rounded-lg border border-white/[0.02]">
                      <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block">Especialidad</span>
                      <p className="text-primary-400 mt-0.5 leading-none italic truncate">{user.service}</p>
                    </div>
                  </div>

                  {/* Social Networks on Directory Card */}
                  {user.metadata && (
                    (() => {
                      const hasCardSocials = !!(
                        user.metadata.instagram ||
                        user.metadata.twitter ||
                        user.metadata.tiktok ||
                        user.metadata.onlyfans ||
                        user.metadata.facebook ||
                        user.metadata.stripchat ||
                        user.metadata.kick ||
                        user.metadata.clapper ||
                        user.metadata.telegram ||
                        user.metadata.whatsapp
                      );
                      if (!hasCardSocials) return null;
                      return (
                        <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-3 border-t border-white/5 justify-center">
                          {user.metadata.instagram && (
                            <a
                              href={user.metadata.instagram.startsWith('http') ? user.metadata.instagram : `https://instagram.com/${user.metadata.instagram.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              referrerPolicy="no-referrer"
                              className="flex items-center justify-center w-6.5 h-6.5 rounded bg-zinc-950 border border-white/5 hover:border-pink-600/50 shadow transition-all duration-300"
                              title="Instagram"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" alt="Instagram" className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {user.metadata.twitter && (
                            <a
                              href={user.metadata.twitter.startsWith('http') ? user.metadata.twitter : `https://x.com/${user.metadata.twitter.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              referrerPolicy="no-referrer"
                              className="flex items-center justify-center w-6.5 h-6.5 rounded bg-zinc-950 border border-white/5 hover:border-white/50 shadow transition-all duration-300"
                              title="X"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <img src="https://upload.wikimedia.org/wikipedia/commons/5/57/X_logo_2023_original.svg" alt="X / Twitter" className="w-3 h-3 invert" />
                            </a>
                          )}
                          {user.metadata.tiktok && (
                            <a
                              href={user.metadata.tiktok.startsWith('http') ? user.metadata.tiktok : `https://tiktok.com/@${user.metadata.tiktok.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              referrerPolicy="no-referrer"
                              className="flex items-center justify-center w-6.5 h-6.5 rounded bg-zinc-950 border border-white/5 hover:border-teal-400/50 shadow transition-all duration-300"
                              title="TikTok"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <img src="https://upload.wikimedia.org/wikipedia/commons/3/34/Ionicons_logo-tiktok.svg" alt="TikTok" className="w-3.5 h-3.5 invert" />
                            </a>
                          )}
                          {user.metadata.onlyfans && (
                            <a
                              href={user.metadata.onlyfans.startsWith('http') ? user.metadata.onlyfans : `https://onlyfans.com/${user.metadata.onlyfans}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              referrerPolicy="no-referrer"
                              className="flex items-center justify-center w-6.5 h-6.5 rounded bg-zinc-950 border border-white/5 hover:border-sky-400/50 shadow transition-all duration-300"
                              title="OnlyFans"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Onlyfans_logo.svg" alt="OnlyFans" className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {user.metadata.facebook && (
                            <a
                              href={user.metadata.facebook.startsWith('http') ? user.metadata.facebook : `https://facebook.com/${user.metadata.facebook}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              referrerPolicy="no-referrer"
                              className="flex items-center justify-center w-6.5 h-6.5 rounded bg-zinc-950 border border-white/5 hover:border-blue-600/50 shadow transition-all duration-300"
                              title="Facebook"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt="Facebook" className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {user.metadata.stripchat && (
                            <a
                              href={user.metadata.stripchat.startsWith('http') ? user.metadata.stripchat : `https://stripchat.com/${user.metadata.stripchat}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              referrerPolicy="no-referrer"
                              className="flex items-center justify-center w-6.5 h-6.5 rounded bg-zinc-950 border border-white/5 hover:border-red-500/50 shadow transition-all duration-300"
                              title="Stripchat"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <img src="https://stripchat.com/favicon.ico" alt="Stripchat" className="w-3.5 h-3.5 rounded-sm" />
                            </a>
                          )}
                          {user.metadata.kick && (
                            <a
                              href={user.metadata.kick.startsWith('http') ? user.metadata.kick : `https://kick.com/${user.metadata.kick}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              referrerPolicy="no-referrer"
                              className="flex items-center justify-center w-6.5 h-6.5 rounded bg-zinc-950 border border-white/5 hover:border-green-500/50 shadow transition-all duration-300"
                              title="Kick"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <img src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Kick_logo.svg" alt="Kick" className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {user.metadata.clapper && (
                            <a
                              href={user.metadata.clapper.startsWith('http') ? user.metadata.clapper : `https://clapperapp.com/${user.metadata.clapper}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              referrerPolicy="no-referrer"
                              className="flex items-center justify-center w-6.5 h-6.5 rounded bg-zinc-950 border border-white/5 hover:border-amber-500/50 shadow transition-all duration-300"
                              title="Clapper"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <img src="https://clapperapp.com/favicon.ico" alt="Clapper" className="w-3.5 h-3.5 rounded-sm" />
                            </a>
                          )}
                          {user.metadata.telegram && (
                            <a
                              href={user.metadata.telegram.startsWith('http') ? user.metadata.telegram : `https://t.me/${user.metadata.telegram.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              referrerPolicy="no-referrer"
                              className="flex items-center justify-center w-6.5 h-6.5 rounded bg-zinc-950 border border-white/5 hover:border-blue-400/50 shadow transition-all duration-300"
                              title="Telegram"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" alt="Telegram" className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {user.metadata.whatsapp && (
                            <a
                              href={user.metadata.whatsapp.startsWith('http') ? user.metadata.whatsapp : (user.metadata.whatsapp.match(/^\d+$/) ? `https://wa.me/${user.metadata.whatsapp}` : `https://wa.me/${user.metadata.whatsapp.replace(/\D/g, '')}`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              referrerPolicy="no-referrer"
                              className="flex items-center justify-center w-6.5 h-6.5 rounded bg-zinc-950 border border-white/5 hover:border-green-500/50 shadow transition-all duration-300"
                              title="WhatsApp"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      );
                    })()
                  )}
                  
                  {user.role === 'super_admin' && (
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center rounded-full bg-primary-600/10 px-3 py-1 text-[8px] font-black text-primary-400 border border-primary-600/30 uppercase tracking-[0.1em] italic">
                        Admin
                      </span>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}
          />
        )
      )}
    </div>
  );
}
