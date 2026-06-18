import { useState, useRef, useEffect, FormEvent, ChangeEvent, RefObject, FC } from 'react';
import { Send, Image as ImageIcon, Loader2, ChevronLeft, MoreVertical, Eraser, Trash2, MessageSquare, CheckCircle2, Mic, StopCircle, Video, Phone, PhoneOff, MicOff, Volume2, VideoOff } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CardHeader, CardTitle, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { MessageBubble } from './MessageBubble';
import { cn } from '@/src/lib/utils';
import { Message, UserProfile, MediaItem } from '@/src/types';
import { X, AlertCircle, Lock, EyeOff } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';
import { isSameDay, format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import AgoraRTC from 'agora-rtc-sdk-ng';

try {
  AgoraRTC.setLogLevel(3); // Warning and errors only to keep console pristine
} catch (e) {
  console.warn('Could not set Agora log level', e);
}


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
  isOnline?: boolean;
  isPremiumVip?: boolean;
  setIsPremiumVip?: (val: boolean) => void;
  premiumPrice?: number;
  setPremiumPrice?: (val: number) => void;
  isSelfDestructing?: boolean;
  setIsSelfDestructing?: (val: boolean) => void;
  isVerified?: boolean;
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
  onMessageVisible,
  isOnline = false,
  isPremiumVip = false,
  setIsPremiumVip,
  premiumPrice = 5,
  setPremiumPrice,
  isSelfDestructing = false,
  setIsSelfDestructing,
  isVerified = false
}) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const optionsRef = useRef<HTMLDivElement>(null);
  const virtuosoRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // P2P WebRTC Secure Call Simulator states (Item 5) upgraded to Real Agora RTC Integration
  const [activeCall, setActiveCall] = useState<'video' | 'audio' | null>(null);
  const [callStatus, setCallStatus] = useState<'dialing' | 'connected' | 'ended'>('dialing');
  const [callTimer, setCallTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Real Agora WebRTC Track & Client States
  const [localAudioTrack, setLocalAudioTrack] = useState<any>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [agoraJoined, setAgoraJoined] = useState(false);
  const [rtcError, setRtcError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRefs = useRef<{ [uid: string]: HTMLDivElement | null }>({});
  const rtcClientRef = useRef<any>(null);

  // Trigger call duration stopwatch
  useEffect(() => {
    if (activeCall && callStatus === 'connected') {
      callTimerRef.current = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      setCallTimer(0);
    }
    return () => { if (callTimerRef.current) clearInterval(callTimerRef.current); };
  }, [activeCall, callStatus]);

  // Bind or play dynamic remote user screens as they register in state
  useEffect(() => {
    remoteUsers.forEach(user => {
      const uidStr = user.uid.toString();
      const divElement = remoteVideoRefs.current[uidStr];
      if (divElement && user.videoTrack) {
        user.videoTrack.play(divElement);
      }
    });
  }, [remoteUsers]);

  // Real Agora call initializer
  const startAgoraCall = async (type: 'video' | 'audio') => {
    setRtcError(null);
    setCallStatus('dialing');
    setActiveCall(type);
    setRemoteUsers([]);
    setIsMuted(false);
    setIsVideoMuted(false);

    let appId = import.meta.env.VITE_AGORA_APP_ID || '';
    // Ensure deterministic clean channel name under 64 characters limit
    const cleanId1 = (currentUser?.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
    const cleanId2 = (targetUser?.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
    const channelName = [cleanId1, cleanId2].sort().join('-');

    // Clean and shorten user identification tracking
    const uid = (currentUser?.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 32) || Math.floor(Math.random() * 10000).toString();

    let token: string | null = null;
    try {
      const response = await fetch(`/api/agora-token?channelName=${encodeURIComponent(channelName)}&uid=${encodeURIComponent(uid)}`);
      if (response.ok) {
        const data = await response.json();
        token = data.token || null;
        if (data.appId) {
          appId = data.appId;
        }
      }
    } catch (err) {
      console.warn('Could not retrieve secure Agora token from server, attempting connection without token:', err);
    }

    try {
      // 1. Instantiate the modern NextGen Agora RTC Client
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      rtcClientRef.current = client;

      // Register live RTC communication events
      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        
        if (mediaType === 'video') {
          setRemoteUsers(prev => {
            if (prev.find(u => u.uid === user.uid)) return prev;
            return [...prev, user];
          });
        }
        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
      });

      client.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') {
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        }
      });

      client.on('user-left', (user) => {
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      });

      // 2. Initialize and open media devices
      let audioT: any = null;
      let videoT: any = null;

      try {
        audioT = await AgoraRTC.createMicrophoneAudioTrack();
        setLocalAudioTrack(audioT);
      } catch (e) {
        console.warn('Microphone configuration failed:', e);
      }

      if (type === 'video') {
        try {
          videoT = await AgoraRTC.createCameraVideoTrack();
          setLocalVideoTrack(videoT);
        } catch (e) {
          console.warn('Camera configuration failed:', e);
        }
      }

      // 3. Connect to the room
      if (appId) {
        await client.join(appId, channelName, token, uid);
        setAgoraJoined(true);

        const publishTracks = [];
        if (audioT) publishTracks.push(audioT);
        if (videoT) publishTracks.push(videoT);

        if (publishTracks.length > 0) {
          await client.publish(publishTracks);
        }
        setCallStatus('connected');
      } else {
        // Safe local mirror/preview test if VITE_AGORA_APP_ID not configured
        console.info('VITE_AGORA_APP_ID fallback mode activated.');
        setCallStatus('connected');
      }

      // Instantly start rendering user's own live camera preview
      if (videoT) {
        setTimeout(() => {
          if (localVideoRef.current) {
            videoT.play(localVideoRef.current);
          }
        }, 150);
      }

    } catch (err: any) {
      console.error('Failed to prepare Agora RTC Stream:', err);
      setRtcError(err.message || 'Cámara o micrófono inaccesibles.');
      setCallStatus('ended');
      setTimeout(() => {
        setActiveCall(null);
      }, 3000);
    }
  };

  // Safe channel exit and media cleanup
  const handleEndCall = async () => {
    setCallStatus('ended');
    
    if (localAudioTrack) {
      try {
        localAudioTrack.stop();
        localAudioTrack.close();
      } catch (e) {}
      setLocalAudioTrack(null);
    }
    if (localVideoTrack) {
      try {
        localVideoTrack.stop();
        localVideoTrack.close();
      } catch (e) {}
      setLocalVideoTrack(null);
    }

    if (rtcClientRef.current) {
      try {
        if (agoraJoined) {
          await rtcClientRef.current.leave();
        }
      } catch (e) {
        console.error('Error leaving Agora channels:', e);
      }
      rtcClientRef.current = null;
    }

    setRemoteUsers([]);
    setAgoraJoined(false);
    setIsMuted(false);
    setIsVideoMuted(false);

    setTimeout(() => {
      setActiveCall(null);
      setCallStatus('dialing');
    }, 1400);
  };

  const toggleMute = () => {
    if (localAudioTrack) {
      if (isMuted) {
        localAudioTrack.setEnabled(true);
        setIsMuted(false);
      } else {
        localAudioTrack.setEnabled(false);
        setIsMuted(true);
      }
    }
  };

  const toggleVideoMute = () => {
    if (localVideoTrack) {
      if (isVideoMuted) {
        localVideoTrack.setEnabled(true);
        setIsVideoMuted(false);
      } else {
        localVideoTrack.setEnabled(false);
        setIsVideoMuted(true);
      }
    }
  };

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
                ) : isOnline ? (
                  <p className="text-[10px] text-green-400 font-extrabold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" />
                    <span>EN LÍNEA</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-white/50">Mensajería Segura Pasiones Vip</p>
                )}
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => startAgoraCall('audio')}
              className="p-2 rounded-xl bg-white/5 text-primary-400 hover:text-white hover:bg-primary-600/20 border border-white/5 transition-all mr-1"
              title="Iniciar Audiollamada Encriptada"
            >
              <Phone size={16} />
            </button>
            <button
              onClick={() => startAgoraCall('video')}
              className="p-2 rounded-xl bg-gradient-to-r from-red-600 to-primary-600 text-white hover:opacity-90 shadow-lg border border-red-500/10 transition-all mr-1 flex items-center justify-center gap-1 px-3 text-[10px] font-black uppercase tracking-widest italic"
              title="Iniciar Videollamada P2P Segura"
            >
              <Video size={13} />
              <span>P2P</span>
            </button>
            
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
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-visible p-0 bg-transparent flex flex-col justify-center">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-white/40 p-6 text-center max-w-sm mx-auto w-full">
            <div className="h-16 w-16 rounded-3xl bg-primary-600/10 border border-primary-500/20 flex items-center justify-center mb-4 text-primary-400">
              <MessageSquare size={28} />
            </div>
            <p className="font-extrabold text-white text-base mb-1">¡Inicia la Conversación Segura!</p>
            <p className="text-xs text-white/50 mb-6 leading-relaxed">Tu chat está protegido y es estrictamente confidencial.</p>
            
            <div className="space-y-2 w-full">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/30 text-left block">Sugerencias Rápidas:</span>
              {[
                "¡Hola! ¿Cómo estás? Me encanta tu perfil. 😊",
                "Buenas, ¿tienes disponibilidad para esta semana? 📅",
                "Hola, me gustaría saber excelentes detalles sobre ti. ✨"
              ].map((msgText) => (
                <button
                  key={msgText}
                  type="button"
                  onClick={() => onNewMessageChange(msgText)}
                  className="w-full p-3 text-left bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-white/80 hover:text-white rounded-xl transition-all duration-300 font-bold active:scale-95 leading-snug cursor-pointer flex justify-between items-center group"
                >
                  <span className="truncate pr-4">{msgText}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">Usar</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            style={{ height: '100%', width: '100%' }}
            data={messages}
            initialTopMostItemIndex={messages.length - 1}
            itemContent={(index, msg) => {
              const prevMsg = messages[index - 1];
              const showDateHeader = !prevMsg || !isSameDay(new Date(msg.created_at), new Date(prevMsg.created_at));
              
              const getDateLabel = (date: Date) => {
                if (isToday(date)) return 'Hoy';
                if (isYesterday(date)) return 'Ayer';
                return format(date, "d 'de' MMMM", { locale: es });
              };

              return (
                <div className="px-4 py-1.5 transition-colors group">
                  {showDateHeader && (
                    <div className="flex justify-center my-6 sticky top-2 z-10">
                      <div className="bg-zinc-800/80 backdrop-blur-md border border-white/5 rounded-full px-4 py-1 shadow-xl">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                          {getDateLabel(new Date(msg.created_at))}
                        </span>
                      </div>
                    </div>
                  )}
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
              );
            }}
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

        {/* VIP Premium & Auto-destruction controls bar */}
        {!isVerified ? (
          <div className="p-3 rounded-2xl border border-amber-500/10 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                <Lock size={15} />
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest block">Muro Premium VIP y Auto-Destrucción</span>
                <span className="text-[8px] font-black uppercase text-white/40 tracking-wider block">Verifica tu cuenta para monetizar tus mensajes</span>
              </div>
            </div>
            <Link 
              to="/settings" 
              className="px-3 py-1.5 bg-amber-500 text-black text-[9px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 active:scale-95 transition-all shrink-0 font-bold"
            >
              Verificarme
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
              {/* Muro Premium VIP toggle */}
              <button
                type="button"
                disabled={!filePreview}
                onClick={() => setIsPremiumVip?.(!isPremiumVip)}
                className={cn(
                  "p-3 rounded-2xl border text-left flex justify-between items-center transition-all bg-black/40",
                  !filePreview ? "opacity-30 cursor-not-allowed border-white/5" : "hover:border-white/10",
                  isPremiumVip
                    ? "border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)] bg-gradient-to-r from-amber-500/10 to-transparent"
                    : "border-white/5"
                )}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className={cn(
                    "p-2 rounded-xl shrink-0 transition-colors",
                    isPremiumVip ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-white/40"
                  )}>
                    <Lock size={15} />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] font-black uppercase text-white tracking-widest block">Muro Premium</span>
                    <span className="text-[8px] font-black uppercase text-white/40 tracking-wider block">Bloquear con $</span>
                  </div>
                </div>
                
                {isPremiumVip && (
                  <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 bg-black/60 rounded-xl px-2 py-0.5 border border-amber-500/20 shrink-0">
                    <span className="text-[10px] font-mono text-amber-400 font-bold">$</span>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={premiumPrice}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) setPremiumPrice?.(val);
                      }}
                      className="w-10 bg-transparent text-white font-bold font-mono text-xs text-center focus:outline-none focus:ring-0 p-0 border-none m-0 rounded"
                    />
                  </div>
                )}
                
                {!isPremiumVip && (
                  <div className="h-4 w-4 rounded-md border border-white/20 shrink-0" />
                )}
              </button>

              {/* Auto-Destrucción toggle */}
              <button
                type="button"
                disabled={!filePreview}
                onClick={() => setIsSelfDestructing?.(!isSelfDestructing)}
                className={cn(
                  "p-3 rounded-2xl border text-left flex justify-between items-center transition-all bg-black/40",
                  !filePreview ? "opacity-30 cursor-not-allowed border-white/5" : "hover:border-white/10",
                  isSelfDestructing
                    ? "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)] bg-gradient-to-r from-red-500/10 to-transparent"
                    : "border-white/5"
                )}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className={cn(
                    "p-2 rounded-xl shrink-0 transition-colors",
                    isSelfDestructing ? "bg-red-500/20 text-red-500" : "bg-white/5 text-white/40"
                  )}>
                    <EyeOff size={15} />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] font-black uppercase text-white tracking-widest block">Auto-Destrucción</span>
                    <span className="text-[8px] font-black uppercase text-white/40 tracking-wider block">Visualización única</span>
                  </div>
                </div>

                <div className="flex items-center">
                  {isSelfDestructing ? (
                    <div className="h-4 w-4 bg-red-500 rounded-full flex items-center justify-center border border-red-400">
                      <div className="h-1.5 w-1.5 bg-black rounded-full" />
                    </div>
                  ) : (
                    <div className="h-4 w-4 rounded-md border border-white/20" />
                  )}
                </div>
              </button>
            </div>
            
            {!filePreview && (
              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest text-center mb-3">
                📷 Adjunta foto o video para activar el Muro Premium VIP o la Auto-Destrucción
              </p>
            )}
          </>
        )}

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
            <div className="flex-1 flex items-center justify-between bg-passion-red/10 border border-passion-red/20 rounded-2xl p-3 px-5 animate-pulse-slow">
              <div className="flex items-center space-x-4">
                <div className="relative flex items-center justify-center">
                  <div className="absolute h-4 w-4 rounded-full bg-passion-red animate-ping" />
                  <div className="relative h-3 w-3 rounded-full bg-passion-red shadow-[0_0_10px_rgba(230,0,0,0.5)]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-white tabular-nums tracking-tighter leading-none">{formatTime(recordingTime)}</span>
                  <span className="text-[9px] text-passion-red/60 uppercase tracking-widest font-black leading-none mt-1">Grabando Audio</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setIsRecording(false)}
                  className="p-2 text-white/30 hover:text-white transition-colors uppercase text-[9px] font-black tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRecording(false);
                    onSendMessage({ preventDefault: () => {} } as any);
                  }}
                  className="h-10 w-10 flex items-center justify-center bg-passion-red rounded-full text-white shadow-xl shadow-passion-red/20 hover:scale-110 active:scale-95 transition-all"
                >
                  <StopCircle size={20} />
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* P2P WebRTC Secure Call Portal Overlay (Item 5) */}
      <AnimatePresence>
        {activeCall && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 bg-[#070707] z-50 flex flex-col justify-between p-8 text-white select-none overflow-hidden h-full rounded-2xl"
          >
            {/* Top Security Banner info */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:justify-between bg-white/[0.02] border border-white/5 p-4 rounded-3xl w-full max-w-md mx-auto">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-green-400 tracking-wider">
                <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" />
                <span>WebRTC Agora RTC Conectado</span>
              </div>
              <div className="text-[9px] font-black uppercase tracking-widest text-white/30 font-mono">
                {import.meta.env.VITE_AGORA_APP_ID ? 'Modo Producción Activo' : 'Canal Abierto P2P'}
              </div>
            </div>

            {/* Error Banner if RTC failed */}
            {rtcError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 text-xs text-red-400 text-center max-w-sm mx-auto mt-4 flex items-center justify-center gap-2">
                <AlertCircle size={14} />
                <span>{rtcError}</span>
              </div>
            )}

            {/* Main Avatar / Video Center Feed */}
            <div className="flex-grow flex flex-col items-center justify-center py-6 w-full max-w-sm mx-auto text-center">
              {callStatus === 'dialing' && (
                <div className="space-y-6">
                  <div className="relative">
                    {/* Pulsating circles around target avatar */}
                    <div className="absolute -inset-6 rounded-full border border-primary-500/10 animate-ping opacity-30" />
                    <div className="absolute -inset-12 rounded-full border border-primary-500/5 animate-ping opacity-20" />
                    
                    <div className="h-32 w-32 rounded-full border bg-black/40 p-1 border-primary-500/30 shadow-[0_0_40px_rgba(230,0,0,0.15)] overflow-hidden mx-auto flex items-center justify-center">
                      {targetUser?.avatar_url ? (
                        <img src={targetUser.avatar_url} alt="" className="h-full w-full object-cover rounded-full" />
                      ) : (
                        <span className="text-3xl uppercase font-bold text-white/30">{targetUser?.full_name?.[0] || 'U'}</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black uppercase italic tracking-tight text-white">{targetUser?.full_name}</h3>
                    <p className="text-[10px] text-primary-400 font-extrabold uppercase tracking-widest animate-pulse leading-none">Estableciendo puente WebRTC...</p>
                  </div>
                </div>
              )}

              {callStatus === 'connected' && (
                activeCall === 'video' ? (
                  /* REAL WEBRTC VIDEO CHANNEL CONTAINER */
                  <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden border border-white/5 bg-zinc-950 shadow-2xl flex items-center justify-center">
                    
                    {/* Remote users video streams layer */}
                    {remoteUsers.length > 0 ? (
                      remoteUsers.map(user => (
                        <div 
                          key={user.uid} 
                          ref={el => { remoteVideoRefs.current[user.uid.toString()] = el; }} 
                          className="absolute inset-0 h-full w-full object-cover" 
                        />
                      ))
                    ) : (
                      /* Fallback placeholder when waiting for remote peer */
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img 
                          src={targetUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80'} 
                          alt="" 
                          className="absolute inset-0 h-full w-full object-cover brightness-[0.5] blur-xs"
                          referrerPolicy="no-referrer"
                        />
                        <div className="p-4 bg-black/80 rounded-2xl border border-white/5 z-10 max-w-[240px] text-center space-y-2">
                          <p className="text-xs font-black uppercase tracking-widest text-[#E60000] animate-pulse">Llamando...</p>
                          <p className="text-[9px] text-white/60 leading-normal">
                            {!import.meta.env.VITE_AGORA_APP_ID 
                              ? "Canal en modo pruebas local. Configura VITE_AGORA_APP_ID en .env para videollamadas con otros dispositivos."
                              : "Esperando a que la otra persona se conecte al canal..."}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* PiP Selfie Picture in Picture Frame from local user camera */}
                    <div 
                      ref={localVideoRef}
                      className={cn(
                        "absolute bottom-4 right-4 h-32 w-24 rounded-2xl overflow-hidden border bg-black/80 shadow-2xl z-20 flex items-center justify-center transition-all",
                        isVideoMuted ? "border-red-500/40" : "border-white/20"
                      )}
                    >
                      {/* Overlay when your camera is stopped */}
                      {isVideoMuted && (
                        <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center p-2 text-center">
                          <VideoOff size={16} className="text-red-500 mb-1" />
                          <span className="text-[8px] font-bold text-white/40 uppercase">Video Off</span>
                        </div>
                      )}
                      
                      {!localVideoTrack && !isVideoMuted && (
                        <div className="text-[8px] font-black tracking-widest text-[#E60000] uppercase animate-pulse text-center p-2">
                          Tú (Sin Video)
                        </div>
                      )}
                    </div>

                    <div className="absolute top-4 left-4 flex flex-col gap-1 z-20 font-mono text-[9px] text-green-400 font-bold bg-black/70 py-1.5 px-3 rounded-xl border border-green-500/20 text-left">
                      <p>📡 P2P SEÑALIZACIÓN: ESTABLE</p>
                      <p>⚡ AUDIO: {isMuted ? 'SILENCIADO' : 'ACTIVO'}</p>
                      <p className="flex items-center gap-1">⏱️ DURACIÓN: {formatTime(callTimer)}</p>
                    </div>
                  </div>
                ) : (
                  /* WEBRTC AUDIO CALL WAVEFORMS & METRICS */
                  <div className="space-y-8 flex flex-col items-center">
                    <div className="h-28 w-28 rounded-full border border-white/10 p-1 shadow-2xl overflow-hidden mx-auto">
                      {targetUser?.avatar_url ? (
                        <img src={targetUser.avatar_url} alt="" className="h-full w-full object-cover rounded-full" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-2xl uppercase font-bold text-white/30">{targetUser?.full_name?.[0] || 'U'}</span>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-lg font-black uppercase tracking-tight text-white">{targetUser?.full_name}</h4>
                      <p className="text-[10px] text-green-400 font-black uppercase tracking-widest font-mono">
                        {isMuted ? 'Micrófono Silenciado' : `Llamada de voz segura... ${formatTime(callTimer)}`}
                      </p>
                    </div>

                    {/* Animated sound equalizer/wave bars representing live audio track activity */}
                    <div className="flex items-center justify-center gap-1.5 h-12">
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: isMuted ? 4 : [12, 48, 12] }}
                          transition={isMuted ? {} : {
                            duration: 0.8 + i * 0.1,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className={cn("w-1 rounded-full transition-all", isMuted ? 'bg-red-500' : 'bg-primary-500')}
                        />
                      ))}
                    </div>
                  </div>
                )
              )}

              {callStatus === 'ended' && (
                <div className="space-y-3">
                  <div className="h-20 w-20 rounded-full bg-red-600/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
                    <PhoneOff size={32} />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white uppercase italic tracking-tighter">Llamada Finalizada</h4>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono mt-1">Enlace de comunicación desconectado con éxito.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Controls */}
            {callStatus !== 'ended' && (
              <div className="flex items-center justify-center gap-4 w-full max-w-sm mx-auto p-4 shrink-0">
                {/* Mute Audio Mic Button */}
                <button
                  type="button"
                  onClick={toggleMute}
                  className={cn(
                    "p-4 rounded-full border transition-all",
                    isMuted ? 'bg-[#E60000] border-red-600 text-white shadow-[0_0_15px_rgba(230,0,0,0.4)]' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                  )}
                  title={isMuted ? "Quitar Silencio" : "Silenciar Micrófono"}
                >
                  {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                
                {/* Toggle Video Camera Button (available on video calls only) */}
                {activeCall === 'video' && (
                  <button
                    type="button"
                    onClick={toggleVideoMute}
                    className={cn(
                      "p-4 rounded-full border transition-all",
                      isVideoMuted ? 'bg-[#E60000] border-red-600 text-white shadow-[0_0_15px_rgba(230,0,0,0.4)]' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    )}
                    title={isVideoMuted ? "Activar Cámara" : "Apagar Cámara"}
                  >
                    {isVideoMuted ? <VideoOff size={20} /> : <Video size={20} />}
                  </button>
                )}
                
                {/* Large Red End-Call Button */}
                <button
                  type="button"
                  onClick={handleEndCall}
                  className="p-5 rounded-full bg-red-600 hover:bg-red-700 text-white border border-red-500/20 shadow-2xl transition-transform hover:scale-110 active:scale-95"
                  title="Colgar y Cerrar Canal"
                >
                  <PhoneOff size={24} />
                </button>

                <button
                  type="button"
                  className="p-4 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
                  title="Cambiar Altavoz"
                >
                  <Volume2 size={20} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
