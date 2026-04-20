// Lightweight CSS-only "3D" particle field for AI-activated users.
// Pure CSS animations — no canvas, no JS render loop. ~60fps on mobile.

import { useMemo } from "react";

interface Shape {
  id: number;
  type: "tri" | "hex" | "dot";
  size: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
  color: string;
  rotate: number;
}

const COLORS = [
  "hsla(258, 100%, 65%, 0.35)", // purple
  "hsla(180, 90%, 55%, 0.28)",  // cyan
  "hsla(0, 90%, 70%, 0.28)",    // coral
  "hsla(280, 90%, 60%, 0.30)",  // magenta
];

const Shape = ({ s }: { s: Shape }) => {
  const common: React.CSSProperties = {
    position: "absolute",
    left: `${s.left}%`,
    top: `${s.top}%`,
    width: s.size,
    height: s.size,
    animation: `ai-float ${s.duration}s ease-in-out ${s.delay}s infinite, ai-spin ${s.duration * 1.4}s linear ${s.delay}s infinite`,
    willChange: "transform, opacity",
    pointerEvents: "none",
    filter: "blur(0.4px)",
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
  return (
    <div style={{ ...common, borderRadius: "50%", background: s.color, boxShadow: `0 0 ${s.size}px ${s.color}` }} />
  );
};

const AiBackground = () => {
  const shapes = useMemo<Shape[]>(() => {
    const types: Shape["type"][] = ["tri", "hex", "dot"];
    return Array.from({ length: 22 }).map((_, i) => ({
      id: i,
      type: types[i % types.length],
      size: 8 + Math.random() * 22,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 6,
      duration: 12 + Math.random() * 14,
      color: COLORS[i % COLORS.length],
      rotate: Math.random() * 360,
    }));
  }, []);

  return (
    <>
      <style>{`
        @keyframes ai-float {
          0%, 100% { transform: translate3d(0,0,0); opacity: 0.55; }
          50% { transform: translate3d(8px, -22px, 0); opacity: 0.95; }
        }
        @keyframes ai-spin {
          from { filter: hue-rotate(0deg); }
          to   { filter: hue-rotate(360deg); }
        }
      `}</style>
      <div className="fixed inset-0 -z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {shapes.map(s => <Shape key={s.id} s={s} />)}
      </div>
    </>
  );
};

export default AiBackground;
