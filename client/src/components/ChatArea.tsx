import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Search, Phone, Video, MoreVertical, ArrowLeft, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Chat, Message, User, ChatMember } from "@shared/schema";

interface ChatAreaProps {
  chatId: string | null;
  onBack?: () => void;
}

type MessageWithExtras = Message & {
  sender: User;
  replyTo?: Message;
};

type ChatWithMembers = Chat & {
  members: (ChatMember & { user: User })[];
};

export function ChatArea({ chatId, onBack }: ChatAreaProps) {
  const { user } = useAuth();
  const [replyTo, setReplyTo] = useState<Message | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat details
  const { data: chat } = useQuery<ChatWithMembers>({
    queryKey: ["/api/chats", chatId],
    enabled: !!chatId,
  });

  // Fetch messages
  const { data: messages = [], isLoading: isMessagesLoading } = useQuery<MessageWithExtras[]>({
    queryKey: ["/api/chats", chatId, "messages"],
    enabled: !!chatId,
    refetchInterval: 5000, // Refresh every 5 seconds for "real-time" feel
  });

  // Mark chat as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/chats/${chatId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Mark chat as read when opening
  useEffect(() => {
    if (chatId && user) {
      markAsReadMutation.mutate();
    }
  }, [chatId, user]);

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="text-primary-foreground text-4xl h-12 w-12" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Welcome to UltraSecure Messenger</h2>
          <p className="text-muted-foreground mb-6">
            Select a conversation to start messaging securely with end-to-end encryption.
          </p>
        </div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  const getOtherUser = () => {
    if (chat.isGroup) return null;
    return chat.members.find(member => member.userId !== (user as any)?.id)?.user;
  };

  const otherUser = getOtherUser();
  const displayName = chat.isGroup 
    ? chat.name || "Unnamed Group"
    : otherUser?.displayName || 
      `${otherUser?.firstName || ""} ${otherUser?.lastName || ""}`.trim() ||
      otherUser?.email || "Unknown User";

  const getStatusText = () => {
    if (chat.isGroup) {
      const memberCount = chat.members.length;
      const onlineCount = chat.members.filter(m => m.user.isOnline).length;
      return `${memberCount} members, ${onlineCount} online`;
    }
    
    if (otherUser?.isOnline) {
      return "Online";
    }
    
    if (otherUser?.lastSeen) {
      const lastSeen = new Date(otherUser.lastSeen);
      const now = new Date();
      const diffMs = now.getTime() - lastSeen.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `Last seen ${diffMins} min ago`;
      if (diffHours < 24) return `Last seen ${diffHours}h ago`;
      if (diffDays < 7) return `Last seen ${diffDays}d ago`;
      return "Last seen recently";
    }
    
    return "Last seen recently";
  };

  const getAvatarSrc = () => {
    if (chat.isGroup) {
      return chat.avatarUrl;
    }
    return otherUser?.profileImageUrl;
  };

  const getAvatarFallback = () => {
    if (chat.isGroup) {
      return <Users className="h-5 w-5" />;
    }
    return (otherUser?.displayName || otherUser?.firstName || "U").charAt(0).toUpperCase();
  };

  const groupMessagesByDate = (messages: MessageWithExtras[]) => {
    const groups: { [key: string]: MessageWithExtras[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.createdAt || new Date()).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="md:hidden"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={getAvatarSrc() || ""} />
                <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
              </Avatar>
              {!chat.isGroup && otherUser?.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
              )}
            </div>
            
            <div>
              <h2 className="font-semibold text-card-foreground" data-testid="text-chat-name">
                {displayName}
              </h2>
              <p className="text-sm text-muted-foreground" data-testid="text-chat-status">
                {getStatusText()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" data-testid="button-search-chat">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" data-testid="button-voice-call">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" data-testid="button-video-call">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" data-testid="button-chat-menu">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="messages-container">
        {isMessagesLoading ? (
          <div className="flex justify-center">
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        ) : Object.keys(messageGroups).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center">
              <h3 className="text-lg font-medium text-foreground mb-2">No messages yet</h3>
              <p className="text-muted-foreground">Start the conversation by sending a message!</p>
            </div>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex justify-center mb-4">
                <span className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                  {formatDateHeader(date)}
                </span>
              </div>
              
              {/* Messages for this date */}
              <div className="space-y-2">
                {dateMessages.map((message, index) => {
                  const isOwn = message.senderId === (user as any)?.id;
                  const showAvatar = !isOwn && (
                    index === 0 || 
                    dateMessages[index - 1].senderId !== message.senderId
                  );
                  
                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={isOwn}
                      showAvatar={showAvatar}
                      onReply={setReplyTo}
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput
        chatId={chatId}
        replyTo={replyTo}
        onClearReply={() => setReplyTo(undefined)}
      />
    </div>
  );
}
