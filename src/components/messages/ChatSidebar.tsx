import { FC } from 'react';
import { Search, MessageSquare, CheckCircle2, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { cn } from '../../lib/utils';
import { Conversation, UserProfile } from '../../types';

interface ChatSidebarProps {
  conversations: Conversation[];
  searchResults?: UserProfile[];
  targetUserId: string | null;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onConversationSelect: (userId: string) => void;
  isSearchingUsers?: boolean;
}

export const ChatSidebar: FC<ChatSidebarProps> = ({
  conversations,
  searchResults = [],
  targetUserId,
  searchTerm,
  onSearchChange,
  onConversationSelect,
  isSearchingUsers
}) => {
  const filteredConversations = conversations.filter(conv => {
    const profile = conv.profile;
    if (!profile) return false;
    const search = searchTerm.toLowerCase();
    return (
      profile.full_name?.toLowerCase().includes(search) ||
      profile.username?.toLowerCase().includes(search)
    );
  });

  // Filter out search results that are already in conversations
  const additionalResults = searchResults.filter(
    profile => !conversations.some(conv => conv.userId === profile.id)
  );

  const hasNoResults = filteredConversations.length === 0 && additionalResults.length === 0;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary-400 transition-colors" size={16} />
          <Input
            placeholder="Buscar conversaciones..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 h-11 bg-white/5 border-white/5 focus:bg-white/10 transition-all rounded-2xl italic font-medium"
            variant="glass"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {hasNoResults ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-white/20">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-medium">No se encontraron conversaciones</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {/* Active Conversations */}
            {filteredConversations.length > 0 && (
              <>
                <div className="px-4 py-2 bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                  Conversaciones Recientes
                </div>
                {filteredConversations.map((conv) => {
                  const profile = conv.profile;
                  const isActive = targetUserId === conv.userId;
                  
                  let lastMsgText = conv.lastMessage || 'Chat vacío';
                  try {
                    if (lastMsgText && lastMsgText.startsWith('{') && lastMsgText.endsWith('}')) {
                      const data = JSON.parse(lastMsgText);
                      lastMsgText = data.text || (data.mediaUrl ? '📸 Imagen' : (data.postRef ? '🔗 Publicación' : 'Archivo'));
                    }
                  } catch (e) {}

                  return (
                    <button
                      key={conv.userId}
                      onClick={() => onConversationSelect(conv.userId)}
                      className={cn(
                        "w-full flex items-center space-x-3 p-4 transition-all hover:bg-white/5 text-left group relative",
                        isActive && "bg-white/[0.03]"
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 shadow-[0_0_15px_rgba(230,0,0,0.5)]" />
                      )}
                      
                      <div className="relative shrink-0">
                        <div className={cn(
                          "h-14 w-14 rounded-2xl flex items-center justify-center text-white/40 font-black overflow-hidden ring-1 transition-all duration-300 group-hover:scale-105",
                          isActive ? "ring-primary-500/50" : "ring-white/10"
                        )}>
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-xl text-white/20">
                              {profile?.full_name?.[0] || 'U'}
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-zinc-900 flex items-center justify-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] border border-black" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-1 min-w-0">
                            <span className={cn(
                              "font-black tracking-tight truncate transition-colors uppercase italic text-sm",
                              isActive ? "text-primary-400" : "text-white"
                            )}>
                              {profile?.full_name || 'Usuario'}
                            </span>
                            {profile?.is_verified && (
                              <CheckCircle2 size={12} className="text-primary-400 shrink-0" />
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-white/20 shrink-0 tabular-nums">
                            {format(new Date(conv.timestamp), 'HH:mm')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn(
                            "text-[11px] truncate italic leading-tight",
                            conv.unreadCount > 0 ? "text-white font-black" : "text-white/40"
                          )}>
                            {lastMsgText}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-primary-600 text-[10px] font-black text-white shadow-lg shadow-primary-900/40 animate-pulse-slow">
                              {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </>
            )}

            {/* Global Search Results */}
            {additionalResults.length > 0 && (
              <>
                <div className="px-4 py-2 bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 border-t border-white/5">
                  Resultados de búsqueda
                </div>
                {additionalResults.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => onConversationSelect(profile.id)}
                    className="w-full flex items-center space-x-3 p-4 transition-all hover:bg-white/5 text-left group"
                  >
                    <div className="relative shrink-0">
                      <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center text-white/40 font-bold overflow-hidden ring-2 ring-white/5 transition-transform group-hover:scale-105">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          profile?.full_name?.[0] || 'U'
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 rounded-full bg-zinc-700 p-0.5 ring-2 ring-black">
                        <UserPlus size={10} className="text-white/60" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1 mb-0.5">
                        <span className="font-bold text-white truncate group-hover:text-primary-400 transition-colors">
                          {profile?.full_name || 'Usuario'}
                        </span>
                        {profile?.is_verified && (
                          <CheckCircle2 size={12} className="text-primary-400" />
                        )}
                      </div>
                      <p className="text-xs text-white/40 truncate">
                        @{profile?.username}
                      </p>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
