import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Users, ChevronRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

interface MemberProfile {
  user_id: string;
  name: string;
  goal_label: string;
  goal_emoji: string;
  streak: number;
  avatar_url: string | null;
}

const GroupChat = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [messages, setMessages] = useState<Tables<"group_messages">[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [memberCount, setMemberCount] = useState(0);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const category = profile?.goal_category || "";

  useEffect(() => {
    if (!category || !user) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from("group_messages")
        .select("*")
        .eq("goal_category", category)
        .order("created_at", { ascending: true })
        .limit(100);
      if (data) setMessages(data);
    };

    const loadMembers = async () => {
      const { data, count } = await supabase
        .from("profiles")
        .select("user_id, name, goal_label, goal_emoji, streak, avatar_url", { count: "exact" })
        .eq("goal_category", category);
      setMemberCount(count || 0);
      if (data) setMembers(data);
    };

    loadMessages();
    loadMembers();

    const channel = supabase
      .channel(`group-${category}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "group_messages", filter: `goal_category=eq.${category}` },
        (payload) => { setMessages((prev) => [...prev, payload.new as Tables<"group_messages">]); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [category, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !profile) return;
    const content = newMessage.trim();
    setNewMessage("");
    await supabase.from("group_messages").insert({
      goal_category: category,
      sender_id: user.id,
      sender_name: profile.name,
      content,
    });
  };

  const getMemberAvatar = (senderId: string) => {
    const m = members.find(m => m.user_id === senderId);
    return m?.avatar_url;
  };

  if (loading || !profile) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-pulse">💬</div>
        <p className="text-muted-foreground text-sm">Loading group chat...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-border/50 bg-background/80">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <button onClick={() => navigate("/dashboard")} className="p-2 rounded-full glass-card">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'hsla(258, 80%, 50%, 0.2)' }}>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-foreground font-semibold text-sm">{category} Group</p>
            <p className="text-muted-foreground text-xs">{memberCount} members</p>
          </div>
          <button onClick={() => setShowMembers(true)} className="p-2 rounded-full glass-card">
            <Users className="w-4 h-4 text-foreground" />
          </button>
        </div>
      </header>

      {/* Members Panel */}
      {showMembers && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMembers(false)} />
          <div className="relative w-full max-w-lg rounded-t-3xl overflow-hidden"
            style={{ background: 'hsl(270 50% 6%)', border: '1px solid hsla(258, 60%, 40%, 0.2)', maxHeight: '70vh' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
              <h2 className="text-lg font-bold text-foreground">Members ({memberCount})</h2>
              <button onClick={() => setShowMembers(false)} className="p-2 rounded-full glass-card">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="px-5 py-3 overflow-y-auto" style={{ maxHeight: 'calc(70vh - 60px)' }}>
              {members.map(m => (
                <button key={m.user_id}
                  onClick={() => { setShowMembers(false); /* could navigate to profile */ }}
                  className="w-full flex items-center gap-3 py-3 border-b border-border/10 text-left">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: 'hsla(258, 80%, 50%, 0.2)' }}>
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">
                      {m.name} {m.user_id === user?.id && <span className="text-primary text-xs">(You)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.goal_emoji} {m.goal_label}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs">🔥</span>
                    <span className="text-xs font-bold text-secondary">{m.streak}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-muted-foreground text-sm">Be the first to say something!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          const avatar = getMemberAvatar(msg.sender_id);
          return (
            <div key={msg.id} className={cn("flex gap-2", isMine ? "justify-end" : "justify-start")}>
              {!isMine && (
                avatar ? (
                  <img src={avatar} alt="" className="w-7 h-7 rounded-full object-cover mt-1 flex-shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold mt-1 flex-shrink-0"
                    style={{ background: 'hsla(258, 80%, 50%, 0.2)' }}>
                    {msg.sender_name.charAt(0).toUpperCase()}
                  </div>
                )
              )}
              <div className={cn(
                "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm",
                isMine ? "rounded-br-md text-primary-foreground" : "glass-card rounded-bl-md text-foreground"
              )}
                style={isMine ? { background: 'linear-gradient(135deg, hsl(258 100% 62%), hsl(280 100% 55%))' } : undefined}
              >
                {!isMine && <p className="text-xs font-semibold text-primary mb-1">{msg.sender_name}</p>}
                {msg.content}
                <p className={cn("text-[10px] mt-1", isMine ? "text-primary-foreground/60" : "text-muted-foreground")}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 border-t border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-2 px-4 py-3 max-w-lg mx-auto">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Message the group..."
            className="flex-1 bg-transparent border border-border rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button onClick={handleSend} disabled={!newMessage.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 transition-all"
            style={{ background: 'linear-gradient(135deg, hsl(258 100% 62%), hsl(280 100% 55%))' }}>
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupChat;
