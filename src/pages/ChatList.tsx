import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Users, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import { useI18n } from "@/hooks/useI18n";
import { toast } from "sonner";

type Tab = "direct" | "groups" | "friends";

interface Conversation {
  matchId: string;
  partnerId: string;
  partnerName: string;
  partnerEmoji: string;
  partnerAvatar: string | null;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
}

interface GroupConvo {
  category: string;
  memberCount: number;
  lastMessage: string;
  lastTime: string;
}

const ChatList = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("direct");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [groups, setGroups] = useState<GroupConvo[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/goal-setup");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user || !profile) return;
    loadConversations();
  }, [user, profile]);

  const loadConversations = async () => {
    if (!user) return;

    // Load DM conversations
    const { data: matches } = await supabase
      .from("matches")
      .select("*")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq("status", "active");

    if (matches) {
      const convos: Conversation[] = [];
      for (const match of matches) {
        const partnerId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        const { data: partner } = await supabase.from("profiles")
          .select("name, goal_emoji, avatar_url")
          .eq("user_id", partnerId).single();

        const { data: lastMsg } = await supabase.from("direct_messages")
          .select("content, created_at")
          .eq("match_id", match.id)
          .order("created_at", { ascending: false })
          .limit(1).maybeSingle();

        const { count } = await supabase.from("direct_messages")
          .select("*", { count: "exact", head: true })
          .eq("match_id", match.id)
          .neq("sender_id", user.id)
          .eq("read", false);

        convos.push({
          matchId: match.id,
          partnerId,
          partnerName: partner?.name || "GoalMate",
          partnerEmoji: partner?.goal_emoji || "🎯",
          partnerAvatar: partner?.avatar_url || null,
          lastMessage: lastMsg?.content || "No messages yet",
          lastTime: lastMsg?.created_at || match.created_at,
          unreadCount: count || 0,
        });
      }
      setConversations(convos);
    }

    // Load group conversations
    if (profile) {
      const { count: memberCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("goal_category", profile.goal_category);

      const { data: lastGroupMsg } = await supabase.from("group_messages")
        .select("content, created_at")
        .eq("goal_category", profile.goal_category)
        .order("created_at", { ascending: false })
        .limit(1).maybeSingle();

      setGroups([{
        category: profile.goal_category,
        memberCount: memberCount || 0,
        lastMessage: lastGroupMsg?.content || "No messages yet",
        lastTime: lastGroupMsg?.created_at || "",
      }]);
    }
  };

  const timeAgo = (date: string) => {
    if (!date) return "";
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  if (loading || !profile) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-4xl animate-pulse">💬</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-border/50 bg-background/80">
        <div className="px-4 py-3 max-w-lg mx-auto">
          <h1 className="text-xl font-black text-gradient-hero tracking-tight">Chats</h1>
        </div>
        <div className="flex max-w-lg mx-auto px-4 pb-2 gap-2">
          {([
            { key: "direct" as Tab, label: "Direct" },
            { key: "groups" as Tab, label: "Groups" },
          ]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn(
                "flex-1 py-2 rounded-full text-xs font-bold transition-all",
                tab === t.key ? "text-primary-foreground" : "text-muted-foreground glass-card"
              )}
              style={tab === t.key ? { background: 'linear-gradient(135deg, hsl(258 100% 62%), hsl(280 100% 55%))' } : undefined}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto space-y-2">
        {tab === "direct" && (
          conversations.length === 0 ? (
            <div className="text-center py-16">
              <MessageCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-foreground font-semibold">No conversations yet</p>
              <p className="text-muted-foreground text-sm mt-1">Get matched to start chatting!</p>
            </div>
          ) : (
            conversations.map(c => (
              <button key={c.matchId}
                onClick={() => navigate(`/chat/${c.matchId}`)}
                className="w-full glass-card p-4 flex items-center gap-3 text-left transition-all active:scale-[0.98]"
              >
                <div className="relative">
                  {c.partnerAvatar ? (
                    <img src={c.partnerAvatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg"
                      style={{ background: 'hsla(258, 80%, 50%, 0.2)' }}>
                      {c.partnerEmoji}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background"
                    style={{ background: 'hsl(145 80% 50%)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-foreground">{c.partnerName}</p>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(c.lastTime)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{c.lastMessage}</p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {c.unreadCount}
                  </span>
                )}
              </button>
            ))
          )
        )}

        {tab === "groups" && (
          groups.map(g => (
            <button key={g.category}
              onClick={() => navigate("/group-chat")}
              className="w-full glass-card p-4 flex items-center gap-3 text-left transition-all active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'hsla(258, 80%, 50%, 0.15)' }}>
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground">{g.category} Group</p>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(g.lastTime)}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{g.lastMessage}</p>
              </div>
              <span className="text-[10px] text-muted-foreground">{g.memberCount} members</span>
            </button>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default ChatList;
