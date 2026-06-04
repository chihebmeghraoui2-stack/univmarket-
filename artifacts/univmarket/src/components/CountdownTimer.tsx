import { useEffect, useMemo, useState } from "react";

interface CountdownTimerProps {
  targetDate: string;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const target = useMemo(() => new Date(targetDate).getTime(), [targetDate]);
  const [remaining, setRemaining] = useState(() => Math.max(target - Date.now(), 0));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRemaining(Math.max(target - Date.now(), 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [target]);

  const formatted = useMemo(() => {
    const seconds = Math.floor(remaining / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return { days, hours, minutes, secs };
  }, [remaining]);

  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-5xl font-semibold">{formatted.days}</p>
        <p className="text-sm text-muted-foreground">Jours</p>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-5xl font-semibold">{formatted.hours}</p>
        <p className="text-sm text-muted-foreground">Heures</p>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-5xl font-semibold">{formatted.minutes}</p>
        <p className="text-sm text-muted-foreground">Minutes</p>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-5xl font-semibold">{formatted.secs}</p>
        <p className="text-sm text-muted-foreground">Secondes</p>
      </div>
    </div>
  );
}
