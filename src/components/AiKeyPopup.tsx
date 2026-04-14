import { useState } from "react";
import { X, ExternalLink, Shield } from "lucide-react";

interface AiKeyPopupProps {
  open: boolean;
  onClose: () => void;
  onActivate: (key: string) => void;
}

const AiKeyPopup = ({ open, onClose, onActivate }: AiKeyPopupProps) => {
  const [step, setStep] = useState<"intro" | "input">("intro");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleActivate = () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    // Store in localStorage (user's own key stays on device)
    localStorage.setItem("gm-gemini-key", apiKey.trim());
    localStorage.setItem("gm-ai-activated", "true");
    localStorage.setItem("gm-ai-popup-shown", "true");
    setTimeout(() => {
      setSaving(false);
      onActivate(apiKey.trim());
    }, 800);
  };

  const handleSkip = () => {
    localStorage.setItem("gm-ai-popup-shown", "true");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleSkip} />
      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300"
        style={{
          background: 'linear-gradient(145deg, hsla(258, 60%, 12%, 0.98) 0%, hsla(270, 40%, 8%, 0.98) 100%)',
          border: '1px solid hsla(258, 100%, 62%, 0.3)',
          boxShadow: '0 0 80px hsla(258, 100%, 62%, 0.2), 0 0 200px hsla(258, 100%, 50%, 0.1)',
        }}>

        {step === "intro" ? (
          <div className="p-6 text-center">
            <div className="text-4xl mb-3">✨</div>
            <h2 className="text-xl font-black text-foreground mb-1">GoalMate AI Power</h2>

            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              GoalMate sirf ek goal tracker nahi — ye aapka personal AI coach ban sakta hai!
            </p>

            <p className="text-sm text-foreground font-semibold mt-4 mb-3">
              Apna FREE Gemini API key add karo aur pao:
            </p>

            <div className="space-y-2 text-left px-2">
              {[
                { emoji: "🤖", text: "Sirf aapke liye bane daily tasks" },
                { emoji: "📺", text: "Smart video recommendations" },
                { emoji: "🗺️", text: "AI powered personalized roadmap" },
                { emoji: "💬", text: "AI motivation messages" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                  <span>{item.emoji}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-xl flex items-start gap-2 text-left"
              style={{ background: 'hsla(145, 60%, 40%, 0.1)', border: '1px solid hsla(145, 60%, 40%, 0.2)' }}>
              <Shield className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                🔒 Aapki API key 100% safe hai. Hum ise sirf aapke browser mein store karte hain. 
                Koi bhi — humare developers bhi — ise dekh nahi sakte. 
                Logout karte hi aapki key permanently delete ho jaati hai.
              </p>
            </div>

            <button onClick={() => setStep("input")}
              className="mt-5 w-full py-3.5 rounded-full text-sm font-bold text-primary-foreground transition-all active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, hsl(258 100% 62%), hsl(280 100% 55%))',
                boxShadow: '0 0 30px hsla(258, 100%, 62%, 0.4)',
              }}>
              🚀 AI Activate Karo — Free!
            </button>

            <button onClick={handleSkip}
              className="mt-2 w-full py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
              Baad Mein Karunga
            </button>
          </div>
        ) : (
          <div className="p-6">
            <button onClick={() => setStep("intro")} className="absolute top-4 right-4 p-1.5 rounded-full glass-card">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="text-center mb-5">
              <div className="text-3xl mb-2">🔑</div>
              <h3 className="text-lg font-bold text-foreground">Enter Your API Key</h3>
              <p className="text-xs text-muted-foreground mt-1">Get it free from Google AI Studio</p>
            </div>

            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full text-sm font-semibold mb-4 transition-all"
              style={{ background: 'hsla(220, 90%, 55%, 0.15)', border: '1px solid hsla(220, 90%, 55%, 0.3)', color: 'hsl(220 90% 65%)' }}>
              <ExternalLink className="w-4 h-4" />
              Open Google AI Studio
            </a>

            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Paste your Gemini API key here..."
              className="w-full bg-transparent border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />

            <button onClick={handleActivate}
              disabled={!apiKey.trim() || saving}
              className="mt-4 w-full py-3.5 rounded-full text-sm font-bold text-primary-foreground transition-all disabled:opacity-40 active:scale-[0.97]"
              style={{
                background: apiKey.trim() ? 'linear-gradient(135deg, hsl(258 100% 62%), hsl(280 100% 55%))' : 'hsla(258, 30%, 30%, 0.5)',
                boxShadow: apiKey.trim() ? '0 0 30px hsla(258, 100%, 62%, 0.4)' : 'none',
              }}>
              {saving ? "Activating..." : "Activate AI ✨"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiKeyPopup;
