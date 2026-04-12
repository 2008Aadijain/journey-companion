import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

const DirectChat = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Tables<"direct_messages">[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [partnerEmoji, setPartnerEmoji] = useState("🎯");
  const [partnerAvatar, setPartnerAvatar] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!matchId || !user) return;

    const loadMatch = async () => {
      const { data: match } = await supabase.from("matches").select("*").eq("id", matchId).single();
      if (!match) return;
      const partnerId = match.user1_id === user.id ? match.user2_id : match.user1_id;
      const { data: partner } = await supabase
        .from("profiles")
        .select("name, goal_emoji, avatar_url")
        .eq("user_id", partnerId)
        .single();
      if (partner) {
        setPartnerName(partner.name);
        setPartnerEmoji(partner.goal_emoji);
        setPartnerAvatar(partner.avatar_url);
      }
    };

    const loadMessages = async () => {
      const { data } = await supabase
        .from("direct_messages").select("*").eq("match_id", matchId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
      await supabase.from("direct_messages").update({ read: true })
        .eq("match_id", matchId).neq("sender_id", user.id).eq("read", false);
    };

    loadMatch();
    loadMessages();

    const channel = supabase
      .channel(`dm-${matchId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const msg = payload.new as Tables<"direct_messages">;
          setMessages((prev) => [...prev, msg]);
          if (msg.sender_id !== user.id) {
            supabase.from("direct_messages").update({ read: true }).eq("id", msg.id).then();
          }
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [matchId, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !matchId) return;
    const content = newMessage.trim();
    setNewMessage("");
    await supabase.from("direct_messages").insert({ match_id: matchId, sender_id: user.id, content });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-border/50 bg-background/80">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <button onClick={() => navigate("/dashboard")} className="p-2 rounded-full glass-card">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          {partnerAvatar ? (
            <img src={partnerAvatar} alt="" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
              style={{ background: 'hsla(258, 100%, 62%, 0.2)' }}>
              {partnerEmoji}
            </div>
          )}
          <div>
            <p className="text-foreground font-semibold text-sm">{partnerName || "GoalMate"}</p>
            <p className="text-muted-foreground text-xs">Your GoalMate</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">👋</div>
            <p className="text-muted-foreground text-sm">Say hi to your GoalMate!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={cn("flex gap-2", isMine ? "justify-end" : "justify-start")}>
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
                <p className={cn("text-[10px] mt-1", isMine ? "text-primary-foreground/60" : "text-muted-foreground")}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      <div className="sticky bottom-0 border-t border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-2 px-4 py-3 max-w-lg mx-auto">
          <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border border-border rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
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

export default DirectChat;
