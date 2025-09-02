
import { useState } from "react";
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
  Plus,
  Phone,
  Video,
  MoreVertical
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [newContactQuery, setNewContactQuery] = useState("");

  // Fetch contacts
  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
    refetchInterval: 30000,
  });

  // Search users for adding new contacts
  const { data: searchResults = [] } = useQuery({
    queryKey: ["/api/users/search", newContactQuery],
    queryFn: async () => {
      if (!newContactQuery.trim()) return [];
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(newContactQuery)}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to search users");
      return response.json();
    },
    enabled: !!newContactQuery.trim(),
  });

  // Add contact mutation
  const addContactMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error("Failed to add contact");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setNewContactQuery("");
      setIsAddContactOpen(false);
      toast({
        title: "Kontakt qo'shildi",
        description: "Yangi kontakt muvaffaqiyatli qo'shildi.",
      });
    },
  });

  // Start chat with contact
  const startChatMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ participantId: contactId }),
      });
      if (!response.ok) throw new Error("Failed to create chat");
      return response.json();
    },
    onSuccess: (newChat) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      onChatCreated?.(newChat.id);
    },
  });

  const filteredContacts = contacts.filter(contact => {
    const searchLower = searchQuery.toLowerCase();
    return (
      contact.displayName?.toLowerCase().includes(searchLower) ||
      contact.username?.toLowerCase().includes(searchLower) ||
      contact.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleStartChat = (contactId: string) => {
    startChatMutation.mutate(contactId);
  };

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return "Hali ko'rinmagan";
    const date = new Date(lastSeen);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;

    if (diffInHours < 1) return "Hozir";
    if (diffInHours < 24) return `${Math.floor(diffInHours)} soat oldin`;
    return date.toLocaleDateString('uz-UZ');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Kontaktlar</h2>
          <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8">
                <UserPlus className="h-4 w-4 mr-1" />
                Qo'shish
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yangi kontakt qo'shish</DialogTitle>
                <DialogDescription>
                  Foydalanuvchini qidiring va kontaktlarga qo'shing
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Email yoki username..."
                    value={newContactQuery}
                    onChange={(e) => setNewContactQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {searchResults.length > 0 && (
                  <ScrollArea className="max-h-60">
                    <div className="space-y-2">
                      {searchResults.map((foundUser: any) => (
                        <div
                          key={foundUser.id}
                          className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                              {foundUser.firstName?.charAt(0) || foundUser.email.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">
                                {foundUser.displayName || foundUser.firstName || foundUser.email}
                              </p>
                              <p className="text-sm text-gray-500">@{foundUser.username || foundUser.email}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addContactMutation.mutate(foundUser.id)}
                            disabled={addContactMutation.isPending}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Kontaktlarni qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Contacts List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">Kontaktlar topilmadi</p>
              <p className="text-sm text-gray-400">
                {contacts.length === 0 ? "Hali kontaktlar yo'q" : "Qidiruv bo'yicha natija yo'q"}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                      {contact.displayName?.charAt(0) || contact.email?.charAt(0) || "U"}
                    </div>
                    {contact.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium truncate">
                        {contact.displayName || contact.email}
                      </h3>
                      {contact.isFavorite && (
                        <Badge variant="secondary" className="text-xs">⭐</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      @{contact.username || contact.email}
                    </p>
                    <p className="text-xs text-gray-400">
                      {contact.isOnline ? "Online" : formatLastSeen(contact.lastSeen)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartChat(contact.id)}
                      disabled={startChatMutation.isPending}
                      className="h-8 w-8 p-0"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
