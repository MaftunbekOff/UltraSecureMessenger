import { Router, Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import Chat from "@/pages/Chat";
import Landing from "@/pages/Landing";
import LoginPage from "@/components/LoginPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <Switch>
            <Route path="/" component={Landing} />
            <Route path="/login" component={LoginPage} />
            <Route path="/chat" component={Chat} />
            <Route component={NotFound} />
          </Switch>
        </Router>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;