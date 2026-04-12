import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, HandMetal, Filter } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface CheckIn {
  id: string;
  user_id: string;
  user_name: string;
  goal_category: string;
  goal_label: string;
  goal_emoji: string;
  content: string;
  streak_at_time: number;
  created_at: string;
  photo_url: string | null;
}

interface Reaction {
  check_in_id: string;
  reaction_type: string;
  user_id: string;
}

interface UserAvatar {
  user_id: string;
  avatar_url: string | null;
}

const CATEGORIES = ["All", "Fitness", "Career", "Learning", "Business", "Creative"];

const ProgressWall = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [filter, setFilter] = useState("All");
  const [showFilter, setShowFilter] = useState(false);
  const [avatars, setAvatars] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (!loading && !user) navigate("/goal-setup");
  }, [loading, user, navigate]);

  const fetchData = async () => {
    let query = supabase.from("check_ins").select("*").order("created_at", { ascending: false }).limit(50);
    if (filter !== "All") query = query.eq("goal_category", filter);
    const { data } = await query;
    if (data) {
      setCheckIns(data);
      // Fetch avatars for unique user IDs
      const userIds = [...new Set(data.map(d => d.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, avatar_url")
          .in("user_id", userIds);
        if (profiles) {
          const map: Record<string, string | null> = {};
          profiles.forEach(p => { map[p.user_id] = p.avatar_url; });
          setAvatars(map);
        }
      }
    }

    const { data: rxns } = await supabase.from("check_in_reactions").select("check_in_id, reaction_type, user_id");
    if (rxns) setReactions(rxns);
  };

  useEffect(() => {
    if (!user) return;
    fetchData();
    const channel = supabase
      .channel("progress-wall")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "check_ins" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, filter]);

  const getReactionCount = (checkInId: string, type: string) =>
    reactions.filter(r => r.check_in_id === checkInId && r.reaction_type === type).length;

  const hasReacted = (checkInId: string, type: string) =>
    reactions.some(r => r.check_in_id === checkInId && r.reaction_type === type && r.user_id === user?.id);

  const toggleReaction = async (checkInId: string, type: string) => {
    if (!user) return;
    if (hasReacted(checkInId, type)) {
      await supabase.from("check_in_reactions").delete()
        .eq("check_in_id", checkInId).eq("user_id", user.id).eq("reaction_type", type);
    } else {
      await supabase.from("check_in_reactions").insert({ check_in_id: checkInId, user_id: user.id, reaction_type: type });
    }
    fetchData();
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-4xl animate-pulse">🌟</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-border/50 bg-background/80">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="p-2 rounded-full glass-card">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Progress Wall</h1>
          </div>
          <button onClick={() => setShowFilter(!showFilter)} className="p-2 rounded-full glass-card">
            <Filter className="w-4 h-4 text-foreground" />
          </button>
        </div>
        {showFilter && (
          <div className="px-4 pb-3 max-w-lg mx-auto">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat}
                  onClick={() => { setFilter(cat); setShowFilter(false); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    filter === cat ? "bg-primary text-primary-foreground" : "glass-card text-muted-foreground hover:text-foreground"
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto space-y-3">
        {checkIns.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-foreground font-semibold">No check-ins yet</p>
            <p className="text-muted-foreground text-sm mt-1">Be the first to share your progress!</p>
          </div>
        ) : (
          checkIns.map((ci) => (
            <div key={ci.id} className="glass-card-glow p-4">
              <div className="flex items-center gap-3 mb-3">
                {avatars[ci.user_id] ? (
                  <img src={avatars[ci.user_id]!} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                    style={{ background: 'hsla(258, 100%, 62%, 0.2)' }}>
                    {ci.goal_emoji}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{ci.user_name}</p>
                  <p className="text-xs text-muted-foreground">{ci.goal_label} · {timeAgo(ci.created_at)}</p>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'hsla(0, 100%, 71%, 0.15)' }}>
                  <span className="text-xs">🔥</span>
                  <span className="text-xs font-bold text-secondary">{ci.streak_at_time}</span>
                </div>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed mb-3">{ci.content}</p>
              {ci.photo_url && (
                <img src={ci.photo_url} alt="Check-in proof" className="w-full max-h-48 object-cover rounded-xl mb-3 border border-border/30" />
              )}
              <div className="flex items-center gap-3">
                <button onClick={() => toggleReaction(ci.id, "like")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    hasReacted(ci.id, "like") ? "bg-secondary/20 text-secondary" : "glass-card text-muted-foreground hover:text-secondary"
                  }`}>
                  <Heart className={`w-3.5 h-3.5 ${hasReacted(ci.id, "like") ? "fill-current" : ""}`} />
                  {getReactionCount(ci.id, "like") || "Like"}
                </button>
                <button onClick={() => toggleReaction(ci.id, "metoo")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    hasReacted(ci.id, "metoo") ? "bg-primary/20 text-primary" : "glass-card text-muted-foreground hover:text-primary"
                  }`}>
                  <HandMetal className="w-3.5 h-3.5" />
                  {getReactionCount(ci.id, "metoo") || "Me Too!"}
                </button>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default ProgressWall;
