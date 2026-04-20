import { useEffect, useState } from "react";

interface SplashScreenProps {
  onDone: () => void;
  duration?: number;
}

const SplashScreen = ({ onDone, duration = 1800 }: SplashScreenProps) => {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), duration - 400);
    const t2 = setTimeout(onDone, duration);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone, duration]);

  return (
    <div className={`fixed inset-0 z-[300] flex items-center justify-center transition-opacity duration-400 ${leaving ? "opacity-0" : "opacity-100"}`}
      style={{ background: 'radial-gradient(ellipse at center, hsl(258 80% 12%) 0%, hsl(270 100% 3%) 70%, hsl(0 0% 0%) 100%)' }}>
      {/* Particle burst */}
      {Array.from({ length: 30 }).map((_, i) => {
        const angle = (i / 30) * 360;
        const dist = 80 + Math.random() * 120;
        return (
          <div key={i} className="absolute"
            style={{
              left: '50%', top: '50%',
              width: 4 + Math.random() * 6, height: 4 + Math.random() * 6,
              borderRadius: '50%',
              background: ['hsl(258 100% 70%)', 'hsl(280 100% 65%)', 'hsl(0 100% 75%)'][i % 3],
              animation: `splash-burst 1.4s ease-out forwards`,
              animationDelay: `${0.2 + (i * 0.01)}s`,
              ['--angle' as string]: `${angle}deg`,
              ['--dist' as string]: `${dist}px`,
            } as React.CSSProperties}
          />
        );
      })}
      <div className="relative text-center animate-in zoom-in-50 duration-700">
        <div className="text-7xl mb-3 animate-bounce">🎯</div>
        <h1 className="text-4xl font-black text-gradient-hero tracking-tight">GoalMate</h1>
        <p className="text-xs text-muted-foreground mt-2 font-semibold tracking-widest uppercase">One goal, one mate</p>
      </div>
      <style>{`
        @keyframes splash-burst {
          0% { transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(var(--angle)) translateY(calc(var(--dist) * -1)); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
