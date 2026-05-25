import { categories, topCategories } from "@/lib/mock-data/seed";
import {
  CreateListingInput,
  Listing,
  ListingFilters,
  ListingWithSeller,
  Order,
  OrderStatus,
  Paginated,
  Report,
  User,
  UserRole,
  UserStatus,
} from "@/lib/types";
import { nextMinBid } from "@/lib/utils";
import { delay, getDB, persist, resetDB, sweepAuctions, uid } from "./store";

/* ------------------------------ helpers ------------------------------- */

class ApiError extends Error {}

function userById(id: string): User {
  const u = getDB().users.find((x) => x.id === id);
  if (!u) throw new ApiError("User not found");
  return u;
}

function categoryById(id: string) {
  return categories.find((c) => c.id === id) ?? categories[0];
}

function enrich(l: Listing): ListingWithSeller {
  return { ...l, seller: userById(l.sellerId), category: categoryById(l.categoryId) };
}

export function priceOf(l: Listing): number {
  return l.type === "fixed" ? l.price ?? 0 : l.currentPrice ?? l.startPrice ?? 0;
}

/** A category and all of its descendant category ids. */
function categoryTreeIds(id: string): string[] {
  const out = [id];
  for (const c of categories) if (c.parentId === id) out.push(...categoryTreeIds(c.id));
  return out;
}

/* ------------------------------- auth --------------------------------- */

export const authApi = {
  async me(): Promise<User | null> {
    const d = getDB();
    return delay(d.sessionUserId ? userById(d.sessionUserId) : null, 120);
  },

  async login(email: string, _password: string): Promise<User> {
    const d = getDB();
    const user = d.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) throw new ApiError("No account with that email. Try demo@asone.app");
    if (user.status === "banned") throw new ApiError("This account has been banned.");
    d.sessionUserId = user.id;
    persist();
    return delay(user, 350);
  },

  async register(input: { name: string; email: string }): Promise<User> {
    const d = getDB();
    if (d.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase()))
      throw new ApiError("An account with that email already exists.");
    const user: User = {
      id: uid("u"),
      email: input.email,
      name: input.name,
      avatar: `https://i.pravatar.cc/200?u=${encodeURIComponent(input.email)}`,
      bio: "",
      location: "",
      ratingAvg: 0,
      ratingCount: 0,
      verified: false,
      role: "user",
      status: "active",
      createdAt: new Date().toISOString(),
    };
    d.users.unshift(user);
    d.sessionUserId = user.id;
    persist();
    return delay(user, 400);
  },

  async logout(): Promise<void> {
    const d = getDB();
    d.sessionUserId = null;
    persist();
    return delay(undefined, 120);
  },

  /** Dev-only: jump into a seeded account (e.g. the admin) without a password. */
  async loginAs(userId: string): Promise<User> {
    const d = getDB();
    d.sessionUserId = userId;
    persist();
    return delay(userById(userId), 150);
  },
};

/* ----------------------------- listings ------------------------------- */

export const listingsApi = {
  async list(filters: ListingFilters = {}): Promise<Paginated<ListingWithSeller>> {
    sweepAuctions();
    const { page = 1, pageSize = 24 } = filters;
    let items = getDB().listings.slice();

    const status = filters.status ?? "active";
    items = items.filter((l) => l.status === status);

    if (filters.sellerId) items = items.filter((l) => l.sellerId === filters.sellerId);
    if (filters.type) items = items.filter((l) => l.type === filters.type);
    if (filters.categoryId) {
      const ids = new Set(categoryTreeIds(filters.categoryId));
      items = items.filter((l) => ids.has(l.categoryId));
    }
    if (filters.condition?.length) {
      const set = new Set(filters.condition);
      items = items.filter((l) => set.has(l.condition));
    }
    if (filters.location) {
      const q = filters.location.toLowerCase();
      items = items.filter((l) => l.location.toLowerCase().includes(q));
    }
    if (filters.q) {
      const q = filters.q.toLowerCase();
      items = items.filter(
        (l) => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q),
      );
    }
    if (filters.minPrice != null) items = items.filter((l) => priceOf(l) >= filters.minPrice!);
    if (filters.maxPrice != null) items = items.filter((l) => priceOf(l) <= filters.maxPrice!);

    const sort = filters.sort ?? "newest";
    items.sort((a, b) => {
      switch (sort) {
        case "price_asc":
          return priceOf(a) - priceOf(b);
        case "price_desc":
          return priceOf(b) - priceOf(a);
        case "most_bids":
          return b.bidCount - a.bidCount;
        case "ending_soon": {
          const ae = a.endAt ? new Date(a.endAt).getTime() : Infinity;
          const be = b.endAt ? new Date(b.endAt).getTime() : Infinity;
          return ae - be;
        }
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    const total = items.length;
    const start = (page - 1) * pageSize;
    return delay(
      { items: items.slice(start, start + pageSize).map(enrich), total, page, pageSize },
      320,
    );
  },

  async getById(id: string): Promise<ListingWithSeller> {
    sweepAuctions();
    const l = getDB().listings.find((x) => x.id === id);
    if (!l) throw new ApiError("Listing not found");
    return delay(enrich(l), 260);
  },

  async endingSoon(limit = 8): Promise<ListingWithSeller[]> {
    sweepAuctions();
    const items = getDB()
      .listings.filter((l) => l.status === "active" && l.type === "auction" && l.endAt)
      .sort((a, b) => new Date(a.endAt!).getTime() - new Date(b.endAt!).getTime())
      .slice(0, limit)
      .map(enrich);
    return delay(items, 300);
  },

  async featured(limit = 8): Promise<ListingWithSeller[]> {
    const items = getDB()
      .listings.filter((l) => l.status === "active")
      .sort((a, b) => b.watchCount - a.watchCount)
      .slice(0, limit)
      .map(enrich);
    return delay(items, 300);
  },

  async related(id: string, limit = 6): Promise<ListingWithSeller[]> {
    const all = getDB().listings;
    const ref = all.find((l) => l.id === id);
    if (!ref) return delay([], 200);
    const items = all
      .filter((l) => l.id !== id && l.status === "active" && l.categoryId === ref.categoryId)
      .slice(0, limit)
      .map(enrich);
    return delay(items, 250);
  },

  async create(input: CreateListingInput, sellerId: string): Promise<Listing> {
    const d = getDB();
    const nowMs = Date.now();
    const listing: Listing = {
      id: uid("l"),
      sellerId,
      title: input.title,
      description: input.description,
      categoryId: input.categoryId,
      condition: input.condition,
      type: input.type,
      images: input.images,
      location: input.location,
      price: input.type === "fixed" ? input.price : null,
      startPrice: input.type === "auction" ? input.startPrice : null,
      currentPrice: input.type === "auction" ? input.startPrice : null,
      reservePrice: input.reservePrice ?? null,
      buyNowPrice: input.buyNowPrice ?? null,
      bidCount: 0,
      highestBidderId: null,
      startAt: new Date(nowMs).toISOString(),
      endAt:
        input.type === "auction"
          ? new Date(nowMs + (input.durationDays ?? 7) * 86_400_000).toISOString()
          : null,
      status: "active",
      watchCount: 0,
      createdAt: new Date(nowMs).toISOString(),
    };
    d.listings.unshift(listing);
    persist();
    return delay(listing, 500);
  },

  async endEarly(id: string, sellerId: string): Promise<Listing> {
    const d = getDB();
    const l = d.listings.find((x) => x.id === id);
    if (!l) throw new ApiError("Listing not found");
    if (l.sellerId !== sellerId) throw new ApiError("Not your listing");
    l.status = "ended";
    if (l.endAt) l.endAt = new Date().toISOString();
    persist();
    return delay(l, 300);
  },
};

/* ------------------------------- bids --------------------------------- */

export const bidsApi = {
  async listByListing(listingId: string) {
    const d = getDB();
    const items = d.bids
      .filter((b) => b.listingId === listingId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((b) => ({ ...b, bidder: userById(b.bidderId) }));
    return delay(items, 240);
  },

  async byUser(userId: string) {
    const d = getDB();
    // Latest bid per listing the user has bid on.
    const seen = new Set<string>();
    const items = d.bids
      .filter((b) => b.bidderId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .filter((b) => (seen.has(b.listingId) ? false : seen.add(b.listingId)))
      .map((b) => {
        const listing = d.listings.find((l) => l.id === b.listingId)!;
        return { ...b, listing: enrich(listing), winning: listing.highestBidderId === userId };
      });
    return delay(items, 300);
  },

  async place(
    listingId: string,
    bidderId: string,
    amount: number,
  ): Promise<{ listing: ListingWithSeller }> {
    const d = getDB();
    sweepAuctions();
    const l = d.listings.find((x) => x.id === listingId);
    if (!l) throw new ApiError("Listing not found");
    if (l.type !== "auction") throw new ApiError("This listing is not an auction");
    if (l.status !== "active" || (l.endAt && Date.now() > new Date(l.endAt).getTime()))
      throw new ApiError("This auction has ended");
    if (l.sellerId === bidderId) throw new ApiError("You can't bid on your own item");

    const min = nextMinBid(l.currentPrice ?? l.startPrice ?? 0);
    if (amount < min) throw new ApiError(`Your bid must be at least ${min.toFixed(2)}`);

    const previousHighest = l.highestBidderId;

    d.bids.push({
      id: uid("b"),
      listingId,
      bidderId,
      amount,
      maxProxyAmount: null,
      createdAt: new Date().toISOString(),
    });
    l.currentPrice = amount;
    l.bidCount += 1;
    l.highestBidderId = bidderId;

    if (previousHighest && previousHighest !== bidderId) {
      d.notifications.unshift({
        id: uid("n"),
        userId: previousHighest,
        type: "outbid",
        title: "You've been outbid",
        body: `Someone outbid you on "${l.title}".`,
        href: `/listings/${l.id}`,
        readAt: null,
        createdAt: new Date().toISOString(),
      });
    }
    persist();
    return delay({ listing: enrich(l) }, 350);
  },
};

/* ------------------------------ orders -------------------------------- */

export const ordersApi = {
  async buyNow(
    listingId: string,
    buyerId: string,
    shippingAddress: string,
  ): Promise<Order> {
    const d = getDB();
    const l = d.listings.find((x) => x.id === listingId);
    if (!l) throw new ApiError("Listing not found");
    if (l.status !== "active") throw new ApiError("This item is no longer available");
    if (l.sellerId === buyerId) throw new ApiError("You can't buy your own item");

    const amount = l.type === "fixed" ? l.price ?? 0 : l.buyNowPrice ?? 0;
    if (!amount) throw new ApiError("This item has no Buy It Now price");

    const order: Order = {
      id: uid("o"),
      listingId,
      buyerId,
      sellerId: l.sellerId,
      amount,
      fee: Math.round(amount * 0.1 * 100) / 100,
      status: "paid",
      shippingAddress,
      trackingNumber: null,
      createdAt: new Date().toISOString(),
    };
    d.orders.unshift(order);
    l.status = "sold";
    d.notifications.unshift({
      id: uid("n"),
      userId: l.sellerId,
      type: "sold",
      title: "Your item sold! 💰",
      body: `"${l.title}" just sold. Time to ship it.`,
      href: "/dashboard/selling",
      readAt: null,
      createdAt: new Date().toISOString(),
    });
    persist();
    return delay(order, 500);
  },

  /** Pay for an order created by winning an auction. */
  async payForOrder(orderId: string): Promise<Order> {
    const d = getDB();
    const o = d.orders.find((x) => x.id === orderId);
    if (!o) throw new ApiError("Order not found");
    o.status = "paid";
    persist();
    return delay(o, 400);
  },

  async listByBuyer(buyerId: string) {
    const d = getDB();
    const items = d.orders
      .filter((o) => o.buyerId === buyerId)
      .map((o) => ({ ...o, listing: enrich(d.listings.find((l) => l.id === o.listingId)!) }));
    return delay(items, 300);
  },

  async listBySeller(sellerId: string) {
    const d = getDB();
    const items = d.orders
      .filter((o) => o.sellerId === sellerId)
      .map((o) => ({ ...o, listing: enrich(d.listings.find((l) => l.id === o.listingId)!) }));
    return delay(items, 300);
  },

  async markShipped(orderId: string, trackingNumber: string): Promise<Order> {
    const d = getDB();
    const o = d.orders.find((x) => x.id === orderId);
    if (!o) throw new ApiError("Order not found");
    o.status = "shipped";
    o.trackingNumber = trackingNumber;
    d.notifications.unshift({
      id: uid("n"),
      userId: o.buyerId,
      type: "shipped",
      title: "Your order has shipped",
      body: `Tracking: ${trackingNumber}`,
      href: "/dashboard/orders",
      readAt: null,
      createdAt: new Date().toISOString(),
    });
    persist();
    return delay(o, 350);
  },

  async confirmDelivery(orderId: string): Promise<Order> {
    const d = getDB();
    const o = d.orders.find((x) => x.id === orderId);
    if (!o) throw new ApiError("Order not found");
    o.status = "completed";
    persist();
    return delay(o, 350);
  },
};

/* ---------------------------- watchlist ------------------------------- */

export const watchlistApi = {
  async list(userId: string) {
    const d = getDB();
    const items = d.watchlist
      .filter((w) => w.userId === userId)
      .map((w) => enrich(d.listings.find((l) => l.id === w.listingId)!))
      .filter(Boolean);
    return delay(items, 280);
  },

  async ids(userId: string): Promise<string[]> {
    const d = getDB();
    return delay(d.watchlist.filter((w) => w.userId === userId).map((w) => w.listingId), 100);
  },

  async toggle(userId: string, listingId: string): Promise<{ watching: boolean }> {
    const d = getDB();
    const idx = d.watchlist.findIndex((w) => w.userId === userId && w.listingId === listingId);
    const listing = d.listings.find((l) => l.id === listingId);
    if (idx >= 0) {
      d.watchlist.splice(idx, 1);
      if (listing) listing.watchCount = Math.max(0, listing.watchCount - 1);
      persist();
      return delay({ watching: false }, 180);
    }
    d.watchlist.unshift({ userId, listingId, createdAt: new Date().toISOString() });
    if (listing) listing.watchCount += 1;
    persist();
    return delay({ watching: true }, 180);
  },
};

/* --------------------------- notifications ---------------------------- */

export const notificationsApi = {
  async list(userId: string) {
    const d = getDB();
    const items = d.notifications.filter((n) => n.userId === userId);
    return delay(items, 200);
  },
  async markAllRead(userId: string) {
    const d = getDB();
    d.notifications.forEach((n) => {
      if (n.userId === userId && !n.readAt) n.readAt = new Date().toISOString();
    });
    persist();
    return delay(undefined, 150);
  },
};

/* ------------------------------ reviews ------------------------------- */

export const reviewsApi = {
  async forUser(userId: string) {
    const d = getDB();
    const items = d.reviews
      .filter((r) => r.targetId === userId)
      .map((r) => ({ ...r, author: userById(r.authorId) }));
    return delay(items, 260);
  },
};

/* ----------------------------- categories ----------------------------- */

export const categoriesApi = {
  all: () => categories,
  top: () => topCategories,
  children: (parentId: string) => categories.filter((c) => c.parentId === parentId),
};

/* ------------------------------- admin -------------------------------- */

function writeAudit(adminId: string, action: string, targetType: string, targetId: string, meta?: string) {
  getDB().auditLog.unshift({
    id: uid("al"),
    adminId,
    action,
    targetType,
    targetId,
    meta,
    createdAt: new Date().toISOString(),
  });
}

export const adminApi = {
  async stats() {
    const d = getDB();
    const gmv = d.orders.reduce((s, o) => s + o.amount, 0);
    const fees = d.orders.reduce((s, o) => s + o.fee, 0);
    const activeListings = d.listings.filter((l) => l.status === "active").length;
    const liveAuctions = d.listings.filter((l) => l.status === "active" && l.type === "auction").length;
    // Sales over the last 7 days (by order createdAt).
    const days = Array.from({ length: 7 }, (_, i) => {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - (6 - i));
      const next = day.getTime() + 86_400_000;
      const total = d.orders
        .filter((o) => {
          const t = new Date(o.createdAt).getTime();
          return t >= day.getTime() && t < next;
        })
        .reduce((s, o) => s + o.amount, 0);
      return { label: day.toLocaleDateString("en-US", { weekday: "short" }), value: total };
    });
    return delay(
      {
        gmv,
        fees,
        activeListings,
        liveAuctions,
        users: d.users.length,
        orders: d.orders.length,
        openReports: d.reports.filter((r) => r.status === "open").length,
        salesByDay: days,
      },
      300,
    );
  },

  async listUsers(q = "") {
    const d = getDB();
    const term = q.toLowerCase();
    return delay(
      d.users.filter(
        (u) => !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term),
      ),
      280,
    );
  },

  async setUserStatus(adminId: string, userId: string, status: UserStatus): Promise<User> {
    const u = userById(userId);
    u.status = status;
    writeAudit(adminId, `user.${status}`, "user", userId);
    persist();
    return delay(u, 280);
  },

  async setUserRole(adminId: string, userId: string, role: UserRole): Promise<User> {
    const u = userById(userId);
    u.role = role;
    writeAudit(adminId, "user.role", "user", userId, role);
    persist();
    return delay(u, 280);
  },

  async setUserVerified(adminId: string, userId: string, verified: boolean): Promise<User> {
    const u = userById(userId);
    u.verified = verified;
    writeAudit(adminId, verified ? "user.verify" : "user.unverify", "user", userId);
    persist();
    return delay(u, 220);
  },

  async listListings(q = "") {
    const d = getDB();
    const term = q.toLowerCase();
    return delay(
      d.listings
        .filter((l) => !term || l.title.toLowerCase().includes(term))
        .map(enrich),
      300,
    );
  },

  async setListingStatus(
    adminId: string,
    listingId: string,
    status: Listing["status"],
  ): Promise<Listing> {
    const d = getDB();
    const l = d.listings.find((x) => x.id === listingId);
    if (!l) throw new ApiError("Listing not found");
    l.status = status;
    writeAudit(adminId, `listing.${status}`, "listing", listingId);
    persist();
    return delay(l, 260);
  },

  async listReports(): Promise<Array<Report & { target?: ListingWithSeller | User }>> {
    const d = getDB();
    return delay(
      d.reports.map((r) => {
        let target: ListingWithSeller | User | undefined;
        if (r.targetType === "listing") {
          const l = d.listings.find((x) => x.id === r.targetId);
          target = l ? enrich(l) : undefined;
        } else if (r.targetType === "user") {
          target = d.users.find((x) => x.id === r.targetId);
        }
        return { ...r, target };
      }),
      280,
    );
  },

  async resolveReport(
    adminId: string,
    reportId: string,
    status: Report["status"],
  ): Promise<Report> {
    const d = getDB();
    const r = d.reports.find((x) => x.id === reportId);
    if (!r) throw new ApiError("Report not found");
    r.status = status;
    writeAudit(adminId, `report.${status}`, "report", reportId);
    persist();
    return delay(r, 240);
  },

  async listOrders() {
    const d = getDB();
    return delay(
      d.orders.map((o) => ({
        ...o,
        listing: enrich(d.listings.find((l) => l.id === o.listingId)!),
        buyer: userById(o.buyerId),
        seller: userById(o.sellerId),
      })),
      300,
    );
  },

  async refundOrder(adminId: string, orderId: string, status: OrderStatus): Promise<Order> {
    const d = getDB();
    const o = d.orders.find((x) => x.id === orderId);
    if (!o) throw new ApiError("Order not found");
    o.status = status;
    writeAudit(adminId, `order.${status}`, "order", orderId);
    persist();
    return delay(o, 280);
  },

  async auditLog() {
    const d = getDB();
    return delay(
      d.auditLog.map((a) => ({ ...a, admin: userById(a.adminId) })),
      200,
    );
  },
};

/* ------------------------------- dev ---------------------------------- */

export const devApi = {
  reset() {
    resetDB();
  },
};

/**
 * The single active API implementation. Today every method is backed by the
 * in-memory mock; to go live, implement the http/ versions and re-export them
 * from here — components never change.
 */
export const api = {
  auth: authApi,
  listings: listingsApi,
  bids: bidsApi,
  orders: ordersApi,
  watchlist: watchlistApi,
  notifications: notificationsApi,
  reviews: reviewsApi,
  categories: categoriesApi,
  admin: adminApi,
  dev: devApi,
};

export type Api = typeof api;
