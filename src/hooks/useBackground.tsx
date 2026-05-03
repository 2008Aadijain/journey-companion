import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { isAiActive } from "@/lib/gemini";

export type BgPreset = "electric" | "space" | "aurora" | "matrix" | "minimal" | "custom";

export interface CustomBgConfig {
  color1: string;
  color2: string;
  color3: string;
  style: "waves" | "particles" | "glow";
  imagePreview?: string; // dataURL thumbnail
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
  }, []);

  const setCustomConfig = useCallback((c: CustomBgConfig | null) => {
    setCustomConfigState(c);
    if (c) localStorage.setItem(CUSTOM_KEY, JSON.stringify(c));
    else localStorage.removeItem(CUSTOM_KEY);
  }, []);

  return (
    <BackgroundContext.Provider value={{ preset, customConfig, setPreset, setCustomConfig }}>
      {children}
    </BackgroundContext.Provider>
  );
};

export const useBackground = () => useContext(BackgroundContext);
