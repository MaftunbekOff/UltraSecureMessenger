import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
  MessageCircle,
  Phone,
  Video,
  MoreHorizontal,
  Check,
  Clock,
  MapPin,
  Globe,
  Calendar,
  Users,
  Activity,
  Star,
  UserPlus,
  UserMinus,
  Block,
  LogOut, // Added LogOut icon
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface UserProfileProps {
  userId: string;
  onClose: () => void;
  onStartChat?: (userId: string) => void;
}

export default function UserProfile({ userId, onClose, onStartChat }: UserProfileProps) {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("about");

  const { data: profileData, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}/profile`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/profile`);
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json();
    },
  });

  const { data: userStatuses } = useQuery({
    queryKey: [`/api/users/${userId}/statuses`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/statuses`);
      if (!response.ok) throw new Error("Failed to fetch statuses");
      return response.json();
    },
  });

  const addContactMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/users/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: userId }),
      });
      if (!response.ok) throw new Error("Failed to add contact");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/profile`] });
      toast({ title: "Contact added successfully" });
    },
  });

  const removeContactMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/users/contacts/${userId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to remove contact");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/profile`] });
      toast({ title: "Contact removed" });
    },
  });

  // Added logout handler
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      queryClient.clear();
      window.location.href = '/login';
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  if (isLoading || !profileData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;
  const canSeeFullProfile = profileData.profileVisibility === "everyone" || 
                           profileData.isContact || 
                           isOwnProfile;

  const getLastSeenText = () => {
    if (profileData.lastSeenVisibility === "nobody" && !isOwnProfile) {
      return null;
    }

    if (profileData.isOnline) {
      return "Online";
    }

    if (profileData.lastSeen) {
      const lastSeen = new Date(profileData.lastSeen);
      const now = new Date();
      const diffMs = now.getTime() - lastSeen.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Last seen just now";
      if (diffMins < 60) return `Last seen ${diffMins} min ago`;
      if (diffHours < 24) return `Last seen ${diffHours}h ago`;
      if (diffDays < 7) return `Last seen ${diffDays}d ago`;
      return "Last seen recently";
    }

    return "Last seen recently";
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <div className="text-center space-y-4">
        <div className="relative">
          <Avatar className="h-32 w-32 mx-auto">
            <AvatarImage src={profileData.profileImageUrl || ""} />
            <AvatarFallback className="text-2xl">
              {(profileData.displayName || profileData.firstName || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {profileData.isOnline && (
            <div className="absolute bottom-2 right-1/2 transform translate-x-6 w-6 h-6 bg-green-500 border-4 border-background rounded-full" />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <h1 className="text-2xl font-bold">
              {profileData.displayName || `${profileData.firstName || ""} ${profileData.lastName || ""}`.trim()}
            </h1>
            {profileData.isVerified && (
              <Badge className="flex items-center">
                <Check className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>

          {profileData.username && (
            <p className="text-muted-foreground">@{profileData.username}</p>
          )}

          {getLastSeenText() && (
            <p className="text-sm text-muted-foreground flex items-center justify-center">
              <Clock className="h-3 w-3 mr-1" />
              {getLastSeenText()}
            </p>
          )}

          {profileData.statusMessage && (
            <p className="text-sm italic text-muted-foreground">"{profileData.statusMessage}"</p>
          )}
        </div>

        {/* Action Buttons */}
        {!isOwnProfile && (
          <div className="flex justify-center space-x-2">
            <Button onClick={() => onStartChat?.(userId)}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>
            <Button variant="outline">
              <Phone className="h-4 w-4 mr-2" />
              Call
            </Button>
            <Button variant="outline">
              <Video className="h-4 w-4 mr-2" />
              Video
            </Button>
            {profileData.isContact ? (
              <Button
                variant="outline"
                onClick={() => removeContactMutation.mutate()}
                disabled={removeContactMutation.isPending}
              >
                <UserMinus className="h-4 w-4 mr-2" />
                Remove
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => addContactMutation.mutate()}
                disabled={addContactMutation.isPending}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            )}
          </div>
        )}
      </div>

      {canSeeFullProfile && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-4">
            {profileData.bio && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm leading-relaxed">{profileData.bio}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6 space-y-4">
                {profileData.location && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profileData.location}</span>
                  </div>
                )}

                {profileData.website && (
                  <div className="flex items-center space-x-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={profileData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {profileData.website}
                    </a>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Joined {new Date(profileData.joinedAt || profileData.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {profileData.mutualContacts > 0 && (
                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profileData.mutualContacts} mutual contacts</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            {userStatuses && userStatuses.length > 0 ? (
              <div className="grid gap-4">
                {userStatuses.map((status: any) => (
                  <Card key={status.id}>
                    <CardContent className="pt-6">
                      {status.mediaUrl && (
                        <div className="mb-4">
                          {status.mediaType === "image" ? (
                            <img
                              src={status.mediaUrl}
                              alt="Status media"
                              className="w-full max-h-64 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                              <span className="text-muted-foreground">Media</span>
                            </div>
                          )}
                        </div>
                      )}
                      {status.content && (
                        <p className="text-sm mb-2">{status.content}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{new Date(status.createdAt).toLocaleString()}</span>
                        <span>{status.viewCount} views</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No status updates yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Profile completion: {profileData.profileCompletionScore || 0}%</span>
                  </div>

                  {profileData.badges && profileData.badges.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Badges</h4>
                      <div className="flex flex-wrap gap-2">
                        {profileData.badges.map((badge: any) => (
                          <Badge key={badge.id} variant="outline">
                            {badge.badgeType.replace("_", " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Add Logout Button for the current user's profile */}
      {isOwnProfile && (
        <div className="flex justify-center mt-4">
          <Button variant="destructive" onClick={handleLogout} className="w-full max-w-xs">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      )}
    </div>
  );
}