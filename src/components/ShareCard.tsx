import { useRef } from "react";
import { X, Share2, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface ShareCardProps {
  open: boolean;
  onClose: () => void;
  name: string;
  goalEmoji: string;
  goalLabel: string;
  streak: number;
  xp: number;
  level: string;
  badges: number;
  milestone?: string;
}

const ShareCard = ({ open, onClose, name, goalEmoji, goalLabel, streak, xp, level, badges, milestone }: ShareCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  if (!open) return null;

  const text = `${milestone ? `🎉 ${milestone}\n\n` : ""}I'm crushing it on GoalMate! 🎯\n\n${goalEmoji} Goal: ${goalLabel}\n🔥 Streak: ${streak} days\n⚡ XP: ${xp}\n🏆 Level: ${level}\n🏅 Badges: ${badges}\n\nJoin me on GoalMate!`;

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };
  const shareInstagram = () => {
    navigator.clipboard.writeText(text);
    toast.success("Caption copied! Open Instagram and paste 📋");
  };
  const copyLink = async () => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard! 📋");
  };
  const nativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "GoalMate", text }); } catch { /* user cancelled */ }
    } else copyLink();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm animate-in zoom-in-95 duration-300">
        <button onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <X className="w-4 h-4 text-foreground" />
        </button>

        {/* The shareable card */}
        <div ref={cardRef} className="rounded-3xl p-6 overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg, hsl(258 80% 25%) 0%, hsl(280 70% 18%) 50%, hsl(258 60% 12%) 100%)',
            boxShadow: '0 20px 60px -10px hsla(258, 100%, 50%, 0.5)',
          }}>
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-[100px] opacity-40"
            style={{ background: 'hsl(258 100% 60%)' }} />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full blur-[100px] opacity-30"
            style={{ background: 'hsl(0 100% 65%)' }} />

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black tracking-tight" style={{ color: 'white' }}>GoalMate 🎯</span>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60" style={{ color: 'white' }}>Achievement</span>
            </div>

            {milestone && (
              <div className="mt-4 text-center py-3 px-4 rounded-2xl"
                style={{ background: 'hsla(0, 0%, 100%, 0.1)', border: '1px solid hsla(0, 0%, 100%, 0.15)' }}>
                <p className="text-sm font-black" style={{ color: 'white' }}>{milestone}</p>
              </div>
            )}

            <div className="text-center my-6">
              <div className="text-5xl mb-2">{goalEmoji}</div>
              <p className="text-xl font-black" style={{ color: 'white' }}>{name}</p>
              <p className="text-xs mt-1 opacity-70" style={{ color: 'white' }}>{goalLabel}</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { v: `🔥 ${streak}`, l: "Streak" },
                { v: `⚡ ${xp}`, l: "XP" },
                { v: `🏅 ${badges}`, l: "Badges" },
              ].map((s, i) => (
                <div key={i} className="text-center py-3 rounded-xl"
                  style={{ background: 'hsla(0, 0%, 100%, 0.08)', border: '1px solid hsla(0, 0%, 100%, 0.1)' }}>
                  <p className="text-sm font-black" style={{ color: 'white' }}>{s.v}</p>
                  <p className="text-[9px] uppercase tracking-wider opacity-60 mt-0.5" style={{ color: 'white' }}>{s.l}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 text-center">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold"
                style={{ background: 'hsla(0, 0%, 100%, 0.15)', color: 'white' }}>
                {level}
              </span>
            </div>

            <p className="text-center text-xs mt-5 opacity-80 font-semibold" style={{ color: 'white' }}>
              Join me on GoalMate! 🚀
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <button onClick={shareWhatsApp}
            className="flex flex-col items-center gap-1 py-3 rounded-2xl glass-card hover:bg-primary/10 transition-all">
            <MessageCircle className="w-5 h-5 text-foreground" />
            <span className="text-[10px] font-semibold text-foreground">WhatsApp</span>
          </button>
          <button onClick={shareInstagram}
            className="flex flex-col items-center gap-1 py-3 rounded-2xl glass-card hover:bg-primary/10 transition-all">
            <Share2 className="w-5 h-5 text-foreground" />
            <span className="text-[10px] font-semibold text-foreground">Instagram</span>
          </button>
          <button onClick={copyLink}
            className="flex flex-col items-center gap-1 py-3 rounded-2xl glass-card hover:bg-primary/10 transition-all">
            <Copy className="w-5 h-5 text-foreground" />
            <span className="text-[10px] font-semibold text-foreground">Copy</span>
          </button>
          <button onClick={nativeShare}
            className="flex flex-col items-center gap-1 py-3 rounded-2xl text-primary-foreground transition-all"
            style={{ background: 'linear-gradient(135deg, hsl(258 100% 62%), hsl(280 100% 55%))' }}>
            <Share2 className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareCard;
