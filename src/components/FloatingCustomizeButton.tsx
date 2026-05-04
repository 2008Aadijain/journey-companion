import { useState, useRef, useEffect } from "react";
import { X, Sparkles, Moon, Sun, Palette, Type, Image as ImageIcon, Bot, Lock, Loader2, Trash2 } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useBackground, BG_PRESETS, type BgPreset, type CustomBgConfig } from "@/hooks/useBackground";
import { isAiActive, callGemini } from "@/lib/gemini";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const COOLDOWN_MS = 60_000;

// Compress to 256x256 JPEG q=0.5 and return base64 (no prefix)
const compressImage = (file: File): Promise<{ base64: string; dataUrl: string; thumb: string }> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = 256; c.height = 256;
        const ctx = c.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unavailable"));
        ctx.drawImage(img, 0, 0, 256, 256);
        const dataUrl = c.toDataURL("image/jpeg", 0.5);
        const tc = document.createElement("canvas");
        tc.width = 80; tc.height = 80;
        tc.getContext("2d")!.drawImage(img, 0, 0, 80, 80);
        const thumb = tc.toDataURL("image/jpeg", 0.7);
        resolve({ base64: dataUrl.split(",")[1], dataUrl, thumb });
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// Canvas-based dominant color extraction (3 colors via simple bucketing)
const extractColorsFromCanvas = (dataUrl: string): Promise<[string, string, string]> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 64; c.height = 64;
      const ctx = c.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unavailable"));
      ctx.drawImage(img, 0, 0, 64, 64);
      const data = ctx.getImageData(0, 0, 64, 64).data;
      const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const key = `${r >> 5}-${g >> 5}-${b >> 5}`;
        const e = buckets.get(key);
        if (e) { e.r += r; e.g += g; e.b += b; e.n++; }
        else buckets.set(key, { r, g, b, n: 1 });
      }
      const sorted = Array.from(buckets.values()).sort((a, b) => b.n - a.n).slice(0, 3);
      while (sorted.length < 3) sorted.push(sorted[0] || { r: 123, g: 47, b: 190, n: 1 });
      const hex = (v: number) => v.toString(16).padStart(2, "0");
      const toHex = (e: { r: number; g: number; b: number; n: number }) =>
        `#${hex(Math.round(e.r / e.n))}${hex(Math.round(e.g / e.n))}${hex(Math.round(e.b / e.n))}`;
      resolve([toHex(sorted[0]), toHex(sorted[1]), toHex(sorted[2])]);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });

const ACCENT_COLORS = [
  { name: "Purple", value: "purple", hsl: "258 100% 62%" },
  { name: "Blue", value: "blue", hsl: "220 100% 55%" },
  { name: "Green", value: "green", hsl: "145 70% 45%" },
  { name: "Orange", value: "orange", hsl: "25 100% 55%" },
  { name: "Pink", value: "pink", hsl: "330 90% 60%" },
];

const FONT_SIZES = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
];


const FloatingCustomizeButton = () => {
  const [open, setOpen] = useState(false);
  const { theme, accentColor, fontSize, setTheme, setAccentColor, setFontSize } = useTheme();
  const { preset, customConfig, setPreset, setCustomConfig } = useBackground();
  const aiActive = isAiActive();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [generating, setGenerating] = useState(false);

  const handleCustomImage = async (file: File) => {
    setGenerating(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const base64 = dataUrl.split(",")[1];
      const mime = file.type || "image/jpeg";

      // Gemini call with inline image
      const key = localStorage.getItem("gm-gemini-key");
      if (!key) throw new Error("No Gemini API key");
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
      const prompt = `Analyze this image. Extract the 3 most dominant colors as hex codes.
Return ONLY this JSON (no markdown, no code fences):
{"color1":"#RRGGBB","color2":"#RRGGBB","color3":"#RRGGBB","style":"waves|particles|glow","mood":"calm|energetic|dark|bright"}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [
            { text: prompt },
            { inline_data: { mime_type: mime, data: base64 } },
          ] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      });
      if (!res.ok) throw new Error(`Gemini error ${res.status}`);
      const data = await res.json();
      const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const cleaned = text.replace(/^```json\s*|\s*```$/g, "").trim();
      const parsed = JSON.parse(cleaned);

      // Make a tiny thumbnail
      const thumb = await new Promise<string>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement("canvas");
          c.width = 80; c.height = 80;
          const ctx = c.getContext("2d")!;
          ctx.drawImage(img, 0, 0, 80, 80);
          resolve(c.toDataURL("image/jpeg", 0.7));
        };
        img.src = dataUrl;
      });

      const cfg: CustomBgConfig = {
        color1: parsed.color1 || "#7B2FBE",
        color2: parsed.color2 || "#00BFFF",
        color3: parsed.color3 || "#FF6B9D",
        style: ["waves", "particles", "glow"].includes(parsed.style) ? parsed.style : "waves",
        imagePreview: thumb,
      };
      setCustomConfig(cfg);
      setPreset("custom", true);
      toast({ title: "Custom AI background applied! ✨" });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to generate background", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Customize"
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg"
        style={{
          background: "linear-gradient(135deg, hsl(258 100% 62%), hsl(280 100% 55%))",
          boxShadow: "0 0 20px hsla(258, 100%, 62%, 0.6), 0 0 40px hsla(280, 100%, 55%, 0.3)",
          animation: "goalmate-glow 3s ease-in-out infinite",
        }}
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-lg rounded-t-3xl overflow-hidden animate-in slide-in-from-bottom duration-300"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', maxHeight: '85vh' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> Customize
              </h2>
              <button onClick={() => setOpen(false)} className="p-2 rounded-full glass-card">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-5 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 60px)' }}>
              {/* Theme */}
              <section>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">🎨 Theme</p>
                <div className="flex items-center gap-3 py-2">
                  {theme === "dark" ? <Moon className="w-5 h-5 text-muted-foreground" /> : <Sun className="w-5 h-5 text-muted-foreground" />}
                  <span className="flex-1 text-sm font-medium text-foreground">Dark Mode</span>
                  <Switch checked={theme === "dark"} onCheckedChange={(c) => setTheme(c ? "dark" : "light")} />
                </div>
                <div className="py-2">
                  <div className="flex items-center gap-3 mb-2">
                    <Palette className="w-5 h-5 text-muted-foreground" />
                    <span className="flex-1 text-sm font-medium text-foreground">Accent Color</span>
                  </div>
                  <div className="flex gap-3 px-8">
                    {ACCENT_COLORS.map(c => (
                      <button key={c.value} onClick={() => setAccentColor(c.value)}
                        className={`w-10 h-10 rounded-full transition-all ${accentColor === c.value ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110" : "hover:scale-105"}`}
                        style={{ background: `hsl(${c.hsl})` }}
                        title={c.name} />
                    ))}
                  </div>
                </div>
              </section>

              {/* Background */}
              <section>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">🖼️ Background</p>
                <div className="grid grid-cols-2 gap-2">
                  {BG_PRESETS.map(p => {
                    const locked = p.aiOnly && !aiActive && p.value !== "minimal";
                    const selected = preset === p.value;
                    return (
                      <button key={p.value} disabled={locked}
                        onClick={() => { setPreset(p.value, true); toast({ title: `Background: ${p.label} ${p.emoji}` }); }}
                        className={`px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                          selected ? "bg-primary/20 border border-primary/50 text-foreground" : "glass-card text-muted-foreground"
                        } ${locked ? "opacity-40 cursor-not-allowed" : ""}`}>
                        <span className="text-base mr-1">{p.emoji}</span> {p.label}
                        {locked && <span className="block text-[9px] mt-0.5">🔒 AI only</span>}
                      </button>
                    );
                  })}
                  {/* Custom AI option */}
                  <button
                    disabled={!aiActive || generating}
                    onClick={() => fileRef.current?.click()}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all col-span-2 ${
                      preset === "custom"
                        ? "bg-primary/20 border border-primary/50 text-foreground"
                        : "glass-card text-muted-foreground"
                    } ${!aiActive ? "opacity-60" : ""}`}>
                    {generating ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> AI is creating your unique background...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className="text-base">✨</span>
                        <span className="flex-1">Custom AI Background</span>
                        {!aiActive && <Lock className="w-3 h-3" />}
                      </span>
                    )}
                    {!aiActive && <span className="block text-[9px] mt-1 text-muted-foreground/70">Activate AI Power to unlock your personalized theme!</span>}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCustomImage(f); e.target.value = ""; }} />
                </div>

                {preset === "custom" && customConfig && (
                  <div className="mt-3 p-3 rounded-xl glass-card flex items-center gap-3">
                    {customConfig.imagePreview && (
                      <img src={customConfig.imagePreview} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    )}
                    <div className="flex-1">
                      <p className="text-xs font-bold text-foreground">Custom AI ✨ Active</p>
                      <div className="flex gap-1 mt-1">
                        {[customConfig.color1, customConfig.color2, customConfig.color3].map((c, i) => (
                          <span key={i} className="w-3 h-3 rounded-full" style={{ background: c }} />
                        ))}
                      </div>
                    </div>
                    <button onClick={() => fileRef.current?.click()}
                      className="text-[10px] px-2 py-1 rounded-full bg-primary/20 text-primary font-bold">Change</button>
                    <button onClick={() => { setCustomConfig(null); setPreset("minimal", true); }}
                      className="p-1.5 rounded-full text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </section>

              {/* Text */}
              <section>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">📝 Text</p>
                <div className="flex items-center gap-3 py-2">
                  <Type className="w-5 h-5 text-muted-foreground" />
                  <span className="flex-1 text-sm font-medium text-foreground">Font Size</span>
                </div>
                <div className="flex gap-2 px-8">
                  {FONT_SIZES.map(fs => (
                    <button key={fs.value} onClick={() => setFontSize(fs.value)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${fontSize === fs.value ? "bg-primary text-primary-foreground" : "glass-card text-muted-foreground"}`}>
                      {fs.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* AI Power */}
              {!aiActive && (
                <section className="p-4 rounded-2xl border border-primary/30" style={{ background: "linear-gradient(135deg, hsla(258,100%,62%,0.1), hsla(280,100%,55%,0.05))" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-5 h-5 text-primary" />
                    <p className="text-sm font-bold text-foreground">🤖 AI Power</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Unlock daily AI-generated tasks, smart videos, dramatic backgrounds, and your very own custom AI theme.
                  </p>
                  <button
                    onClick={() => { setOpen(false); window.dispatchEvent(new CustomEvent("open-ai-popup")); }}
                    className="w-full py-2.5 rounded-full text-sm font-bold text-white"
                    style={{ background: "linear-gradient(135deg, hsl(258 100% 62%), hsl(280 100% 55%))" }}>
                    Activate AI Power ⚡
                  </button>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingCustomizeButton;
