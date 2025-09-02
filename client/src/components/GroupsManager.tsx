import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { 
  Users, 
  Hash, 
  Plus, 
  Search, 
  Settings, 
  UserPlus,
  Crown,
  MessageCircle,
  Lock,
  Globe
} from "lucide-react";

interface Group {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  isGroup: boolean;
  isChannel: boolean;
  isPrivate: boolean;
  memberCount: number;
  isAdmin: boolean;
  lastActivity?: string;
  unreadCount: number;
}

export default function GroupsManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Form state for creating groups/channels
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPrivate: false,
    isChannel: false,
  });

  // Fetch groups and channels
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["/api/groups"],
    queryFn: async () => {
      const response = await fetch("/api/groups");
      if (!response.ok) throw new Error("Failed to fetch groups");
      return response.json();
    },
  });

  // Create group/channel mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          isGroup: true,
          isChannel: data.isChannel,
          isPrivate: data.isPrivate,
        }),
      });
      if (!response.ok) throw new Error("Failed to create group");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setIsCreateOpen(false);
      setFormData({ name: "", description: "", isPrivate: false, isChannel: false });
      toast({ title: formData.isChannel ? "Kanal yaratildi" : "Guruh yaratildi" });
    },
  });

  const filteredGroups = groups.filter((group: Group) => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = 
      (activeTab === "channels" && group.isChannel) ||
      (activeTab === "all");

    return matchesSearch && matchesTab;
  });

  const GroupItem = ({ group }: { group: Group }) => (
    <Card className="hover:bg-accent cursor-pointer transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={group.avatarUrl} alt={group.name} />
              <AvatarFallback>
                {group.isChannel ? (
                  <Hash className="h-6 w-6" />
                ) : (
                  <Users className="h-6 w-6" />
                )}
              </AvatarFallback>
            </Avatar>
            {group.isPrivate && (
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
                <Lock className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate">{group.name}</h3>
              {group.isAdmin && <Crown className="h-4 w-4 text-yellow-500" />}
              {group.unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {group.unreadCount}
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground truncate">
              {group.description || `${group.memberCount} a'zo`}
            </p>

            <div className="flex items-center gap-4 mt-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {group.memberCount}
              </span>
              {group.lastActivity && (
                <span className="text-xs text-muted-foreground">
                  {new Date(group.lastActivity).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <MessageCircle className="h-4 w-4" />
            </Button>
            {group.isAdmin && (
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Guruhlar</h2>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Yaratish
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {formData.isChannel ? "Yangi kanal yaratish" : "Yangi guruh yaratish"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is-channel"
                      checked={formData.isChannel}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, isChannel: checked }))
                      }
                    />
                    <Label htmlFor="is-channel">Kanal</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">
                    {formData.isChannel ? "Kanal nomi" : "Guruh nomi"}
                  </Label>
                  <Input
                    id="name"
                    placeholder={formData.isChannel ? "Kanal nomini kiriting" : "Guruh nomini kiriting"}
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Tavsif (ixtiyoriy)</Label>
                  <Textarea
                    id="description"
                    placeholder="Qisqa tavsif yozing..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-private"
                    checked={formData.isPrivate}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, isPrivate: checked }))
                    }
                  />
                  <Label htmlFor="is-private" className="flex items-center gap-2">
                    {formData.isPrivate ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                    {formData.isPrivate ? "Maxfiy" : "Ochiq"}
                  </Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Bekor qilish
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => createGroupMutation.mutate(formData)}
                    disabled={!formData.name.trim() || createGroupMutation.isPending}
                  >
                    {createGroupMutation.isPending ? "Yaratilmoqda..." : "Yaratish"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">Barchasi</TabsTrigger>
            <TabsTrigger value="channels">Kanallar</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Groups/Channels List */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-8">
            <div className="mb-4">
              {formData.isChannel ? (
                <Hash className="h-12 w-12 text-muted-foreground mx-auto" />
              ) : (
                <Users className="h-12 w-12 text-muted-foreground mx-auto" />
              )}
            </div>
            <h3 className="font-medium mb-2">
              {searchQuery ? "Natija topilmadi" : "Guruhlar yo'q"}
            </h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery 
                ? "Boshqa nom bilan qidirib ko'ring" 
                : "Yangi guruh yoki kanal yaratish uchun yuqoridagi "Yaratish" tugmasini bosing"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGroups.map((group: Group) => (
              <GroupItem key={group.id} group={group} />
            ))}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="p-4 border-t bg-muted/30">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            Guruhlar: {groups.filter((g: Group) => g.isGroup && !g.isChannel).length}
          </span>
          <span>
            Kanallar: {groups.filter((g: Group) => g.isChannel).length}
          </span>
        </div>
      </div>
    </div>
  );
}