import { useState, useRef, useEffect, FormEvent, ChangeEvent, RefObject, FC } from 'react';
import { Send, Image as ImageIcon, Loader2, ChevronLeft, MoreVertical, Eraser, Trash2, MessageSquare, CheckCircle2, Mic, StopCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CardHeader, CardTitle, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { MessageBubble } from './MessageBubble';
import { cn } from '@/src/lib/utils';
import { Message, UserProfile, MediaItem } from '@/src/types';
import { X, AlertCircle } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';

interface ChatWindowProps {
  targetUser: UserProfile | null;
  messages: Message[];
  currentUser: any;
  newMessage: string;
  onNewMessageChange: (val: string) => void;
  onSendMessage: (e: FormEvent) => void;
  onBack: () => void;
  onClearChat: () => void;
  onDeleteChat: () => void;
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  onMediaClick: (url: string, type: 'image' | 'video') => void;
  filePreview: string | null;
  onRemoveFile: () => void;
  isSending: boolean;
  sendError: string | null;
  scrollRef: RefObject<HTMLDivElement>;
  fileInputRef: RefObject<HTMLInputElement>;
  refPost?: MediaItem | null;
  onClearRefPost?: () => void;
  isTyping?: boolean;
  onDeleteMessage?: (id: string, isMe: boolean) => void;
  onReactMessage?: (id: string, emoji: string) => void;
  onMessageVisible?: (id: string) => void;
}

export const ChatWindow: FC<ChatWindowProps> = ({
  targetUser,
  messages,
  currentUser,
  newMessage,
  onNewMessageChange,
  onSendMessage,
  onBack,
  onClearChat,
  onDeleteChat,
  onFileSelect,
  onMediaClick,
  filePreview,
  onRemoveFile,
  isSending,
  sendError,
  scrollRef,
  fileInputRef,
  refPost,
  onClearRefPost,
  isTyping,
  onDeleteMessage,
  onReactMessage,
  onMessageVisible
}) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const optionsRef = useRef<HTMLDivElement>(null);
  const virtuosoRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingTime(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (virtuosoRef.current && messages.length > 0) {
      virtuosoRef.current.scrollToIndex({
        index: messages.length - 1,
        behavior: 'smooth'
      });
    }
  }, [messages.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setIsOptionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!targetUser) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="max-w-md">
          <div className="h-20 w-20 rounded-full bg-primary-600/10 flex items-center justify-center mx-auto mb-6">
            <MessageSquare size={40} className="text-primary-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Tus Mensajes Seguros</h2>
          <p className="text-white/60">
            Selecciona una conversación de la lista o busca un usuario en el directorio para comenzar a chatear de forma privada.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-transparent">
      <CardHeader className="border-b border-white/10 py-4 bg-black/20 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={onBack}
              className="md:hidden p-2 -ml-2 text-white/60 hover:text-white"
            >
              <ChevronLeft size={24} />
            </button>
            <Link to={`/profile/${targetUser.id}`} className="flex items-center space-x-3 group/user">
              <div className="h-10 w-10 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 font-bold overflow-hidden ring-2 ring-white/10 transition-transform group-hover/user:scale-110">
                {targetUser?.avatar_url ? (
                  <img src={targetUser.avatar_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  targetUser?.full_name?.[0] || 'U'
                )}
              </div>
              <div>
                <div className="flex items-center space-x-1">
                  <CardTitle className="text-lg font-bold text-white group-hover/user:text-primary-400 transition-colors">
                    {targetUser?.full_name || 'Miembro de la Red'}
                  </CardTitle>
                  {targetUser?.is_verified && (
                    <CheckCircle2 size={16} className="text-primary-400" />
                  )}
                </div>
                {isTyping ? (
                  <p className="text-[10px] text-primary-400 font-medium animate-pulse">Escribiendo...</p>
                ) : (
                  <p className="text-[10px] text-white/50">Mensajería Segura Pasiones Vip</p>
                )}
              </div>
            </Link>
          </div>

          <div className="relative" ref={optionsRef}>
            <button
              onClick={() => setIsOptionsOpen(!isOptionsOpen)}
              className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
            >
              <MoreVertical size={20} />
            </button>

            <AnimatePresence>
              {isOptionsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-black/90 p-1 shadow-2xl backdrop-blur-2xl z-50"
                >
                  <button
                    onClick={() => { onClearChat(); setIsOptionsOpen(false); }}
                    className="flex w-full items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-bold text-white/70 hover:bg-white/5 hover:text-white transition-all"
                  >
                    <Eraser size={16} />
                    <span>Vaciar chat</span>
                  </button>
                  <button
                    onClick={() => { onDeleteChat(); setIsOptionsOpen(false); }}
                    className="flex w-full items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
                  >
                    <Trash2 size={16} />
                    <span>Eliminar chat</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-visible p-0 bg-transparent flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white/20 p-4">
            <MessageSquare size={48} className="mb-2 opacity-20" />
            <p className="text-sm">No hay mensajes todavía. ¡Di hola!</p>
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            style={{ height: '100%', width: '100%' }}
            data={messages}
            initialTopMostItemIndex={messages.length - 1}
            itemContent={(_, msg) => (
              <div className="px-4 py-2 hover:bg-white/[0.02] transition-colors group">
                <MessageBubble 
                  key={msg.id} 
                  message={msg} 
                  isMe={msg.sender_id === currentUser?.id} 
                  currentUserId={currentUser?.id}
                  onMediaClick={onMediaClick}
                  onDelete={onDeleteMessage}
                  onReact={onReactMessage}
                  onVisible={onMessageVisible}
                />
              </div>
            )}
            components={{
              Footer: () => <div className="h-4" />
            }}
          />
        )}
      </CardContent>

      <div className="p-4 border-t border-white/10 bg-black/20 shrink-0">
        <AnimatePresence>
          {refPost && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-3 relative flex items-center space-x-3 p-2 rounded-xl bg-primary-600/10 border border-primary-500/20"
            >
              <div className="h-12 w-12 rounded-lg overflow-hidden bg-black/40 shrink-0">
                {refPost.type === 'video' ? (
                  <video src={refPost.url} className="h-full w-full object-cover" />
                ) : (
                  <img src={refPost.url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-primary-400 uppercase tracking-wider">Respondiendo a publicación</p>
                <p className="text-xs text-white/70 truncate">{refPost.caption || 'Sin descripción'}</p>
              </div>
              <button
                onClick={onClearRefPost}
                className="p-1.5 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {filePreview && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-3 relative w-24 h-24 rounded-lg overflow-hidden ring-2 ring-primary-500"
            >
              <img src={filePreview} alt="" className="w-full h-full object-cover" />
              <button
                onClick={onRemoveFile}
                className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white hover:bg-black/80 transition-colors"
              >
                <X size={14} />
              </button>
              {isSending && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 size={20} className="text-white animate-spin" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {sendError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-3 flex items-center space-x-2 rounded-lg bg-red-500/10 p-2 text-xs text-red-400 border border-red-500/20"
            >
              <AlertCircle size={14} />
              <span>{sendError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={onSendMessage} className="flex items-end space-x-2">
          {!isRecording ? (
            <>
              <div className="flex-1 flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSending}
                    className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-primary-400 hover:bg-primary-600/10 transition-all disabled:opacity-50"
                  >
                    <ImageIcon size={20} />
                  </button>
                  <Input
                    placeholder="Escribe un mensaje..."
                    value={newMessage}
                    onChange={(e) => onNewMessageChange(e.target.value)}
                    disabled={isSending}
                    className="flex-1"
                    variant="glass"
                  />
                  <button
                    type="button"
                    onClick={() => setIsRecording(true)}
                    disabled={isSending}
                    className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-primary-400 hover:bg-primary-600/10 transition-all disabled:opacity-50"
                  >
                    <Mic size={20} />
                  </button>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onFileSelect}
                  accept="image/*,video/*"
                  className="hidden"
                />
              </div>
              <Button type="submit" size="md" isLoading={isSending} disabled={!newMessage.trim() && !filePreview}>
                <Send size={18} />
              </Button>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-between bg-primary-600/10 border border-primary-500/20 rounded-xl p-2 px-4 animate-pulse-slow">
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-bold text-white tabular-nums">{formatTime(recordingTime)}</span>
                <span className="text-xs text-white/40 uppercase tracking-widest font-black">Grabando audio...</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRecording(false)}
                  className="p-2 text-white/40 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // In a real app, this would stop recording and send the blob
                    setIsRecording(false);
                    onSendMessage({ preventDefault: () => {} } as any);
                  }}
                  className="p-2 bg-primary-600 rounded-full text-white shadow-lg"
                >
                  <StopCircle size={20} />
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
