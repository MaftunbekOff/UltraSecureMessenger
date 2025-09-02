import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Search, Plus, Users, User as UserIcon, MessageCircle, Hash } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";
import type { Chat, User } from "@shared/schema";
import ProfileSettings from "./ProfileSettings";

interface ChatSidebarProps {
  selectedChatId: string | null;
  onChatSelect: (chatId: string) => void;
}

type ChatWithExtras = Chat & {
  lastMessage?: any;
  unreadCount: number;
  otherUser?: User;
};

export function ChatSidebar({ selectedChatId, onChatSelect }: ChatSidebarProps) {
  const { user: loggedInUser } = useAuth(); // Renamed to avoid conflict with fetched user
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"chats" | "groups" | "channels">("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  const queryClient = useQueryClient();

  // Fetch the logged-in user's details (assuming this is what useAuth provides)
  const { data: user, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      const response = await fetch('/api/auth/user', {
        credentials: 'include',
      });
      if (!response.ok) {
        // If user is not authenticated, it might return a 401 or similar
        // Depending on backend, you might want to handle this gracefully
        // For now, we assume a successful fetch or an error
        throw new Error('Not authenticated');
      }
      return response.json();
    },
    // Keep the user data fresh, but don't refetch on every render unless necessary
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });


  // Fetch user's chats
  const { data: chats = [], isLoading: isChatsLoading } = useQuery<ChatWithExtras[]>({
    queryKey: ["/api/chats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Search users for new chat
  const { data: searchResults = [] } = useQuery<User[]>({
    queryKey: ["/api/users/search", userSearchQuery],
    enabled: userSearchQuery.length > 0,
  });

  // Create direct chat mutation
  const createDirectChatMutation = useMutation({
    mutationFn: async (otherUserId: string) => {
      return apiRequest("POST", "/api/chats/direct", { otherUserId });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      setShowNewChatDialog(false);
      setUserSearchQuery("");
      // The response should contain the chat data
      response.json().then((chat: any) => {
        onChatSelect(chat.id);
      });
    },
  });

  // Filter chats based on active tab and search
  const filteredChats = chats.filter(chat => {
    const matchesSearch = searchQuery === "" ||
      (chat.isGroup ? chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) :
       chat.otherUser?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       chat.otherUser?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       chat.otherUser?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()));

    switch (activeTab) {
      case "chats":
        return !chat.isGroup && matchesSearch;
      case "groups":
        return chat.isGroup && matchesSearch;
      case "channels":
        return false; // Channels not implemented yet
      default:
        return matchesSearch;
    }
  });

  const handleCreateDirectChat = (otherUserId: string) => {
    createDirectChatMutation.mutate(otherUserId);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getDisplayName = (chat: ChatWithExtras) => {
    if (chat.isGroup) {
      return chat.name || "Unnamed Group";
    }
    return chat.otherUser?.displayName ||
           `${chat.otherUser?.firstName || ""} ${chat.otherUser?.lastName || ""}`.trim() ||
           chat.otherUser?.email || "Unknown User";
  };

  const getAvatarSrc = (chat: ChatWithExtras) => {
    if (chat.isGroup) {
      return chat.avatarUrl;
    }
    return chat.otherUser?.profileImageUrl;
  };

  const getAvatarFallback = (chat: ChatWithExtras): React.ReactNode => {
    if (chat.isGroup) {
      return <Users className="h-4 w-4" />;
    }
    const name = getDisplayName(chat);
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-card-foreground">UltraSecure</h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              data-testid="button-toggle-theme"
            >
              {theme === "light" ? "🌙" : "☀️"}
            </Button>
            <Button variant="ghost" size="sm" data-testid="button-settings" onClick={() => setShowProfileSettings(true)}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-chats"
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border">
        <Button
          variant={activeTab === "chats" ? "default" : "ghost"}
          className="flex-1 rounded-none"
          onClick={() => setActiveTab("chats")}
          data-testid="button-tab-chats"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Chats
        </Button>
        <Button
          variant={activeTab === "groups" ? "default" : "ghost"}
          className="flex-1 rounded-none"
          onClick={() => setActiveTab("groups")}
          data-testid="button-tab-groups"
        >
          <Users className="h-4 w-4 mr-2" />
          Groups
        </Button>
        <Button
          variant={activeTab === "channels" ? "default" : "ghost"}
          className="flex-1 rounded-none"
          onClick={() => setActiveTab("channels")}
          data-testid="button-tab-channels"
        >
          <Hash className="h-4 w-4 mr-2" />
          Channels
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="p-2 border-b border-border">
        <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
          <DialogTrigger asChild>
            <Button className="w-full" data-testid="button-new-chat">
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-new-chat">
            <DialogHeader>
              <DialogTitle>Start New Chat</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Search users..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                data-testid="input-search-users"
              />
              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchResults.map(searchUser => (
                  <div
                    key={searchUser.id}
                    className="flex items-center justify-between p-2 hover:bg-secondary rounded-md cursor-pointer"
                    onClick={() => handleCreateDirectChat(searchUser.id)}
                    data-testid={`user-result-${searchUser.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={searchUser.profileImageUrl || ""} />
                        <AvatarFallback>
                          {(searchUser.displayName || searchUser.firstName || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {searchUser.displayName || `${searchUser.firstName || ""} ${searchUser.lastName || ""}`.trim()}
                        </p>
                        <p className="text-xs text-muted-foreground">{searchUser.email}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isChatsLoading || isUserLoading ? (
          <div className="p-4 text-center text-muted-foreground">Loading chats...</div>
        ) : filteredChats.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {activeTab === "chats" ? "No direct chats yet" :
             activeTab === "groups" ? "No groups yet" :
             "Channels coming soon"}
          </div>
        ) : (
          filteredChats.map(chat => (
            <div
              key={chat.id}
              className={cn(
                "p-3 hover:bg-secondary cursor-pointer border-b border-border transition-colors",
                selectedChatId === chat.id && "bg-secondary"
              )}
              onClick={() => onChatSelect(chat.id)}
              data-testid={`chat-item-${chat.id}`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={getAvatarSrc(chat) || ""} />
                    <AvatarFallback>{getAvatarFallback(chat)}</AvatarFallback>
                  </Avatar>
                  {!chat.isGroup && chat.otherUser?.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-card-foreground truncate">
                      {getDisplayName(chat)}
                    </h3>
                    {chat.lastMessage && (
                      <span className="text-xs text-muted-foreground">
                        {formatTime(chat.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate">
                      {chat.lastMessage?.content || "No messages yet"}
                    </p>
                    {chat.unreadCount > 0 && (
                      <Badge variant="default" className="ml-2 text-xs">
                        {chat.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* User Profile */}
      {user && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={(user as any)?.profileImageUrl || ""} />
              <AvatarFallback>
                {((user as any)?.displayName || (user as any)?.firstName || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="font-medium text-card-foreground text-sm">
                {(user as any)?.displayName || `${(user as any)?.firstName || ""} ${(user as any)?.lastName || ""}`.trim() || "User"}
              </h4>
              <p className="text-xs text-green-500">Online</p>
            </div>
            <Button variant="ghost" size="sm" data-testid="button-user-menu" onClick={() => setShowProfileSettings(true)}>
              <UserIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Profile Settings Dialog */}
      {showProfileSettings && (
        <Dialog open={showProfileSettings} onOpenChange={setShowProfileSettings}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <ProfileSettings onClose={() => setShowProfileSettings(false)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}