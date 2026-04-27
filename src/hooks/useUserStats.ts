import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { profileService } from '@/src/services/profileService';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function useUserStats(userId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['user-stats', userId];

  const { data: stats, isLoading } = useQuery({
    queryKey,
    queryFn: () => (userId ? profileService.fetchUserStats(userId) : null),
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId) return;

    // Subscribe to follows changes
    const followsChannel = supabase
      .channel(`follows-stats-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follows',
          filter: `following_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follows',
          filter: `follower_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    // Subscribe to media changes (if a post is deleted, stats change)
    const mediaChannel = supabase
      .channel(`media-stats-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'media',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    // Subscribe to likes changes
    // Since we can't filter by media.user_id here, we listen to all and invalidate
    // We use a single channel for efficiency
    const likesChannel = supabase
      .channel(`likes-stats-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(followsChannel);
      supabase.removeChannel(mediaChannel);
      supabase.removeChannel(likesChannel);
    };
  }, [userId, queryClient, queryKey]);

  return { stats, isLoading };
}
