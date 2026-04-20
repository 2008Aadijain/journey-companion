import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Flame, Trophy, Zap, Target, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const getLevelTitle = (xp: number): { title: string; emoji: string } => {
  if (xp >= 1000) return { title: "Champion", emoji: "🏆" };
  if (xp >= 501) return { title: "Achiever", emoji: "⚡" };
  if (xp >= 101) return { title: "Explorer", emoji: "🚀" };
  return { title: "Beginner", emoji: "🌱" };
};

const PublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [achievements, setAchievements] = useState<Tables<"achievements">[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (!p) { setNotFound(true); setLoading(false); return; }
      setProfile(p);
      const { data: a } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", userId)
        .order("earned_at", { ascending: true });
      if (a) setAchievements(a);
      setLoading(false);
    })();
  }, [userId]);

  const sharePublic = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: `${profile?.name} on GoalMate`, url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Profile link copied! 📋");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 max-w-lg mx-auto space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-xl font-bold text-foreground mb-2">Profile not found</h2>
        <p className="text-sm text-muted-foreground mb-6">This user doesn't exist on GoalMate.</p>
        <button onClick={() => navigate("/")}
          className="px-6 py-2.5 rounded-full text-sm font-bold text-primary-foreground"
          style={{ background: 'linear-gradient(135deg, hsl(258 100% 62%), hsl(280 100% 55%))' }}>
          Go to GoalMate
        </button>
      </div>
    );
  }

  const lv = getLevelTitle(profile.xp ?? 0);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-border/50 bg-background/80">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full glass-card">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <h1 className="text-sm font-bold text-foreground">Public Profile</h1>
          <button onClick={sharePublic} className="p-2 rounded-full glass-card">
            <Share2 className="w-4 h-4 text-foreground" />
          </button>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-5">
        <div className="glass-card-glow p-6 text-center animate-goalmate-glow">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full blur-xl opacity-60"
              style={{ background: 'radial-gradient(circle, hsl(258 100% 62%), transparent 70%)' }} />
            <div className="relative rounded-full p-[3px]"
              style={{ background: 'linear-gradient(135deg, hsl(258 100% 62%), hsl(280 100% 60%))' }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-[90px] h-[90px] rounded-full object-cover border-2 border-background" />
              ) : (
                <div className="w-[90px] h-[90px] rounded-full flex items-center justify-center text-4xl font-bold border-2 border-background"
                  style={{ background: 'linear-gradient(135deg, hsla(258, 100%, 62%, 0.3), hsla(0, 100%, 71%, 0.2))' }}>
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <h2 className="text-2xl font-black text-foreground">{profile.name}</h2>
          <p className="text-xs font-bold mt-1.5 inline-flex items-center gap-1 px-3 py-1 rounded-full"
            style={{ background: 'hsla(258, 80%, 50%, 0.15)', color: 'hsl(258 100% 70%)', border: '1px solid hsla(258, 100%, 62%, 0.3)' }}>
            {lv.emoji} {lv.title}
          </p>
          <p className="text-sm text-muted-foreground mt-2">{profile.goal_emoji} {profile.goal_label}</p>

          <div className="grid grid-cols-3 gap-2 mt-5">
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center">
                <Flame className="w-3.5 h-3.5 text-secondary animate-flame-flicker" />
                <span className="text-base font-bold text-foreground">{profile.streak}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Streak</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span className="text-base font-bold text-foreground">{profile.xp ?? 0}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">XP</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center">
                <Trophy className="w-3.5 h-3.5 text-primary" />
                <span className="text-base font-bold text-foreground">{achievements.length}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Badges</p>
            </div>
          </div>
        </div>

        {achievements.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" /> Badges Earned
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {achievements.map(b => (
                <div key={b.id} className="glass-card p-4 text-center">
                  <div className="text-3xl mb-2">{b.badge_emoji}</div>
                  <p className="text-xs font-bold text-foreground">{b.badge_name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{b.badge_description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={() => navigate("/login")}
          className="w-full py-3 rounded-full text-sm font-bold text-primary-foreground"
          style={{ background: 'linear-gradient(135deg, hsl(258 100% 62%), hsl(280 100% 55%))' }}>
          <Target className="w-4 h-4 inline mr-2" />
          Start Your Goal Journey
        </button>
      </main>
    </div>
  );
};

export default PublicProfile;
