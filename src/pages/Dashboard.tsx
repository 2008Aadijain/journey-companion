import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Flame, Target, Users, Calendar, ChevronRight, MessageCircle, Globe, User, Sparkles, MoreVertical, Trophy, Zap, Camera, X } from "lucide-react";
import { getDayTask } from "@/data/roadmaps";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import ProgressGraph from "@/components/ProgressGraph";
import SettingsPanel from "@/components/SettingsPanel";

const MOTIVATION_QUOTES = [
  "Small steps every day lead to big results. 🚀",
  "You didn't come this far to only come this far. 💪",
  "Discipline is choosing what you want most over what you want now. 🎯",
  "The secret of getting ahead is getting started. ⚡",
  "Progress, not perfection. 🌟",
  "Your future self will thank you. 🔥",
  "Consistency beats intensity. Every single time. 💎",
  "One day or day one — you decide. 🏆",
];

const SMART_NUDGES: Record<string, string[]> = {
  Learning: [
    "Try 15 min of focused practice today ⏱️",
    "Teach someone what you learned yesterday 🗣️",
    "Review your notes from Day 1 — see how far you've come 📝",
    "Watch one tutorial video during your break 🎬",
    "Write down 3 things you learned this week ✍️",
    "Try solving a problem without looking at the answer 🧩",
    "Set a timer and do a 20-min deep work sprint 🏃",
  ],
  Fitness: [
    "Drink 2 glasses of water before your first meal 💧",
    "Take a 10-min walk after lunch today 🚶",
    "Try holding a plank for 30 seconds right now 💪",
    "Stretch for 5 minutes before bed tonight 🧘",
    "Track what you eat today — awareness is key 📊",
    "Do 10 pushups right now. Go! 🔥",
    "Sleep 30 min earlier tonight for recovery 😴",
  ],
  Creative: [
    "Spend 10 min browsing design inspiration today 🎨",
    "Try recreating a UI you admire from scratch ✏️",
    "Experiment with a new color palette 🌈",
    "Share your latest work and ask for feedback 💬",
    "Study one design principle deeply today 📐",
    "Take a photo of something beautiful around you 📸",
    "Sketch a quick wireframe on paper ✍️",
  ],
  Business: [
    "Talk to one potential customer today 🗣️",
    "Write down your top 3 priorities for the week 📋",
    "Read one article about your industry 📰",
    "Spend 15 min refining your pitch 🎤",
    "Review your expenses — where can you optimize? 💰",
    "Send one networking message today 🤝",
    "Write down what your ideal customer looks like 🎯",
  ],
  Career: [
    "Update one section of your resume today 📄",
    "Apply to at least one job before end of day 🎯",
    "Practice answering 'Tell me about yourself' 🗣️",
    "Reach out to someone in your desired role on LinkedIn 🔗",
    "Learn one new skill that's in-demand today 📚",
    "Prepare a STAR story for your next interview ⭐",
    "Set up a job alert for your dream role 🔔",
  ],
};

const getSmartNudge = (category: string, day: number): string => {
  const nudges = SMART_NUDGES[category] || SMART_NUDGES.Learning;
  return nudges[(day - 1) % nudges.length];
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const [checkinText, setCheckinText] = useState("");
  const [checkinPhoto, setCheckinPhoto] = useState<File | null>(null);
  const [checkinPhotoPreview, setCheckinPhotoPreview] = useState<string | null>(null);
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);
  const [taskComplete, setTaskComplete] = useState(false);
  const [match, setMatch] = useState<Tables<"matches"> | null>(null);
  const [matchProfile, setMatchProfile] = useState<Tables<"profiles"> | null>(null);
  const [unreadDM, setUnreadDM] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [checkInDates, setCheckInDates] = useState<string[]>([]);
  const [pendingFriendCount, setPendingFriendCount] = useState(0);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!loading && !user) navigate("/goal-setup");
  }, [loading, user, navigate]);

  // Request notification permission on first load
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // 8 PM reminder check
  useEffect(() => {
    if (!user || !profile || todayCheckedIn) return;
    const checkReminder = () => {
      const now = new Date();
      if (now.getHours() >= 20 && "Notification" in window && Notification.permission === "granted") {
        new Notification("GoalMate 🔥", {
          body: "Hey! Don't break your streak today 🔥 Check in now!",
          icon: "/placeholder.svg",
        });
      }
    };
    const interval = setInterval(checkReminder, 60000 * 30); // check every 30 min
    return () => clearInterval(interval);
  }, [user, profile, todayCheckedIn]);

  const calculatedDay = useMemo(() => {
    if (!profile) return 1;
    const created = new Date(profile.created_at);
    const createdDate = new Date(created.getFullYear(), created.getMonth(), created.getDate());
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffDays = Math.floor((todayDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays + 1);
  }, [profile]);

  // Load check-in dates for graph + today check
  useEffect(() => {
    if (!user || !profile) return;
    const loadCheckins = async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data } = await supabase
        .from("check_ins")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", sevenDaysAgo.toISOString());
      if (data) setCheckInDates(data.map(d => d.created_at));

      // Check today
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();
      const { count } = await supabase
        .from("check_ins")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfDay)
        .lt("created_at", endOfDay);
      if (count && count > 0) {
        setTodayCheckedIn(true);
        setTaskComplete(true);
      }
    };
    loadCheckins();
  }, [user, profile]);

  // Pending friend requests count
  useEffect(() => {
    if (!user) return;
    const loadPending = async () => {
      const { count } = await supabase
        .from("friend_requests")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("status", "pending");
      setPendingFriendCount(count || 0);
    };
    loadPending();
  }, [user]);

  useEffect(() => {
    if (!user || !profile) return;
    const findMatch = async () => {
      const { data: existing } = await supabase
        .from("matches").select("*")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq("status", "active").limit(1).single();
      if (existing) {
        setMatch(existing);
        const partnerId = existing.user1_id === user.id ? existing.user2_id : existing.user1_id;
        const { data: partner } = await supabase.from("profiles").select("*").eq("user_id", partnerId).single();
        if (partner) setMatchProfile(partner);
        return;
      }
      const { data: candidates } = await supabase
        .from("profiles").select("*")
        .eq("goal_category", profile.goal_category)
        .neq("user_id", user.id).limit(10);
      if (!candidates || candidates.length === 0) return;
      for (const candidate of candidates) {
        const { data: existingMatch } = await supabase
          .from("matches").select("id")
          .or(`user1_id.eq.${candidate.user_id},user2_id.eq.${candidate.user_id}`)
          .eq("status", "active").limit(1).maybeSingle();
        if (!existingMatch) {
          const { data: newMatch } = await supabase
            .from("matches")
            .insert({ user1_id: user.id, user2_id: candidate.user_id, goal_category: profile.goal_category })
            .select().single();
          if (newMatch) { setMatch(newMatch); setMatchProfile(candidate); }
          return;
        }
      }
    };
    findMatch();
  }, [user, profile]);

  useEffect(() => {
    if (!match || !user) return;
    const countUnread = async () => {
      const { count } = await supabase
        .from("direct_messages").select("*", { count: "exact", head: true })
        .eq("match_id", match.id).neq("sender_id", user.id).eq("read", false);
      setUnreadDM(count || 0);
    };
    countUnread();
    const channel = supabase
      .channel(`unread-${match.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages", filter: `match_id=eq.${match.id}` }, () => countUnread())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [match, user]);

  const daysLeft = useMemo(() => {
    if (!profile?.deadline) return 30;
    return Math.max(0, Math.ceil((new Date(profile.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  }, [profile]);

  const totalDays = useMemo(() => {
    if (!profile?.deadline) return 30;
    const created = new Date(profile.created_at);
    const createdDate = new Date(created.getFullYear(), created.getMonth(), created.getDate());
    return Math.max(30, Math.ceil((new Date(profile.deadline).getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
  }, [profile]);

  const progress = Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100));

  const todayTask = useMemo(() => {
    if (!profile) return null;
    if (profile.is_custom) return { day: calculatedDay, task: `Day ${calculatedDay}: Work on your goal`, detail: "Add your tasks manually and track daily progress." };
    return getDayTask(profile.goal_label.toLowerCase().replace(/\s+/g, '-'), calculatedDay) ||
      getDayTask(profile.goal_category.toLowerCase(), calculatedDay);
  }, [profile, calculatedDay]);

  const todayQuote = useMemo(() => MOTIVATION_QUOTES[new Date().getDate() % MOTIVATION_QUOTES.length], []);
  const todayNudge = useMemo(() => {
    if (!profile) return "";
    return getSmartNudge(profile.goal_category, calculatedDay);
  }, [profile, calculatedDay]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCheckinPhoto(file);
      setCheckinPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setCheckinPhoto(null);
    setCheckinPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleCheckin = async () => {
    if (!checkinText.trim() || !user || !profile || todayCheckedIn) return;

    let photoUrl: string | null = null;
    if (checkinPhoto) {
      const ext = checkinPhoto.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      await supabase.storage.from("avatars").upload(path, checkinPhoto, { upsert: true });
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      photoUrl = publicUrl;
    }

    const newStreak = profile.streak + 1;
    const photoBonus = photoUrl ? 5 : 0;
    const xpGain = 10 + photoBonus + (newStreak % 7 === 0 ? 50 : 0) + (newStreak === 30 ? 200 : 0);
    setTodayCheckedIn(true);
    await supabase.from("check_ins").insert({
      user_id: user.id, user_name: profile.name, goal_category: profile.goal_category,
      goal_label: profile.goal_label, goal_emoji: profile.goal_emoji,
      content: checkinText, streak_at_time: newStreak, photo_url: photoUrl,
    });
    setCheckinText("");
    removePhoto();
    await supabase.from("profiles").update({
      streak: newStreak,
      xp: (profile.xp ?? 0) + xpGain,
    }).eq("user_id", user.id);
    refreshProfile();
  };

  const handleTaskComplete = () => { if (!taskComplete) setTaskComplete(true); };

  const handleLogout = async () => { await signOut(); navigate("/"); };

  if (loading || !profile) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-pulse">🎯</div>
        <p className="text-muted-foreground text-sm">Loading your journey...</p>
      </div>
    </div>
  );

  const fadeClass = (delay: number) => cn(
    "transition-all duration-700",
    mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
  );

  return (
    <div className="min-h-screen bg-background relative">
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} onLogout={handleLogout} />

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-[0.12] blur-[120px]"
          style={{ background: 'hsl(258 100% 55%)' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-5 py-3.5 max-w-lg mx-auto">
          <h1 className="text-xl font-black text-gradient-hero tracking-tight">GoalMate</h1>
          <div className="flex items-center gap-2">
            {/* XP Badge */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full"
              style={{ background: 'hsla(258, 80%, 50%, 0.15)', border: '1px solid hsla(258, 100%, 62%, 0.2)' }}>
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-black text-primary">{profile.xp ?? 0}</span>
            </div>

            {/* Avatar */}
            <button onClick={() => navigate("/profile")} className="relative">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-border/40" />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 border-border/40"
                  style={{ background: 'hsla(258, 80%, 50%, 0.2)' }}>
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
            </button>

            {/* Settings */}
            <button onClick={() => setSettingsOpen(true)} className="p-2 rounded-full hover:bg-muted/50 transition-colors">
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-5 pt-6 pb-6 max-w-lg mx-auto space-y-5">

        {/* ===== STREAK HERO ===== */}
        <div className={fadeClass(0)} style={{ transitionDelay: '0ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Your streak</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-foreground leading-none">{profile.streak}</span>
                <span className="text-lg text-muted-foreground font-semibold">days</span>
              </div>
            </div>
            <div className="relative">
              <div className="text-5xl animate-[breathe_3s_ease-in-out_infinite]">🔥</div>
              <div className="absolute inset-0 rounded-full blur-xl opacity-40"
                style={{ background: 'hsla(25, 100%, 55%, 0.6)' }} />
            </div>
          </div>
        </div>

        {/* ===== MY GOAL CARD ===== */}
        <div className={fadeClass(1)} style={{ transitionDelay: '100ms' }}>
          <div className="rounded-2xl p-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, hsla(258, 100%, 50%, 0.35) 0%, hsla(280, 80%, 35%, 0.25) 50%, hsla(258, 60%, 18%, 0.5) 100%)',
              border: '1px solid hsla(258, 100%, 70%, 0.2)',
              boxShadow: '0 0 60px -15px hsla(258, 100%, 62%, 0.3), inset 0 1px 0 hsla(0, 0%, 100%, 0.06)',
            }}
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[80px] opacity-30"
              style={{ background: 'hsl(258 100% 62%)' }} />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-[60px] opacity-15"
              style={{ background: 'hsl(280 100% 60%)' }} />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">My Goal</span>
                  </div>
                  <h2 className="text-2xl font-black text-foreground leading-tight">{profile.goal_label}</h2>
                </div>
                <span className="text-3xl">{profile.goal_emoji}</span>
              </div>

              <div className="flex items-center gap-5 mb-4">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary/60" />
                  <span className="text-xs text-foreground/70 font-medium">Day {calculatedDay}</span>
                </div>
                <span className="text-xs text-foreground/70 font-medium">{daysLeft} days left</span>
              </div>

              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'hsla(258, 40%, 30%, 0.5)' }}>
                <div className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, hsl(258 100% 65%), hsl(280 100% 65%), hsl(258 100% 70%))',
                    boxShadow: '0 0 16px hsla(258, 100%, 62%, 0.6)',
                  }}
                />
              </div>
              <p className="text-[11px] text-foreground/50 mt-2 font-medium">{progress}% complete</p>
            </div>
          </div>
        </div>

        {/* ===== DAILY CHECK-IN ===== */}
        <div className={fadeClass(2)} style={{ transitionDelay: '200ms' }}>
          <div className="rounded-2xl p-5 border border-border/40" style={{ background: 'hsla(258, 30%, 12%, 0.5)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-4 h-4 text-secondary" />
              <span className="text-sm font-bold text-foreground">Daily Check-in</span>
            </div>

            {todayCheckedIn ? (
              <div className="text-center py-5">
                <div className="text-5xl mb-3 animate-[breathe_3s_ease-in-out_infinite]">✅</div>
                <p className="text-foreground font-bold text-lg">Already checked in!</p>
                <p className="text-muted-foreground text-xs mt-1.5">See you tomorrow — keep the streak alive 🔥</p>
              </div>
            ) : (
              <>
                <textarea
                  value={checkinText}
                  onChange={(e) => setCheckinText(e.target.value)}
                  placeholder="What did you do today for your goal?"
                  className="w-full h-20 bg-transparent border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 resize-none transition-all"
                />

                {/* Photo preview */}
                {checkinPhotoPreview && (
                  <div className="mt-2 relative inline-block">
                    <img src={checkinPhotoPreview} alt="Proof" className="w-20 h-20 rounded-xl object-cover border border-border/40" />
                    <button onClick={removePhoto}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Photo upload button */}
                <div className="mt-2 flex items-center gap-3">
                  <button onClick={() => photoInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold glass-card text-muted-foreground hover:text-foreground transition-all">
                    <Camera className="w-3.5 h-3.5" />
                    Add proof 📸 (optional)
                  </button>
                  {checkinPhoto && <span className="text-[10px] text-primary font-semibold">+5 XP bonus!</span>}
                  <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                </div>

                <button
                  onClick={handleCheckin}
                  disabled={!checkinText.trim()}
                  className="mt-3 w-full py-3.5 rounded-full text-sm font-bold text-primary-foreground transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.97]"
                  style={{
                    background: checkinText.trim()
                      ? 'linear-gradient(135deg, hsl(258 100% 62%), hsl(280 100% 58%))'
                      : 'hsla(258, 30%, 30%, 0.5)',
                    boxShadow: checkinText.trim()
                      ? '0 0 30px hsla(258, 100%, 62%, 0.4), inset 0 1px 0 hsla(0, 0%, 100%, 0.15)'
                      : 'none',
                  }}
                >
                  Check In ✅ (+10 XP{checkinPhoto ? " +5 📸" : ""})
                </button>
              </>
            )}
          </div>
        </div>

        {/* ===== PROGRESS GRAPH ===== */}
        <div className={fadeClass(3)} style={{ transitionDelay: '250ms' }}>
          <ProgressGraph checkInDates={checkInDates} />
        </div>

        {/* ===== GOALMATE CARD ===== */}
        <div className={fadeClass(4)} style={{ transitionDelay: '300ms' }}>
          <div className="rounded-2xl p-5 border border-border/40" style={{ background: 'hsla(270, 30%, 12%, 0.5)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">Your GoalMate</span>
            </div>

            {matchProfile ? (
              <div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {matchProfile.avatar_url ? (
                      <img src={matchProfile.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover"
                        style={{ border: '2px solid hsla(258, 100%, 62%, 0.3)' }} />
                    ) : (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                        style={{ background: 'hsla(258, 80%, 50%, 0.2)', border: '2px solid hsla(258, 100%, 62%, 0.3)' }}>
                        {matchProfile.goal_emoji}
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background"
                      style={{ background: 'hsl(145 80% 50%)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-bold text-sm">{matchProfile.name}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{matchProfile.goal_label}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Flame className="w-3 h-3 text-secondary" />
                      <span className="text-xs text-secondary font-bold">{matchProfile.streak} day streak</span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-3">Motivate each other 💪</p>
                <button
                  onClick={() => navigate(`/chat/${match?.id}`)}
                  className="mt-3 w-full py-2.5 rounded-full text-sm font-bold text-foreground transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-2"
                  style={{ background: 'hsla(258, 60%, 40%, 0.25)', border: '1px solid hsla(258, 100%, 62%, 0.2)' }}
                >
                  <MessageCircle className="w-4 h-4 text-primary" />
                  Chat with {matchProfile.name.split(" ")[0]}
                  {unreadDM > 0 && (
                    <span className="ml-1 w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold flex items-center justify-center">
                      {unreadDM}
                    </span>
                  )}
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground font-bold text-sm">Finding your GoalMate...</p>
                    <p className="text-muted-foreground text-xs mt-0.5">Matching you with someone on the same mission</p>
                  </div>
                </div>
                <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: 'hsla(258, 30%, 25%, 0.5)' }}>
                  <div className="h-full rounded-full animate-pulse" style={{ width: '65%', background: 'linear-gradient(90deg, hsl(258 100% 62%), hsl(280 100% 60%))' }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== GROUP CHAT ===== */}
        <div className={fadeClass(5)} style={{ transitionDelay: '350ms' }}>
          <button onClick={() => navigate("/group-chat")}
            className="w-full rounded-2xl p-4 text-left border border-border/40 transition-all duration-300 active:scale-[0.98]"
            style={{ background: 'hsla(258, 30%, 12%, 0.5)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'hsla(258, 80%, 50%, 0.15)' }}>
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-foreground font-bold text-sm">{profile.goal_category} Group</p>
                  <p className="text-muted-foreground text-[11px]">Chat with others chasing the same goal</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </button>
        </div>

        {/* ===== TODAY'S TASK ===== */}
        {todayTask && (
          <div className={fadeClass(6)} style={{ transitionDelay: '400ms' }}>
            <div className="rounded-2xl p-5 border border-border/40" style={{ background: 'hsla(258, 30%, 12%, 0.5)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-base">📋</span>
                  <span className="text-sm font-bold text-foreground">Today's Task</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary/70 px-2.5 py-1 rounded-full"
                  style={{ background: 'hsla(258, 80%, 50%, 0.12)' }}>Day {todayTask.day}</span>
              </div>
              <div className="flex items-start gap-3">
                <button onClick={handleTaskComplete} disabled={taskComplete}
                  className={cn("mt-0.5 w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all duration-300",
                    taskComplete ? "border-primary bg-primary text-primary-foreground" : "border-border/60 hover:border-primary/60"
                  )}>
                  {taskComplete && <Check className="w-3.5 h-3.5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-semibold transition-all", taskComplete ? "text-muted-foreground line-through" : "text-foreground")}>
                    {todayTask.task}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1.5 leading-relaxed">{todayTask.detail}</p>
                </div>
              </div>
              {taskComplete && (
                <div className="mt-4 text-center py-2.5 rounded-xl" style={{ background: 'hsla(258, 80%, 50%, 0.1)' }}>
                  <p className="text-xs text-primary font-bold">✨ Great job! See you tomorrow.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== SMART NUDGE ===== */}
        <div className={fadeClass(7)} style={{ transitionDelay: '450ms' }}>
          <div className="rounded-2xl p-4 border border-secondary/20 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, hsla(25, 80%, 50%, 0.08) 0%, hsla(258, 40%, 15%, 0.4) 100%)' }}>
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-[40px] opacity-20"
              style={{ background: 'hsl(25 100% 55%)' }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">💡</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-secondary/80">Daily Suggestion</span>
              </div>
              <p className="text-sm text-foreground font-semibold leading-relaxed">{todayNudge}</p>
            </div>
          </div>
        </div>

        {/* ===== MOTIVATION ===== */}
        <div className={fadeClass(8)} style={{ transitionDelay: '500ms' }}>
          <div className="rounded-2xl p-4 border border-border/30" style={{ background: 'hsla(258, 20%, 10%, 0.4)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-primary/70" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Today's Motivation</span>
            </div>
            <p className="text-sm text-foreground/80 font-medium italic leading-relaxed">"{todayQuote}"</p>
          </div>
        </div>

        <div className="h-24" />
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/30 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-around max-w-lg mx-auto py-2.5">
          {[
            { icon: Target, label: "Home", path: "/dashboard", active: true },
            { icon: Globe, label: "Wall", path: "/progress-wall", active: false },
            { icon: Users, label: "Friends", path: "/friends", active: false, badge: pendingFriendCount },
            { icon: Trophy, label: "Rank", path: "/leaderboard", active: false },
            { icon: User, label: "Profile", path: "/profile", active: false },
          ].map((item) => (
            <button key={item.label} onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors relative"
            >
              <item.icon className={cn("w-5 h-5", item.active ? "text-primary" : "text-muted-foreground/60")} />
              <span className={cn("text-[10px] font-bold", item.active ? "text-primary" : "text-muted-foreground/60")}>{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-0.5 right-0 w-4 h-4 rounded-full bg-secondary text-secondary-foreground text-[8px] font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Dashboard;
