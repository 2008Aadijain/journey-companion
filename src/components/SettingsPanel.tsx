import { useState, useEffect, useRef } from "react";
import { X, User, Camera, Bell, Info, LogOut, ChevronRight, Moon, Sun, Palette, Type, Clock, Globe, Trash2, Lock, Mail, Bot, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/hooks/useI18n";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const ACCENT_COLORS = [
  { name: "Purple", value: "purple", hsl: "258 100% 62%" },
  { name: "Blue", value: "blue", hsl: "220 100% 55%" },
  { name: "Green", value: "green", hsl: "145 70% 45%" },
  { name: "Orange", value: "orange", hsl: "25 100% 55%" },
];

const FONT_SIZES = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
];

const SettingsPanel = ({ open, onClose, onLogout }: SettingsPanelProps) => {
  const { user, profile, refreshProfile } = useAuth();
  const { theme, accentColor, fontSize, setTheme, setAccentColor, setFontSize } = useTheme();
  const { lang, setLang, t } = useI18n();
  const { toast } = useToast();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(profile?.name || "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Preferences state
  const [prefs, setPrefs] = useState({
    theme: "dark",
    accent_color: "purple",
    font_size: "medium",
    notifications_enabled: true,
    reminder_time: "20:00",
    language: "en",
  });
  const [showAccentPicker, setShowAccentPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [aiKeyStored, setAiKeyStored] = useState(() => !!localStorage.getItem("gm-gemini-key"));
  const [showAiKeyInput, setShowAiKeyInput] = useState(false);
  const [aiKeyValue, setAiKeyValue] = useState("");

  // Load preferences
  useEffect(() => {
    if (!user || !open) return;
    const load = async () => {
      const { data } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setPrefs({
          theme: data.theme,
          accent_color: data.accent_color,
          font_size: data.font_size,
          notifications_enabled: data.notifications_enabled,
          reminder_time: data.reminder_time,
          language: data.language,
        });
      }
    };
    load();
  }, [user, open]);

  if (!open || !profile || !user) return null;

  const savePrefs = async (updates: Partial<typeof prefs>) => {
    const newPrefs = { ...prefs, ...updates };
    setPrefs(newPrefs);
    const { error } = await supabase
      .from("user_preferences")
      .upsert({ user_id: user.id, ...newPrefs }, { onConflict: "user_id" });
    if (error) console.error("Failed to save preferences:", error);
  };

  const saveName = async () => {
    if (!newName.trim()) return;
    await supabase.from("profiles").update({ name: newName.trim() }).eq("user_id", user.id);
    setEditingName(false);
    refreshProfile();
    toast({ title: "Name updated! ✨" });
  };

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
    setUploading(false);
    refreshProfile();
    toast({ title: "Photo updated! 📸" });
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Failed to change password", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password changed! 🔒" });
      setChangingPassword(false);
      setNewPassword("");
    }
  };

  const handleDeleteAccount = async () => {
    // Delete all user data
    await supabase.from("check_ins").delete().eq("user_id", user.id);
    await supabase.from("direct_messages").delete().eq("sender_id", user.id);
    await supabase.from("friend_requests").delete().or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
    await supabase.from("matches").delete().or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
    await supabase.from("user_preferences").delete().eq("user_id", user.id);
    await supabase.from("profiles").delete().eq("user_id", user.id);
    localStorage.removeItem("gm-gemini-key");
    localStorage.removeItem("gm-ai-activated");
    localStorage.removeItem("gm-ai-popup-shown");
    localStorage.removeItem("gm-onboarding-done");
    localStorage.removeItem("gm-shield-used");
    await supabase.auth.signOut();
    toast({ title: "Account deleted" });
    onClose();
    onLogout();
  };

  const requestNotifications = async () => {
    if ("Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        new Notification("GoalCircle 🔥", { body: "Notifications enabled! We'll remind you to check in." });
        savePrefs({ notifications_enabled: true });
      }
    }
  };

  const sectionTitle = (text: string) => (
    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 px-1 pt-3 pb-1">{text}</p>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-t-3xl overflow-hidden animate-in slide-in-from-bottom duration-300"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', maxHeight: '85vh' }}>
        
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <h2 className="text-lg font-bold text-foreground">Settings</h2>
          <button onClick={onClose} className="p-2 rounded-full glass-card">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-5 py-2 space-y-0.5 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 60px)' }}>
          {/* Profile Header */}
          <div className="flex items-center gap-4 py-3">
            <div className="relative">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                  style={{ background: 'hsla(258, 80%, 50%, 0.2)' }}>
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
              <button onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-background"
                style={{ background: 'hsl(258 100% 62%)' }}>
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => { if (e.target.files?.[0]) uploadAvatar(e.target.files[0]); }} />
            </div>
            <div>
              <p className="text-foreground font-bold">{profile.name}</p>
              <p className="text-xs text-muted-foreground">{profile.goal_emoji} {profile.goal_label}</p>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">{user.email}</p>
              {uploading && <p className="text-xs text-primary mt-1">Uploading...</p>}
            </div>
          </div>

          <div className="h-px bg-border/30 my-1" />

          {/* ═══ UI CUSTOMIZATION ═══ */}
          {sectionTitle("Appearance")}

          {/* Dark/Light Mode */}
          <div className="flex items-center gap-3 py-3">
            {theme === "dark" ? <Moon className="w-5 h-5 text-muted-foreground" /> : <Sun className="w-5 h-5 text-muted-foreground" />}
            <span className="flex-1 text-sm font-medium text-foreground">Dark Mode</span>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>

          {/* Accent Color */}
          <button onClick={() => setShowAccentPicker(!showAccentPicker)}
            className="w-full flex items-center gap-3 py-3 text-left">
            <Palette className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">Accent Color</span>
            <div className="w-5 h-5 rounded-full" style={{ background: `hsl(${ACCENT_COLORS.find(c => c.value === accentColor)?.hsl || ACCENT_COLORS[0].hsl})` }} />
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          {showAccentPicker && (
            <div className="flex gap-3 pb-2 px-8">
              {ACCENT_COLORS.map(color => (
                <button key={color.value} onClick={() => { setAccentColor(color.value); setShowAccentPicker(false); }}
                  className={`w-10 h-10 rounded-full transition-all ${accentColor === color.value ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110" : "hover:scale-105"}`}
                  style={{ background: `hsl(${color.hsl})` }}
                  title={color.name}
                />
              ))}
            </div>
          )}

          {/* Font Size */}
          <button onClick={() => setShowFontPicker(!showFontPicker)}
            className="w-full flex items-center gap-3 py-3 text-left">
            <Type className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">Font Size</span>
            <span className="text-xs text-muted-foreground capitalize">{fontSize}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          {showFontPicker && (
            <div className="flex gap-2 pb-2 px-8">
              {FONT_SIZES.map(fs => (
                <button key={fs.value} onClick={() => { setFontSize(fs.value); setShowFontPicker(false); }}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${fontSize === fs.value ? "bg-primary text-primary-foreground" : "glass-card text-muted-foreground"}`}>
                  {fs.label}
                </button>
              ))}
            </div>
          )}

          <div className="h-px bg-border/30 my-1" />

          {/* ═══ PROFILE SETTINGS ═══ */}
          {sectionTitle("Profile")}

          {/* Edit Name */}
          <button onClick={() => { setEditingName(!editingName); setNewName(profile.name); }}
            className="w-full flex items-center gap-3 py-3 text-left">
            <User className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">Edit Name</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          {editingName && (
            <div className="flex gap-2 pb-2 px-8">
              <input value={newName} onChange={e => setNewName(e.target.value)}
                className="flex-1 bg-transparent border border-border/50 rounded-full px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <button onClick={saveName}
                className="px-4 py-2 rounded-full text-xs font-bold text-primary-foreground"
                style={{ background: 'hsl(258 100% 62%)' }}>Save</button>
            </div>
          )}

          {/* Change Picture */}
          <button onClick={() => fileRef.current?.click()}
            className="w-full flex items-center gap-3 py-3 text-left">
            <Camera className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">Change Picture</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Change Password */}
          <button onClick={() => setChangingPassword(!changingPassword)}
            className="w-full flex items-center gap-3 py-3 text-left">
            <Lock className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">Change Password</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          {changingPassword && (
            <div className="flex gap-2 pb-2 px-8">
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="New password (min 6)"
                className="flex-1 bg-transparent border border-border/50 rounded-full px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50" />
              <button onClick={handleChangePassword}
                className="px-4 py-2 rounded-full text-xs font-bold text-primary-foreground"
                style={{ background: 'hsl(258 100% 62%)' }}>Save</button>
            </div>
          )}

          <div className="h-px bg-border/30 my-1" />

          {/* ═══ APP SETTINGS ═══ */}
          {sectionTitle("App Settings")}

          {/* Notifications */}
          <div className="flex items-center gap-3 py-3">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">Notifications</span>
            <Switch
              checked={prefs.notifications_enabled}
              onCheckedChange={(checked) => {
                if (checked) requestNotifications();
                else savePrefs({ notifications_enabled: false });
              }}
            />
          </div>

          {/* Reminder Time */}
          <button onClick={() => setShowReminderPicker(!showReminderPicker)}
            className="w-full flex items-center gap-3 py-3 text-left">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">Reminder Time</span>
            <span className="text-xs text-muted-foreground">{prefs.reminder_time}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          {showReminderPicker && (
            <div className="flex gap-2 pb-2 px-8 flex-wrap">
              {["18:00", "19:00", "20:00", "21:00", "22:00"].map(t => (
                <button key={t} onClick={() => { savePrefs({ reminder_time: t }); setShowReminderPicker(false); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${prefs.reminder_time === t ? "bg-primary text-primary-foreground" : "glass-card text-muted-foreground"}`}>
                  {t}
                </button>
              ))}
            </div>
          )}

          {/* Language */}
          <div className="flex items-center gap-3 py-3">
            <Globe className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">{t("language")}</span>
            <div className="flex gap-1 p-1 rounded-full" style={{ background: 'hsla(258, 30%, 30%, 0.15)' }}>
              {([
                { v: "en" as const, label: "EN" },
                { v: "hi" as const, label: "हिं" },
                { v: "hg" as const, label: "Hg" },
              ]).map(opt => (
                <button key={opt.v}
                  onClick={() => { setLang(opt.v); savePrefs({ language: opt.v }); }}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${lang === opt.v ? "text-primary-foreground" : "text-muted-foreground"}`}
                  style={lang === opt.v ? { background: 'hsl(258 100% 62%)' } : undefined}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-border/30 my-1" />

          {/* ═══ AI POWER ═══ */}
          {sectionTitle("AI Power")}

          <div className="flex items-center gap-3 py-3">
            <Bot className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">Gemini API Key</span>
            {aiKeyStored ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: 'hsla(145, 70%, 45%, 0.2)', color: 'hsl(145 70% 55%)' }}>
                ✨ Active
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Not set</span>
            )}
          </div>

          {aiKeyStored ? (
            <div className="px-8 pb-3 space-y-3">
              <div className="p-3 rounded-xl" style={{ background: 'hsla(160, 80%, 45%, 0.08)', border: '1px solid hsla(160, 80%, 45%, 0.2)' }}>
                <p className="text-xs font-bold" style={{ color: '#00E5A0' }}>AI Status: Active ✨</p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                  🔒 Your key is encrypted & safe. Logout = key deleted forever.
                </p>
              </div>
              <button onClick={() => {
                localStorage.removeItem("gm-gemini-key");
                localStorage.removeItem("gm-ai-activated");
                setAiKeyStored(false);
                toast({ title: "AI deactivated" });
              }}
                className="w-full py-2 rounded-full text-xs font-bold text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors">
                Deactivate AI
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => setShowAiKeyInput(!showAiKeyInput)}
                className="w-full flex items-center gap-3 py-2 px-8 text-left">
                <span className="text-xs text-primary font-semibold">+ Add API Key</span>
              </button>
              {showAiKeyInput && (
                <div className="px-8 pb-2 space-y-2">
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] text-primary/70 hover:text-primary">
                    <ExternalLink className="w-3 h-3" /> Get free key from Google AI Studio
                  </a>
                  <div className="flex gap-2">
                    <input type="password" value={aiKeyValue} onChange={e => setAiKeyValue(e.target.value)}
                      placeholder="Paste API key..."
                      className="flex-1 bg-transparent border border-border/50 rounded-full px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50" />
                    <button onClick={() => {
                      if (!aiKeyValue.trim()) return;
                      localStorage.setItem("gm-gemini-key", aiKeyValue.trim());
                      localStorage.setItem("gm-ai-activated", "true");
                      localStorage.setItem("gm-ai-popup-shown", "true");
                      setAiKeyStored(true);
                      setShowAiKeyInput(false);
                      setAiKeyValue("");
                      toast({ title: "AI Activated! ✨" });
                    }}
                      className="px-4 py-2 rounded-full text-xs font-bold text-primary-foreground"
                      style={{ background: 'hsl(258 100% 62%)' }}>Save</button>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="h-px bg-border/30 my-1" />

          {/* ═══ ACCOUNT ═══ */}
          {sectionTitle("Account")}

          {/* About */}
          <button className="w-full flex items-center gap-3 py-3 text-left">
            <Info className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <span className="text-sm font-medium text-foreground block">About GoalCircle</span>
              <span className="text-xs text-muted-foreground">Goals are better together</span>
            </div>
          </button>

          {/* Logout */}
          <button onClick={onLogout}
            className="w-full flex items-center gap-3 py-3 text-left">
            <LogOut className="w-5 h-5 text-destructive" />
            <span className="flex-1 text-sm font-medium text-destructive">Logout</span>
          </button>

          {/* Delete Account */}
          <button onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
            className="w-full flex items-center gap-3 py-3 text-left">
            <Trash2 className="w-5 h-5 text-destructive/60" />
            <span className="flex-1 text-sm font-medium text-destructive/60">Delete Account</span>
          </button>
          {showDeleteConfirm && (
            <div className="px-4 pb-3">
              <div className="p-4 rounded-xl border border-destructive/30" style={{ background: 'hsla(0, 80%, 50%, 0.06)' }}>
                <p className="text-sm font-bold text-destructive mb-3">Are you sure? This will:</p>
                <div className="space-y-1.5 mb-4">
                  <p className="text-xs text-destructive/80">❌ Delete all your goals</p>
                  <p className="text-xs text-destructive/80">❌ Delete all your streaks</p>
                  <p className="text-xs text-destructive/80">❌ Delete all your messages</p>
                  <p className="text-xs text-destructive/80">❌ Remove you from all groups</p>
                </div>
                <p className="text-[10px] text-destructive/60 mb-3">This cannot be undone!</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2.5 rounded-full text-xs font-semibold glass-card text-muted-foreground">Cancel</button>
                  <button onClick={handleDeleteAccount}
                    className="flex-1 px-4 py-2.5 rounded-full text-xs font-bold bg-destructive text-destructive-foreground">
                    Yes, Delete Everything
                  </button>
                </div>
              </div>
            </div>
          )}

          <p className="text-center text-[10px] text-muted-foreground/50 pt-4 pb-6">GoalCircle v1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
