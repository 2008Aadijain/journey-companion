import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { isAiActive } from "@/lib/gemini";

export type BgPreset = "electric" | "space" | "aurora" | "matrix" | "minimal" | "custom";

export interface CustomBgConfig {
  color1: string;
  color2: string;
  color3: string;
  style: "waves" | "particles" | "glow" | "glitch";
  imagePreview?: string;   // small thumbnail
  cartoonImage?: string;   // full cartoonized data URL (used as glitch bg)
}

export const BG_PRESETS: { value: BgPreset; label: string; emoji: string; aiOnly: boolean }[] = [
  { value: "electric", label: "Electric", emoji: "⚡", aiOnly: true },
  { value: "space", label: "Space", emoji: "🌌", aiOnly: true },
  { value: "aurora", label: "Aurora", emoji: "🌈", aiOnly: true },
  { value: "matrix", label: "Matrix", emoji: "💻", aiOnly: true },
  { value: "minimal", label: "Minimal", emoji: "◯", aiOnly: false },
];

const STORAGE_KEY = "gm-bg-preset";
const MANUAL_KEY = "gm-bg-manual";
const DAILY_KEY = "gm-bg-daily-date";
const CUSTOM_KEY = "gm-bg-custom";
const PALETTE_KEY = "gm-bg-palette-active";

const AI_PRESETS: BgPreset[] = ["electric", "space", "aurora", "matrix", "minimal"];

interface Ctx {
  preset: BgPreset;
  customConfig: CustomBgConfig | null;
  setPreset: (p: BgPreset, manual?: boolean) => void;
  setCustomConfig: (c: CustomBgConfig | null) => void;
}

const BackgroundContext = createContext<Ctx>({
  preset: "minimal",
  customConfig: null,
  setPreset: () => {},
  setCustomConfig: () => {},
});

const todayKey = () => new Date().toISOString().slice(0, 10);

// hex -> {h,s,l}
const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const hslStr = (h: number, s: number, l: number) =>
  `${h} ${Math.max(0, Math.min(100, s))}% ${Math.max(0, Math.min(100, l))}%`;

const applyCustomPalette = (cfg: CustomBgConfig) => {
  const root = document.documentElement;
  const p = hexToHsl(cfg.color1);
  const sec = hexToHsl(cfg.color2);
  const acc = hexToHsl(cfg.color3);
  // Boost saturation a bit so palette feels vibrant
  root.style.setProperty("--primary", hslStr(p.h, Math.max(p.s, 65), Math.max(45, Math.min(70, p.l))));
  root.style.setProperty("--secondary", hslStr(sec.h, Math.max(sec.s, 60), Math.max(50, Math.min(75, sec.l))));
  root.style.setProperty("--accent", hslStr(acc.h, Math.max(acc.s, 60), Math.max(45, Math.min(65, acc.l))));
  root.style.setProperty("--ring", hslStr(p.h, Math.max(p.s, 65), Math.max(45, Math.min(70, p.l))));
  localStorage.setItem(PALETTE_KEY, "true");
};

const clearCustomPalette = () => {
  // Remove inline overrides so theme hook's accent color takes back over.
  const root = document.documentElement;
  root.style.removeProperty("--primary");
  root.style.removeProperty("--secondary");
  root.style.removeProperty("--accent");
  root.style.removeProperty("--ring");
  localStorage.removeItem(PALETTE_KEY);
  // Trigger a re-render of useTheme accent effect by dispatching event
  window.dispatchEvent(new CustomEvent("gm-palette-reset"));
};

export const BackgroundProvider = ({ children }: { children: React.ReactNode }) => {
  const [preset, setPresetState] = useState<BgPreset>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as BgPreset | null;
    if (stored) return stored;
    return isAiActive() ? "electric" : "minimal";
  });
  const [customConfig, setCustomConfigState] = useState<CustomBgConfig | null>(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  // Apply custom palette on load if active
  useEffect(() => {
    if (preset === "custom" && customConfig) {
      applyCustomPalette(customConfig);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAiActive()) return;
    const isManual = localStorage.getItem(MANUAL_KEY) === "true";
    if (isManual) return;
    const lastRotation = localStorage.getItem(DAILY_KEY);
    if (lastRotation === todayKey()) return;
    const rotateList = AI_PRESETS.filter(p => p !== "minimal");
    const next = rotateList[Math.floor(Math.random() * rotateList.length)];
    setPresetState(next);
    localStorage.setItem(STORAGE_KEY, next);
    localStorage.setItem(DAILY_KEY, todayKey());
  }, []);

  const setPreset = useCallback((p: BgPreset, manual = true) => {
    setPresetState(p);
    localStorage.setItem(STORAGE_KEY, p);
    if (manual) localStorage.setItem(MANUAL_KEY, "true");
    if (p !== "custom") {
      clearCustomPalette();
    } else if (customConfig) {
      applyCustomPalette(customConfig);
    }
  }, [customConfig]);

  const setCustomConfig = useCallback((c: CustomBgConfig | null) => {
    setCustomConfigState(c);
    if (c) {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(c));
      applyCustomPalette(c);
    } else {
      localStorage.removeItem(CUSTOM_KEY);
      clearCustomPalette();
    }
  }, []);

  return (
    <BackgroundContext.Provider value={{ preset, customConfig, setPreset, setCustomConfig }}>
      {children}
    </BackgroundContext.Provider>
  );
};

export const useBackground = () => useContext(BackgroundContext);
