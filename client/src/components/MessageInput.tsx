import { useState, useRef, KeyboardEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Paperclip, Smile, Send, X } from "lucide-react";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import type { Message } from "@shared/schema";

interface MessageInputProps {
  chatId: string;
  replyTo?: Message;
  onClearReply?: () => void;
}

export function MessageInput({ chatId, replyTo, onClearReply }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { trackMessageLatency } = usePerformanceMonitor();

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string; replyToId?: string; fileUrl?: string; fileName?: string; fileSize?: number; messageType?: string }) => {
      return apiRequest("POST", `/api/chats/${chatId}/messages`, messageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats", chatId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      setMessage("");
      onClearReply?.();
      adjustTextareaHeight();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Send message with file
      sendMessageMutation.mutate({
        content: `📎 ${data.fileName}`,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        messageType: "file",
        replyToId: replyTo?.id,
      });
      setIsUploading(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!message.trim() || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate({
      content: message,
      messageType: "text",
      replyToId: replyTo?.id,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    uploadFileMutation.mutate(file);
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-4 border-t border-border bg-card">
      {/* Reply Context */}
      {replyTo && (
        <div className="mb-3 p-2 bg-muted/20 rounded-md border-l-2 border-primary">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Replying to</p>
              <p className="text-sm truncate">{replyTo.content}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearReply}
              className="h-6 w-6 p-0 ml-2"
              data-testid="button-clear-reply"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-end space-x-3">
        {/* File Upload */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFileClick}
          disabled={isUploading || sendMessageMutation.isPending}
          data-testid="button-attach-file"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="*/*"
        />

        {/* Message Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            placeholder="Type a message..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            className="resize-none min-h-[40px] max-h-[120px] pr-12"
            rows={1}
            disabled={sendMessageMutation.isPending || isUploading}
            data-testid="textarea-message-input"
          />

          {/* Emoji Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            data-testid="button-emoji"
          >
            <Smile className="h-4 w-4" />
          </Button>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!message.trim() || sendMessageMutation.isPending || isUploading}
          size="sm"
          data-testid="button-send-message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Upload Status */}
      {isUploading && (
        <div className="mt-2 text-sm text-muted-foreground">
          Uploading file...
        </div>
      )}
    </div>
  );
}