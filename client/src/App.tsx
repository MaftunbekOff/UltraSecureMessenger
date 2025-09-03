import { Router, Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Chat from "@/pages/Chat";
import Landing from "@/pages/Landing";
import LoginPage from "@/components/LoginPage";
import NotFoundPage from "@/pages/not-found";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function AppContent() {
  const { user, isLoading, refetch } = useAuth();

  console.log('🚀 [App] Ilova yuklandi, foydalanuvchi holati:', { user: user?.id, isLoading });

  // Check authentication status on mount
  useEffect(() => {
    console.log('🔐 [App] Autentifikatsiya tekshirilmoqda...');
    refetch();
  }, [refetch]);

  if (isLoading) {
    console.log('⏳ [App] Yuklanish holati ko\'rsatilmoqda...');
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-lg">Yuklanmoqda...</div>
      </div>
    );
  }

  // If user is not authenticated, show login page
  if (!user) {
    console.log('🔓 [App] Foydalanuvchi tizimga kirmagan, login sahifasi ko\'rsatilmoqda');
    return <LoginPage />;
  }

  console.log('✅ [App] Foydalanuvchi tizimga kirgan, chat interfeysi yuklanmoqda');

  return (
    <Router>
      <Switch>
        <Route path="/" component={Chat} />
        <Route path="/landing" component={Landing} />
        <Route component={NotFoundPage} />
      </Switch>
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppContent />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;