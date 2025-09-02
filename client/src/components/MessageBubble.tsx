import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { MoreHorizontal, Reply, Heart, Copy, Edit, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message, User } from "@shared/schema";

interface MessageBubbleProps {
  message: Message & { sender: User; replyTo?: Message };
  isOwn: boolean;
  showAvatar?: boolean;
  onReply?: (message: Message) => void;
}

export function MessageBubble({ message, isOwn, showAvatar = true, onReply }: MessageBubbleProps) {
  const { user } = useAuth();
  const [showActions, setShowActions] = useState(false);

  // React to message mutation
  const addReactionMutation = useMutation({
    mutationFn: async (emoji: string) => {
      return apiRequest("POST", `/api/messages/${message.id}/reactions`, { emoji });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats", message.chatId, "messages"] });
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/messages/${message.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats", message.chatId, "messages"] });
    },
  });

  const formatTime = (timestamp: string | Date | null) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleReaction = (emoji: string) => {
    addReactionMutation.mutate(emoji);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || "");
  };

  const handleDelete = () => {
    deleteMessageMutation.mutate();
  };

  const handleReply = () => {
    onReply?.(message);
  };

  if (message.isDeleted) {
    return (
      <div className="flex justify-center py-2">
        <span className="text-xs text-muted-foreground italic">This message was deleted</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full group",
        isOwn ? "justify-end" : "justify-start"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      data-testid={`message-${message.id}`}
    >
      <div className={cn("flex max-w-[75%]", isOwn ? "flex-row-reverse" : "flex-row")}>
        {/* Avatar */}
        {showAvatar && !isOwn && (
          <Avatar className="h-8 w-8 mt-1">
            <AvatarImage src={message.sender.profileImageUrl || ""} />
            <AvatarFallback>
              {(message.sender.displayName || message.sender.firstName || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}

        {/* Message Content */}
        <div className={cn("mx-2", showAvatar && !isOwn && "ml-2")}>
          {/* Reply Context */}
          {message.replyTo && (
            <div className="mb-1 p-2 border-l-2 border-muted-foreground/30 bg-muted/20 rounded text-xs">
              <p className="text-muted-foreground truncate">
                Replying to: {message.replyTo.content}
              </p>
            </div>
          )}

          {/* Main Message */}
          <div
            className={cn(
              "rounded-2xl px-4 py-2 relative",
              isOwn
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground"
            )}
          >
            {/* Sender Name (for group chats, non-own messages) */}
            {!isOwn && showAvatar && (
              <div className="text-xs font-medium mb-1 opacity-75">
                {message.sender.displayName || 
                 `${message.sender.firstName || ""} ${message.sender.lastName || ""}`.trim() ||
                 "Unknown User"}
              </div>
            )}

            {/* Message Content */}
            <div className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </div>

            {/* Message Info */}
            <div className="flex items-center justify-end mt-1 space-x-1">
              <span className="text-xs opacity-75">
                {formatTime(message.createdAt)}
              </span>
              {message.isEdited && (
                <span className="text-xs opacity-50">edited</span>
              )}
              {isOwn && (
                <div className="text-xs opacity-75">
                  ✓✓
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message Actions */}
        {showActions && (
          <div className={cn(
            "flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity",
            isOwn ? "flex-row-reverse mr-2" : "ml-2"
          )}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReply}
              className="h-6 w-6 p-0"
              data-testid={`button-reply-${message.id}`}
            >
              <Reply className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction("❤️")}
              className="h-6 w-6 p-0"
              data-testid={`button-react-${message.id}`}
            >
              <Heart className="h-3 w-3" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  data-testid={`button-actions-${message.id}`}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwn ? "end" : "start"}>
                <DropdownMenuItem onClick={handleCopy} data-testid={`action-copy-${message.id}`}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </DropdownMenuItem>
                {isOwn && (
                  <>
                    <DropdownMenuItem data-testid={`action-edit-${message.id}`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-destructive focus:text-destructive"
                      data-testid={`action-delete-${message.id}`}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}
