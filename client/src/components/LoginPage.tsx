import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Mail, MessageCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@') || email.length < 5) {
      toast({
        title: "Email noto'g'ri",
        description: "Iltimos, to'g'ri email manzilini kiriting",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/email/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        credentials: 'include', // Include cookies
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Muvaffaqiyatli kirish",
          description: "UltraSecure Messenger ga xush kelibsiz!",
        });
        // Wait a bit for the cookie to be set
        setTimeout(() => {
          window.location.href = "/";
        }, 100);
      } else {
        const error = await response.json();
        console.error("Login error:", error);
        toast({
          title: "Kirish xatoligi",
          description: error.message || "Iltimos, qayta urinib ko'ring",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Network error:", error);
      toast({
        title: "Tarmoq xatoligi",
        description: "Internet aloqasini tekshirib, qayta urinib ko'ring",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Welcome to UltraSecure Messenger</CardTitle>
          <p className="text-muted-foreground">Enter your email to continue</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                data-testid="input-email"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isLoading}
              data-testid="button-email-login"
            >
              <Mail className="h-5 w-5 mr-2" />
              {isLoading ? "Signing in..." : "Continue with Email"}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground mt-4">
            <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}