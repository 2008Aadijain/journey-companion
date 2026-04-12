import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Particles from "@/components/Particles";
import FeatureCards from "@/components/FeatureCards";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  // Returning users skip landing → go directly to dashboard
  useEffect(() => {
    if (!loading && user && profile) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, user, profile, navigate]);

  // Show nothing while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-5xl animate-pulse">🎯</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient relative overflow-hidden">
      <Particles />

      {/* Ambient glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsla(258, 100%, 62%, 0.6), transparent 70%)' }}
      />
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full opacity-10 blur-[100px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsla(0, 100%, 71%, 0.5), transparent 70%)' }}
      />

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="mb-4 fade-up">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase glass-card text-muted-foreground">
            🚀 Your accountability partner awaits
          </span>
        </div>

        <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-gradient-hero fade-up fade-up-delay-1 leading-[0.9]">
          GoalMate
        </h1>

        <p className="mt-5 text-xl md:text-2xl font-semibold text-gradient-accent fade-up fade-up-delay-2">
          Ek goal, ek dost, ek naya safar
        </p>

        <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-md fade-up fade-up-delay-2">
          Get matched with a like-minded partner. Chase goals together. Never lose motivation again.
        </p>

        <button
          onClick={() => navigate("/goal-setup")}
          className="mt-10 glow-button text-primary-foreground px-12 py-4 text-lg fade-up fade-up-delay-3"
        >
          Start Your Journey →
        </button>

        <div className="mt-8 glass-card px-6 py-3 fade-up fade-up-delay-4 flex items-center gap-3">
          <div className="flex -space-x-2">
            {['🟣', '🔴', '🟡'].map((dot, i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                {dot}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="text-secondary font-bold text-lg">2,847</span>{" "}
            chasing goals right now
          </p>
        </div>
      </section>

      <FeatureCards />
    </div>
  );
};

export default Index;
