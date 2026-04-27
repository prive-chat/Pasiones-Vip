import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/src/services/profileService';
import { Card } from '@/src/components/ui/Card';
import { BadgeCheck, Calendar, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { VirtuosoGrid } from 'react-virtuoso';
import { OptimizedImage } from '@/src/components/ui/OptimizedImage';
import { ProfileSkeleton } from '@/src/components/Skeletons';

export default function UserDirectory() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: profileService.fetchAllProfiles,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <ProfileSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-[600px]">
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
                  <div className="mt-2 flex items-center text-[10px] uppercase tracking-[0.2em] font-black text-white/30">
                    <Calendar size={12} className="mr-2 text-primary-600" />
                    Desde {new Date(user.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
              
              {user.role === 'super_admin' && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center rounded-full bg-primary-600/10 px-3 py-1 text-[9px] font-black text-primary-400 border border-primary-600/30 uppercase tracking-[0.1em] italic">
                    Admin
                  </span>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      />
    </div>
  );
}
