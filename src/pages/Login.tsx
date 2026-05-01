import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Particles from "@/components/Particles";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const { user, profile, loading, signIn } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (!loading && user && profile) {
      navigate("/dashboard", { replace: true });
    } else if (!loading && user && !profile) {
      navigate("/goal-setup", { replace: true });
    }
  }, [loading, user, profile, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    const { error } = await signIn(form.email, form.password);
    setFormLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error, variant: "destructive" });
      return;
    }
    // Auth state change will trigger redirect
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setFormLoading(true);
    const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password });
    setFormLoading(false);
    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      return;
    }
    if (data.user) {
      // New user → goal setup
      navigate("/goal-setup");
    }
  };

  const handleGoogleAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard" },
    });
    if (error) toast({ title: "Google login failed", description: error.message, variant: "destructive" });
  };

  const handleForgotPassword = async () => {
    if (!form.email.trim()) {
      toast({ title: "Enter your email first", variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password reset email sent! 📧" });
    }
  };

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

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8 fade-up">
          <h1 className="text-5xl font-black text-gradient-hero tracking-tighter leading-[0.9] mb-2">GoalCircle</h1>
          <p className="text-muted-foreground text-sm">Ek goal, ek dost, ek naya safar</p>
        </div>

        {/* Social Login */}
        <div className="space-y-3 mb-4 fade-up fade-up-delay-1">
          <button onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
            style={{ background: 'hsl(0 0% 100%)', color: 'hsl(0 0% 20%)' }}>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <button onClick={() => toast({ title: "Coming Soon! 🚀", description: "Facebook login will be available soon." })}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
            style={{ background: 'hsl(220 70% 50%)', color: 'hsl(0 0% 100%)' }}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Continue with Facebook
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5 fade-up fade-up-delay-1">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* Email Form */}
        <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="glass-card-glow p-6 space-y-4 fade-up fade-up-delay-2">
          {mode === "signup" && (
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5 font-medium">Your Name</label>
              <input type="text" placeholder="Arjun" required
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-transparent border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" />
            </div>
          )}
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5 font-medium">Email</label>
            <input type="email" placeholder="arjun@example.com" required
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-transparent border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5 font-medium">Password</label>
            <input type="password" placeholder="••••••••" required minLength={6}
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-transparent border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" />
          </div>

          {mode === "login" && (
            <button type="button" onClick={handleForgotPassword}
              className="text-xs text-primary/70 hover:text-primary transition-colors font-medium">
              Forgot password?
            </button>
          )}

          <button type="submit" disabled={formLoading}
            className="w-full glow-button text-primary-foreground py-4 text-lg font-bold disabled:opacity-60">
            {formLoading ? (mode === "login" ? "Logging in..." : "Creating account...") : (mode === "login" ? "Log In 🔥" : "Sign Up 🚀")}
          </button>
        </form>

        <button onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-4 w-full text-center text-sm text-primary hover:text-primary/80 transition-colors font-semibold fade-up fade-up-delay-3">
          {mode === "login" ? "New here? Sign up" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
};

export default Login;
