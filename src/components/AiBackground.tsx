// Multi-preset animated background. Always renders behind content (z-index: -1).
// Presets: electric, space, aurora, matrix, minimal.

import { useMemo } from "react";
import { useBackground } from "@/hooks/useBackground";

const ElectricBg = () => {
  // SVG circuit-board-like lines with animated electric arcs.
  const arcs = useMemo(() => Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    delay: Math.random() * 6,
    duration: 4 + Math.random() * 4,
    x1: Math.random() * 100,
    y1: Math.random() * 100,
    x2: Math.random() * 100,
    y2: Math.random() * 100,
    color: i % 2 === 0 ? "hsla(180, 100%, 60%, 0.5)" : "hsla(280, 100%, 65%, 0.5)",
  })), []);
  const dots = useMemo(() => Array.from({ length: 24 }).map((_, i) => ({
    id: i,
    cx: Math.random() * 100,
    cy: Math.random() * 100,
    r: 1 + Math.random() * 2,
    delay: Math.random() * 5,
    color: i % 2 === 0 ? "hsl(180, 100%, 65%)" : "hsl(280, 100%, 70%)",
  })), []);

  return (
    <>
      <style>{`
        @keyframes electric-flow {
          0%   { stroke-dashoffset: 200; opacity: 0; }
          15%  { opacity: 0.7; }
          85%  { opacity: 0.5; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
        @keyframes electric-pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50%      { opacity: 0.9; transform: scale(1.4); }
        }
      `}</style>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, opacity: 0.18 }}>
        {/* Static circuit grid */}
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={`gh-${i}`} x1="0" y1={i * 20} x2="100" y2={i * 20}
            stroke="hsla(180, 80%, 50%, 0.25)" strokeWidth="0.1" />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={`gv-${i}`} x1={i * 20} y1="0" x2={i * 20} y2="100"
            stroke="hsla(280, 80%, 60%, 0.25)" strokeWidth="0.1" />
        ))}
        {/* Animated arcs */}
        {arcs.map(a => (
          <line key={`a-${a.id}`} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
            stroke={a.color} strokeWidth="0.3" strokeLinecap="round"
            strokeDasharray="4 200"
            style={{ animation: `electric-flow ${a.duration}s linear ${a.delay}s infinite`, filter: `drop-shadow(0 0 1px ${a.color})` }} />
        ))}
        {/* Pulsing dots (nodes) */}
        {dots.map(d => (
          <circle key={`d-${d.id}`} cx={d.cx} cy={d.cy} r={d.r / 8}
            fill={d.color}
            style={{
              animation: `electric-pulse ${2 + Math.random() * 3}s ease-in-out ${d.delay}s infinite`,
              transformOrigin: `${d.cx}px ${d.cy}px`,
              filter: `drop-shadow(0 0 0.4px ${d.color})`,
            }} />
        ))}
      </svg>
    </>
  );
};

const SpaceBg = () => {
  const stars = useMemo(() => Array.from({ length: 80 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 1 + Math.random() * 2,
    delay: Math.random() * 5,
    duration: 2 + Math.random() * 4,
  })), []);
  return (
    <>
      <style>{`
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50%      { opacity: 0.9; transform: scale(1.2); }
        }
      `}</style>
      <div style={{ position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 30% 20%, hsla(258, 60%, 25%, 0.25), transparent 60%), radial-gradient(ellipse at 75% 80%, hsla(280, 60%, 20%, 0.2), transparent 60%)",
      }} />
      {stars.map(s => (
        <div key={s.id} style={{
          position: "absolute", left: `${s.left}%`, top: `${s.top}%`,
          width: s.size, height: s.size, borderRadius: "50%",
          background: "hsla(0, 0%, 100%, 0.7)",
          boxShadow: `0 0 ${s.size * 3}px hsla(220, 100%, 80%, 0.4)`,
          animation: `star-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
        }} />
      ))}
    </>
  );
};

const AuroraBg = () => (
  <>
    <style>{`
      @keyframes aurora-shift {
        0%   { transform: translate3d(-10%, 0, 0) rotate(-2deg); }
        50%  { transform: translate3d(10%, 5%, 0) rotate(2deg); }
        100% { transform: translate3d(-10%, 0, 0) rotate(-2deg); }
      }
    `}</style>
    {[
      { c: "hsla(160, 95%, 50%, 0.18)", t: 10, d: 18 },
      { c: "hsla(258, 95%, 60%, 0.15)", t: 30, d: 22 },
      { c: "hsla(330, 95%, 60%, 0.12)", t: 55, d: 26 },
      { c: "hsla(190, 95%, 55%, 0.14)", t: 70, d: 20 },
    ].map((a, i) => (
      <div key={i} style={{
        position: "absolute", left: "-20%", right: "-20%", top: `${a.t}%`,
        height: "40%",
        background: `linear-gradient(90deg, transparent, ${a.c} 30%, ${a.c} 70%, transparent)`,
        filter: "blur(60px)",
        animation: `aurora-shift ${a.d}s ease-in-out ${i * 1.5}s infinite`,
      }} />
    ))}
  </>
);

const MatrixBg = () => {
  const cols = useMemo(() => Array.from({ length: 18 }).map((_, i) => ({
    id: i,
    left: (i / 18) * 100,
    delay: Math.random() * 6,
    duration: 5 + Math.random() * 6,
    chars: Array.from({ length: 20 }).map(() => String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96))).join(" "),
  })), []);
  return (
    <>
      <style>{`
        @keyframes matrix-fall {
          0%   { transform: translateY(-100%); opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.5; }
          100% { transform: translateY(110vh); opacity: 0; }
        }
      `}</style>
      {cols.map(c => (
        <div key={c.id} style={{
          position: "absolute", top: 0, left: `${c.left}%`,
          fontFamily: "monospace", fontSize: 12, lineHeight: 1.2,
          color: "hsla(145, 90%, 55%, 0.55)",
          textShadow: "0 0 6px hsla(145, 95%, 50%, 0.6)",
          writingMode: "vertical-rl",
          whiteSpace: "nowrap",
          animation: `matrix-fall ${c.duration}s linear ${c.delay}s infinite`,
        }}>{c.chars}</div>
      ))}
    </>
  );
};

const MinimalBg = () => {
  const shapes = useMemo(() => Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 80 + Math.random() * 120,
    delay: Math.random() * 6,
    duration: 18 + Math.random() * 12,
    color: i % 2 === 0 ? "hsla(258, 80%, 50%, 0.06)" : "hsla(280, 80%, 50%, 0.05)",
  })), []);
  return (
    <>
      <style>{`
        @keyframes minimal-drift {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          50%      { transform: translate3d(20px, -20px, 0) scale(1.05); }
        }
      `}</style>
      {shapes.map(s => (
        <div key={s.id} style={{
          position: "absolute", left: `${s.left}%`, top: `${s.top}%`,
          width: s.size, height: s.size, borderRadius: "50%",
          background: s.color,
          filter: `blur(${s.size / 4}px)`,
          animation: `minimal-drift ${s.duration}s ease-in-out ${s.delay}s infinite`,
        }} />
      ))}
    </>
  );
};

const AiBackground = () => {
  const { preset } = useBackground();

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: -1 }}
      aria-hidden="true"
    >
      {preset === "electric" && <ElectricBg />}
      {preset === "space" && <SpaceBg />}
      {preset === "aurora" && <AuroraBg />}
      {preset === "matrix" && <MatrixBg />}
      {preset === "minimal" && <MinimalBg />}
    </div>
  );
};

export default AiBackground;
