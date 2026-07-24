import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, MessageSquare, Trash2, CheckCircle2, Loader2, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../hooks/useAuth';
import { commentService, CommentItem } from '../services/commentService';
import { OptimizedImage } from './ui/OptimizedImage';
import { IMAGE_SIZES } from '../lib/images';
import { useNotificationStore } from '../store/notificationStore';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaId: string;
  postOwnerId?: string;
  onCommentCountChange?: (newCount: number) => void;
}

const QUICK_EMOJIS = ['❤️', '🔥', '😍', '👏', '🙌', '💯', '✨'];

export const CommentsModal = ({
  isOpen,
  onClose,
  mediaId,
  postOwnerId,
  onCommentCountChange
}: CommentsModalProps) => {
  const { user, profile } = useAuth();
  const { addToast } = useNotificationStore();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const onCommentCountChangeRef = useRef(onCommentCountChange);
  useEffect(() => {
    onCommentCountChangeRef.current = onCommentCountChange;
  }, [onCommentCountChange]);

  useEffect(() => {
    if (!loading && onCommentCountChangeRef.current) {
      onCommentCountChangeRef.current(comments.length);
    }
  }, [comments.length, loading]);

  useEffect(() => {
    if (isOpen && mediaId) {
      loadComments();

      // Realtime Supabase subscription
      const unsubscribe = commentService.subscribeToComments(mediaId, ({ eventType, comment }) => {
        if (eventType === 'INSERT' && comment && comment.id) {
          setComments(prev => {
            if (prev.some(c => c.id === comment.id)) return prev;
            return [...prev, comment as CommentItem];
          });
        } else if (eventType === 'DELETE' && comment && comment.id) {
          setComments(prev => {
            return prev.filter(c => c.id !== comment.id);
          });
        }
      });

      // Window custom events for instant local multi-component sync
      const handleCustomAdd = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail && detail.mediaId === mediaId && detail.comment) {
          setComments(prev => {
            if (prev.some(c => c.id === detail.comment.id)) return prev;
            return [...prev, detail.comment];
          });
        }
      };

      const handleCustomDelete = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail && detail.mediaId === mediaId && detail.commentId) {
          setComments(prev => {
            return prev.filter(c => c.id !== detail.commentId);
          });
        }
      };

      window.addEventListener('pasiones_comment_added', handleCustomAdd);
      window.addEventListener('pasiones_comment_deleted', handleCustomDelete);

      return () => {
        unsubscribe();
        window.removeEventListener('pasiones_comment_added', handleCustomAdd);
        window.removeEventListener('pasiones_comment_deleted', handleCustomDelete);
      };
    }
  }, [isOpen, mediaId, user?.id]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await commentService.fetchComments(mediaId, user?.id);
      setComments(data);
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLikeComment = async (commentId: string, currentIsLiked?: boolean) => {
    if (!user) {
      addToast({
        type: 'error',
        message: 'Inicia sesión',
        description: 'Debes iniciar sesión para dar me gusta a los comentarios.'
      });
      return;
    }

    // Optimistic UI update
    setComments(prev =>
      prev.map(c => {
        if (c.id === commentId) {
          const isLiked = !c.is_liked;
          const likesCount = Math.max(0, (c.likes_count || 0) + (isLiked ? 1 : -1));
          return { ...c, is_liked: isLiked, likes_count: likesCount };
        }
        return c;
      })
    );

    try {
      await commentService.toggleCommentLike(commentId, user.id, !!currentIsLiked);
    } catch (err) {
      console.error('Error toggling comment like:', err);
    }
  };

  const handleAddComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newComment.trim() || submitting) return;

    if (!user) {
      addToast({
        type: 'error',
        message: 'Inicia sesión',
        description: 'Debes estar autenticado para comentar.'
      });
      return;
    }

    setSubmitting(true);
    const contentText = newComment.trim();
    setNewComment('');

    try {
      const created = await commentService.addComment(
        mediaId,
        user.id,
        contentText,
        profile || undefined
      );

      setComments(prev => [...prev, created]);

      addToast({
        type: 'success',
        message: 'Comentario publicado',
        description: 'Tu comentario ha sido añadido.'
      });

      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Error adding comment:', err);
      addToast({
        type: 'error',
        message: 'Error al comentar',
        description: 'No se pudo enviar tu comentario.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletingId(commentId);
    try {
      await commentService.deleteComment(commentId, mediaId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      addToast({
        type: 'info',
        message: 'Comentario eliminado',
        description: 'El comentario ha sido removido.'
      });
    } catch (err) {
      console.error('Error deleting comment:', err);
      addToast({
        type: 'error',
        message: 'Error',
        description: 'No se pudo eliminar el comentario.'
      });
    } finally {
      setDeletingId(null);
    }
  };

  const addEmoji = (emoji: string) => {
    setNewComment(prev => prev + emoji);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
          {/* Backdrop Click */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full sm:max-w-lg bg-[#0F0F0F] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh] sm:h-[600px] z-10"
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-primary-600/10 text-primary-400">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-tight uppercase italic flex items-center gap-2">
                    Comentarios
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary-600/20 text-primary-400 font-bold not-italic">
                      {comments.length}
                    </span>
                  </h3>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Comments Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full py-12 space-y-3">
                  <Loader2 size={32} className="animate-spin text-primary-500" />
                  <p className="text-xs text-white/40 font-medium">Cargando comentarios...</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center space-y-3">
                  <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center text-white/20 border border-white/5">
                    <MessageSquare size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white/80">Aún no hay comentarios</p>
                    <p className="text-xs text-white/40 mt-1">Sé el primero en compartir tu opinión sobre esta publicación.</p>
                  </div>
                </div>
              ) : (
                comments.map((comment) => {
                  const isCommentOwner = user?.id === comment.user_id;
                  const isPostOwner = user?.id === postOwnerId;
                  const canDelete = isCommentOwner || isPostOwner;

                  return (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex space-x-3 group/comment bg-white/[0.02] hover:bg-white/[0.04] p-3 rounded-2xl border border-white/5 transition-all"
                    >
                      <div className="h-9 w-9 rounded-full bg-primary-600/10 flex items-center justify-center text-primary-400 font-bold text-xs overflow-hidden shrink-0 ring-1 ring-white/10">
                        {comment.profiles?.avatar_url ? (
                          <OptimizedImage
                            src={comment.profiles.avatar_url}
                            alt=""
                            className="h-full w-full object-cover"
                            transform={IMAGE_SIZES.AVATAR_SM}
                          />
                        ) : (
                          comment.profiles?.full_name?.[0] || 'U'
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-1.5 min-w-0">
                            <span className="text-xs font-black text-white truncate">
                              {comment.profiles?.full_name || 'Usuario de la Red'}
                            </span>
                            {comment.profiles?.is_verified && (
                              <CheckCircle2 size={12} className="text-primary-400 shrink-0" />
                            )}
                            <span className="text-[10px] text-white/40 shrink-0">
                              • {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: es })}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1">
                            {/* Comment Like Button */}
                            <button
                              onClick={() => handleToggleLikeComment(comment.id, comment.is_liked)}
                              className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                comment.is_liked
                                  ? 'bg-red-500/10 text-red-400'
                                  : 'text-white/40 hover:text-white hover:bg-white/5'
                              }`}
                              title={comment.is_liked ? 'Ya no me gusta' : 'Me gusta'}
                            >
                              <Heart
                                size={12}
                                className={comment.is_liked ? 'fill-red-500 text-red-500' : ''}
                              />
                              {comment.likes_count ? (
                                <span>{comment.likes_count}</span>
                              ) : null}
                            </button>

                            {/* Comment Delete Button */}
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                disabled={deletingId === comment.id}
                                className="text-white/40 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition-colors opacity-100 sm:opacity-40 sm:group-hover/comment:opacity-100"
                                title="Eliminar comentario"
                              >
                                {deletingId === comment.id ? (
                                  <Loader2 size={13} className="animate-spin text-red-400" />
                                ) : (
                                  <Trash2 size={13} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-white/85 mt-1 leading-relaxed whitespace-pre-line font-medium break-words">
                          {comment.content}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={commentsEndRef} />
            </div>

            {/* Quick Emojis Bar */}
            <div className="px-4 py-2 border-t border-white/5 bg-black/20 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-white/30 font-bold uppercase shrink-0">Rápido:</span>
              {QUICK_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => addEmoji(emoji)}
                  className="px-2 py-1 bg-white/5 hover:bg-white/15 rounded-lg text-sm transition-all hover:scale-110 active:scale-95 shrink-0"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Footer Form */}
            <form onSubmit={handleAddComment} className="p-3 md:p-4 border-t border-white/10 bg-black/60 backdrop-blur-md">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 font-bold text-xs shrink-0 overflow-hidden">
                  {profile?.avatar_url ? (
                    <OptimizedImage
                      src={profile.avatar_url}
                      alt=""
                      className="h-full w-full object-cover"
                      transform={IMAGE_SIZES.AVATAR_SM}
                    />
                  ) : (
                    profile?.full_name?.[0] || 'Yo'
                  )}
                </div>

                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={user ? "Escribe un comentario..." : "Inicia sesión para comentar"}
                  disabled={!user || submitting}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-primary-500/50 transition-colors"
                />

                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting || !user}
                  className="p-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:hover:bg-primary-600 text-white transition-all duration-200 shrink-0 shadow-lg shadow-primary-600/20"
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
