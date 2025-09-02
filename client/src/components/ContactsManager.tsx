
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { 
  Search, 
  UserPlus, 
  MoreVertical, 
  Star, 
  MessageCircle, 
  Phone, 
  Video, 
  Ban, 
  Flag, 
  Users,
  Filter,
  Download,
  Upload,
  UserMinus,
  Eye,
  EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";

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

  // Fetch contacts
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["/api/users/contacts"],
    queryFn: async () => {
      const response = await fetch("/api/users/contacts");
      if (!response.ok) throw new Error("Failed to fetch contacts");
      return response.json();
    },
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

  const ContactItem = ({ contact }: { contact: Contact }) => (
    <div 
      className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
      onClick={() => handleStartChat(contact.id)}
    >
      <div className="relative">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
          {contact.displayName?.charAt(0)?.toUpperCase() || contact.username?.charAt(0)?.toUpperCase() || "?"}
        </div>
        {contact.isOnline && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm truncate">
            {contact.nickname || contact.displayName}
          </h3>
          <span className="text-xs text-gray-500">
            {contact.isOnline ? "Online" : getLastSeenText(contact.lastSeen)}
          </span>
        </div>

        <p className="text-xs text-gray-600 truncate mt-1">
          @{contact.username}
        </p>

        <div className="flex items-center gap-1 mt-1">
          <MessageCircle className="h-4 w-4" />
          <span className="text-xs text-gray-400">Shaxsiy</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-2 border-b">
        <h2 className="text-lg font-semibold mb-2">Kontaktlar</h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Kontaktlarni qidiring..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {searchQuery ? "Kontakt topilmadi" : "Hali kontaktlar yo'q"}
              </p>
              <p className="text-xs text-gray-400">
                {searchQuery ? "Boshqa nom bilan qidirib ko'ring" : "Kontakt qo'shish uchun Quick Actions dan foydalaning"}
              </p>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <ContactItem key={contact.id} contact={contact} />
            ))
          )}
        </div>
      </div>

      {/* Stats Footer */}
      <div className="p-2 border-t bg-muted/30">
        <div className="text-center text-sm text-muted-foreground">
          Jami kontaktlar: {contacts.length}
        </div>
      </div>
    </div>
  );
}
