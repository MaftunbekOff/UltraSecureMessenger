
import React, { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { X, Camera, Palette, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface StatusComposerProps {
  onClose: () => void;
}

const backgroundColors = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9"
];

export default function StatusComposer({ onClose }: StatusComposerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [content, setContent] = useState("");
  const [backgroundColor, setBackgroundColor] = useState(backgroundColors[0]);
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>("");

  const createStatusMutation = useMutation({
    mutationFn: async (statusData: any) => {
      let mediaUrl = "";
      
      if (mediaFile) {
        const formData = new FormData();
        formData.append("file", mediaFile);
        
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          mediaUrl = uploadData.fileUrl;
        }
      }

      const response = await fetch("/api/users/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...statusData,
          mediaUrl: mediaUrl || undefined,
          mediaType: mediaFile ? (mediaFile.type.startsWith('image/') ? 'image' : 'video') : undefined,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to create status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/statuses`] });
      toast({ title: "Status posted successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to post status", variant: "destructive" });
    },
  });

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large. Maximum size is 10MB.", variant: "destructive" });
      return;
    }

    setMediaFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePost = () => {
    if (!content.trim() && !mediaFile) {
      toast({ title: "Please add some content or media", variant: "destructive" });
      return;
    }

    createStatusMutation.mutate({
      content: content.trim(),
      backgroundColor,
      textColor,
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Add Status
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.profileImageUrl || ""} />
              <AvatarFallback>
                {(user?.displayName || user?.firstName || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {user?.displayName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim()}
              </p>
              <Badge variant="secondary" className="text-xs">
                Expires in 24h
              </Badge>
            </div>
          </div>

          {/* Media Preview */}
          {mediaPreview && (
            <div className="relative">
              <img
                src={mediaPreview}
                alt="Status preview"
                className="w-full max-h-48 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  setMediaFile(null);
                  setMediaPreview("");
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Content Input */}
          <div className="space-y-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share what's on your mind..."
              className="resize-none"
              rows={3}
              maxLength={280}
              style={{
                backgroundColor: backgroundColor + "20",
                color: textColor === "#FFFFFF" ? "inherit" : textColor,
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{content.length}/280</span>
            </div>
          </div>

          {/* Background Colors */}
          <div className="space-y-2">
            <Label className="flex items-center text-sm">
              <Palette className="h-4 w-4 mr-2" />
              Background Color
            </Label>
            <div className="flex space-x-2">
              {backgroundColors.map((color) => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded-full border-2 ${
                    backgroundColor === color ? "border-primary" : "border-muted"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setBackgroundColor(color)}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={createStatusMutation.isPending}
            >
              <Camera className="h-4 w-4 mr-2" />
              Add Media
            </Button>
            
            <Button
              onClick={handlePost}
              disabled={createStatusMutation.isPending || (!content.trim() && !mediaFile)}
            >
              {createStatusMutation.isPending ? "Posting..." : "Post Status"}
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleMediaUpload}
          />
        </CardContent>
      </Card>
    </div>
  );
}
