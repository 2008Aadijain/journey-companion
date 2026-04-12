import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index.tsx";
import GoalSetup from "./pages/GoalSetup.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import DirectChat from "./pages/DirectChat.tsx";
import GroupChat from "./pages/GroupChat.tsx";
import ProgressWall from "./pages/ProgressWall.tsx";
import Profile from "./pages/Profile.tsx";
import Leaderboard from "./pages/Leaderboard.tsx";
import Friends from "./pages/Friends.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/goal-setup" element={<GoalSetup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chat/:matchId" element={<DirectChat />} />
            <Route path="/group-chat" element={<GroupChat />} />
            <Route path="/progress-wall" element={<ProgressWall />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/friends" element={<Friends />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
