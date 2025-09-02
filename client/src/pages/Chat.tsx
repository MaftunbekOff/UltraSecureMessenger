import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatArea } from "@/components/ChatArea";
import PerformanceDashboard from "@/components/PerformanceDashboard";
import { useIsMobile } from "@/hooks/use-mobile";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useRouter } from "wouter";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";

export default function Chat() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);

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

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Mobile: Show sidebar or chat area */}
      {isMobile ? (
        <>
          {showSidebar ? (
            <ChatSidebar
              selectedChatId={selectedChatId}
              onChatSelect={handleChatSelect}
            />
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
          <ChatSidebar
            selectedChatId={selectedChatId}
            onChatSelect={handleChatSelect}
          />
          <ChatArea chatId={selectedChatId} />
        </>
      )}

      {/* Performance monitoring toggle */}
      <div className="fixed bottom-4 right-4">
        <Button
          onClick={() => setShowPerformanceDashboard(true)}
          variant="outline"
          size="sm"
          className="bg-background/80 backdrop-blur-sm"
        >
          <Activity className="h-4 w-4 mr-2" />
          Performance
        </Button>
      </div>
    </div>
  );
}