import { useState, useEffect, memo } from 'react';
import { Clock } from 'lucide-react';

const LiveClock = memo(() => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = now.getHours();
  const isPM = hours >= 12;
  const h12 = hours % 12 || 12;
  const mins = now.getMinutes().toString().padStart(2, '0');
  const secs = now.getSeconds().toString().padStart(2, '0');
  const period = isPM ? 'م' : 'ص';

  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();

  return (
    <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-2.5 py-1.5 border border-border/40 font-mono select-none" dir="ltr">
      <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
      <span className="text-foreground font-semibold tabular-nums">
        {h12}:{mins}:{secs}
      </span>
      <span className="text-primary font-bold text-[10px]">{period}</span>
      <span className="text-border">|</span>
      <span className="tabular-nums">{day}/{month}/{year}</span>
    </div>
  );
});

LiveClock.displayName = 'LiveClock';

export default LiveClock;
