
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
  Plus,
  Users,
  Hash,
  Lock,
  Globe,
  Settings,
  UserPlus
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Group {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  memberCount: number;
  isPrivate: boolean;
  isAdmin: boolean;
  lastActivity?: string;
  unreadCount?: number;
}

interface GroupsManagerProps {
  onChatCreated?: (chatId: string) => void;
}

export default function GroupsManager({ onChatCreated }: GroupsManagerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({
    name: "",
    description: "",
    isPrivate: false,
  });

  // Fetch groups
  const { data: groups = [], isLoading } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
    refetchInterval: 30000,
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: typeof groupForm) => {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(groupData),
      });
      if (!response.ok) throw new Error("Failed to create group");
      return response.json();
    },
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      setGroupForm({ name: "", description: "", isPrivate: false });
      setIsCreateGroupOpen(false);
      onChatCreated?.(newGroup.chatId);
      toast({
        title: "Guruh yaratildi",
        description: "Yangi guruh muvaffaqiyatli yaratildi.",
      });
    },
  });

  const filteredGroups = groups.filter(group => {
    const searchLower = searchQuery.toLowerCase();
    return (
      group.name?.toLowerCase().includes(searchLower) ||
      group.description?.toLowerCase().includes(searchLower)
    );
  });

  const handleJoinGroup = (groupId: string) => {
    // Navigate to group chat
    onChatCreated?.(groupId);
  };

  const formatLastActivity = (lastActivity?: string) => {
    if (!lastActivity) return "Faollik yo'q";
    const date = new Date(lastActivity);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;

    if (diffInHours < 1) return "Hozir faol";
    if (diffInHours < 24) return `${Math.floor(diffInHours)} soat oldin`;
    return date.toLocaleDateString('uz-UZ');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Guruhlar</h2>
          <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8">
                <Plus className="h-4 w-4 mr-1" />
                Yaratish
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yangi guruh yaratish</DialogTitle>
                <DialogDescription>
                  Yangi guruh yarating va do'stlaringizni taklif qiling
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="group-name">Guruh nomi</Label>
                  <Input
                    id="group-name"
                    placeholder="Guruh nomini kiriting..."
                    value={groupForm.name}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="group-description">Ta'rif (ixtiyoriy)</Label>
                  <Textarea
                    id="group-description"
                    placeholder="Guruh haqida qisqacha ma'lumot..."
                    value={groupForm.description}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="private-group"
                    checked={groupForm.isPrivate}
                    onCheckedChange={(checked) => setGroupForm(prev => ({ ...prev, isPrivate: checked }))}
                  />
                  <Label htmlFor="private-group">Maxfiy guruh</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateGroupOpen(false)}
                  >
                    Bekor qilish
                  </Button>
                  <Button
                    onClick={() => createGroupMutation.mutate(groupForm)}
                    disabled={!groupForm.name.trim() || createGroupMutation.isPending}
                  >
                    Yaratish
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Guruhlarni qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Groups List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">Guruhlar topilmadi</p>
              <p className="text-sm text-gray-400">
                {groups.length === 0 ? "Hali guruhlarga a'zo emassiz" : "Qidiruv bo'yicha natija yo'q"}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setIsCreateGroupOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Birinchi guruhni yarating
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredGroups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => handleJoinGroup(group.id)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                      {group.name?.charAt(0) || "G"}
                    </div>
                    {group.isPrivate ? (
                      <Lock className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-500 text-white rounded-full p-0.5" />
                    ) : (
                      <Globe className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 text-white rounded-full p-0.5" />
                    )}
                  </div>

                  {/* Group Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium truncate flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        {group.name}
                      </h3>
                      <div className="flex items-center gap-1">
                        {group.unreadCount && group.unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 min-w-5 text-xs px-1">
                            {group.unreadCount > 99 ? "99+" : group.unreadCount}
                          </Badge>
                        )}
                        {group.isAdmin && (
                          <Badge variant="secondary" className="text-xs">Admin</Badge>
                        )}
                      </div>
                    </div>
                    
                    {group.description && (
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {group.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {group.memberCount} a'zo
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatLastActivity(group.lastActivity)}
                      </span>
                      {group.isPrivate && (
                        <Badge variant="outline" className="text-xs px-1">
                          <Lock className="h-3 w-3 mr-1" />
                          Maxfiy
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {group.isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle group settings
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle invite members
                      }}
                    >
                      <UserPlus className="h-4 w-4" />
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
