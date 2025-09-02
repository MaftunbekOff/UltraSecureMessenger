import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { 
  Search, 
  UserPlus, 
  Users,
  MessageCircle,
  Plus
} from "lucide-react";

interface Contact {
  id: string;
  displayName: string;
  username?: string;
  email?: string;
  profileImageUrl?: string;
  isOnline: boolean;
  lastSeen?: string;
  nickname?: string;
  isFavorite: boolean;
  isBlocked: boolean;
  presenceStatus: string;
  mutualFriends: number;
}

interface ContactsManagerProps {
  onChatCreated?: (chatId: string) => void;
}

export default function ContactsManager({ onChatCreated }: ContactsManagerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // Fetch contacts
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["/api/users/contacts"],
    queryFn: async () => {
      const response = await fetch("/api/users/contacts");
      if (!response.ok) throw new Error("Failed to fetch contacts");
      return response.json();
    },
  });

  // Search users for new contact
  const { data: searchResults = [] } = useQuery({
    queryKey: ["/api/users/search", userSearchQuery],
    enabled: userSearchQuery.length > 0,
  });

  // Create direct chat mutation
  const createDirectChatMutation = useMutation({
    mutationFn: async (otherUserId: string) => {
      const response = await fetch("/api/chats/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId }),
      });
      if (!response.ok) throw new Error("Failed to create direct chat");
      return response.json();
    },
    onSuccess: (chat) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      onChatCreated?.(chat.id);
      toast({ title: "Chat yaratildi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Chat yaratib bo'lmadi", variant: "destructive" });
    },
  });

  const handleStartChat = (contactId: string) => {
    createDirectChatMutation.mutate(contactId);
  };

  // Filter contacts based on search
  const filteredContacts = contacts.filter((contact: Contact) => {
    const matchesSearch = 
      contact.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch && !contact.isBlocked;
  });

  const getLastSeenText = (lastSeen?: string) => {
    if (!lastSeen) return "";
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 5) return "Hozir";
    if (diffMins < 60) return `${diffMins} daqiqa oldin`;
    if (diffHours < 24) return `${diffHours} soat oldin`;
    return `${diffDays} kun oldin`;
  };

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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search contacts */}
      <div className="px-3 py-1 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Kontaktlarni qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-8"
          />
        </div>
      </div>

      {/* Contacts List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Kontaktlar yo'q</p>
            <p className="text-xs text-gray-400">Yangi kontakt qo'shish uchun qidiring</p>
          </div>
        ) : (
          filteredContacts.map((contact, index) => (
            <div
              key={`contact-${contact.id}-${index}`}
              onClick={() => handleStartChat(contact.id)}
              className="flex items-center gap-2 px-2 py-1.5 cursor-pointer transition-colors hover:bg-gray-50"
            >
              {/* Contact avatar */}
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {(contact.displayName || contact.username || contact.email || "U").charAt(0).toUpperCase()}
                </div>
                {contact.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>

              {/* Contact info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm truncate">
                    {contact.nickname || contact.displayName || contact.username || contact.email}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {contact.isOnline ? "Online" : getLastSeenText(contact.lastSeen)}
                  </span>
                </div>

                <p className="text-xs text-gray-600 truncate mt-1">
                  @{contact.username || contact.email}
                </p>

                <div className="flex items-center gap-1 mt-1">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-xs text-gray-400">Shaxsiy</span>
                </div>
              </div>
            </div>
          ))
        )}
      </ScrollArea>
    </div>
  );
}