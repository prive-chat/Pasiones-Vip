import { FC, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Check, CheckCheck, Maximize2, ExternalLink, Smile, Trash2, MoreHorizontal } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { cn } from '../../lib/utils';
import { Message } from '../../types';
import { useNavigate } from 'react-router-dom';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  onMediaClick: (url: string, type: 'image' | 'video') => void;
  onDelete?: (id: string, isMe: boolean) => void;
  onReact?: (id: string, emoji: string) => void;
  onVisible?: (id: string) => void;
  currentUserId?: string;
}

const COMMON_EMOJIS = ['❤️', '🔥', '😂', '😮', '😢', '👍'];

export const MessageBubble: FC<MessageBubbleProps> = ({ 
  message, 
  isMe, 
  onMediaClick, 
  onDelete, 
  onReact,
  onVisible,
  currentUserId 
}) => {
  const navigate = useNavigate();
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { ref: inViewRef, inView } = useInView({
    threshold: 0.5,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inView && !isMe && !message.is_read) {
      onVisible?.(message.id);
    }
  }, [inView, isMe, message.is_read, message.id, onVisible]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
        setShowReactions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasReactions = message.reactions && Object.keys(message.reactions).length > 0;
  const renderContent = (message: Message) => {
    const { content, media_url: msgMediaUrl, media_type: msgMediaType, ref_post_id: msgRefPostId } = message;
    let text = content;
    let mediaUrl = msgMediaUrl || null;
    let mediaType = msgMediaType || null;
    let postRef: any = null;

    // Check if there is an explicit ref_post_id
    // Note: We might need to fetch the post if it's not pre-loaded, 
    // but for now we look into JSON for backward compatibility
    
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed === 'object' && parsed !== null) {
        text = parsed.text || '';
        if (!mediaUrl) mediaUrl = parsed.mediaUrl || null;
        postRef = parsed.postRef || parsed.post || null;
      }
    } catch (e) {
      // Not JSON, just plain text
    }

    // Determine media type if not explicitly provided
    if (mediaUrl && !mediaType) {
      mediaType = (mediaUrl.includes('.mp4') || mediaUrl.includes('.mov')) ? 'video' : 'image';
    }
    
    return (
      <div className="space-y-2">
        {postRef && (
          <div 
            className="mb-2 p-2 rounded-lg bg-black/30 border border-white/10 cursor-pointer hover:bg-black/40 transition-colors"
            onClick={() => navigate(`/post/${postRef.id}`)}
          >
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded overflow-hidden bg-black/40 shrink-0">
                {postRef.type === 'video' ? (
                  <video src={postRef.url} className="h-full w-full object-cover" />
                ) : (
                  <img src={postRef.url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-primary-400 uppercase tracking-wider">Respondiendo a publicación</p>
                <p className="text-[10px] text-white/60 truncate">{postRef.caption || 'Sin descripción'}</p>
              </div>
              <ExternalLink size={12} className="text-white/20" />
            </div>
          </div>
        )}
        {mediaUrl && (
          <div 
            className="relative w-full max-w-[280px] rounded-xl overflow-hidden bg-black/40 cursor-pointer group ring-1 ring-white/10"
            onClick={() => onMediaClick(mediaUrl!, mediaType as 'image' | 'video')}
          >
            {mediaType === 'video' ? (
              <video src={mediaUrl} className="w-full h-auto max-h-[400px] object-contain block" />
            ) : (
              <img src={mediaUrl} alt="" className="w-full h-auto max-h-[400px] object-contain block" referrerPolicy="no-referrer" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Maximize2 size={20} className="text-white" />
            </div>
          </div>
        )}
        {text && <p className="whitespace-pre-wrap break-words">{text}</p>}
      </div>
    );
  };

  return (
    <motion.div
      ref={inViewRef}
      initial={{ opacity: 0, x: isMe ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn("flex w-full group/main", isMe ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          "relative max-w-[85%] sm:max-w-[70%] px-4 py-2.5 shadow-xl transition-all",
          isMe 
            ? "bg-primary-600 text-white rounded-2xl rounded-tr-none ml-12" 
            : "bg-white/10 text-white rounded-2xl rounded-tl-none mr-12 border border-white/10 backdrop-blur-md"
        )}
      >
        <div className="relative z-10">
          {renderContent(message)}
        </div>

        <div className={cn(
          "mt-1 flex items-center justify-end space-x-1 text-[10px] font-medium",
          isMe ? "text-primary-100/70" : "text-white/40"
        )}>
          <span>{format(new Date(message.created_at), 'HH:mm')}</span>
          {isMe && (
            <div className="flex items-center">
              {message.is_read ? (
                <CheckCheck size={12} className="text-passion-red" />
              ) : message.is_delivered ? (
                <CheckCheck size={12} className="text-white/40" />
              ) : (
                <Check size={12} className="opacity-60" />
              )}
            </div>
          )}
        </div>

        <div 
          className={cn(
            "absolute top-0 h-3 w-3",
            isMe 
              ? "-right-1 bg-primary-600 [clip-path:polygon(0_0,0_100%,100%_0)]" 
              : "-left-1 bg-white/10 [clip-path:polygon(100%_0,100%_100%,0_0)]"
          )} 
        />

        {/* Reactions Display */}
        {hasReactions && (
          <div className={cn(
            "absolute -bottom-3 flex flex-wrap gap-1 items-center z-20",
            isMe ? "right-0" : "left-0"
          )}>
            {Object.entries(message.reactions!).map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => onReact?.(message.id, emoji)}
                className={cn(
                  "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] border backdrop-blur-md transition-all",
                  users.includes(currentUserId || '')
                    ? "bg-primary-600/30 border-primary-500/50 text-white"
                    : "bg-black/60 border-white/10 text-white/70 hover:border-white/20"
                )}
              >
                <span>{emoji}</span>
                {users.length > 1 && <span className="font-bold opacity-80">{users.length}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Actions Menu Trigger */}
        <div className={cn(
          "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1",
          isMe ? "-left-12 pr-2 flex-row-reverse" : "-right-12 pl-2"
        )}>
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <MoreHorizontal size={14} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className={cn(
                    "absolute bottom-full mb-2 w-32 rounded-xl bg-black/90 border border-white/10 p-1 shadow-2xl backdrop-blur-xl z-50",
                    isMe ? "right-0" : "left-0"
                  )}
                >
                  <button
                    onClick={() => { setShowReactions(!showReactions); }}
                    className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-white/70 hover:bg-white/5 hover:text-white transition-all"
                  >
                    <Smile size={14} />
                    <span>Reaccionar</span>
                  </button>
                  <button
                    onClick={() => { onDelete?.(message.id, isMe); setShowMenu(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
                  >
                    <Trash2 size={14} />
                    <span>Eliminar</span>
                  </button>

                  <AnimatePresence>
                    {showReactions && (
                      <motion.div 
                        initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: isMe ? 20 : -20 }}
                        className={cn(
                          "absolute top-0 flex gap-1 p-1.5 bg-zinc-900 border border-white/10 rounded-full shadow-2xl z-50",
                          isMe ? "right-full mr-2" : "left-full ml-2"
                        )}
                      >
                        {COMMON_EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => { onReact?.(message.id, emoji); setShowMenu(false); }}
                            className="text-lg hover:scale-125 transition-transform p-1"
                          >
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
