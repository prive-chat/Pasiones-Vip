import { useQuery } from '@tanstack/react-query';
import { mediaService } from '@/src/services/mediaService';
import { useAuth } from '@/src/hooks/useAuth';
import { Heart, TrendingUp, Search, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { profileService } from '@/src/services/profileService';
import { UserProfile } from '@/src/types';
import { Input } from '@/src/components/ui/Input';

export function TrendingSidebar() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: trending = [] } = useQuery({
    queryKey: ['trending', user?.id],
    queryFn: () => mediaService.fetchTrendingMedia(user?.id, 5),
    enabled: !!user,
  });

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      setIsSearching(true);
      try {
        const results = await profileService.searchProfiles(query);
        setSearchResults(results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar - Integrated in sidebar for desktop centering */}
      <div className="relative z-50">
        <Input
          placeholder="Buscar usuarios..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          variant="glass"
          leftElement={<Search size={18} />}
          rightElement={isSearching ? <Loader2 size={18} className="animate-spin" /> : null}
        />
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
            >
              {searchResults.map((profile) => (
                <Link
                  key={profile.id}
                  to={`/profile/${profile.id}`}
                  onClick={() => setSearchQuery('')}
                  className="flex items-center space-x-3 p-3 hover:bg-white/5 transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 font-bold overflow-hidden ring-1 ring-white/10">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      profile.full_name?.[0] || 'U'
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{profile.full_name}</p>
                    <p className="text-xs text-white/40">@{profile.username}</p>
                  </div>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center space-x-2 mb-6">
          <TrendingUp size={20} className="text-primary-400" />
          <h3 className="text-lg font-bold text-white">Tendencias</h3>
        </div>
        <div className="space-y-4">
          {trending.map((item) => (
            <Link 
              key={item.id} 
              to={`/post/${item.id}`}
              className="flex items-center space-x-3 group"
            >
              <div className="h-12 w-12 rounded-lg overflow-hidden bg-white/5 shrink-0">
                {item.type === 'video' ? (
                  <video src={item.url} className="h-full w-full object-cover" />
                ) : (
                  <img src={item.url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 truncate group-hover:text-primary-400 transition-colors">
                  {item.caption || 'Publicación sin título'}
                </p>
                <div className="flex items-center space-x-2 text-[10px] text-white/40 font-bold">
                  <Heart size={10} className="fill-primary-600 text-primary-600" />
                  <span>{item.likes_count} likes</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TrendingSidebar;
