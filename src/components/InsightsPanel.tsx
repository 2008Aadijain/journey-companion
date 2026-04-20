import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Calendar, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface InsightsPanelProps {
  userId: string;
  streak: number;
  deadline: string | null;
  createdAt: string;
}

interface WeekStats {
  thisWeek: number;
  lastWeek: number;
  bestStreak: number;
  xpThisWeek: number;
}

const startOfWeek = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const InsightsPanel = ({ userId, streak, deadline, createdAt }: InsightsPanelProps) => {
  const [stats, setStats] = useState<WeekStats | null>(null);

  useEffect(() => {
    (async () => {
      const now = new Date();
      const thisWeekStart = startOfWeek(now);
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);

      const { data: thisWeekData } = await supabase
        .from("check_ins")
        .select("created_at, streak_at_time")
        .eq("user_id", userId)
        .gte("created_at", thisWeekStart.toISOString());

      const { data: lastWeekData } = await supabase
        .from("check_ins")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", lastWeekStart.toISOString())
        .lt("created_at", thisWeekStart.toISOString());

      const { data: allCheckIns } = await supabase
        .from("check_ins")
        .select("streak_at_time")
        .eq("user_id", userId)
        .order("streak_at_time", { ascending: false })
        .limit(1);

      setStats({
        thisWeek: thisWeekData?.length ?? 0,
        lastWeek: lastWeekData?.length ?? 0,
        bestStreak: allCheckIns?.[0]?.streak_at_time ?? streak,
        xpThisWeek: (thisWeekData?.length ?? 0) * 10,
      });
    })();
  }, [userId, streak]);

  // Goal completion prediction
  const prediction = (() => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const created = new Date(createdAt);
    const daysSinceStart = Math.max(1, Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)));
    const consistency = streak / daysSinceStart;
    if (consistency <= 0) return null;
    const totalDays = Math.ceil((deadlineDate.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    const projectedDays = Math.ceil(totalDays / Math.max(0.1, consistency));
    const projectedDate = new Date(created.getTime() + projectedDays * 24 * 60 * 60 * 1000);
    return projectedDate;
  })();

  if (!stats) return null;

  const trend = stats.thisWeek - stats.lastWeek;

  return (
    <div className="glass-card-glow p-5 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">My Progress</h3>
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-2">This week</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-foreground">{stats.thisWeek}</span>
          <span className="text-sm text-muted-foreground">/ 7 days</span>
          {trend !== 0 && (
            <span className={`text-xs font-bold flex items-center gap-0.5 ml-auto ${trend > 0 ? "text-primary" : "text-destructive"}`}>
              {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend)} vs last week
            </span>
          )}
        </div>
        <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: 'hsla(258, 30%, 25%, 0.4)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${(stats.thisWeek / 7) * 100}%`,
              background: 'linear-gradient(90deg, hsl(258 100% 62%), hsl(280 100% 65%))',
            }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/30">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Best Streak</p>
          <p className="text-lg font-black text-foreground mt-0.5">🔥 {stats.bestStreak}d</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">XP This Week</p>
          <p className="text-lg font-black text-foreground mt-0.5">⚡ {stats.xpThisWeek}</p>
        </div>
      </div>

      {prediction && (
        <div className="p-3 rounded-xl flex items-start gap-2.5"
          style={{ background: 'hsla(258, 60%, 40%, 0.1)', border: '1px solid hsla(258, 100%, 62%, 0.2)' }}>
          <Target className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-primary font-bold">Goal forecast</p>
            <p className="text-xs text-foreground font-semibold mt-0.5">
              At this pace, you'll complete your goal on{" "}
              <span className="text-primary">
                {prediction.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsightsPanel;
