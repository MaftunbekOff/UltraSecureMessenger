import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, MessageCircle, Lock, Users, Zap, Globe, Mail, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function Landing() {
  const [email, setEmail] = useState("");
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const handleLogin = () => {
    window.location.href = "/login";
  };

  const loginMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch('/api/auth/email/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      return response.json();
    },
    onSuccess: () => {
      window.location.href = '/chat';
    },
  });

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
      window.location.reload();
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">UltraSecure Messenger</h1>
          </div>
          {!isAuthenticated && (
            <Button onClick={handleLogin} data-testid="button-login">
              Sign In
            </Button>
          )}
          {isAuthenticated && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Salom, {user?.firstName || user?.email}!
              </span>
              <Button
                onClick={() => window.location.href = '/chat'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Chatga o'tish
              </Button>
              <Button
                onClick={() => logoutMutation.mutate()}
                variant="outline"
                size="sm"
                disabled={logoutMutation.isPending}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                {logoutMutation.isPending ? "Chiqilmoqda..." : "Chiqish"}
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-8">
            <MessageCircle className="h-12 w-12 text-primary-foreground" />
          </div>

          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Secure Messaging
            <span className="text-primary"> Redefined</span>
          </h2>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience the next generation of secure communication with end-to-end encryption,
            lightning-fast performance, and a beautiful interface designed for the modern world.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleLogin} size="lg" className="text-lg px-8" data-testid="button-get-started">
              Get Started
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8" data-testid="button-learn-more">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">End-to-End Encryption</h3>
              <p className="text-muted-foreground">
                Your messages are protected with military-grade encryption. Only you and your recipients can read them.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Optimized for performance, even on slow connections. Messages are compressed and delivered instantly.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Group Chats</h3>
              <p className="text-muted-foreground">
                Create secure group conversations with friends, family, or colleagues. Manage permissions and roles easily.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Cross-Platform</h3>
              <p className="text-muted-foreground">
                Access your messages on web, mobile, and desktop. Seamless synchronization across all your devices.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Rich Media</h3>
              <p className="text-muted-foreground">
                Share photos, videos, documents, and voice messages. All protected with the same level of security.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Privacy First</h3>
              <p className="text-muted-foreground">
                We don't store your messages on our servers. Your privacy is our top priority, always.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Ready to experience secure messaging?
          </h3>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of users who trust UltraSecure Messenger for their communication needs.
          </p>
          <Button onClick={handleLogin} size="lg" className="text-lg px-12" data-testid="button-join-now">
            Join Now - It's Free
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-24 border-t border-border">
        <div className="text-center text-muted-foreground">
          <p>&copy; 2024 UltraSecure Messenger. Built with security and privacy in mind.</p>
        </div>
      </footer>
    </div>
  );
}