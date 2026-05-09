import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { I18nProvider } from "@/hooks/useI18n";
import { BackgroundProvider } from "@/hooks/useBackground";
import ProtectedRoute from "@/components/ProtectedRoute";
import AiBackground from "@/components/AiBackground";
import FloatingCustomizeButton from "@/components/FloatingCustomizeButton";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import GoalSetup from "./pages/GoalSetup.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import DirectChat from "./pages/DirectChat.tsx";
import GroupChat from "./pages/GroupChat.tsx";
import ProgressWall from "./pages/ProgressWall.tsx";
import Profile from "./pages/Profile.tsx";
import Leaderboard from "./pages/Leaderboard.tsx";
import Friends from "./pages/Friends.tsx";
import ChatList from "./pages/ChatList.tsx";
import PublicProfile from "./pages/PublicProfile.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
          <I18nProvider>
          <BackgroundProvider>
          <AiBackground />
          <FloatingCustomizeButton />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/goal-setup" element={<ProtectedRoute><GoalSetup /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/chat/:matchId" element={<ProtectedRoute><DirectChat /></ProtectedRoute>} />
            <Route path="/group-chat" element={<ProtectedRoute><GroupChat /></ProtectedRoute>} />
            <Route path="/progress-wall" element={<ProtectedRoute><ProgressWall /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
            <Route path="/chats" element={<ProtectedRoute><ChatList /></ProtectedRoute>} />
            <Route path="/u/:userId" element={<PublicProfile />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BackgroundProvider>
          </I18nProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
