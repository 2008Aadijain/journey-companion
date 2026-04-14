import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Particles from "@/components/Particles";
import { presetGoals } from "@/data/roadmaps";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const GoalSetup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, loading, signUp, signIn } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<"goal" | "custom" | "deadline" | "signup" | "login">(
    searchParams.get("login") === "true" ? "login" : "goal"
  );
  const [selectedGoal, setSelectedGoal] = useState<{ id: string; label: string; emoji: string; category?: string } | null>(null);
  const [customGoal, setCustomGoal] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [formLoading, setFormLoading] = useState(false);

  // If already logged in with profile, redirect to dashboard
  useEffect(() => {
    if (!loading && user && profile) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, user, profile, navigate]);

  const handleGoalSelect = (goal: typeof presetGoals[0]) => {
    setSelectedGoal(goal);
    setTimeout(() => setStep("deadline"), 300);
  };

  const handleCustomGoalSubmit = () => {
    if (!customGoal.trim()) return;
    setSelectedGoal({ id: "custom", label: customGoal, emoji: "✨", category: "Custom" });
    setStep("deadline");
  };

  const handleDeadlineNext = () => {
    if (!deadline) return;
    setStep("signup");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    setFormLoading(true);

    const { error } = await signUp(form.email, form.password, {
      name: form.name,
      goalCategory: selectedGoal.category || selectedGoal.id,
      goalLabel: selectedGoal.label,
      goalEmoji: selectedGoal.emoji,
      deadline: deadline ? deadline.toISOString().split("T")[0] : null,
      isCustom: selectedGoal.id === "custom",
    });

    setFormLoading(false);
    if (error) {
      toast({ title: "Signup failed", description: error, variant: "destructive" });
      return;
    }
    navigate("/dashboard");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    const { error } = await signIn(loginForm.email, loginForm.password);
    setFormLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error, variant: "destructive" });
      return;
    }
    navigate("/dashboard");
  };

  const stepNumber = step === "goal" || step === "custom" ? 1 : step === "deadline" ? 2 : 3;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-5xl animate-pulse">🎯</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient relative overflow-hidden flex items-center justify-center px-4 py-12">
      <Particles />

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-15 blur-[100px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsla(258, 100%, 62%, 0.5), transparent 70%)' }}
      />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8 fade-up">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                s <= stepNumber
                  ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsla(258,100%,62%,0.5)]"
                  : "bg-muted text-muted-foreground"
              )}>
                {s}
              </div>
              {s < 3 && (
                <div className={cn(
                  "w-12 h-0.5 transition-all duration-300",
                  s < stepNumber ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Goal Selection */}
        {step === "goal" && (
          <div className="fade-up text-center">
            <h2 className="text-3xl md:text-4xl font-black text-gradient-hero mb-2 tracking-tight">
              What's your mission? 🚀
            </h2>
            <p className="text-muted-foreground mb-8">Pick a goal or create your own</p>

            <div className="grid grid-cols-2 gap-3">
              {presetGoals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => handleGoalSelect(goal)}
                  className={cn(
                    "glass-card-glow p-5 text-left group transition-all duration-300",
                    selectedGoal?.id === goal.id && "ring-2 ring-primary"
                  )}
                >
                  <div className="text-2xl mb-2">{goal.emoji}</div>
                  <div className="text-foreground font-semibold text-sm">{goal.label}</div>
                  <div className="text-muted-foreground text-xs mt-0.5">{goal.category}</div>
                </button>
              ))}

              <button
                onClick={() => setStep("custom")}
                className="glass-card-glow p-5 text-left group border-dashed col-span-2"
              >
                <div className="text-2xl mb-2">✨</div>
                <div className="text-foreground font-semibold text-sm">My Own Goal</div>
                <div className="text-muted-foreground text-xs mt-0.5">Define your own challenge</div>
              </button>
            </div>
          </div>
        )}

        {/* Step 1b: Custom Goal */}
        {step === "custom" && (
          <div className="fade-up text-center">
            <h2 className="text-3xl md:text-4xl font-black text-gradient-hero mb-2 tracking-tight">
              What's your goal? ✨
            </h2>
            <p className="text-muted-foreground mb-8">Be specific — your GoalMate needs to know!</p>

            <textarea
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              placeholder="e.g. Run a 5K in under 30 minutes..."
              className="w-full h-32 glass-card bg-transparent text-foreground placeholder:text-muted-foreground p-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />

            <div className="flex gap-3 mt-6 justify-center">
              <button
                onClick={() => setStep("goal")}
                className="px-6 py-3 rounded-full text-muted-foreground font-semibold transition-all hover:text-foreground"
              >
                ← Back
              </button>
              <button
                onClick={handleCustomGoalSubmit}
                disabled={!customGoal.trim()}
                className="glow-button text-primary-foreground px-10 py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Deadline */}
        {step === "deadline" && (
          <div className="fade-up text-center">
            <div className="text-5xl mb-4">{selectedGoal?.emoji}</div>
            <h2 className="text-2xl md:text-3xl font-black text-gradient-hero mb-1 tracking-tight">
              {selectedGoal?.label}
            </h2>
            <p className="text-muted-foreground mb-8">When do you want to achieve this?</p>

            <div className="flex justify-center mb-6">
              <Popover>
                <PopoverTrigger asChild>
                  <button className={cn(
                    "glass-card-glow flex items-center gap-3 px-6 py-4 text-left w-full max-w-xs",
                    !deadline && "text-muted-foreground"
                  )}>
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    {deadline ? format(deadline, "PPP") : "Pick a deadline"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border" align="center">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    disabled={(date) => date < new Date()}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2 justify-center flex-wrap mb-8">
              {[
                { label: "30 days", days: 30 },
                { label: "60 days", days: 60 },
                { label: "90 days", days: 90 },
              ].map((opt) => {
                const target = new Date();
                target.setDate(target.getDate() + opt.days);
                return (
                  <button
                    key={opt.days}
                    onClick={() => setDeadline(target)}
                    className="px-4 py-2 rounded-full text-xs font-semibold glass-card hover:bg-primary/20 transition-all text-muted-foreground hover:text-foreground"
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setStep("goal")}
                className="px-6 py-3 rounded-full text-muted-foreground font-semibold transition-all hover:text-foreground"
              >
                ← Back
              </button>
              <button
                onClick={handleDeadlineNext}
                disabled={!deadline}
                className="glow-button text-primary-foreground px-10 py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Signup */}
        {step === "signup" && (
          <div className="fade-up">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-gradient-hero tracking-tight">Almost there! 🚀</h2>
              <p className="text-muted-foreground mt-2">Create your account to start crushing it</p>
            </div>

            <div className="glass-card p-4 mb-6 flex items-center gap-3">
              <span className="text-2xl">{selectedGoal?.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-semibold text-sm truncate">{selectedGoal?.label}</p>
                <p className="text-muted-foreground text-xs">
                  Deadline: {deadline ? format(deadline, "PPP") : "Not set"}
                </p>
              </div>
            </div>

            {/* Social Signup */}
            <div className="space-y-3 mb-4">
              <button
                onClick={async () => {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: { redirectTo: window.location.origin + "/dashboard" },
                  });
                  if (error) toast({ title: "Google signup failed", description: error.message, variant: "destructive" });
                }}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                style={{ background: 'hsl(0 0% 100%)', color: 'hsl(0 0% 20%)' }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </div>

            {/* OR Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-border/50" />
            </div>

            <form onSubmit={handleSignup} className="glass-card-glow p-6 space-y-4">
              {[
                { key: "name", label: "Your Name", type: "text", placeholder: "Arjun" },
                { key: "email", label: "Email", type: "email", placeholder: "arjun@example.com" },
                { key: "password", label: "Password", type: "password", placeholder: "••••••••" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-sm text-muted-foreground mb-1.5 font-medium">{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    required
                    minLength={field.key === "password" ? 6 : undefined}
                    value={form[field.key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className="w-full bg-transparent border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              ))}

              <button
                type="submit"
                disabled={formLoading}
                className="w-full glow-button text-primary-foreground py-4 text-lg font-bold disabled:opacity-60"
              >
                {formLoading ? "Creating account..." : "Let's Go! 🔥"}
              </button>
            </form>

            <button
              onClick={() => setStep("deadline")}
              className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to deadline
            </button>

            <button
              onClick={() => setStep("login")}
              className="mt-2 w-full text-center text-sm text-primary hover:text-primary/80 transition-colors font-semibold"
            >
              Already have an account? Log in
            </button>
          </div>
        )}

        {/* Step: Login */}
        {step === "login" && (
          <div className="fade-up">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-gradient-hero tracking-tight">Welcome Back! 👋</h2>
              <p className="text-muted-foreground mt-2">Log in to continue your journey</p>
            </div>

            {/* Social Login */}
            <div className="space-y-3 mb-4">
              <button
                onClick={async () => {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: { redirectTo: window.location.origin + "/dashboard" },
                  });
                  if (error) toast({ title: "Google login failed", description: error.message, variant: "destructive" });
                }}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                style={{ background: 'hsl(0 0% 100%)', color: 'hsl(0 0% 20%)' }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </div>

            {/* OR Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-border/50" />
            </div>

            <form onSubmit={handleLogin} className="glass-card-glow p-6 space-y-4">
              {[
                { key: "email", label: "Email", type: "email", placeholder: "arjun@example.com" },
                { key: "password", label: "Password", type: "password", placeholder: "••••••••" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-sm text-muted-foreground mb-1.5 font-medium">{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    required
                    value={loginForm[field.key as keyof typeof loginForm]}
                    onChange={(e) => setLoginForm({ ...loginForm, [field.key]: e.target.value })}
                    className="w-full bg-transparent border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              ))}

              <button
                type="submit"
                disabled={formLoading}
                className="w-full glow-button text-primary-foreground py-4 text-lg font-bold disabled:opacity-60"
              >
                {formLoading ? "Logging in..." : "Log In 🔥"}
              </button>
            </form>

            <button
              onClick={() => setStep("goal")}
              className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← New here? Set up your goal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalSetup;
