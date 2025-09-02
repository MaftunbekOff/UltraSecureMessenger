import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { 
  Plus, 
  MessageCircle, 
  Users, 
  Hash, 
  UserPlus, 
  Search,
  Lock,
  Globe,
  Edit3
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  onNewChat?: () => void;
  onNewGroup?: () => void;
  onFileUpload?: () => void;
}

export function QuickActions({ onNewChat, onNewGroup, onFileUpload }: QuickActionsProps) {
  const queryClient = useQueryClient();
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);

  // Form states
  const [groupForm, setGroupForm] = useState({
    name: "",
    description: "",
    username: "",
    isPrivate: false,
  });

  const [groupUsernameInput, setGroupUsernameInput] = useState("");

  const [channelForm, setChannelForm] = useState({
    name: "",
    description: "",
    username: "",
    isPrivate: false,
  });

  const [channelUsernameInput, setChannelUsernameInput] = useState("");

  const [newContactQuery, setNewContactQuery] = useState("");

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

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: typeof groupForm) => {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          username: data.username,
          isGroup: true,
          isChannel: false,
          isPrivate: data.isPrivate,
        }),
      });
      if (!response.ok) throw new Error("Failed to create group");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      setIsCreateGroupOpen(false);
      setGroupForm({ name: "", description: "", username: "", isPrivate: false });
      setGroupUsernameInput("");
      toast({ title: "Guruh yaratildi" });
    },
  });

  // Create channel mutation
  const createChannelMutation = useMutation({
    mutationFn: async (data: typeof channelForm) => {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          username: data.username,
          isGroup: true,
          isChannel: true,
          isPrivate: data.isPrivate,
        }),
      });
      if (!response.ok) throw new Error("Failed to create channel");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      setIsCreateChannelOpen(false);
      setChannelForm({ name: "", description: "", username: "", isPrivate: false });
      setChannelUsernameInput("");
      toast({ title: "Kanal yaratildi" });
    },
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

  const actions = [
    { 
      icon: MessageCircle, 
      label: "Yangi chat", 
      action: () => {
        onNewChat?.();
        setIsActionsOpen(false);
      }, 
      color: "bg-blue-500" 
    },
    { 
      icon: Users, 
      label: "Yangi guruh", 
      action: () => {
        setIsCreateGroupOpen(true);
        setIsActionsOpen(false);
      }, 
      color: "bg-green-500" 
    },
    { 
      icon: Hash, 
      label: "Yangi kanal", 
      action: () => {
        setIsCreateChannelOpen(true);
        setIsActionsOpen(false);
      }, 
      color: "bg-purple-500" 
    },
    { 
      icon: UserPlus, 
      label: "Kontakt qo'shish", 
      action: () => {
        setIsAddContactOpen(true);
        setIsActionsOpen(false);
      }, 
      color: "bg-orange-500" 
    },
  ];

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        {isActionsOpen && (
          <Card className="mb-4 w-64">
            <CardContent className="p-2">
              {actions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start mb-1 last:mb-0"
                    onClick={action.action}
                  >
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center mr-3", action.color)}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    {action.label}
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        )}

        <Button
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg"
          onClick={() => setIsActionsOpen(!isActionsOpen)}
        >
          <Edit3 className={cn("h-6 w-6 transition-transform", isActionsOpen && "rotate-45")} />
        </Button>
      </div>

      {/* Create Group Dialog */}
      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yangi guruh yaratish</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Guruh nomi</Label>
              <Input
                id="group-name"
                placeholder="Guruh nomini kiriting"
                value={groupForm.name}
                onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            {!groupForm.isPrivate && (
              <div className="space-y-2">
                <Label htmlFor="group-username">
                  Username <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="group-username"
                  placeholder="guruh_nomi"
                  value={groupUsernameInput}
                  onChange={(e) => {
                    let value = e.target.value;

                    // If user typed @, remove it to get clean value
                    if (value.startsWith('@')) {
                      value = value.substring(1);
                    }

                    // If value already ends with 'group', remove it to avoid duplication
                    if (value.endsWith('group')) {
                      value = value.substring(0, value.length - 5);
                    }

                    // Remove invalid characters (only allow letters, numbers, underscore)
                    value = value.replace(/[^a-zA-Z0-9_]/g, '');

                    // Update input state with clean value
                    setGroupUsernameInput(value);

                    // Store clean value with prefix/suffix
                    setGroupForm(prev => ({ 
                      ...prev, 
                      username: value ? `@${value}group` : '' 
                    }));
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Guruh username oxirida group bilan tugashi kerak
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="group-description">Tavsif (ixtiyoriy)</Label>
              <Textarea
                id="group-description"
                placeholder="Qisqa tavsif yozing..."
                value={groupForm.description}
                onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="group-private"
                checked={groupForm.isPrivate}
                onCheckedChange={(checked) => {
                  setGroupForm(prev => ({ 
                    ...prev, 
                    isPrivate: checked,
                    username: checked ? "" : prev.username
                  }));
                  if (checked) {
                    setGroupUsernameInput("");
                  }
                }}
              />
              <Label htmlFor="group-private" className="flex items-center gap-2">
                {groupForm.isPrivate ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                {groupForm.isPrivate ? "Maxfiy guruh" : "Ochiq guruh"}
              </Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsCreateGroupOpen(false);
                  setGroupUsernameInput("");
                }}
              >
                Bekor qilish
              </Button>
              <Button
                className="flex-1"
                onClick={() => createGroupMutation.mutate(groupForm)}
                disabled={
                  !groupForm.name.trim() || 
                  (!groupForm.isPrivate && (!groupForm.username.trim() || !groupForm.username.endsWith('group'))) ||
                  createGroupMutation.isPending
                }
              >
                {createGroupMutation.isPending ? "Yaratilmoqda..." : "Yaratish"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Channel Dialog */}
      <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yangi kanal yaratish</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="channel-name">Kanal nomi</Label>
              <Input
                id="channel-name"
                placeholder="Kanal nomini kiriting"
                value={channelForm.name}
                onChange={(e) => setChannelForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            {!channelForm.isPrivate && (
              <div className="space-y-2">
                <Label htmlFor="channel-username">
                  Username <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="channel-username"
                  placeholder="kanal_nomi"
                  value={channelUsernameInput}
                  onChange={(e) => {
                    let value = e.target.value;

                    // If user typed @, remove it to get clean value
                    if (value.startsWith('@')) {
                      value = value.substring(1);
                    }

                    // If value already ends with 'channel', remove it to avoid duplication
                    if (value.endsWith('channel')) {
                      value = value.substring(0, value.length - 7);
                    }

                    // Remove invalid characters (only allow letters, numbers, underscore)
                    value = value.replace(/[^a-zA-Z0-9_]/g, '');

                    // Update input state with clean value
                    setChannelUsernameInput(value);

                    // Store clean value with prefix/suffix
                    setChannelForm(prev => ({ 
                      ...prev, 
                      username: value ? `@${value}channel` : '' 
                    }));
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Kanal username oxirida channel bilan tugashi kerak
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="channel-description">Tavsif (ixtiyoriy)</Label>
              <Textarea
                id="channel-description"
                placeholder="Qisqa tavsif yozing..."
                value={channelForm.description}
                onChange={(e) => setChannelForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="channel-private"
                checked={channelForm.isPrivate}
                onCheckedChange={(checked) => {
                  setChannelForm(prev => ({ 
                    ...prev, 
                    isPrivate: checked,
                    username: checked ? "" : prev.username
                  }));
                  if (checked) {
                    setChannelUsernameInput("");
                  }
                }}
              />
              <Label htmlFor="channel-private" className="flex items-center gap-2">
                {channelForm.isPrivate ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                {channelForm.isPrivate ? "Maxfiy kanal" : "Ochiq kanal"}
              </Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsCreateChannelOpen(false);
                  setChannelUsernameInput("");
                }}
              >
                Bekor qilish
              </Button>
              <Button
                className="flex-1"
                onClick={() => createChannelMutation.mutate(channelForm)}
                disabled={
                  !channelForm.name.trim() || 
                  (!channelForm.isPrivate && (!channelForm.username.trim() || !channelForm.username.endsWith('channel'))) ||
                  createChannelMutation.isPending
                }
              >
                {createChannelMutation.isPending ? "Yaratilmoqda..." : "Yaratish"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Contact Dialog */}
      <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
        <DialogContent className="sm:max-w-md">
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

              {newContactQuery && !isSearching && searchResults.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  Natija topilmadi
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}