import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flame, Trophy, Share2, LogOut, Zap, Camera, Users as UsersIcon, Target } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import InsightsPanel from "@/components/InsightsPanel";
import ShareCard from "@/components/ShareCard";

interface Achievement {
  id: string;
  badge_name: string;
  badge_emoji: string;
  badge_description: string;
  earned_at: string;
}

const ALL_BADGES = [
  { name: "Getting Started", emoji: "🌱", description: "3 day streak", threshold: 3 },
  { name: "On Fire", emoji: "🔥", description: "7 day streak", threshold: 7 },
  { name: "Habit Builder", emoji: "🏗️", description: "21 day streak", threshold: 21 },
  { name: "GoalMate Champion", emoji: "🏆", description: "30 day streak", threshold: 30 },
];

const getLevelTitle = (xp: number): { title: string; emoji: string } => {
  if (xp >= 1000) return { title: "Champion", emoji: "🏆" };
  if (xp >= 501) return { title: "Achiever", emoji: "⚡" };
  if (xp >= 101) return { title: "Explorer", emoji: "🚀" };
  return { title: "Beginner", emoji: "🌱" };
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [friendCount, setFriendCount] = useState(0);
  const [showShareCard, setShowShareCard] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/goal-setup");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchAchievements = async () => {
      const { data } = await supabase.from("achievements").select("*").eq("user_id", user.id).order("earned_at", { ascending: true });
      if (data) setAchievements(data);
    };
    fetchAchievements();
    // friend count
    (async () => {
      const { data } = await supabase
        .from("friend_requests")
        .select("id")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq("status", "accepted");
      setFriendCount(data?.length || 0);
    })();
  }, [user]);

  useEffect(() => {
    if (!user || !profile) return;
    const checkBadges = async () => {
      for (const badge of ALL_BADGES) {
        if (profile.streak >= badge.threshold && !achievements.find(a => a.badge_name === badge.name)) {
          const { data } = await supabase.from("achievements").insert({
            user_id: user.id,
            badge_name: badge.name,
            badge_emoji: badge.emoji,
            badge_description: badge.description,
          }).select().single();
          if (data) {
            setAchievements(prev => [...prev, data]);
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
          }
        }
      }
    };
    checkBadges();
  }, [user, profile, achievements]);

  const handleShare = async (badge: Achievement) => {
    const text = `I just earned the "${badge.badge_emoji} ${badge.badge_name}" badge on GoalMate! ${badge.badge_description}. Join me at GoalMate!`;
    if (navigator.share) {
      try { await navigator.share({ title: "GoalMate Achievement", text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
    setUploading(false);
    refreshProfile();
  };

  const handleLogout = async () => { await signOut(); navigate("/"); };

  if (loading || !profile) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-4xl animate-pulse">👤</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <div key={i} className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`,
                width: `${8 + Math.random() * 8}px`,
                height: `${8 + Math.random() * 8}px`,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                background: ['hsl(258 100% 62%)', 'hsl(0 100% 71%)', 'hsl(50 100% 60%)', 'hsl(145 60% 50%)', 'hsl(210 100% 60%)'][Math.floor(Math.random() * 5)],
                animation: `confetti-fall ${2 + Math.random() * 2}s ease-in forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-border/50 bg-background/80">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="p-2 rounded-full glass-card">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Profile</h1>
          </div>
          <button onClick={handleLogout} className="p-2 rounded-full glass-card">
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-5 pb-24">
        {/* Profile Card */}
        <div className="glass-card-glow p-6 text-center animate-goalmate-glow">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full blur-xl opacity-60"
              style={{ background: 'radial-gradient(circle, hsl(258 100% 62%), transparent 70%)' }} />
            <div className="relative rounded-full p-[3px]"
              style={{ background: 'linear-gradient(135deg, hsl(258 100% 62%), hsl(280 100% 60%))' }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-[74px] h-[74px] rounded-full object-cover border-2 border-background" />
              ) : (
                <div className="w-[74px] h-[74px] rounded-full flex items-center justify-center text-3xl font-bold border-2 border-background"
                  style={{ background: 'linear-gradient(135deg, hsla(258, 100%, 62%, 0.3), hsla(0, 100%, 71%, 0.2))' }}>
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <button onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-background z-10"
              style={{ background: 'hsl(258 100% 62%)' }}>
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { if (e.target.files?.[0]) uploadAvatar(e.target.files[0]); }} />
          </div>
          {uploading && <p className="text-xs text-primary mb-2">Uploading...</p>}
          <h2 className="text-2xl font-black text-foreground">{profile.name}</h2>
          {(() => {
            const lv = getLevelTitle(profile.xp ?? 0);
            return (
              <p className="text-xs font-bold mt-1.5 inline-flex items-center gap-1 px-3 py-1 rounded-full"
                style={{ background: 'hsla(258, 80%, 50%, 0.15)', color: 'hsl(258 100% 70%)', border: '1px solid hsla(258, 100%, 62%, 0.3)' }}>
                {lv.emoji} {lv.title}
              </p>
            );
          })()}
          <p className="text-sm text-muted-foreground mt-2">{profile.goal_emoji} {profile.goal_label}</p>
          <div className="grid grid-cols-4 gap-2 mt-5">
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center">
                <Target className="w-3.5 h-3.5 text-primary" />
                <span className="text-base font-bold text-foreground">1</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Goals</p>
            </div>
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
                <UsersIcon className="w-3.5 h-3.5 text-primary" />
                <span className="text-base font-bold text-foreground">{friendCount}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Friends</p>
            </div>
          </div>
          <button
            onClick={() => setShowShareCard(true)}
            className="mt-5 w-full py-2.5 rounded-full text-xs font-bold text-primary-foreground inline-flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, hsl(258 100% 62%), hsl(280 100% 55%))' }}
          >
            <Share2 className="w-3.5 h-3.5" /> Share Profile
          </button>
        </div>

        {/* Smart Insights */}
        {user && (
          <InsightsPanel
            userId={user.id}
            streak={profile.streak}
            deadline={profile.deadline}
            createdAt={profile.created_at}
          />
        )}

        {/* Public profile link */}
        {user && (
          <button
            onClick={async () => {
              const url = `${window.location.origin}/u/${user.id}`;
              if (navigator.share) {
                try { await navigator.share({ title: `${profile.name} on GoalMate`, url }); } catch {}
              } else {
                await navigator.clipboard.writeText(url);
              }
            }}
            className="w-full glass-card p-3 flex items-center gap-3 text-left hover:bg-primary/5 transition-all">
            <div className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'hsla(258, 80%, 50%, 0.15)' }}>
              <Share2 className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-foreground">My public profile</p>
              <p className="text-[10px] text-muted-foreground">Share your goalmate.app/u/... link</p>
            </div>
          </button>
        )}

        {/* Badges */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" /> Achievements
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {ALL_BADGES.map(badge => {
              const earned = achievements.find(a => a.badge_name === badge.name);
              return (
                <div key={badge.name}
                  className={`glass-card p-4 text-center transition-all ${earned ? "" : "opacity-40 grayscale"}`}>
                  <div className="text-3xl mb-2">{badge.emoji}</div>
                  <p className="text-xs font-bold text-foreground">{badge.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{badge.description}</p>
                  {earned && (
                    <button onClick={() => handleShare(earned)}
                      className="mt-2 flex items-center gap-1 mx-auto px-2 py-1 rounded-full text-[10px] font-semibold text-primary hover:bg-primary/10 transition-all">
                      <Share2 className="w-3 h-3" /> Share
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Goal */}
        <div className="glass-card-glow p-5">
          <h3 className="text-sm font-bold text-foreground mb-3">Current Goal</h3>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{profile.goal_emoji}</span>
            <div>
              <p className="text-sm font-semibold text-foreground">{profile.goal_label}</p>
              <p className="text-xs text-muted-foreground">{profile.goal_category} · Day {Math.max(1, Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)) + 1)}</p>
              {profile.deadline && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Deadline: {new Date(profile.deadline).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
      <ShareCard
        open={showShareCard}
        onClose={() => setShowShareCard(false)}
        name={profile.name}
        goalEmoji={profile.goal_emoji}
        goalLabel={profile.goal_label}
        streak={profile.streak}
        xp={profile.xp ?? 0}
        level={getLevelTitle(profile.xp ?? 0).title}
        badges={achievements.length}
      />
    </div>
  );
};

export default Profile;
