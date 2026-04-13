import { useNavigate, useLocation } from "react-router-dom";
import { Target, Globe, Users, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [pendingFriendCount, setPendingFriendCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user) return;
    const loadCounts = async () => {
      const { count: friendCount } = await supabase
        .from("friend_requests")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("status", "pending");
      setPendingFriendCount(friendCount || 0);

      // Count unread DMs
      const { data: matches } = await supabase
        .from("matches")
        .select("id")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq("status", "active");
      if (matches && matches.length > 0) {
        const matchIds = matches.map(m => m.id);
        let total = 0;
        for (const mid of matchIds) {
          const { count } = await supabase
            .from("direct_messages")
            .select("*", { count: "exact", head: true })
            .eq("match_id", mid)
            .neq("sender_id", user.id)
            .eq("read", false);
          total += count || 0;
        }
        setUnreadMessages(total);
      }
    };
    loadCounts();
  }, [user, location.pathname]);

  const items = [
    { icon: Target, label: "Home", path: "/dashboard" },
    { icon: Globe, label: "Wall", path: "/progress-wall" },
    { icon: MessageCircle, label: "Chat", path: "/chats", badge: unreadMessages },
    { icon: Users, label: "Friends", path: "/friends", badge: pendingFriendCount },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/30 bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-around max-w-lg mx-auto py-2.5">
        {items.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === "/chats" && location.pathname.startsWith("/chat"));
          return (
            <button key={item.label} onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors relative"
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground/60")} />
              <span className={cn("text-[10px] font-bold", isActive ? "text-primary" : "text-muted-foreground/60")}>{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-0.5 right-0 w-4 h-4 rounded-full bg-secondary text-secondary-foreground text-[8px] font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
