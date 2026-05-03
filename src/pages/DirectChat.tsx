import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Check, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";
import { checkBeforeSend } from "@/lib/moderation";
import { toast } from "sonner";

const PAGE_SIZE = 50;

const DirectChat = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Tables<"direct_messages">[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [partnerEmoji, setPartnerEmoji] = useState("🎯");
  const [partnerAvatar, setPartnerAvatar] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!matchId || !user) return;

    const loadMatch = async () => {
      const { data: match } = await supabase.from("matches").select("*").eq("id", matchId).single();
      if (!match) return;
      const pid = match.user1_id === user.id ? match.user2_id : match.user1_id;
      setPartnerId(pid);
      const { data: partner } = await supabase
        .from("profiles").select("name, goal_emoji, avatar_url").eq("user_id", pid).single();
      if (partner) {
        setPartnerName(partner.name);
        setPartnerEmoji(partner.goal_emoji);
        setPartnerAvatar(partner.avatar_url);
      }
    };

    const loadMessages = async () => {
      const { data } = await supabase
        .from("direct_messages").select("*").eq("match_id", matchId)
        .order("created_at", { ascending: false }).limit(PAGE_SIZE);
      if (data) {
        setMessages(data.reverse());
        setHasMore(data.length === PAGE_SIZE);
      }
      await supabase.from("direct_messages").update({ read: true })
        .eq("match_id", matchId).neq("sender_id", user.id).eq("read", false);
    };

    loadMatch();
    loadMessages();

    // Real-time message inserts + read updates
    const msgChannel = supabase
      .channel(`dm-${matchId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const msg = payload.new as Tables<"direct_messages">;
          setMessages((prev) => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
          if (msg.sender_id !== user.id) {
            supabase.from("direct_messages").update({ read: true }).eq("id", msg.id).then();
          }
        })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "direct_messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const msg = payload.new as Tables<"direct_messages">;
          setMessages((prev) => prev.map(m => m.id === msg.id ? msg : m));
        })
      .subscribe();

    // Presence for typing/online
    const presence = supabase.channel(`presence-${matchId}`, { config: { presence: { key: user.id } } });
    typingChannelRef.current = presence;
    presence
      .on("presence", { event: "sync" }, () => {
        const state = presence.presenceState() as Record<string, Array<{ typing?: boolean }>>;
        const others = Object.keys(state).filter(k => k !== user.id);
        setPartnerOnline(others.length > 0);
        const someoneTyping = others.some(k => state[k]?.[0]?.typing);
        setPartnerTyping(someoneTyping);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await presence.track({ typing: false });
      });

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(presence);
    };
  }, [matchId, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, partnerTyping]);

  const loadOlder = async () => {
    if (!matchId || messages.length === 0 || loadingOlder) return;
    setLoadingOlder(true);
    const oldest = messages[0];
    const { data } = await supabase.from("direct_messages").select("*").eq("match_id", matchId)
      .lt("created_at", oldest.created_at)
      .order("created_at", { ascending: false }).limit(PAGE_SIZE);
    if (data) {
      setMessages(prev => [...data.reverse(), ...prev]);
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoadingOlder(false);
  };

  const handleTyping = (val: string) => {
    setNewMessage(val);
    if (!typingChannelRef.current) return;
    typingChannelRef.current.track({ typing: true });
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      typingChannelRef.current?.track({ typing: false });
    }, 1500);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !matchId) return;
    const content = newMessage.trim();
    const blocked = checkBeforeSend(content);
    if (blocked) {
      toast.error(blocked);
      return;
    }
    setNewMessage("");
    typingChannelRef.current?.track({ typing: false });
    const tempId = `temp-${Date.now()}`;
    const optimistic: Tables<"direct_messages"> = {
      id: tempId, match_id: matchId, sender_id: user.id, content,
      created_at: new Date().toISOString(), read: false,
    };
    setMessages(prev => [...prev, optimistic]);
    const { data } = await supabase.from("direct_messages")
      .insert({ match_id: matchId, sender_id: user.id, content }).select().single();
    if (data) setMessages(prev => prev.map(m => m.id === tempId ? data : m));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-border/50 bg-background/80">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <button onClick={() => navigate("/chats")} className="p-2 rounded-full glass-card">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={() => partnerId && navigate(`/u/${partnerId}`)} className="relative">
            {partnerAvatar ? (
              <img src={partnerAvatar} alt="" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
                style={{ background: 'hsla(258, 100%, 62%, 0.2)' }}>
                {partnerEmoji}
              </div>
            )}
            {partnerOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background"
                style={{ background: 'hsl(145 80% 50%)' }} />
            )}
          </button>
          <div>
            <p className="text-foreground font-semibold text-sm">{partnerName || "GoalCircle"}</p>
            <p className="text-xs" style={{ color: partnerTyping ? 'hsl(258 100% 70%)' : partnerOnline ? 'hsl(145 80% 55%)' : 'hsl(var(--muted-foreground))' }}>
              {partnerTyping ? "typing…" : partnerOnline ? "Online" : "Your GoalCircle"}
            </p>
          </div>
        </div>
      </header>

      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full space-y-3">
        {hasMore && (
          <button onClick={loadOlder} disabled={loadingOlder}
            className="mx-auto block text-xs text-primary font-semibold py-1.5 px-4 rounded-full glass-card disabled:opacity-50">
            {loadingOlder ? "Loading…" : "Load older messages"}
          </button>
        )}
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">👋</div>
            <p className="text-muted-foreground text-sm">Say hi to your GoalCircle!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={cn("flex gap-2 animate-in fade-in slide-in-from-bottom-1 duration-200", isMine ? "justify-end" : "justify-start")}>
              {!isMine && (
                partnerAvatar ? (
                  <img src={partnerAvatar} alt="" className="w-7 h-7 rounded-full object-cover mt-1 flex-shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs mt-1 flex-shrink-0"
                    style={{ background: 'hsla(258, 100%, 62%, 0.2)' }}>
                    {partnerEmoji}
                  </div>
                )
              )}
              <div className={cn(
                "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm",
                isMine ? "rounded-br-md text-primary-foreground" : "glass-card rounded-bl-md text-foreground"
              )}
                style={isMine ? { background: 'linear-gradient(135deg, hsl(258 100% 62%), hsl(280 100% 55%))' } : undefined}
              >
                {msg.content}
                <div className={cn("flex items-center gap-1 mt-1", isMine ? "justify-end" : "")}>
                  <p className={cn("text-[10px]", isMine ? "text-primary-foreground/60" : "text-muted-foreground")}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {isMine && (msg.read
                    ? <CheckCheck className="w-3 h-3" style={{ color: '#7DD3FC' }} />
                    : <Check className="w-3 h-3 text-primary-foreground/60" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {partnerTyping && (
          <div className="flex gap-2 justify-start animate-in fade-in duration-200">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs mt-1 flex-shrink-0"
              style={{ background: 'hsla(258, 100%, 62%, 0.2)' }}>{partnerEmoji}</div>
            <div className="glass-card rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
              {[0, 150, 300].map(d => (
                <span key={d} className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
                  style={{ animation: `typing-bounce 1s infinite ${d}ms` }} />
              ))}
            </div>
            <style>{`@keyframes typing-bounce { 0%,60%,100%{transform:translateY(0);opacity:0.4} 30%{transform:translateY(-4px);opacity:1} }`}</style>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="sticky bottom-0 border-t border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-2 px-4 py-3 max-w-lg mx-auto">
          <input value={newMessage} onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border border-border rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          <button onClick={handleSend} disabled={!newMessage.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, hsl(258 100% 62%), hsl(280 100% 55%))' }}>
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DirectChat;
