import { Heart, UserPlus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/hooks/useAuth';

interface StatsModalProps {
  type: 'followers' | 'following' | 'likes';
  userId?: string;
  onClose?: () => void;
}

export default function StatsModal({ type, userId, onClose }: StatsModalProps) {
  const { profile: currentProfile } = useAuth();
  const targetId = userId || currentProfile?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['modal-data', type, targetId],
    queryFn: async () => {
      if (!targetId) return [];

      if (type === 'followers') {
        const { data } = await supabase
          .from('follows')
          .select('follower_id, profiles!follows_follower_id_fkey(*)')
          .eq('following_id', targetId)
          .eq('status', 'accepted');
        return data?.map(d => d.profiles) || [];
      }

      if (type === 'following') {
        const { data } = await supabase
          .from('follows')
          .select('following_id, profiles!follows_following_id_fkey(*)')
          .eq('follower_id', targetId)
          .eq('status', 'accepted');
        return data?.map(d => d.profiles) || [];
      }

      if (type === 'likes') {
        const { data: mediaIds } = await supabase
          .from('media')
          .select('id')
          .eq('user_id', targetId);
        
        if (!mediaIds?.length) return [];

        const { data } = await supabase
          .from('likes')
          .select('id, user_id, profiles(*)')
          .in('media_id', mediaIds.map(m => m.id));
        
        return data || [];
      }

      return [];
    },
    enabled: !!targetId
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="h-8 w-8 border-2 border-passion-red border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-white/20 uppercase tracking-widest">Cargando...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-white/40">
        <p className="text-sm font-bold uppercase tracking-widest">No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((item: any) => {
        const user = type === 'likes' ? item.profiles : item;
        if (!user) return null;
        
        return (
          <Link
            key={item.id || user.id}
            to={`/profile/${user.id}`}
            onClick={onClose}
            className="flex items-center space-x-4 p-3 rounded-2xl hover:bg-white/5 transition-colors group"
          >
            <div className="h-12 w-12 rounded-xl bg-zinc-800 border border-white/10 overflow-hidden shrink-0">
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={user.full_name} 
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-passion-red/10 text-passion-red font-bold">
                  {user.full_name?.[0] || 'U'}
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-white group-hover:text-passion-red transition-colors truncate">
                {user.full_name}
              </span>
              <span className="text-xs text-white/40 truncate">
                @{user.username}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
