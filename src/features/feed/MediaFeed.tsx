import { useState, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaService } from '../../services/mediaService';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { MediaViewer } from '../../components/ui/MediaViewer';
import { supabase } from '../../lib/supabase';
import { Virtuoso } from 'react-virtuoso';

import MediaCard from '../../components/MediaCard';
import { MediaSkeleton } from '../../components/Skeletons';

export default function MediaFeed() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewerMedia, setViewerMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const { user } = useAuth();

  const queryKey = ['media', user?.id];

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 0 }) => mediaService.fetchMedia(user?.id, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length : undefined;
    },
    enabled: !!user,
  });

  const items = data?.pages.flat() || [];

  const deleteMutation = useMutation({
    mutationFn: mediaService.deleteMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats', user?.id] });
      setDeleteId(null);
    },
  });

  useEffect(() => {
    const subscription = supabase
      .channel('media_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'media' }, () => {
        queryClient.invalidateQueries({ queryKey: ['media'] });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  if (isLoading) {
    return <MediaSkeleton />;
  }

  return (
    <div className="flex-1 min-h-[600px]">
      <Virtuoso
        useWindowScroll
        data={items}
        endReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        itemContent={(index, item) => (
          <div className="pb-8">
            <MediaCard
              key={item.id}
              item={item}
              index={index}
              queryKey={queryKey}
              onView={(url, type) => setViewerMedia({ url, type })}
              onDelete={(id) => setDeleteId(id)}
            />
          </div>
        )}
        components={{
          Footer: () => (
            <div className="h-20 flex items-center justify-center">
              {isFetchingNextPage && <Loader2 className="h-6 w-6 animate-spin text-primary-600" />}
            </div>
          )
        }}
      />

      <ConfirmModal
        isOpen={!!deleteId}
        title="¿Eliminar publicación?"
        message="Esta acción no se puede deshacer. La publicación se eliminará permanentemente de la red."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      <MediaViewer
        isOpen={!!viewerMedia}
        url={viewerMedia?.url || null}
        type={viewerMedia?.type || null}
        onClose={() => setViewerMedia(null)}
      />
    </div>
  );
}
