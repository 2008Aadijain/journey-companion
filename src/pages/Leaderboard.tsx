import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Lock, Flame } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  user_id: string;
  name: string;
  xp: number;
  streak: number;
  goal_emoji: string;
  avatar_url: string | null;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/goal-setup");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, name, xp, streak, goal_emoji, avatar_url")
        .order("xp", { ascending: false })
        .limit(50);
      if (data) setEntries(data);
    };
    fetchLeaderboard();
  }, [user]);

  const isLocked = (profile?.xp ?? 0) < 10;

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
      </header>

      <main className="px-4 py-5 max-w-lg mx-auto">
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
        ) : (
          <div className="space-y-2">
            {entries.map((entry, idx) => {
              const isMe = entry.user_id === user?.id;
              return (
                <div key={entry.user_id}
                  className={cn(
                    "flex items-center gap-3 p-3.5 rounded-xl transition-all",
                    isMe ? "border border-primary/30" : "border border-border/20"
                  )}
                  style={{
                    background: isMe
                      ? 'hsla(258, 60%, 40%, 0.15)'
                      : idx < 3 ? 'hsla(258, 30%, 12%, 0.5)' : 'transparent'
                  }}
                >
                  <span className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black",
                    idx === 0 ? "bg-yellow-500/20 text-yellow-400" :
                    idx === 1 ? "bg-gray-400/20 text-gray-300" :
                    idx === 2 ? "bg-orange-500/20 text-orange-400" :
                    "text-muted-foreground"
                  )}>
                    {idx < 3 ? ["🥇", "🥈", "🥉"][idx] : idx + 1}
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
                    <p className={cn("text-sm font-bold", isMe ? "text-primary" : "text-foreground")}>
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
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Leaderboard;
