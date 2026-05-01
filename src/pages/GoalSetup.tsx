import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<"goal" | "custom" | "deadline">("goal");
  const [selectedGoal, setSelectedGoal] = useState<{ id: string; label: string; emoji: string; category?: string } | null>(null);
  const [customGoal, setCustomGoal] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [formLoading, setFormLoading] = useState(false);
  const [name, setName] = useState("");

  // If already has profile, go to dashboard
  useEffect(() => {
    if (!loading && user && profile) {
      navigate("/dashboard", { replace: true });
    }
    if (!loading && !user) {
      navigate("/login", { replace: true });
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

  const handleFinish = async () => {
    if (!selectedGoal || !deadline || !user || !name.trim()) return;
    setFormLoading(true);

    const { error } = await supabase.from("profiles").insert({
      user_id: user.id,
      name: name.trim(),
      goal_category: selectedGoal.category || selectedGoal.id,
      goal_label: selectedGoal.label,
      goal_emoji: selectedGoal.emoji,
      deadline: deadline.toISOString().split("T")[0],
      is_custom: selectedGoal.id === "custom",
    });

    setFormLoading(false);
    if (error) {
      toast({ title: "Setup failed", description: error.message, variant: "destructive" });
      return;
    }
    navigate("/dashboard");
  };

  const stepNumber = step === "goal" || step === "custom" ? 1 : 2;

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
        style={{ background: 'radial-gradient(circle, hsla(258, 100%, 62%, 0.5), transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8 fade-up">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                s <= stepNumber
                  ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsla(258,100%,62%,0.5)]"
                  : "bg-muted text-muted-foreground"
              )}>{s}</div>
              {s < 2 && <div className={cn("w-12 h-0.5 transition-all duration-300", s < stepNumber ? "bg-primary" : "bg-muted")} />}
            </div>
          ))}
        </div>

        {/* Step 1: Goal Selection */}
        {step === "goal" && (
          <div className="fade-up text-center">
            <h2 className="text-3xl md:text-4xl font-black text-gradient-hero mb-2 tracking-tight">What's your mission? 🚀</h2>
            <p className="text-muted-foreground mb-8">Pick a goal or create your own</p>
            <div className="grid grid-cols-2 gap-3">
              {presetGoals.map((goal) => (
                <button key={goal.id} onClick={() => handleGoalSelect(goal)}
                  className={cn("glass-card-glow p-5 text-left group transition-all duration-300", selectedGoal?.id === goal.id && "ring-2 ring-primary")}>
                  <div className="text-2xl mb-2">{goal.emoji}</div>
                  <div className="text-foreground font-semibold text-sm">{goal.label}</div>
                  <div className="text-muted-foreground text-xs mt-0.5">{goal.category}</div>
                </button>
              ))}
              <button onClick={() => setStep("custom")} className="glass-card-glow p-5 text-left group border-dashed col-span-2">
                <div className="text-2xl mb-2">✨</div>
                <div className="text-foreground font-semibold text-sm">My Own Goal</div>
                <div className="text-muted-foreground text-xs mt-0.5">Define your own challenge</div>
              </button>
            </div>
          </div>
        )}

        {/* Custom Goal */}
        {step === "custom" && (
          <div className="fade-up text-center">
            <h2 className="text-3xl md:text-4xl font-black text-gradient-hero mb-2 tracking-tight">What's your goal? ✨</h2>
            <p className="text-muted-foreground mb-8">Be specific — your GoalCircle needs to know!</p>
            <textarea value={customGoal} onChange={(e) => setCustomGoal(e.target.value)}
              placeholder="e.g. Run a 5K in under 30 minutes..."
              className="w-full h-32 glass-card bg-transparent text-foreground placeholder:text-muted-foreground p-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
            <div className="flex gap-3 mt-6 justify-center">
              <button onClick={() => setStep("goal")} className="px-6 py-3 rounded-full text-muted-foreground font-semibold transition-all hover:text-foreground">← Back</button>
              <button onClick={handleCustomGoalSubmit} disabled={!customGoal.trim()}
                className="glow-button text-primary-foreground px-10 py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none">Next →</button>
            </div>
          </div>
        )}

        {/* Step 2: Deadline + Name */}
        {step === "deadline" && (
          <div className="fade-up text-center">
            <div className="text-5xl mb-4">{selectedGoal?.emoji}</div>
            <h2 className="text-2xl md:text-3xl font-black text-gradient-hero mb-1 tracking-tight">{selectedGoal?.label}</h2>
            <p className="text-muted-foreground mb-6">Set your deadline and name</p>

            {/* Name input */}
            <div className="mb-6 max-w-xs mx-auto">
              <label className="block text-sm text-muted-foreground mb-1.5 font-medium text-left">Your Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Arjun"
                className="w-full bg-transparent border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" />
            </div>

            <div className="flex justify-center mb-6">
              <Popover>
                <PopoverTrigger asChild>
                  <button className={cn("glass-card-glow flex items-center gap-3 px-6 py-4 text-left w-full max-w-xs", !deadline && "text-muted-foreground")}>
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    {deadline ? format(deadline, "PPP") : "Pick a deadline"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border" align="center">
                  <Calendar mode="single" selected={deadline} onSelect={setDeadline} disabled={(date) => date < new Date()} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2 justify-center flex-wrap mb-8">
              {[{ label: "30 days", days: 30 }, { label: "60 days", days: 60 }, { label: "90 days", days: 90 }].map((opt) => {
                const target = new Date(); target.setDate(target.getDate() + opt.days);
                return (
                  <button key={opt.days} onClick={() => setDeadline(target)}
                    className="px-4 py-2 rounded-full text-xs font-semibold glass-card hover:bg-primary/20 transition-all text-muted-foreground hover:text-foreground">
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 justify-center">
              <button onClick={() => setStep("goal")} className="px-6 py-3 rounded-full text-muted-foreground font-semibold transition-all hover:text-foreground">← Back</button>
              <button onClick={handleFinish} disabled={!deadline || !name.trim() || formLoading}
                className="glow-button text-primary-foreground px-10 py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none">
                {formLoading ? "Setting up..." : "Let's Go! 🔥"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalSetup;
