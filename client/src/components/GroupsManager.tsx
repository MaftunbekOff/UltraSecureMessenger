
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { 
  Users, 
  Search,
  Crown,
  Lock,
  Hash,
  Plus
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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

interface GroupsManagerProps {
  onChatCreated?: (chatId: string) => void;
}

export default function GroupsManager({ onChatCreated }: GroupsManagerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [groupForm, setGroupForm] = useState({
    name: "",
    description: "",
    isPrivate: false,
  });

  // Fetch groups only
  const { data: allGroups = [], isLoading } = useQuery({
    queryKey: ["/api/groups"],
    queryFn: async () => {
      const response = await fetch("/api/groups");
      if (!response.ok) throw new Error("Failed to fetch groups");
      return response.json();
    },
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: typeof groupForm) => {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupData),
      });
      if (!response.ok) throw new Error("Failed to create group");
      return response.json();
    },
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      onChatCreated?.(group.id);
      setGroupForm({ name: "", description: "", isPrivate: false });
      toast({ title: "Guruh yaratildi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Guruh yaratib bo'lmadi", variant: "destructive" });
    },
  });

  // Filter to show only groups (not channels) and apply search
  const filteredGroups = allGroups
    .filter((group: Group) => group.isGroup && !group.isChannel)
    .filter((group: Group) => 
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

  const handleCreateGroup = () => {
    if (groupForm.name.trim()) {
      createGroupMutation.mutate(groupForm);
    }
  };

  return (
    <div className="group-list-container">
      {/* Search */}
      <div className="px-3 py-2 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Guruhlarni qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>

      {/* Groups List */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Hali guruhlar yo'q</p>
              <p className="text-xs text-gray-400">Yangi guruh yaratish uchun pastdagi tugmani bosing</p>
            </div>
          ) : (
            filteredGroups.map((group: Group, groupIndex: number) => (
              <div
                key={`group-${group.id}-${groupIndex}`}
                onClick={() => onChatCreated?.(group.id)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
              >
                {/* Group avatar */}
                <div className="relative">
                  <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  {group.isPrivate && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gray-500 border-2 border-white rounded-full flex items-center justify-center">
                      <Lock className="h-1.5 w-1.5 text-white" />
                    </div>
                  )}
                </div>

                {/* Group info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm truncate flex items-center gap-1">
                      {group.name}
                      {group.isAdmin && <Crown className="h-3 w-3 text-yellow-500" />}
                    </h3>
                    <div className="flex items-center gap-1">
                      {group.unreadCount > 0 && (
                        <Badge variant="destructive" className="h-5 min-w-5 text-xs px-1">
                          {group.unreadCount > 99 ? "99+" : group.unreadCount}
                        </Badge>
                      )}
                      {group.lastActivity && (
                        <span className="text-xs text-gray-500">
                          {formatTime(group.lastActivity)}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 truncate">
                    {group.description || `${group.memberCount} a'zo`}
                  </p>

                  <div className="flex items-center gap-1 mt-1">
                    <Users className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {group.memberCount} a'zo
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      {/* Create Group Button */}
      <div className="p-2 border-t">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Yangi guruh
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Yangi guruh yaratish</DialogTitle>
              <DialogDescription>
                Yangi guruh yaratish uchun nom va tavsifni kiriting
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Guruh nomi"
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
              />
              <Input
                placeholder="Guruh tavsifi (ixtiyoriy)"
                value={groupForm.description}
                onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <DialogTrigger asChild>
                <Button variant="outline">Bekor qilish</Button>
              </DialogTrigger>
              <Button 
                onClick={handleCreateGroup}
                disabled={!groupForm.name.trim() || createGroupMutation.isPending}
              >
                {createGroupMutation.isPending ? "Yaratilmoqda..." : "Yaratish"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
