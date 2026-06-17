import { FC, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Check, CheckCheck, Maximize2, ExternalLink, Smile, Trash2, MoreHorizontal, Lock, EyeOff, Coins } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { cn } from '../../lib/utils';
import { Message } from '../../types';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import { useNotificationStore } from '../../store/notificationStore';
import { creditsManager } from '../../lib/credits';

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

  const { addToast } = useNotificationStore();
  const setActiveModal = useUIStore((state) => state.setActiveModal);

  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (!message.id) return false;
    return localStorage.getItem(`unlocked_msg_${message.id}`) === 'true';
  });

  const [isDestroyed, setIsDestroyed] = useState(() => {
    if (!message.id) return false;
    return localStorage.getItem(`destroyed_msg_${message.id}`) === 'true';
  });

  const [revealSelfDestruct, setRevealSelfDestruct] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      localStorage.setItem(`destroyed_msg_${message.id}`, 'true');
      setIsDestroyed(true);
      setCountdown(null);
      addToast({
        type: 'info',
        message: 'Contenido Destruido',
        description: 'El mensaje de un solo uso se ha desvanecido.',
        duration: 3000
      });
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, message.id, addToast]);

  const effectiveUnlocked = isMe || isUnlocked;

  const handleUnlock = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const parsed = JSON.parse(message.content);
      const price = parsed.premium_price || 5;
      const success = creditsManager.deductCredits(price);
      if (success) {
        localStorage.setItem(`unlocked_msg_${message.id}`, 'true');
        setIsUnlocked(true);
        addToast({
          type: 'success',
          message: '¡Mensaje Desbloqueado!',
          description: 'El pago con créditos fue autorizado.',
          duration: 3000
        });
      } else {
        addToast({
          type: 'error',
          message: 'Saldo Insuficiente',
          description: `Este mensaje VIP premium requiere ${price} $.`,
          duration: 4000
        });
        setActiveModal('payment', { price });
      }
    } catch (err) {
      console.error('Error unlocking message:', err);
    }
  };

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

    let isPremium = false;
    let price = 5;
    let isSelfDestruct = false;

    try {
      const parsed = JSON.parse(content);
      if (typeof parsed === 'object' && parsed !== null) {
        text = parsed.text || '';
        if (!mediaUrl) mediaUrl = parsed.mediaUrl || null;
        postRef = parsed.postRef || parsed.post || null;
        
        isPremium = !!parsed.is_premium_vip;
        price = parsed.premium_price || 5;
        isSelfDestruct = !!parsed.is_self_destructing;
      }
    } catch (e) {
      // Not JSON, just plain text
    }

    if (mediaUrl && !mediaType) {
      mediaType = (mediaUrl.includes('.mp4') || mediaUrl.includes('.mov')) ? 'video' : 'image';
    }

    // 1. Check if Premium Lock is active
    if (isPremium && !effectiveUnlocked) {
      return (
        <div className="p-4 bg-gradient-to-b from-amber-600/10 to-amber-900/5 border border-amber-500/20 rounded-2xl text-center space-y-3 max-w-[280px]">
          <div className="mx-auto w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-400 border border-amber-500/20">
            <Lock size={16} className="animate-pulse" />
          </div>
          <div className="space-y-1">
            <h5 className="text-[10px] font-black uppercase text-amber-500 tracking-wider font-sans">Muro Premium VIP</h5>
            <p className="text-[9px] text-white/50 leading-relaxed uppercase">El remitente bloqueó este mensaje confidencial por {price} $.</p>
          </div>
          <button
            type="button"
            onClick={handleUnlock}
            className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-black font-black uppercase tracking-widest text-[9px] rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-1.5 font-bold"
          >
            <span>Desbloquear por {price} $</span>
          </button>
        </div>
      );
    }

    // 2. Check if Self Destruct is active
    if (isSelfDestruct) {
      if (isDestroyed) {
        return (
          <div className="p-4 bg-zinc-950/40 border border-white/5 rounded-2xl flex items-center gap-3 max-w-[280px] opacity-60">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 shrink-0">
              <EyeOff size={14} />
            </div>
            <div className="space-y-0.5">
              <h5 className="text-[10px] font-black uppercase text-white/40 tracking-wider">Contenido Destruido</h5>
              <p className="text-[9px] text-white/30 uppercase leading-none">Auto-destrucción completada.</p>
            </div>
          </div>
        );
      }

      if (!isMe && !revealSelfDestruct) {
        return (
          <div className="p-4 bg-gradient-to-b from-red-600/10 to-red-900/5 border border-red-500/20 rounded-2xl text-center space-y-3 max-w-[280px]">
            <div className="mx-auto w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 border border-red-500/20">
              <EyeOff size={16} />
            </div>
            <div className="space-y-1">
              <h5 className="text-[10px] font-black uppercase text-red-500 tracking-wider">Visualización Única</h5>
              <p className="text-[9px] text-white/50 leading-relaxed uppercase font-sans">Haz clic para descubrir este contenido privado durante 10 segundos.</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setRevealSelfDestruct(true);
                setCountdown(10);
              }}
              className="w-full py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-90 text-white font-black uppercase tracking-widest text-[9px] rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-1.5 font-bold"
            >
              <span>Revelar Contenido Seguro</span>
            </button>
          </div>
        );
      }
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
        {countdown !== null && (
          <div className="mt-2 bg-red-500/10 border border-red-500/25 rounded-xl p-2 flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-red-500 font-mono animate-pulse shrink-0">
            <span>Se destruirá en...</span>
            <span className="text-xs font-bold font-mono">{countdown}s</span>
          </div>
        )}
        {isSelfDestruct && isMe && (
          <div className="text-[8px] font-black uppercase text-white/40 bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 tracking-wider w-fit">
            👁️ Autodestrucción Activa
          </div>
        )}
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
          "relative max-w-[85%] sm:max-w-[70%] px-4 py-3 shadow-2xl transition-all",
          isMe 
            ? "bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-[1.5rem] rounded-tr-none ml-12" 
            : "bg-white/10 text-white rounded-[1.5rem] rounded-tl-none mr-12 border border-white/10 backdrop-blur-md"
        )}
      >
        <div className="relative z-10">
          {renderContent(message)}
        </div>

        <div className={cn(
          "mt-2 flex items-center justify-end space-x-1.5 text-[10px] font-black uppercase tracking-tighter",
          isMe ? "text-primary-100/60" : "text-white/40"
        )}>
          <span className="italic">{format(new Date(message.created_at), 'HH:mm')}</span>
          {isMe && (
            <div className="flex items-center">
              {message.is_read ? (
                <CheckCheck size={14} className="text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" />
              ) : message.is_delivered ? (
                <CheckCheck size={14} className="text-white/40" />
              ) : (
                <Check size={14} className="opacity-60" />
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
