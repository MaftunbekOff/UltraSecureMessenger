
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

export function ContactsManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [newContactQuery, setNewContactQuery] = useState("");

  // Fetch contacts
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["/api/users/contacts"],
    queryFn: async () => {
      const response = await fetch("/api/users/contacts");
      if (!response.ok) throw new Error("Failed to fetch contacts");
      return response.json();
    },
  });

  // Search users for adding contacts
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ["/api/users/search", newContactQuery],
    queryFn: async () => {
      if (!newContactQuery.trim()) return [];
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(newContactQuery)}`);
      if (!response.ok) throw new Error("Failed to search users");
      return response.json();
    },
    enabled: !!newContactQuery.trim(),
  });

  // Add contact mutation
  const addContactMutation = useMutation({
    mutationFn: async ({ contactId, nickname }: { contactId: string; nickname?: string }) => {
      const response = await fetch("/api/users/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId, nickname }),
      });
      if (!response.ok) throw new Error("Failed to add contact");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/contacts"] });
      setIsAddContactOpen(false);
      setNewContactQuery("");
      toast({ title: "Kontakt qo'shildi" });
    },
  });

  // Remove contact mutation
  const removeContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const response = await fetch(`/api/users/contacts/${contactId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to remove contact");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/contacts"] });
      toast({ title: "Kontakt o'chirildi" });
    },
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ contactId, isFavorite }: { contactId: string; isFavorite: boolean }) => {
      const response = await fetch(`/api/users/contacts/${contactId}/favorite`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite }),
      });
      if (!response.ok) throw new Error("Failed to update favorite");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/contacts"] });
    },
  });

  // Block contact mutation
  const blockContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const response = await fetch(`/api/users/contacts/${contactId}/block`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to block contact");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/contacts"] });
      toast({ title: "Kontakt bloklandi" });
    },
  });

  // Filter contacts based on search and filter
  const filteredContacts = contacts.filter((contact: Contact) => {
    const matchesSearch = 
      contact.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = 
      selectedFilter === "all" ||
      (selectedFilter === "online" && contact.isOnline) ||
      (selectedFilter === "offline" && !contact.isOnline) ||
      (selectedFilter === "favorites" && contact.isFavorite) ||
      (selectedFilter === "blocked" && contact.isBlocked);

    return matchesSearch && matchesFilter && !contact.isBlocked;
  });

  const favoriteContacts = filteredContacts.filter((contact: Contact) => contact.isFavorite);
  const onlineContacts = filteredContacts.filter((contact: Contact) => contact.isOnline);
  const offlineContacts = filteredContacts.filter((contact: Contact) => !contact.isOnline);

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
    <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors">
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage src={contact.profileImageUrl} alt={contact.displayName} />
          <AvatarFallback>
            {contact.displayName?.charAt(0)?.toUpperCase() || contact.username?.charAt(0)?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div className={cn(
          "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background",
          contact.isOnline ? "bg-green-500" : "bg-gray-400"
        )} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">
            {contact.nickname || contact.displayName}
          </p>
          {contact.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          @{contact.username}
        </p>
        <p className="text-xs text-muted-foreground">
          {contact.isOnline ? "Online" : getLastSeenText(contact.lastSeen)}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {/* Navigate to chat */}}
          className="h-8 w-8 p-0"
        >
          <MessageCircle className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {/* Navigate to profile */}}>
              <Eye className="h-4 w-4 mr-2" />
              Profilni ko'rish
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => toggleFavoriteMutation.mutate({ 
                contactId: contact.id, 
                isFavorite: !contact.isFavorite 
              })}
            >
              <Star className="h-4 w-4 mr-2" />
              {contact.isFavorite ? "Sevimlilardan o'chirish" : "Sevimlilarga qo'shish"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => removeContactMutation.mutate(contact.id)}>
              <UserMinus className="h-4 w-4 mr-2" />
              Kontaktni o'chirish
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => blockContactMutation.mutate(contact.id)}
              className="text-destructive"
            >
              <Ban className="h-4 w-4 mr-2" />
              Bloklash
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Kontaktlar</h2>
          <div className="flex gap-2">
            <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Qo'shish
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yangi kontakt qo'shish</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Username, email yoki ismni kiriting..."
                      value={newContactQuery}
                      onChange={(e) => setNewContactQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {isSearching && (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    </div>
                  )}
                  
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {searchResults.map((user: any) => (
                      <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.profileImageUrl} alt={user.displayName} />
                          <AvatarFallback>
                            {user.displayName?.charAt(0)?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{user.displayName}</p>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addContactMutation.mutate({ contactId: user.id })}
                          disabled={addContactMutation.isPending}
                        >
                          Qo'shish
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kontaktlarni qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs value={selectedFilter} onValueChange={setSelectedFilter} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">Barchasi</TabsTrigger>
              <TabsTrigger value="favorites">Sevimlilar</TabsTrigger>
              <TabsTrigger value="online">Online</TabsTrigger>
              <TabsTrigger value="offline">Offline</TabsTrigger>
              <TabsTrigger value="blocked">Bloklangan</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Kontaktlar topilmadi</h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery ? "Qidiruv bo'yicha natija yo'q" : "Hali kontaktlar qo'shilmagan"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Favorites Section */}
            {favoriteContacts.length > 0 && selectedFilter === "all" && (
              <div>
                <h3 className="font-medium mb-3 text-sm text-muted-foreground flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Sevimlilar ({favoriteContacts.length})
                </h3>
                <div className="space-y-2">
                  {favoriteContacts.map((contact) => (
                    <ContactItem key={contact.id} contact={contact} />
                  ))}
                </div>
              </div>
            )}

            {/* Online Section */}
            {onlineContacts.length > 0 && selectedFilter === "all" && (
              <div>
                <h3 className="font-medium mb-3 text-sm text-muted-foreground">
                  Online ({onlineContacts.length})
                </h3>
                <div className="space-y-2">
                  {onlineContacts.filter(c => !c.isFavorite).map((contact) => (
                    <ContactItem key={contact.id} contact={contact} />
                  ))}
                </div>
              </div>
            )}

            {/* Offline Section */}
            {offlineContacts.length > 0 && selectedFilter === "all" && (
              <div>
                <h3 className="font-medium mb-3 text-sm text-muted-foreground">
                  Offline ({offlineContacts.length})
                </h3>
                <div className="space-y-2">
                  {offlineContacts.filter(c => !c.isFavorite).map((contact) => (
                    <ContactItem key={contact.id} contact={contact} />
                  ))}
                </div>
              </div>
            )}

            {/* All other filters */}
            {selectedFilter !== "all" && (
              <div className="space-y-2">
                {filteredContacts.map((contact) => (
                  <ContactItem key={contact.id} contact={contact} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="p-4 border-t bg-muted/30">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Jami kontaktlar: {contacts.length}</span>
          <span>Online: {contacts.filter((c: Contact) => c.isOnline).length}</span>
        </div>
      </div>
    </div>
  );
}
