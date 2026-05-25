"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatClock, formatCountdown, getCountdown } from "@/lib/utils";

/** Live ticking countdown to an auction end time. */
export function Countdown({
  endAt,
  variant = "compact",
  className,
  onEnd,
}: {
  endAt: string;
  variant?: "compact" | "clock" | "full";
  className?: string;
  onEnd?: () => void;
}) {
  const [c, setC] = React.useState(() => getCountdown(endAt));
  const firedRef = React.useRef(false);

  React.useEffect(() => {
    firedRef.current = false;
    const tick = () => {
      const next = getCountdown(endAt);
      setC(next);
      if (next.ended && !firedRef.current) {
        firedRef.current = true;
        onEnd?.();
      }
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endAt, onEnd]);

  const urgent = !c.ended && c.total < 60 * 60 * 1000; // under an hour

  if (variant === "full") {
    const blocks = [
      { label: "days", value: c.days },
      { label: "hrs", value: c.hours },
      { label: "min", value: c.minutes },
      { label: "sec", value: c.seconds },
    ];
    return (
      <div className={cn("flex gap-2", className)} aria-live="polite">
        {blocks.map((b) => (
          <div
            key={b.label}
            className="flex min-w-12 flex-col items-center rounded-lg bg-secondary px-2 py-1.5"
          >
            <span className="font-mono text-xl font-bold tabular-nums">
              {String(b.value).padStart(2, "0")}
            </span>
            <span className="text-[10px] uppercase text-muted-foreground">{b.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium tabular-nums",
        urgent && "text-danger",
        className,
      )}
      aria-live="polite"
    >
      <Clock className="size-3.5" />
      {variant === "clock" ? formatClock(c) : formatCountdown(c)}
    </span>
  );
}
