import * as seed from "@/lib/mock-data/seed";
import type {
  AuditLogEntry,
  Bid,
  Listing,
  Order,
  AppNotification,
  Report,
  Review,
  User,
} from "@/lib/types";

/**
 * In-memory store for the Phase-0 mock backend. Seeded from mock-data, mutated
 * by the mock API, and persisted to localStorage so refreshes keep state.
 * This is the ONLY stateful module; the http/ implementations added later will
 * replace lib/api entirely without touching components.
 */
export type DB = {
  users: User[];
  listings: Listing[];
  bids: Bid[];
  orders: Order[];
  reviews: Review[];
  reports: Report[];
  auditLog: AuditLogEntry[];
  notifications: AppNotification[];
  watchlist: Array<{ userId: string; listingId: string; createdAt: string }>;
  sessionUserId: string | null;
};

const STORAGE_KEY = "asone.db.v1";
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

function freshDB(): DB {
  return {
    users: clone(seed.users),
    listings: clone(seed.listings),
    bids: clone(seed.bids),
    orders: clone(seed.orders),
    reviews: clone(seed.reviews),
    reports: clone(seed.reports),
    auditLog: clone(seed.auditLog),
    notifications: clone(seed.notifications),
    watchlist: clone(seed.watchlist),
    sessionUserId: null,
  };
}

let db: DB = freshDB();
let hydrated = false;

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) db = JSON.parse(raw) as DB;
  } catch {
    /* ignore corrupt storage */
  }
}

export function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* quota / private mode — fine, stays in memory */
  }
}

export function resetDB() {
  db = freshDB();
  persist();
}

export function getDB(): DB {
  hydrate();
  return db;
}

/** Simulated network latency so loading states & skeletons are real. */
export function delay<T>(value: T, ms = 280): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Idempotent auction-close sweep — mirrors the server's node-cron sweep.
 * Closes any active auction past its end time: creates an order for the
 * highest valid bidder (if reserve met) or marks it ended with no sale.
 * Returns the ids of listings that changed so callers can notify.
 */
export function sweepAuctions(): string[] {
  const d = getDB();
  const nowMs = Date.now();
  const changed: string[] = [];

  for (const l of d.listings) {
    if (l.type !== "auction" || l.status !== "active") continue;
    if (!l.endAt || new Date(l.endAt).getTime() > nowMs) continue;

    const hasWinner =
      l.bidCount > 0 &&
      l.highestBidderId != null &&
      (l.reservePrice == null || (l.currentPrice ?? 0) >= l.reservePrice);

    if (hasWinner) {
      const amount = l.currentPrice ?? l.startPrice ?? 0;
      d.orders.unshift({
        id: uid("o"),
        listingId: l.id,
        buyerId: l.highestBidderId!,
        sellerId: l.sellerId,
        amount,
        fee: Math.round(amount * 0.1 * 100) / 100,
        status: "pending",
        shippingAddress: "",
        trackingNumber: null,
        createdAt: new Date().toISOString(),
      });
      l.status = "sold";
      d.notifications.unshift({
        id: uid("n"),
        userId: l.highestBidderId!,
        type: "won",
        title: "You won the auction! 🎉",
        body: `You won "${l.title}". Complete checkout to confirm.`,
        href: `/listings/${l.id}`,
        readAt: null,
        createdAt: new Date().toISOString(),
      });
    } else {
      l.status = "ended";
    }
    changed.push(l.id);
  }

  if (changed.length) persist();
  return changed;
}
