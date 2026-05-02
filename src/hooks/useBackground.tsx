import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { isAiActive } from "@/lib/gemini";

export type BgPreset = "electric" | "space" | "aurora" | "matrix" | "minimal";

export const BG_PRESETS: { value: BgPreset; label: string; emoji: string; aiOnly: boolean }[] = [
  { value: "electric", label: "Electric", emoji: "⚡", aiOnly: true },
  { value: "space", label: "Space", emoji: "🌌", aiOnly: true },
  { value: "aurora", label: "Aurora", emoji: "🌈", aiOnly: true },
  { value: "matrix", label: "Matrix", emoji: "💻", aiOnly: true },
  { value: "minimal", label: "Minimal", emoji: "◯", aiOnly: false },
];

const STORAGE_KEY = "gm-bg-preset";
const MANUAL_KEY = "gm-bg-manual"; // "true" if user chose manually
const DAILY_KEY = "gm-bg-daily-date";

const AI_PRESETS: BgPreset[] = ["electric", "space", "aurora", "matrix", "minimal"];

interface Ctx {
  preset: BgPreset;
  setPreset: (p: BgPreset, manual?: boolean) => void;
}

const BackgroundContext = createContext<Ctx>({
  preset: "minimal",
  setPreset: () => {},
});

const todayKey = () => new Date().toISOString().slice(0, 10);

export const BackgroundProvider = ({ children }: { children: React.ReactNode }) => {
  const [preset, setPresetState] = useState<BgPreset>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as BgPreset | null;
    if (stored && AI_PRESETS.includes(stored)) return stored;
    return isAiActive() ? "electric" : "minimal";
  });

  // Daily auto-rotation for AI users (unless manually overridden)
  useEffect(() => {
    if (!isAiActive()) return;
    const isManual = localStorage.getItem(MANUAL_KEY) === "true";
    if (isManual) return;
    const lastRotation = localStorage.getItem(DAILY_KEY);
    if (lastRotation === todayKey()) return;
    // Pick a random preset (excluding minimal so AI users get dramatic visuals)
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

  return (
    <BackgroundContext.Provider value={{ preset, setPreset }}>{children}</BackgroundContext.Provider>
  );
};

export const useBackground = () => useContext(BackgroundContext);
