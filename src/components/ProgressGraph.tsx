import { useMemo } from "react";

interface ProgressGraphProps {
  checkInDates: string[]; // ISO date strings of check-ins
}

const ProgressGraph = ({ checkInDates }: ProgressGraphProps) => {
  const days = useMemo(() => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const result: { label: string; done: boolean; date: string }[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const done = checkInDates.some(cd => cd.startsWith(dateStr));
      result.push({
        label: dayNames[d.getDay()],
        done,
        date: dateStr,
      });
    }
    return result;
  }, [checkInDates]);

  const completedCount = days.filter(d => d.done).length;

  return (
    <div className="rounded-2xl p-5 border border-border/40" style={{ background: 'hsla(258, 30%, 12%, 0.5)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-base">📊</span>
          <span className="text-sm font-bold text-foreground">7-Day Activity</span>
        </div>
        <span className="text-xs text-muted-foreground font-semibold">{completedCount}/7 days</span>
      </div>

      <div className="flex items-end justify-between gap-1.5 h-24">
        {days.map((day, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full flex flex-col justify-end" style={{ height: '72px' }}>
              <div
                className="w-full rounded-t-md transition-all duration-500"
                style={{
                  height: day.done ? '100%' : '20%',
                  background: day.done
                    ? 'linear-gradient(180deg, hsl(258 100% 65%), hsl(280 100% 55%))'
                    : 'hsla(0, 70%, 50%, 0.25)',
                  boxShadow: day.done ? '0 0 12px hsla(258, 100%, 62%, 0.4)' : 'none',
                  minHeight: '8px',
                }}
              />
            </div>
            <span className="text-[9px] font-bold text-muted-foreground">{day.label}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/20">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'hsl(258 100% 65%)' }} />
          <span className="text-[10px] text-muted-foreground">Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'hsla(0, 70%, 50%, 0.25)' }} />
          <span className="text-[10px] text-muted-foreground">Missed</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressGraph;
