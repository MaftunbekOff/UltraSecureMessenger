import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Search,
  Settings, 
  Crown,
  MessageCircle,
  Lock
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

interface GroupsManagerProps {
  onChatCreated?: (chatId: string) => void;
}

export default function GroupsManager({ onChatCreated }: GroupsManagerProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch groups only
  const { data: allGroups = [], isLoading } = useQuery({
    queryKey: ["/api/groups"],
    queryFn: async () => {
      const response = await fetch("/api/groups");
      if (!response.ok) throw new Error("Failed to fetch groups");
      return response.json();
    },
  });

  // Filter to show only groups (not channels) and apply search
  const filteredGroups = allGroups
    .filter((group: Group) => group.isGroup && !group.isChannel)
    .filter((group: Group) => 
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const GroupItem = ({ group }: { group: Group }) => (
    <div
      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
      onClick={() => onChatCreated?.(group.id)}
    >
      {/* Group avatar */}
      <div className="relative">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
          {group.name.charAt(0).toUpperCase()}
        </div>
        {group.isPrivate && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-500 border-2 border-white rounded-full flex items-center justify-center">
            <Lock className="h-2 w-2 text-white" />
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
                {new Date(group.lastActivity).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-600 truncate mt-1">
          {group.description || `${group.memberCount} a'zo`}
        </p>

        <div className="flex items-center gap-1 mt-1">
          <Users className="h-4 w-4" />
          <span className="text-xs text-gray-400">Guruh</span>
          <span className="text-xs text-gray-400">
            • {group.memberCount} a'zo
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-4">Guruhlar</h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Guruhlarni qidiring..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1 px-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {searchQuery ? "Guruh topilmadi" : "Hali guruhlar yo'q"}
              </p>
              <p className="text-xs text-gray-400">
                {searchQuery ? "Boshqa nom bilan qidirib ko'ring" : "Guruh yaratish uchun Quick Actions dan foydalaning"}
              </p>
            </div>
          ) : (
            filteredGroups.map((group: Group) => (
              <GroupItem key={group.id} group={group} />
            ))
          )}
        </div>
      </div>

      {/* Stats Footer */}
      <div className="p-4 border-t bg-muted/30">
        <div className="text-center text-sm text-muted-foreground">
          Jami guruhlar: {filteredGroups.length}
        </div>
      </div>
    </div>
  );
}