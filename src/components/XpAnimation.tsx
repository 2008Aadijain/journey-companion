import { useState, useEffect } from "react";

interface XpAnimationProps {
  amount: number;
  show: boolean;
  onDone?: () => void;
}

const XpAnimation = ({ amount, show, onDone }: XpAnimationProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onDone?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onDone]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center">
      <div className="animate-xp-float text-center">
        <div className="text-3xl font-black text-primary drop-shadow-lg"
          style={{ textShadow: '0 0 20px hsla(258, 100%, 62%, 0.6)' }}>
          +{amount} XP! 🌟
        </div>
      </div>
    </div>
  );
};

export default XpAnimation;
