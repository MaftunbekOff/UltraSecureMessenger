import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  Users,
  Settings,
  Hash,
  Clock,
  Search
} from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  profileImageUrl?: string;
  username?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface ChatWithExtras {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'channel';
  participants: User[];
  lastMessage?: {
    content: string;
    timestamp: string;
    sender: User;
  };
  unreadCount?: number;
  isOnline?: boolean;
}

interface ChatSidebarProps {
  selectedChatId: string | null;
  onChatSelect: (chatId: string) => void;
}

export function ChatSidebar({ selectedChatId, onChatSelect }: ChatSidebarProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  // Fetch user's chats
  const { data: chats = [], isLoading: isChatsLoading } = useQuery<ChatWithExtras[]>({
    queryKey: ["/api/chats"],
    refetchInterval: 30000,
  });

  const filteredChats = chats?.filter(chat => {
    const searchLower = searchQuery.toLowerCase();
    return (chat.name || '').toLowerCase().includes(searchLower) ||
           chat.participants.some(p =>
             (p.displayName || '').toLowerCase().includes(searchLower) ||
             (p.email || '').toLowerCase().includes(searchLower)
           );
  }) || [];

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;

    if (diffInHours < 24) {
      return date.toLocaleTimeString('uz-UZ', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return date.toLocaleDateString('uz-UZ', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getChatIcon = (chat: ChatWithExtras) => {
    switch (chat.type) {
      case 'group':
        return <Users className="h-4 w-4" />;
      case 'channel':
        return <Hash className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Chatlarni qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      

      {/* Chat list */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 px-2">
          {isChatsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Hali chatlar yo'q</p>
              <p className="text-xs text-gray-400">Yangi chat boshlash uchun yuqorida qidiring</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onChatSelect(chat.id)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedChatId === chat.id
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-gray-50"
                }`}
              >
                {/* Chat avatar */}
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                    {(chat.name || chat.participants?.[0]?.firstName || chat.participants?.[0]?.email || "U").charAt(0).toUpperCase()}
                  </div>
                  {chat.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>

                {/* Chat info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm truncate">
                      {chat.name || chat.participants?.find(p => p.id !== user?.id)?.displayName || "Unknown Chat"}
                    </h3>
                    <div className="flex items-center gap-1">
                      {chat.unreadCount && chat.unreadCount > 0 && (
                        <Badge variant="destructive" className="h-5 min-w-5 text-xs px-1">
                          {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                        </Badge>
                      )}
                      {chat.lastMessage && (
                        <span className="text-xs text-gray-500">
                          {formatTime(chat.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                  </div>

                  {chat.lastMessage && (
                    <p className="text-xs text-gray-600 truncate mt-1">
                      {chat.lastMessage.sender.id !== user?.id && (
                        <span className="font-medium">
                          {chat.lastMessage.sender.firstName || chat.lastMessage.sender.email}:
                        </span>
                      )}
                      {" " + chat.lastMessage.content}
                    </p>
                  )}

                  <div className="flex items-center gap-1 mt-1">
                    {getChatIcon(chat)}
                    <span className="text-xs text-gray-400 capitalize">
                      {chat.type === 'direct' ? 'Shaxsiy' : chat.type === 'group' ? 'Guruh' : 'Kanal'}
                    </span>
                    {chat.participants && (
                      <span className="text-xs text-gray-400">
                        • {chat.participants.length} a'zo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}