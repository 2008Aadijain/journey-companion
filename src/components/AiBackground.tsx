// Multi-preset animated background. Always renders behind content (z-index: -1).
// Presets: electric, space, aurora, matrix, minimal, custom.

import { useMemo } from "react";
import { useBackground } from "@/hooks/useBackground";

const ElectricBg = () => {
  const bolts = useMemo(() => Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    height: 60 + Math.random() * 90,
    angle: Math.random() * 360,
    color: i % 2 === 0 ? "#00FFFF" : "#9B59B6",
    delay: Math.random() * 4,
    cycle: 2 + Math.random() * 4,
  })), []);

  return (
    <>
      <style>{`
        @keyframes electric-flash {
          0%   { opacity: 0; }
          5%   { opacity: 0.9; }
          10%  { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes electric-bgflash {
          0%   { opacity: 0; }
          50%  { opacity: 0.03; }
          100% { opacity: 0; }
        }
      `}</style>
      <div style={{
        position: "absolute", inset: 0, background: "#00FFFF",
        animation: "electric-bgflash 3s ease-in-out infinite",
      }} />
      {bolts.map(b => (
        <span key={b.id} style={{
          position: "absolute",
          left: `${b.left}%`,
          top: `${b.top}%`,
          width: 2,
          height: b.height,
          background: b.color,
          boxShadow: `0 0 8px ${b.color}, 0 0 16px ${b.color}`,
          transform: `rotate(${b.angle}deg)`,
          transformOrigin: "center",
          opacity: 0,
          animation: `electric-flash ${b.cycle}s linear ${b.delay}s infinite`,
          borderRadius: 2,
        }} />
      ))}
    </>
  );
};

const SpaceBg = () => {
  const stars = useMemo(() => Array.from({ length: 200 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 1 + Math.random(),
    delay: Math.random() * 4,
    duration: 2 + Math.random() * 2,
    baseOp: 0.3 + Math.random() * 0.7,
  })), []);
  const shooters = useMemo(() => Array.from({ length: 4 }).map((_, i) => ({
    id: i,
    top: Math.random() * 60,
    delay: i * 13 + Math.random() * 5,
  })), []);
  return (
    <>
      <style>{`
        @keyframes star-twinkle {
          0%   { opacity: 0.3; }
          50%  { opacity: var(--op-max, 1); }
          100% { opacity: 0.3; }
        }
        @keyframes shooting-star {
          0%   { transform: translate3d(110vw, 0, 0) rotate(200deg); opacity: 0; }
          2%   { opacity: 1; }
          8%   { opacity: 1; }
          10%  { transform: translate3d(-20vw, 60vh, 0) rotate(200deg); opacity: 0; }
          100% { opacity: 0; }
        }
      `}</style>
      {stars.map(s => (
        <div key={s.id} style={{
          position: "absolute", left: `${s.left}%`, top: `${s.top}%`,
          width: s.size, height: s.size, borderRadius: "50%",
          background: "white",
          ["--op-max" as never]: s.baseOp,
          animation: `star-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
        }} />
      ))}
      {shooters.map(sh => (
        <div key={sh.id} style={{
          position: "absolute", top: `${sh.top}%`, right: 0,
          width: 100, height: 1.5,
          background: "linear-gradient(90deg, transparent, white)",
          boxShadow: "0 0 6px white",
          animation: `shooting-star 12s linear ${sh.delay}s infinite`,
        }} />
      ))}
    </>
  );
};

const AuroraBg = () => {
  const blobs = [
    { size: 400, color: "#00FF88", pos: { top: -100, left: -100 } as React.CSSProperties, duration: 12, delay: 0 },
    { size: 350, color: "#7B2FBE", pos: { top: 100, right: -50 } as React.CSSProperties, duration: 14, delay: 2 },
    { size: 300, color: "#00BFFF", pos: { bottom: 100, left: 50 } as React.CSSProperties, duration: 11, delay: 4 },
    { size: 380, color: "#FF6B9D", pos: { bottom: -50, right: 100 } as React.CSSProperties, duration: 15, delay: 1 },
  ];
  return (
    <>
      <style>{`
        @keyframes aurora-float {
          0%   { transform: translate(0px, 0px); }
          33%  { transform: translate(30px, -20px); }
          66%  { transform: translate(-20px, 30px); }
          100% { transform: translate(0px, 0px); }
        }
      `}</style>
      {blobs.map((b, i) => (
        <div key={i} style={{
          position: "absolute",
          width: b.size, height: b.size,
          borderRadius: "50%",
          background: b.color,
          filter: "blur(80px)",
          opacity: 0.2,
          animation: `aurora-float ${b.duration}s ease-in-out ${b.delay}s infinite`,
          ...b.pos,
        }} />
      ))}
    </>
  );
};

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

interface CustomConfig {
  color1: string; color2: string; color3: string;
  style: "waves" | "particles" | "glow";
}

const CustomBg = ({ cfg }: { cfg: CustomConfig }) => {
  const { color1, color2, color3, style } = cfg;
  const particles = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 6 + Math.random() * 16,
    delay: Math.random() * 8,
    duration: 10 + Math.random() * 12,
    color: [color1, color2, color3][i % 3],
  })), [color1, color2, color3]);

  if (style === "waves") {
    return (
      <>
        <style>{`
          @keyframes custom-wave {
            0%, 100% { background-position: 0% 50%, 100% 50%, 50% 0%; }
            50%      { background-position: 100% 50%, 0% 50%, 50% 100%; }
          }
        `}</style>
        <div style={{
          position: "absolute", inset: "-20%",
          background: `
            radial-gradient(ellipse 60% 40% at 30% 30%, ${color1}88, transparent 60%),
            radial-gradient(ellipse 60% 40% at 70% 70%, ${color2}88, transparent 60%),
            radial-gradient(ellipse 60% 40% at 50% 90%, ${color3}88, transparent 60%)
          `,
          backgroundSize: "200% 200%, 200% 200%, 200% 200%",
          filter: "blur(50px)",
          opacity: 0.55,
          animation: "custom-wave 20s ease-in-out infinite",
        }} />
      </>
    );
  }

  if (style === "particles") {
    return (
      <>
        <style>{`
          @keyframes custom-float {
            0%, 100% { transform: translate3d(0,0,0); opacity: 0.5; }
            50%      { transform: translate3d(20px, -30px, 0); opacity: 0.9; }
          }
        `}</style>
        {particles.map(p => (
          <div key={p.id} style={{
            position: "absolute", left: `${p.left}%`, top: `${p.top}%`,
            width: p.size, height: p.size, borderRadius: "50%",
            background: p.color, opacity: 0.6,
            boxShadow: `0 0 ${p.size}px ${p.color}`,
            filter: "blur(1px)",
            animation: `custom-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }} />
        ))}
      </>
    );
  }

  // glow
  return (
    <>
      <style>{`
        @keyframes custom-glow {
          0%, 100% { transform: scale(1); opacity: 0.45; }
          50%      { transform: scale(1.2); opacity: 0.75; }
        }
      `}</style>
      {[
        { c: color1, l: 20, t: 25, s: "60vw", d: 0 },
        { c: color2, l: 65, t: 55, s: "55vw", d: 3 },
        { c: color3, l: 40, t: 75, s: "50vw", d: 6 },
      ].map((o, i) => (
        <div key={i} style={{
          position: "absolute", left: `${o.l}%`, top: `${o.t}%`,
          width: o.s, height: o.s, borderRadius: "50%",
          background: `radial-gradient(circle, ${o.c}, transparent 65%)`,
          filter: "blur(40px)",
          animation: `custom-glow ${10 + i * 2}s ease-in-out ${o.d}s infinite`,
          transform: "translate(-50%, -50%)",
        }} />
      ))}
    </>
  );
};

const AiBackground = () => {
  const { preset, customConfig } = useBackground();

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
      {preset === "custom" && customConfig && <CustomBg cfg={customConfig} />}
    </div>
  );
};

export default AiBackground;
