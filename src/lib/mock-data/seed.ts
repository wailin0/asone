import type {
  AuditLogEntry,
  Bid,
  Category,
  Condition,
  Listing,
  ListingType,
  Order,
  AppNotification,
  Report,
  Review,
  User,
} from "@/lib/types";

/** Tiny deterministic PRNG (mulberry32) so seed data is identical every load. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20260525);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) => min + rand() * (max - min);
const round2 = (n: number) => Math.round(n * 100) / 100;

const now = Date.now();
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const iso = (ms: number) => new Date(ms).toISOString();

const img = (seed: string) => `https://picsum.photos/seed/${seed}/800/800`;
const avatar = (n: number) => `https://i.pravatar.cc/200?img=${n}`;

/* ----------------------------- Categories ----------------------------- */

export const categories: Category[] = [
  { id: "c-electronics", name: "Electronics", slug: "electronics", parentId: null, icon: "Smartphone" },
  { id: "c-phones", name: "Phones", slug: "phones", parentId: "c-electronics" },
  { id: "c-computers", name: "Computers", slug: "computers", parentId: "c-electronics" },
  { id: "c-cameras", name: "Cameras", slug: "cameras", parentId: "c-electronics" },
  { id: "c-audio", name: "Audio", slug: "audio", parentId: "c-electronics" },
  { id: "c-fashion", name: "Fashion", slug: "fashion", parentId: null, icon: "Shirt" },
  { id: "c-shoes", name: "Shoes", slug: "shoes", parentId: "c-fashion" },
  { id: "c-watches", name: "Watches", slug: "watches", parentId: "c-fashion" },
  { id: "c-bags", name: "Bags", slug: "bags", parentId: "c-fashion" },
  { id: "c-home", name: "Home & Garden", slug: "home", parentId: null, icon: "Sofa" },
  { id: "c-furniture", name: "Furniture", slug: "furniture", parentId: "c-home" },
  { id: "c-kitchen", name: "Kitchen", slug: "kitchen", parentId: "c-home" },
  { id: "c-collectibles", name: "Collectibles", slug: "collectibles", parentId: null, icon: "Gem" },
  { id: "c-toys", name: "Toys & Games", slug: "toys", parentId: null, icon: "Gamepad2" },
  { id: "c-sports", name: "Sports", slug: "sports", parentId: null, icon: "Dumbbell" },
  { id: "c-music", name: "Musical Instruments", slug: "music", parentId: null, icon: "Music" },
];
export const topCategories = categories.filter((c) => c.parentId === null);

/* ------------------------------- Users -------------------------------- */

const cities = [
  "Brooklyn, NY", "Austin, TX", "Seattle, WA", "Portland, OR", "Chicago, IL",
  "Denver, CO", "Miami, FL", "Boston, MA", "San Diego, CA", "Nashville, TN",
];
const firstNames = ["Ava", "Leo", "Maya", "Noah", "Zoe", "Kai", "Ivy", "Eli", "Nora", "Finn", "Ruby", "Owen", "Luna", "Jack", "Mia", "Sam"];
const lastNames = ["Reed", "Cole", "Hart", "Vance", "Quinn", "Frost", "Lane", "Webb", "Cruz", "Pike", "Shaw", "Dunn"];

export const users: User[] = [];

// Two fixed demo accounts you can log in as.
export const DEMO_USER_ID = "u-demo";
export const DEMO_ADMIN_ID = "u-admin";

users.push({
  id: DEMO_USER_ID,
  email: "demo@asone.app",
  name: "Demo Buyer",
  avatar: avatar(12),
  bio: "Bargain hunter and occasional seller. I collect vintage cameras.",
  location: "Brooklyn, NY",
  ratingAvg: 4.8,
  ratingCount: 37,
  verified: true,
  role: "user",
  status: "active",
  createdAt: iso(now - 420 * DAY),
});
users.push({
  id: DEMO_ADMIN_ID,
  email: "admin@asone.app",
  name: "Admin Riley",
  avatar: avatar(5),
  bio: "Marketplace operations & trust/safety.",
  location: "Seattle, WA",
  ratingAvg: 5,
  ratingCount: 8,
  verified: true,
  role: "admin",
  status: "active",
  createdAt: iso(now - 600 * DAY),
});

for (let i = 0; i < 22; i++) {
  const first = firstNames[i % firstNames.length];
  const last = pick(lastNames);
  const status = i === 7 ? "suspended" : i === 13 ? "banned" : "active";
  users.push({
    id: `u-${i}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
    name: `${first} ${last}`,
    avatar: avatar(20 + i),
    bio: pick([
      "Downsizing and selling things I no longer use.",
      "Small reseller — fast shipping, smoke-free home.",
      "Vintage & thrift finds. Ask me anything!",
      "Tech enthusiast clearing out the gadget drawer.",
    ]),
    location: pick(cities),
    ratingAvg: round2(between(3.6, 5)),
    ratingCount: Math.floor(between(2, 240)),
    verified: rand() > 0.4,
    role: i === 3 ? "moderator" : "user",
    status,
    createdAt: iso(now - Math.floor(between(20, 700)) * DAY),
  });
}

const sellerIds = users.filter((u) => u.status === "active").map((u) => u.id);

/* ------------------------------ Listings ------------------------------ */

type Template = { title: string; cat: string; lo: number; hi: number; img: string };
const templates: Template[] = [
  { title: "Apple iPhone 13 Pro 256GB — Unlocked", cat: "c-phones", lo: 380, hi: 620, img: "iphone" },
  { title: "Google Pixel 7 — Obsidian", cat: "c-phones", lo: 180, hi: 320, img: "pixel" },
  { title: 'MacBook Air M2 13" 8GB/256GB', cat: "c-computers", lo: 600, hi: 950, img: "macbook" },
  { title: "ThinkPad X1 Carbon Gen 9", cat: "c-computers", lo: 350, hi: 700, img: "thinkpad" },
  { title: "Sony A7 III Mirrorless Body", cat: "c-cameras", lo: 800, hi: 1300, img: "sonya7" },
  { title: "Canon AE-1 35mm Film Camera", cat: "c-cameras", lo: 90, hi: 240, img: "canonae1" },
  { title: "Fujifilm X100V — Silver", cat: "c-cameras", lo: 900, hi: 1500, img: "fujix100" },
  { title: "Sony WH-1000XM4 Headphones", cat: "c-audio", lo: 110, hi: 230, img: "sonyxm4" },
  { title: "Vintage Marantz 2270 Receiver", cat: "c-audio", lo: 300, hi: 800, img: "marantz" },
  { title: "Nike Air Jordan 1 Retro High", cat: "c-shoes", lo: 120, hi: 420, img: "jordan1" },
  { title: "New Balance 990v5 — Grey", cat: "c-shoes", lo: 80, hi: 180, img: "nb990" },
  { title: "Omega Seamaster Automatic", cat: "c-watches", lo: 2200, hi: 4800, img: "omega" },
  { title: "Seiko 5 Sports Automatic", cat: "c-watches", lo: 110, hi: 260, img: "seiko" },
  { title: "Louis Vuitton Neverfull MM", cat: "c-bags", lo: 700, hi: 1500, img: "lvbag" },
  { title: "Herman Miller Aeron Chair (Size B)", cat: "c-furniture", lo: 350, hi: 850, img: "aeron" },
  { title: "Mid-Century Walnut Sideboard", cat: "c-furniture", lo: 200, hi: 700, img: "sideboard" },
  { title: "KitchenAid Artisan Stand Mixer", cat: "c-kitchen", lo: 150, hi: 320, img: "kitchenaid" },
  { title: "Le Creuset 5.5qt Dutch Oven", cat: "c-kitchen", lo: 120, hi: 260, img: "lecreuset" },
  { title: "First Edition Comic Lot (1980s)", cat: "c-collectibles", lo: 60, hi: 900, img: "comics" },
  { title: "Vintage Polaroid SX-70 Land Camera", cat: "c-collectibles", lo: 90, hi: 300, img: "polaroid" },
  { title: "LEGO Star Wars UCS Millennium Falcon", cat: "c-toys", lo: 400, hi: 850, img: "lego" },
  { title: "Nintendo Switch OLED — White", cat: "c-toys", lo: 180, hi: 300, img: "switch" },
  { title: "Trek Domane SL Road Bike — 56cm", cat: "c-sports", lo: 900, hi: 2200, img: "trekbike" },
  { title: "Wilson Pro Staff Tennis Racket", cat: "c-sports", lo: 60, hi: 180, img: "racket" },
  { title: "Fender Player Stratocaster — Sunburst", cat: "c-music", lo: 450, hi: 800, img: "strat" },
  { title: "Yamaha P-125 Digital Piano", cat: "c-music", lo: 350, hi: 650, img: "yamaha" },
  { title: "iPad Pro 11\" M1 128GB Wi-Fi", cat: "c-computers", lo: 400, hi: 700, img: "ipad" },
  { title: "Dyson V11 Cordless Vacuum", cat: "c-home", lo: 180, hi: 400, img: "dyson" },
  { title: "Samsung 55\" 4K QLED TV", cat: "c-electronics", lo: 280, hi: 650, img: "samsungtv" },
  { title: "Ray-Ban Wayfarer Sunglasses", cat: "c-fashion", lo: 40, hi: 130, img: "rayban" },
];

const conditions: Condition[] = ["new", "like_new", "good", "fair", "for_parts"];

export const listings: Listing[] = [];
export const bids: Bid[] = [];

templates.forEach((t, idx) => {
  // Spread some listings across multiple variants for a fuller catalog.
  const variants = 1 + (idx % 2);
  for (let v = 0; v < variants; v++) {
    const id = `l-${idx}-${v}`;
    const isAuction: boolean = rand() > 0.45;
    const type: ListingType = isAuction ? "auction" : "fixed";
    const seller = pick(sellerIds);
    const condition = pick(conditions);
    const base = round2(between(t.lo, t.hi));
    const createdAt = now - Math.floor(between(1, 40)) * DAY;
    const images = [img(`${t.img}${v}`), img(`${t.img}${v}b`), img(`${t.img}${v}c`)];

    let listing: Listing;
    if (isAuction) {
      // Mix of ending-soon (minutes), today (hours), and multi-day auctions.
      const bucket = rand();
      const endMs =
        bucket < 0.18 ? now + between(2, 55) * 60_000 :
        bucket < 0.5 ? now + between(1, 10) * HOUR :
        now + between(1, 7) * DAY;
      const startPrice = round2(base * 0.4);
      const nBids = Math.floor(between(0, 24));
      let current = startPrice;
      // Synthesize a believable bid history.
      const bidders = sellerIds.filter((s) => s !== seller);
      for (let b = 0; b < nBids; b++) {
        current = round2(current * between(1.04, 1.18));
        bids.push({
          id: `b-${id}-${b}`,
          listingId: id,
          bidderId: pick(bidders),
          amount: current,
          maxProxyAmount: null,
          createdAt: iso(createdAt + (b + 1) * between(0.2, 4) * HOUR),
        });
      }
      const lastBid = bids.filter((b) => b.listingId === id).at(-1);
      listing = {
        id,
        sellerId: seller,
        title: t.title,
        description: descFor(t.title, condition),
        categoryId: t.cat,
        condition,
        type,
        images,
        location: users.find((u) => u.id === seller)!.location ?? "USA",
        price: null,
        startPrice,
        currentPrice: nBids > 0 ? current : startPrice,
        reservePrice: rand() > 0.7 ? round2(base * 0.9) : null,
        buyNowPrice: rand() > 0.6 ? round2(base * 1.15) : null,
        bidCount: nBids,
        highestBidderId: lastBid?.bidderId ?? null,
        startAt: iso(createdAt),
        endAt: iso(endMs),
        status: "active",
        watchCount: Math.floor(between(0, 80)),
        createdAt: iso(createdAt),
      };
    } else {
      listing = {
        id,
        sellerId: seller,
        title: t.title,
        description: descFor(t.title, condition),
        categoryId: t.cat,
        condition,
        type,
        images,
        location: users.find((u) => u.id === seller)!.location ?? "USA",
        price: base,
        startPrice: null,
        currentPrice: null,
        reservePrice: null,
        buyNowPrice: null,
        bidCount: 0,
        highestBidderId: null,
        startAt: iso(createdAt),
        endAt: null,
        status: "active",
        watchCount: Math.floor(between(0, 60)),
        createdAt: iso(createdAt),
      };
    }
    listings.push(listing);
  }
});

function descFor(title: string, condition: Condition) {
  const cond: Record<Condition, string> = {
    new: "Brand new, never used, still sealed in original packaging.",
    like_new: "Used once or twice — indistinguishable from new, no marks.",
    good: "Gently used with minor signs of wear. Fully functional.",
    fair: "Well-used with visible wear but works as intended.",
    for_parts: "Not fully working — sold as-is for parts or repair.",
  };
  return [
    `${title}. ${cond[condition]}`,
    "Ships within 1 business day from a smoke-free home. Carefully packed with tracking included.",
    "Any questions, send me a message before bidding — happy to add more photos.",
    "Bundle with my other listings to save on shipping.",
  ].join("\n\n");
}

/* ------------------------------- Orders ------------------------------- */

export const orders: Order[] = [];
const soldListings = listings.slice(0, 6);
soldListings.forEach((l, i) => {
  const amount = l.price ?? l.currentPrice ?? 100;
  const statuses: Order["status"][] = ["completed", "delivered", "shipped", "paid", "completed", "shipped"];
  orders.push({
    id: `o-${i}`,
    listingId: l.id,
    buyerId: i % 2 === 0 ? DEMO_USER_ID : pick(sellerIds),
    sellerId: l.sellerId,
    amount,
    fee: round2(amount * 0.1),
    status: statuses[i],
    shippingAddress: "123 Demo St, Brooklyn, NY 11201",
    trackingNumber: i < 3 ? `1Z999AA1${1000000 + i}` : null,
    createdAt: iso(now - (i + 1) * 3 * DAY),
  });
  l.status = "sold";
});

/* ------------------------------ Reviews ------------------------------- */

export const reviews: Review[] = orders
  .filter((o) => o.status === "completed")
  .map((o, i) => ({
    id: `rv-${i}`,
    orderId: o.id,
    authorId: o.buyerId,
    targetId: o.sellerId,
    rating: pick([4, 5, 5, 5]),
    comment: pick([
      "Item exactly as described, super fast shipping. A+ seller!",
      "Great communication and well packaged. Would buy again.",
      "Smooth transaction, item in perfect condition.",
    ]),
    createdAt: iso(new Date(o.createdAt).getTime() + 2 * DAY),
  }));

/* ------------------------------ Reports ------------------------------- */

export const reports: Report[] = [
  {
    id: "rp-0",
    reporterId: DEMO_USER_ID,
    targetType: "listing",
    targetId: listings[8].id,
    reason: "Suspected counterfeit — branding looks off in the photos.",
    status: "open",
    createdAt: iso(now - 2 * DAY),
  },
  {
    id: "rp-1",
    reporterId: "u-2",
    targetType: "user",
    targetId: "u-7",
    reason: "Seller asked to complete payment off-platform.",
    status: "reviewing",
    createdAt: iso(now - 5 * DAY),
  },
  {
    id: "rp-2",
    reporterId: "u-4",
    targetType: "listing",
    targetId: listings[12].id,
    reason: "Prohibited item.",
    status: "open",
    createdAt: iso(now - 1 * DAY),
  },
];

/* ---------------------------- Audit log ------------------------------- */

export const auditLog: AuditLogEntry[] = [
  {
    id: "al-0",
    adminId: DEMO_ADMIN_ID,
    action: "user.suspend",
    targetType: "user",
    targetId: "u-7",
    meta: "Off-platform payment solicitation",
    createdAt: iso(now - 4 * DAY),
  },
  {
    id: "al-1",
    adminId: DEMO_ADMIN_ID,
    action: "listing.remove",
    targetType: "listing",
    targetId: "l-99",
    meta: "Prohibited item",
    createdAt: iso(now - 6 * DAY),
  },
];

/* --------------------------- Notifications ---------------------------- */

export const notifications: AppNotification[] = [
  {
    id: "n-0",
    userId: DEMO_USER_ID,
    type: "outbid",
    title: "You've been outbid",
    body: "Someone outbid you on \"Canon AE-1 35mm Film Camera\".",
    href: "/listings/l-5-0",
    readAt: null,
    createdAt: iso(now - 30 * 60_000),
  },
  {
    id: "n-1",
    userId: DEMO_USER_ID,
    type: "ending_soon",
    title: "Auction ending soon",
    body: "An item on your watchlist ends in under an hour.",
    href: "/dashboard/watchlist",
    readAt: null,
    createdAt: iso(now - 2 * HOUR),
  },
  {
    id: "n-2",
    userId: DEMO_USER_ID,
    type: "shipped",
    title: "Your order has shipped",
    body: "Tracking added for your recent purchase.",
    href: "/dashboard/orders",
    readAt: iso(now - 20 * HOUR),
    createdAt: iso(now - DAY),
  },
];

/** Watchlist as [userId, listingId] pairs. */
export const watchlist: Array<{ userId: string; listingId: string; createdAt: string }> = [
  { userId: DEMO_USER_ID, listingId: listings[1].id, createdAt: iso(now - 3 * HOUR) },
  { userId: DEMO_USER_ID, listingId: listings[5].id, createdAt: iso(now - 8 * HOUR) },
  { userId: DEMO_USER_ID, listingId: listings[10].id, createdAt: iso(now - DAY) },
];
