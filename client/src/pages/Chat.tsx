
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatArea } from "@/components/ChatArea";
import PerformanceDashboard from "@/components/PerformanceDashboard";
import ProfileSettings from "@/components/ProfileSettings";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { ThemeCustomizer } from "@/components/ThemeCustomizer";
import { AchievementSystem } from "@/components/AchievementSystem";
import { notificationManager } from "@/utils/notifications";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Settings, LogOut, User, Activity, Palette, Trophy } from "lucide-react";
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
  const [currentView, setCurrentView] = useState<'chat' | 'profile' | 'performance' | 'theme' | 'achievements' | 'onboarding'>('chat');
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

  // Redirect if not authenticated
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

  // Check onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('seen-onboarding');
    if (!hasSeenOnboarding && user) {
      setCurrentView('onboarding');
    }

    if (user) {
      notificationManager.requestPermission();
    }
  }, [user]);

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  const handleBackToSidebar = () => {
    setSelectedChatId(null);
    setShowSidebar(true);
  };

  useEffect(() => {
    if (!isMobile) {
      setShowSidebar(true);
    }
  }, [isMobile]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Render different views
  const renderCurrentView = () => {
    switch (currentView) {
      case 'onboarding':
        return (
          <OnboardingFlow onClose={() => {
            localStorage.setItem('seen-onboarding', 'true');
            setCurrentView('chat');
          }} />
        );
      case 'profile':
        return (
          <div className="h-screen flex flex-col bg-background">
            <div className="flex justify-between items-center p-4 border-b bg-white">
              <h2 className="text-xl font-semibold">Profil sozlamalari</h2>
              <Button variant="outline" onClick={() => setCurrentView('chat')}>
                Chatga qaytish
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <ProfileSettings />
            </div>
          </div>
        );
      case 'performance':
        return (
          <div className="h-screen flex flex-col bg-background">
            <div className="flex justify-between items-center p-4 border-b bg-white">
              <h2 className="text-xl font-semibold">Dastur samaradorligi</h2>
              <Button variant="outline" onClick={() => setCurrentView('chat')}>
                Chatga qaytish
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <PerformanceDashboard />
            </div>
          </div>
        );
      case 'theme':
        return (
          <ThemeCustomizer onClose={() => setCurrentView('chat')} />
        );
      case 'achievements':
        return (
          <AchievementSystem 
            userStats={{
              messagesCount: 0,
              friendsCount: 0,
              groupsCreated: 0,
              reactionsGiven: 0,
              has2FA: false,
              profileComplete: false
            }}
            onClose={() => setCurrentView('chat')}
          />
        );
      default:
        return renderChatLayout();
    }
  };

  const renderChatLayout = () => {
    if (isMobile) {
      return (
        <div className="h-screen flex flex-col bg-background">
          {showSidebar ? (
            <div className="flex flex-col h-full">
              {/* Simple mobile header */}
              <div className="p-3 border-b flex items-center justify-between bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.profileImageUrl || ""} />
                    <AvatarFallback className="text-sm">
                      {(user?.firstName || user?.email?.split('@')[0] || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">
                      {user?.displayName || user?.firstName || user?.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{user?.username || user?.email?.split('@')[0]}
                    </p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setCurrentView('profile')}>
                      <User className="h-4 w-4 mr-2" />
                      Profil
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrentView('performance')}>
                      <Activity className="h-4 w-4 mr-2" />
                      Samaradorlik
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrentView('theme')}>
                      <Palette className="h-4 w-4 mr-2" />
                      Mavzu
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrentView('achievements')}>
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
                      {logoutMutation.isPending ? "Chiqilmoqda..." : "Chiqish"}
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
        </div>
      );
    }

    // Desktop layout - much cleaner
    return (
      <div className="h-screen flex bg-background">
        {/* Sidebar */}
        <div className="w-80 border-r bg-white flex flex-col">
          {/* Clean desktop header */}
          <div className="p-4 border-b bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.profileImageUrl || ""} />
                  <AvatarFallback>
                    {(user?.firstName || user?.email?.split('@')[0] || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">
                    {user?.displayName || user?.firstName || user?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{user?.username || user?.email?.split('@')[0]}
                  </p>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setCurrentView('profile')}>
                    <User className="h-4 w-4 mr-2" />
                    Profil sozlamalari
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentView('performance')}>
                    <Activity className="h-4 w-4 mr-2" />
                    Samaradorlik
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentView('theme')}>
                    <Palette className="h-4 w-4 mr-2" />
                    Mavzu sozlamalari
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentView('achievements')}>
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
          </div>
          
          <div className="flex-1 overflow-hidden">
            <ChatSidebar
              selectedChatId={selectedChatId}
              onChatSelect={handleChatSelect}
            />
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1">
          <ChatArea chatId={selectedChatId} />
        </div>
      </div>
    );
  };

  return renderCurrentView();
}
