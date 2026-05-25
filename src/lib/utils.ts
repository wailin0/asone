import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names, de-duping conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function formatMoney(amount: number) {
  return currency.format(amount);
}

export function formatCompactMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatDate(iso: string | number | Date) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatRelative(iso: string | number | Date) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

export type Countdown = {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  ended: boolean;
};

export function getCountdown(endAt: string | number | Date): Countdown {
  const total = new Date(endAt).getTime() - Date.now();
  const clamped = Math.max(total, 0);
  return {
    total,
    days: Math.floor(clamped / 86_400_000),
    hours: Math.floor((clamped / 3_600_000) % 24),
    minutes: Math.floor((clamped / 60_000) % 60),
    seconds: Math.floor((clamped / 1000) % 60),
    ended: total <= 0,
  };
}

/** Compact countdown label, e.g. "2d 4h", "5h 12m", "47s". */
export function formatCountdown(c: Countdown) {
  if (c.ended) return "Ended";
  if (c.days > 0) return `${c.days}d ${c.hours}h`;
  if (c.hours > 0) return `${c.hours}h ${c.minutes}m`;
  if (c.minutes > 0) return `${c.minutes}m ${c.seconds}s`;
  return `${c.seconds}s`;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Full clock countdown, e.g. "02:04:09:51" or "12:34". */
export function formatClock(c: Countdown) {
  if (c.ended) return "00:00";
  if (c.days > 0) return `${c.days}d ${pad(c.hours)}:${pad(c.minutes)}:${pad(c.seconds)}`;
  if (c.hours > 0) return `${pad(c.hours)}:${pad(c.minutes)}:${pad(c.seconds)}`;
  return `${pad(c.minutes)}:${pad(c.seconds)}`;
}

/**
 * eBay-style minimum bid increment, scaling with current price.
 * Mirrors the rule the real bidding engine will enforce server-side.
 */
export function minIncrement(currentPrice: number): number {
  if (currentPrice < 1) return 0.05;
  if (currentPrice < 10) return 0.25;
  if (currentPrice < 50) return 1;
  if (currentPrice < 250) return 2.5;
  if (currentPrice < 500) return 5;
  if (currentPrice < 1000) return 10;
  if (currentPrice < 5000) return 25;
  return 50;
}

export function nextMinBid(currentPrice: number): number {
  return Math.round((currentPrice + minIncrement(currentPrice)) * 100) / 100;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
