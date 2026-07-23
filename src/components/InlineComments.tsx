import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MessageSquare, Trash2, CheckCircle2, Loader2, Sparkles, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../hooks/useAuth';
import { commentService, CommentItem } from '../services/commentService';
import { OptimizedImage } from './ui/OptimizedImage';
import { IMAGE_SIZES } from '../lib/images';
import { useNotificationStore } from '../store/notificationStore';

interface InlineCommentsProps {
  mediaId: string;
  postOwnerId?: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentCountChange?: (newCount: number) => void;
}

const QUICK_EMOJIS = ['❤️', '🔥', '😍', '👏', '🙌', '💯', '✨'];

export const InlineComments = ({
  mediaId,
  postOwnerId,
  isOpen,
  onClose,
  onCommentCountChange
}: InlineCommentsProps) => {
  const { user, profile } = useAuth();
  const { addToast } = useNotificationStore();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && mediaId) {
      loadComments();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);

      // Realtime Supabase subscription
      const unsubscribe = commentService.subscribeToComments(mediaId, ({ eventType, comment }) => {
        if (eventType === 'INSERT' && comment && comment.id) {
          setComments(prev => {
            if (prev.some(c => c.id === comment.id)) return prev;
            const updated = [...prev, comment as CommentItem];
            if (onCommentCountChange) onCommentCountChange(updated.length);
            return updated;
          });
        } else if (eventType === 'DELETE' && comment && comment.id) {
          setComments(prev => {
            const updated = prev.filter(c => c.id !== comment.id);
            if (onCommentCountChange) onCommentCountChange(updated.length);
            return updated;
          });
        }
      });

      // Window custom events for instant local multi-component sync
      const handleCustomAdd = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail && detail.mediaId === mediaId && detail.comment) {
          setComments(prev => {
            if (prev.some(c => c.id === detail.comment.id)) return prev;
            const updated = [...prev, detail.comment];
            if (onCommentCountChange) onCommentCountChange(updated.length);
            return updated;
          });
        }
      };

      const handleCustomDelete = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail && detail.mediaId === mediaId && detail.commentId) {
          setComments(prev => {
            const updated = prev.filter(c => c.id !== detail.commentId);
            if (onCommentCountChange) onCommentCountChange(updated.length);
            return updated;
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
  }, [isOpen, mediaId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await commentService.fetchComments(mediaId);
      setComments(data);
      if (onCommentCountChange) {
        onCommentCountChange(data.length);
      }
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
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

      setComments(prev => {
        const next = [...prev, created];
        if (onCommentCountChange) {
          onCommentCountChange(next.length);
        }
        return next;
      });

      addToast({
        type: 'success',
        message: 'Comentario publicado',
        description: 'Tu comentario ha sido añadido.'
      });
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
      setComments(prev => {
        const next = prev.filter(c => c.id !== commentId);
        if (onCommentCountChange) {
          onCommentCountChange(next.length);
        }
        return next;
      });
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
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden border-t border-white/10 bg-black/40 backdrop-blur-md rounded-b-2xl mt-1"
        >
          <div className="p-3 md:p-4 space-y-3">
            {/* Header / Collapse Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center space-x-2">
                <MessageSquare size={16} className="text-primary-400" />
                <span className="text-xs font-black uppercase italic tracking-wider text-white/90">
                  Comentarios ({comments.length})
                </span>
              </div>
              <button
                onClick={onClose}
                className="flex items-center space-x-1 text-[11px] font-bold text-white/50 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-white/5"
              >
                <span>Ocultar</span>
                <ChevronUp size={14} />
              </button>
            </div>

            {/* Quick Comment Form */}
            <form onSubmit={handleAddComment} className="flex flex-col gap-2">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 font-bold text-xs shrink-0 overflow-hidden ring-1 ring-white/10">
                  {profile?.avatar_url ? (
                    <OptimizedImage
                      src={profile.avatar_url}
                      alt=""
                      className="h-full w-full object-cover"
                      transform={IMAGE_SIZES.AVATAR_SM}
                    />
                  ) : (
                    profile?.full_name?.[0] || 'U'
                  )}
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={user ? "Escribe tu comentario..." : "Inicia sesión para comentar"}
                  disabled={!user || submitting}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-primary-500/60 focus:bg-white/10 transition-all"
                />

                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting || !user}
                  className="p-2 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:hover:bg-primary-600 text-white transition-all duration-200 shrink-0 shadow-lg shadow-primary-600/20"
                  title="Enviar comentario"
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>

              {/* Quick Emojis */}
              {user && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                  <span className="text-[10px] text-white/30 font-bold uppercase shrink-0">Reaccionar:</span>
                  {QUICK_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => addEmoji(emoji)}
                      className="px-2 py-0.5 bg-white/5 hover:bg-white/15 rounded-lg text-xs transition-all hover:scale-110 active:scale-95 shrink-0 text-white/90"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </form>

            {/* Comments List */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
              {loading ? (
                <div className="flex items-center justify-center py-6 space-x-2 text-white/40 text-xs">
                  <Loader2 size={18} className="animate-spin text-primary-400" />
                  <span>Cargando comentarios...</span>
                </div>
              ) : comments.length === 0 ? (
                <div className="py-6 text-center space-y-1 bg-white/[0.01] rounded-xl border border-white/5">
                  <Sparkles size={20} className="mx-auto text-primary-400/40" />
                  <p className="text-xs font-bold text-white/60">Sé el primero en comentar</p>
                  <p className="text-[10px] text-white/40">Comparte tu opinión con la comunidad.</p>
                </div>
              ) : (
                comments.map((comment) => {
                  const isCommentOwner = user?.id === comment.user_id;
                  const isPostOwner = user?.id === postOwnerId;
                  const canDelete = isCommentOwner || isPostOwner;

                  return (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="group/comment flex items-start space-x-2.5 bg-white/[0.03] hover:bg-white/[0.06] p-2.5 rounded-xl border border-white/5 transition-all"
                    >
                      <div className="h-7 w-7 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 font-bold text-[11px] overflow-hidden shrink-0 ring-1 ring-white/10">
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
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center space-x-1.5 min-w-0">
                            <span className="text-xs font-bold text-white truncate">
                              {comment.profiles?.full_name || 'Usuario'}
                            </span>
                            {comment.profiles?.is_verified && (
                              <CheckCircle2 size={11} className="text-primary-400 shrink-0" />
                            )}
                            <span className="text-[10px] text-white/40 shrink-0">
                              • {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: es })}
                            </span>
                          </div>

                          {canDelete && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              disabled={deletingId === comment.id}
                              className="text-white/30 hover:text-red-400 p-1 rounded-md hover:bg-red-500/10 transition-colors opacity-0 group-hover/comment:opacity-100 shrink-0"
                              title="Eliminar"
                            >
                              {deletingId === comment.id ? (
                                <Loader2 size={12} className="animate-spin text-red-400" />
                              ) : (
                                <Trash2 size={12} />
                              )}
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-white/85 mt-0.5 leading-normal whitespace-pre-line font-normal break-words">
                          {comment.content}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
