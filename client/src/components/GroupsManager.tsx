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

  // Fetch groups only
  const { data: allGroups = [], isLoading } = useQuery({
    queryKey: ["/api/groups"],
    queryFn: async () => {
      const response = await fetch("/api/groups");
      if (!response.ok) throw new Error("Failed to fetch groups");
      return response.json();
    },
  });

  // Filter to show only groups (not channels)
  const groups = allGroups.filter((group: Group) => group.isGroup && !group.isChannel);

  const GroupItem = ({ group }: { group: Group }) => (
    <Card 
      className="hover:bg-accent cursor-pointer transition-colors"
      onClick={() => onChatCreated?.(group.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={group.avatarUrl} alt={group.name} />
              <AvatarFallback>
                <Users className="h-6 w-6" />
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
        <h2 className="text-lg font-semibold">Guruhlar</h2>
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-8">
            <div className="mb-4">
              <Users className="h-12 w-12 text-muted-foreground mx-auto" />
            </div>
            <h3 className="font-medium mb-2">Guruhlar yo'q</h3>
            <p className="text-muted-foreground text-sm">
              Hech qanday guruh mavjud emas
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group: Group) => (
              <GroupItem key={group.id} group={group} />
            ))}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="p-4 border-t bg-muted/30">
        <div className="text-center text-sm text-muted-foreground">
          Jami guruhlar: {groups.length}
        </div>
      </div>
    </div>
  );
}