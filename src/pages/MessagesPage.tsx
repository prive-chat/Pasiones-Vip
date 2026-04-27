import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageService } from '@/src/services/messageService';
import { profileService } from '@/src/services/profileService';
import { mediaService } from '@/src/services/mediaService';
import { notificationService } from '@/src/services/notificationService';
import { Button } from '@/src/components/ui/Button';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import { AnimatePresence, motion } from 'framer-motion';
import { MediaViewer } from '@/src/components/ui/MediaViewer';
import { supabase } from '@/src/lib/supabase';
import { cn } from '@/src/lib/utils';
import { ChatSidebar } from '@/src/components/messages/ChatSidebar';
import { ChatWindow } from '@/src/components/messages/ChatWindow';
import { MediaItem } from '@/src/types';

export default function MessagesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const targetUserId = searchParams.get('to') || searchParams.get('user');
  const refPostId = searchParams.get('ref');
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [refPost, setRefPost] = useState<MediaItem | null>(null);

  useEffect(() => {
    if (refPostId && targetUserId) {
      mediaService.fetchMediaItem(refPostId)
        .then((item) => {
          if (item) {
            setRefPost(item);
          }
        })
        .catch(err => console.error('Error fetching ref post:', err));
    }
  }, [refPostId, targetUserId]);

  const { user: currentUser, profile: currentProfile } = useAuth();
  const [sendError, setSendError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [viewerMedia, setViewerMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'clear' | 'delete' | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const searchMutation = useMutation({
    mutationFn: (query: string) => profileService.searchProfiles(query),
    onSuccess: (data) => {
      setSearchResults(data);
    }
  });

  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      const timer = setTimeout(() => {
        searchMutation.mutate(searchTerm);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', currentUser?.id],
    queryFn: () => messageService.fetchConversations(currentUser!.id),
    enabled: !!currentUser?.id,
  });

  const { data: targetUser } = useQuery({
    queryKey: ['profile', targetUserId],
    queryFn: () => profileService.fetchProfile(targetUserId!),
    enabled: !!targetUserId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', targetUserId],
    queryFn: () => messageService.fetchMessages(currentUser!.id, targetUserId!),
    enabled: !!targetUserId && !!currentUser,
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ content, file }: { content: string; file?: File }) => 
      messageService.sendMessage(
        currentUser!.id, 
        targetUserId!, 
        content, 
        currentProfile?.full_name || 'Alguien',
        file
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUser?.id] });
      setNewMessage('');
      setSelectedFile(null);
      setFilePreview(null);
      setSendError(null);
      setRefPost(null);
      // Remove ref from URL without reloading
      if (refPostId) {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('ref');
        navigate(`/messages?${newParams.toString()}`, { replace: true });
      }
    },
    onError: (error: any) => {
      setSendError(error.message || 'No se pudo enviar el mensaje.');
    }
  });

  const deleteChatMutation = useMutation({
    mutationFn: () => {
      if (confirmAction === 'clear') {
        return messageService.clearChat(currentUser!.id, targetUserId!);
      } else {
        return messageService.deleteChat(currentUser!.id, targetUserId!);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUser?.id] });
      setIsConfirmOpen(false);
      if (confirmAction === 'delete') {
        navigate('/messages');
      }
    },
    onError: (error: any) => {
      setSendError(error.message || 'No se pudo eliminar el chat.');
    }
  });

  const deleteMessageMutation = useMutation({
    mutationFn: ({ id, isMe }: { id: string, isMe: boolean }) => 
      messageService.deleteIndividualMessage(id, currentUser!.id, isMe),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', targetUserId] });
    }
  });

  const reactMutation = useMutation({
    mutationFn: ({ id, emoji }: { id: string, emoji: string }) => 
      messageService.toggleReaction(id, currentUser!.id, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', targetUserId] });
    }
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => messageService.markMessageAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUser?.id] });
    }
  });

  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (targetUserId && currentUser) {
      // Mark messages as read when opening the chat
      messageService.markAsRead(currentUser.id, targetUserId)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['conversations', currentUser.id] });
          queryClient.invalidateQueries({ queryKey: ['messages', targetUserId] });
        })
        .catch(err => console.error('Error marking messages as read:', err));

      // Also mark as delivered just in case
      messageService.markAsDelivered(currentUser.id, targetUserId)
        .catch(err => console.error('Error marking messages as delivered:', err));

      notificationService.markMessageNotificationsRead(currentUser.id, targetUserId)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['notifications', currentUser.id] });
        })
        .catch(err => console.error('Error marking notifications as read:', err));

      // Real-time subscriptions
      const channel = supabase.channel(`chat_${targetUserId}_${currentUser.id}`, {
        config: {
          presence: {
            key: currentUser.id,
          },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const isOtherTyping = Object.values(state).some((presence: any) => 
            presence.some((p: any) => p.user_id === targetUserId && p.is_typing)
          );
          setOtherUserTyping(isOtherTyping);
        })
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'messages',
            filter: `receiver_id=eq.${currentUser.id}`
          }, 
          (payload) => {
            if (payload.new && (payload.new as any).sender_id === targetUserId) {
              queryClient.invalidateQueries({ queryKey: ['messages', targetUserId] });
              // Mark as read immediately if chat is open
              messageService.markAsRead(currentUser.id, targetUserId);
              notificationService.markMessageNotificationsRead(currentUser.id, targetUserId);
            } else if (payload.new && (payload.new as any).receiver_id === currentUser.id) {
              // If chat is NOT open but we received a message, mark as delivered
              messageService.markAsDelivered(currentUser.id, (payload.new as any).sender_id);
            }
            queryClient.invalidateQueries({ queryKey: ['conversations', currentUser.id] });
          }
        )
        .on(
          'postgres_changes',
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'messages',
            filter: `sender_id=eq.${currentUser.id}`
          }, 
          () => {
            // Listen for read receipts
            queryClient.invalidateQueries({ queryKey: ['messages', targetUserId] });
          }
        )
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: currentUser.id,
              is_typing: false
            });
          }
        });

      return () => {
        channel.unsubscribe();
      };
    }
  }, [targetUserId, currentUser, queryClient]);

  const handleTyping = () => {
    if (!currentUser || !targetUserId) return;

    if (!isTyping) {
      setIsTyping(true);
      const channel = supabase.channel(`chat_${targetUserId}_${currentUser.id}`);
      channel.track({ user_id: currentUser.id, is_typing: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      const channel = supabase.channel(`chat_${targetUserId}_${currentUser.id}`);
      channel.track({ user_id: currentUser.id, is_typing: false });
    }, 3000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile && !refPost) || !targetUserId || !currentUser) return;
    
    // Stop typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsTyping(false);
    const channel = supabase.channel(`chat_${targetUserId}_${currentUser.id}`);
    channel.track({ user_id: currentUser.id, is_typing: false });

    let content = newMessage;
    if (refPost) {
      content = JSON.stringify({
        text: newMessage,
        postRef: {
          id: refPost.id,
          url: refPost.url,
          type: refPost.type,
          caption: refPost.caption
        }
      });
    }

    sendMessageMutation.mutate({ content, file: selectedFile || undefined });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setFilePreview(url);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl p-0 sm:p-4 h-[calc(100dvh-64px)] sm:h-[calc(100vh-80px)] flex flex-col">
      <div className="flex-1 flex overflow-hidden glass-card border-none rounded-none sm:rounded-2xl shadow-2xl">
        <div className={cn(
          "w-full md:w-80 lg:w-96 border-r border-white/10 bg-black/20 flex-col",
          targetUserId ? "hidden md:flex" : "flex"
        )}>
          <ChatSidebar 
            conversations={conversations}
            searchResults={searchResults}
            targetUserId={targetUserId}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onConversationSelect={(id) => navigate(`/messages?to=${id}`)}
            isSearchingUsers={searchMutation.isPending}
          />
        </div>

        <ChatWindow 
          targetUser={targetUser || null}
          messages={messages}
          currentUser={currentUser}
          newMessage={newMessage}
          onNewMessageChange={(val) => {
            setNewMessage(val);
            handleTyping();
          }}
          onSendMessage={handleSendMessage}
          onBack={() => navigate('/messages')}
          onClearChat={() => { setConfirmAction('clear'); setIsConfirmOpen(true); }}
          onDeleteChat={() => { setConfirmAction('delete'); setIsConfirmOpen(true); }}
          onFileSelect={handleFileSelect}
          onMediaClick={(url, type) => setViewerMedia({ url, type })}
          filePreview={filePreview}
          onRemoveFile={() => { setSelectedFile(null); setFilePreview(null); }}
          isSending={sendMessageMutation.isPending}
          sendError={sendError}
          scrollRef={scrollRef}
          fileInputRef={fileInputRef}
          refPost={refPost}
          onClearRefPost={() => setRefPost(null)}
          isTyping={otherUserTyping}
          onDeleteMessage={(id, isMe) => deleteMessageMutation.mutate({ id, isMe })}
          onReactMessage={(id, emoji) => reactMutation.mutate({ id, emoji })}
          onMessageVisible={(id) => markReadMutation.mutate(id)}
        />
      </div>

      <MediaViewer
        isOpen={!!viewerMedia}
        url={viewerMedia?.url || null}
        type={viewerMedia?.type || null}
        onClose={() => setViewerMedia(null)}
      />

      <AnimatePresence>
        {isConfirmOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-4">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {confirmAction === 'clear' ? '¿Vaciar conversación?' : '¿Eliminar chat completo?'}
              </h3>
              <p className="text-sm text-white/60 mb-6">
                {confirmAction === 'clear' 
                  ? 'Se eliminarán todos los mensajes de esta conversación. Esta acción no se puede deshacer.'
                  : 'Se eliminará todo el historial y la conversación desaparecerá de tu lista. Esta acción no se puede deshacer.'}
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="ghost"
                  className="flex-1 text-white/60 hover:text-white hover:bg-white/5"
                  onClick={() => setIsConfirmOpen(false)}
                  disabled={deleteChatMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => deleteChatMutation.mutate()}
                  isLoading={deleteChatMutation.isPending}
                >
                  Confirmar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
