import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatArea } from "@/components/ChatArea";
import PerformanceDashboard from "@/components/PerformanceDashboard";
import ProfileSettings from "@/components/ProfileSettings";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { QuickActions } from "@/components/QuickActions";
import { ThemeCustomizer } from "@/components/ThemeCustomizer";
import { AchievementSystem } from "@/components/AchievementSystem";
import { notificationManager } from "@/utils/notifications";
import { useIsMobile } from "@/hooks/use-mobile";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useRouter } from "wouter";
import { Button } from "@/components/ui/button";
import { Activity, LogOut, Settings, User, BarChart3, Palette, Trophy } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Chat() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = '/';
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Check if user is new and needs onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('seen-onboarding');
    if (!hasSeenOnboarding && user) {
      setShowOnboarding(true);
    }

    // Request notification permission
    if (user) {
      notificationManager.requestPermission();
    }
  }, [user]);


  // Handle chat selection
  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  // Handle back from chat (mobile)
  const handleBackToSidebar = () => {
    setSelectedChatId(null);
    setShowSidebar(true);
  };

  // Update sidebar visibility based on screen size
  useEffect(() => {
    if (!isMobile) {
      setShowSidebar(true);
    }
  }, [isMobile]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (showOnboarding) {
    return (
      <OnboardingFlow onClose={() => setShowOnboarding(false)} />
    );
  }

  if (showProfileSettings) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Profile Settings</h2>
          <Button
            variant="outline"
            onClick={() => setShowProfileSettings(false)}
          >
            Back to Chat
          </Button>
        </div>
        <div className="flex-1 overflow-auto">
          <ProfileSettings />
        </div>
      </div>
    );
  }

  if (showPerformanceDashboard) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Performance Dashboard</h2>
          <Button
            variant="outline"
            onClick={() => setShowPerformanceDashboard(false)}
          >
            Back to Chat
          </Button>
        </div>
        <div className="flex-1 overflow-auto">
          <PerformanceDashboard />
        </div>
      </div>
    );
  }

  if (showThemeCustomizer) {
    return (
      <ThemeCustomizer onClose={() => setShowThemeCustomizer(false)} />
    );
  }

  if (showAchievements) {
    return (
      <AchievementSystem onClose={() => setShowAchievements(false)} />
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Mobile: Show sidebar or chat area */}
      {isMobile ? (
        <>
          {showSidebar ? (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImageUrl || ""} />
                    <AvatarFallback>
                      {(user?.firstName || user?.email?.split('@')[0] || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">
                      {user?.displayName || user?.firstName || user?.email?.split('@')[0]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      @{user?.username || user?.email?.split('@')[0]}
                    </span>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setShowProfileSettings(true)}>
                      <User className="h-4 w-4 mr-2" />
                      Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowPerformanceDashboard(true)}
                      title="Performance Dashboard"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Performance
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowThemeCustomizer(true)}
                      title="Mavzu sozlamalari"
                    >
                      <Palette className="h-4 w-4 mr-2" />
                      Mavzu sozlamalari
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowAchievements(true)}
                      title="Yutuqlar"
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      Yutuqlar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => logoutMutation.mutate()}
                      disabled={logoutMutation.isPending}
                      className="text-red-600 focus:text-red-600"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {logoutMutation.isPending ? "Chiqilmoqda..." : "Tizimdan chiqish"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <ChatSidebar
                selectedChatId={selectedChatId}
                onChatSelect={handleChatSelect}
              />
            </div>
          ) : (
            <ChatArea
              chatId={selectedChatId}
              onBack={handleBackToSidebar}
            />
          )}
        </>
      ) : (
        <>
          {/* Desktop: Show both sidebar and chat area */}
          <div className="flex flex-col w-80 border-r bg-white">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImageUrl || ""} />
                  <AvatarFallback>
                    {(user?.firstName || user?.email?.split('@')[0] || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">
                    {user?.displayName || user?.firstName || user?.email?.split('@')[0]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    @{user?.username || user?.email?.split('@')[0]}
                  </span>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setShowProfileSettings(true)}>
                    <User className="h-4 w-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowPerformanceDashboard(true)}>
                    <Activity className="h-4 w-4 mr-2" />
                    Performance
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowThemeCustomizer(true)}
                    title="Mavzu sozlamalari"
                  >
                    <Palette className="h-4 w-4 mr-2" />
                    Mavzu sozlamalari
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAchievements(true)}
                    title="Yutuqlar"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Yutuqlar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {logoutMutation.isPending ? "Chiqilmoqda..." : "Tizimdan chiqish"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <ChatSidebar
              selectedChatId={selectedChatId}
              onChatSelect={handleChatSelect}
            />
          </div>
          <ChatArea chatId={selectedChatId} />
        </>
      )}


    </div>
  );
}