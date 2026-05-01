// Dramatic CSS-only "3D" particle field for AI-activated users.
// Larger glowing shapes (purple + cyan + coral), particle trails, ~60fps mobile.

import { useMemo } from "react";

interface Shape {
  id: number;
  type: "tri" | "hex" | "dot" | "ring";
  size: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
  color: string;
  glow: string;
  rotate: number;
}

const PALETTE = [
  { c: "hsla(258, 100%, 65%, 0.55)", g: "hsla(258, 100%, 65%, 0.45)" }, // purple
  { c: "hsla(180, 95%, 60%, 0.50)",  g: "hsla(180, 95%, 60%, 0.40)" },  // cyan
  { c: "hsla(8, 95%, 68%, 0.50)",    g: "hsla(8, 95%, 68%, 0.40)" },    // coral
  { c: "hsla(285, 95%, 65%, 0.55)",  g: "hsla(285, 95%, 65%, 0.45)" },  // magenta
];

const ShapeEl = ({ s }: { s: Shape }) => {
  const common: React.CSSProperties = {
    position: "absolute",
    left: `${s.left}%`,
    top: `${s.top}%`,
    width: s.size,
    height: s.size,
    animation: `ai-float ${s.duration}s ease-in-out ${s.delay}s infinite, ai-spin ${s.duration * 1.5}s linear ${s.delay}s infinite`,
    willChange: "transform, opacity",
    pointerEvents: "none",
    filter: `drop-shadow(0 0 ${s.size * 0.6}px ${s.glow})`,
  };

  if (s.type === "tri") {
    return (
      <div style={common}>
        <div style={{
          width: 0, height: 0,
          borderLeft: `${s.size / 2}px solid transparent`,
          borderRight: `${s.size / 2}px solid transparent`,
          borderBottom: `${s.size}px solid ${s.color}`,
          transform: `rotate(${s.rotate}deg)`,
        }} />
      </div>
    );
  }
  if (s.type === "hex") {
    return (
      <div style={common}>
        <div style={{
          width: s.size, height: s.size * 0.866,
          background: s.color,
          clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
          transform: `rotate(${s.rotate}deg)`,
        }} />
      </div>
    );
  }
  if (s.type === "ring") {
    return (
      <div style={{ ...common, borderRadius: "50%", border: `2px solid ${s.color}`, boxShadow: `0 0 ${s.size}px ${s.glow}, inset 0 0 ${s.size * 0.5}px ${s.glow}` }} />
    );
  }
  return (
    <div style={{ ...common, borderRadius: "50%", background: s.color, boxShadow: `0 0 ${s.size * 1.5}px ${s.glow}` }} />
  );
};

const AiBackground = () => {
  const shapes = useMemo<Shape[]>(() => {
    const types: Shape["type"][] = ["tri", "hex", "dot", "ring"];
    return Array.from({ length: 28 }).map((_, i) => {
      const palette = PALETTE[i % PALETTE.length];
      return {
        id: i,
        type: types[i % types.length],
        size: 24 + Math.random() * 60, // larger
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 8,
        duration: 14 + Math.random() * 16,
        color: palette.c,
        glow: palette.g,
        rotate: Math.random() * 360,
      };
    });
  }, []);

  // Particle trail dots (small, fast, drifting)
  const trails = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 8 + Math.random() * 8,
      size: 2 + Math.random() * 3,
      color: PALETTE[i % PALETTE.length].c,
    }));
  }, []);

  return (
    <>
      <style>{`
        @keyframes ai-float {
          0%, 100% { transform: translate3d(0,0,0) scale(1); opacity: 0.65; }
          50% { transform: translate3d(14px, -34px, 0) scale(1.08); opacity: 1; }
        }
        @keyframes ai-spin {
          from { filter: hue-rotate(0deg); }
          to   { filter: hue-rotate(360deg); }
        }
        @keyframes ai-trail {
          0%   { transform: translateY(110vh) translateX(0); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(-10vh) translateX(40px); opacity: 0; }
        }
        @keyframes ai-border-flow {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
      <div className="fixed inset-0 -z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Soft radial gradient backdrop */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 30% 20%, hsla(258, 80%, 30%, 0.18), transparent 50%), radial-gradient(ellipse at 75% 80%, hsla(180, 80%, 30%, 0.12), transparent 50%), radial-gradient(ellipse at 20% 80%, hsla(8, 80%, 40%, 0.10), transparent 50%)",
        }} />
        {shapes.map(s => <ShapeEl key={s.id} s={s} />)}
        {/* Particle trails */}
        {trails.map(t => (
          <div key={`t-${t.id}`} style={{
            position: "absolute",
            left: `${t.left}%`,
            top: 0,
            width: t.size, height: t.size,
            borderRadius: "50%",
            background: t.color,
            boxShadow: `0 0 ${t.size * 4}px ${t.color}`,
            animation: `ai-trail ${t.duration}s linear ${t.delay}s infinite`,
            willChange: "transform, opacity",
          }} />
        ))}
      </div>
    </>
  );
};

export default AiBackground;
