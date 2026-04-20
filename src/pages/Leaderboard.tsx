import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Lock, Flame, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardEntry {
  user_id: string;
  name: string;
  xp: number;
  streak: number;
  goal_emoji: string;
  goal_category: string;
  avatar_url: string | null;
}

type Filter = "global" | "friends" | "category";

const Leaderboard = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<Filter>("global");
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingData(true);
      const { data } = await supabase
        .from("profiles")
        .select("user_id, name, xp, streak, goal_emoji, goal_category, avatar_url")
        .order("xp", { ascending: false })
        .limit(200);
      if (data) setEntries(data);

      const { data: reqs } = await supabase
        .from("friend_requests")
        .select("sender_id, receiver_id")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq("status", "accepted");
      const ids = (reqs || []).map(r => r.sender_id === user.id ? r.receiver_id : r.sender_id);
      setFriendIds(ids);
      setLoadingData(false);
    })();
  }, [user]);

  const filteredEntries = useMemo(() => {
    if (filter === "friends") {
      const ids = new Set([...friendIds, user?.id ?? ""]);
      return entries.filter(e => ids.has(e.user_id));
    }
    if (filter === "category" && profile) {
      return entries.filter(e => e.goal_category === profile.goal_category);
    }
    return entries;
  }, [entries, filter, friendIds, profile, user]);

  const myRank = useMemo(() => {
    if (!user) return null;
    const idx = filteredEntries.findIndex(e => e.user_id === user.id);
    return idx === -1 ? null : idx + 1;
  }, [filteredEntries, user]);

  const top10 = filteredEntries.slice(0, 10);
  const isLocked = (profile?.xp ?? 0) < 10;
  const meInTop10 = user ? top10.some(e => e.user_id === user.id) : false;

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-4xl animate-pulse">🏆</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-border/50 bg-background/80">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <button onClick={() => navigate("/dashboard")} className="p-2 rounded-full glass-card">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <Trophy className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Leaderboard</h1>
        </div>
        {!isLocked && (
          <div className="flex max-w-lg mx-auto px-4 pb-2 gap-2">
            {([
              { k: "global" as Filter, label: "Global" },
              { k: "friends" as Filter, label: "Friends" },
              { k: "category" as Filter, label: "My Goal" },
            ]).map(t => (
              <button key={t.k} onClick={() => setFilter(t.k)}
                className={cn(
                  "flex-1 py-2 rounded-full text-xs font-bold transition-all",
                  filter === t.k ? "text-primary-foreground" : "text-muted-foreground glass-card"
                )}
                style={filter === t.k ? { background: 'linear-gradient(135deg, hsl(258 100% 62%), hsl(280 100% 55%))' } : undefined}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="px-4 py-5 max-w-lg mx-auto pb-24">
        {isLocked ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4"
              style={{ background: 'hsla(258, 60%, 40%, 0.2)' }}>
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Leaderboard Locked</h2>
            <p className="text-muted-foreground text-sm">Earn at least 10 XP to unlock the leaderboard.</p>
            <p className="text-muted-foreground text-xs mt-2">Your XP: {profile?.xp ?? 0}/10</p>
          </div>
        ) : loadingData ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : top10.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-foreground font-semibold">
              {filter === "friends" ? "Add friends to see them here 👥" : "Be the first to earn XP! 🚀"}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {top10.map((entry, idx) => {
                const isMe = entry.user_id === user?.id;
                const crown = idx === 0 ? "👑" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
                return (
                  <button key={entry.user_id}
                    onClick={() => navigate(`/u/${entry.user_id}`)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-left active:scale-[0.99]",
                      isMe ? "border border-primary/40" : "border border-border/20",
                      idx === 0 && "animate-goalmate-glow"
                    )}
                    style={{
                      background: isMe
                        ? 'hsla(258, 60%, 40%, 0.15)'
                        : idx === 0 ? 'linear-gradient(135deg, hsla(45, 90%, 50%, 0.1), hsla(258, 30%, 12%, 0.5))'
                        : idx < 3 ? 'hsla(258, 30%, 12%, 0.5)' : 'transparent'
                    }}
                  >
                    <span className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center text-sm font-black",
                      idx === 0 ? "bg-yellow-500/20" :
                      idx === 1 ? "bg-gray-400/20" :
                      idx === 2 ? "bg-orange-500/20" :
                      "text-muted-foreground"
                    )}>
                      {crown ?? `#${idx + 1}`}
                    </span>

                    {entry.avatar_url ? (
                      <img src={entry.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ background: 'hsla(258, 80%, 50%, 0.2)' }}>
                        {entry.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-bold truncate", isMe ? "text-primary" : "text-foreground")}>
                        {entry.name} {isMe && "(You)"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{entry.goal_emoji}</span>
                        <div className="flex items-center gap-0.5">
                          <Flame className="w-3 h-3 text-secondary" />
                          <span className="text-xs text-secondary font-semibold">{entry.streak}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-black text-primary">{entry.xp}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold">XP</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* My rank if not in top 10 */}
            {!meInTop10 && myRank && profile && user && (
              <div className="mt-4 pt-4 border-t border-border/30">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Your rank</p>
                <div className="flex items-center gap-3 p-3.5 rounded-xl border border-primary/40"
                  style={{ background: 'hsla(258, 60%, 40%, 0.15)' }}>
                  <span className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-primary">
                    #{myRank}
                  </span>
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: 'hsla(258, 80%, 50%, 0.2)' }}>
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary">{profile.name} (You)</p>
                    <p className="text-[10px] text-muted-foreground">
                      {filter === "global" ? "Globally" : filter === "friends" ? "Among friends" : "In your goal category"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-primary">{profile.xp ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">XP</p>
                  </div>
                </div>
              </div>
            )}

            <p className="text-center text-[10px] text-muted-foreground/60 mt-6">
              <Crown className="w-3 h-3 inline -mt-0.5 mr-1" />
              New week, new chance to top the leaderboard! 🏆
            </p>
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default Leaderboard;
