import { z } from "zod";

/**
 * Domain types + Zod schemas for aSone. In Phase 0 these live in the web app
 * and the mock API validates against them; later they move to packages/shared
 * so the Express API conforms to the exact same shapes.
 */

export const UserRole = z.enum(["user", "moderator", "admin"]);
export type UserRole = z.infer<typeof UserRole>;

export const UserStatus = z.enum(["active", "suspended", "banned"]);
export type UserStatus = z.infer<typeof UserStatus>;

export const Condition = z.enum(["new", "like_new", "good", "fair", "for_parts"]);
export type Condition = z.infer<typeof Condition>;

export const ListingType = z.enum(["fixed", "auction"]);
export type ListingType = z.infer<typeof ListingType>;

export const ListingStatus = z.enum(["draft", "active", "sold", "ended", "removed"]);
export type ListingStatus = z.infer<typeof ListingStatus>;

export const OrderStatus = z.enum([
  "pending",
  "paid",
  "shipped",
  "delivered",
  "completed",
  "refunded",
  "cancelled",
]);
export type OrderStatus = z.infer<typeof OrderStatus>;

export const ReportStatus = z.enum(["open", "reviewing", "resolved", "dismissed"]);
export type ReportStatus = z.infer<typeof ReportStatus>;

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatar: z.string(),
  bio: z.string().optional(),
  location: z.string().optional(),
  ratingAvg: z.number(),
  ratingCount: z.number(),
  verified: z.boolean(),
  role: UserRole,
  status: UserStatus,
  createdAt: z.string(),
});
export type User = z.infer<typeof userSchema>;

export type Category = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  icon?: string;
};

export const listingSchema = z.object({
  id: z.string(),
  sellerId: z.string(),
  title: z.string(),
  description: z.string(),
  categoryId: z.string(),
  condition: Condition,
  type: ListingType,
  images: z.array(z.string()),
  location: z.string(),
  // fixed price
  price: z.number().nullable(),
  // auction
  startPrice: z.number().nullable(),
  currentPrice: z.number().nullable(),
  reservePrice: z.number().nullable(),
  buyNowPrice: z.number().nullable(),
  bidCount: z.number(),
  highestBidderId: z.string().nullable(),
  startAt: z.string(),
  endAt: z.string().nullable(),
  status: ListingStatus,
  watchCount: z.number(),
  createdAt: z.string(),
});
export type Listing = z.infer<typeof listingSchema>;

export type Bid = {
  id: string;
  listingId: string;
  bidderId: string;
  amount: number;
  maxProxyAmount: number | null;
  createdAt: string;
};

export type Order = {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  fee: number;
  status: OrderStatus;
  shippingAddress: string;
  trackingNumber: string | null;
  createdAt: string;
};

export type Review = {
  id: string;
  orderId: string;
  authorId: string;
  targetId: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type Report = {
  id: string;
  reporterId: string;
  targetType: "listing" | "user" | "message";
  targetId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
};

export type AuditLogEntry = {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  meta?: string;
  createdAt: string;
};

export type NotificationType =
  | "outbid"
  | "won"
  | "sold"
  | "shipped"
  | "ending_soon"
  | "message";

export type AppNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
};

/* ---------- Inputs / requests ---------- */

export const createListingSchema = z
  .object({
    title: z.string().min(4, "Give your item a descriptive title").max(120),
    description: z.string().min(10, "Add a few words about the item").max(4000),
    categoryId: z.string().min(1, "Pick a category"),
    condition: Condition,
    type: ListingType,
    images: z.array(z.string()).min(1, "Add at least one photo"),
    location: z.string().min(2, "Where is the item?"),
    price: z.number().positive().nullable(),
    startPrice: z.number().positive().nullable(),
    buyNowPrice: z.number().positive().nullable(),
    reservePrice: z.number().positive().nullable(),
    durationDays: z.number().int().min(1).max(14).nullable(),
  })
  .refine((v) => (v.type === "fixed" ? v.price != null : true), {
    message: "Set a price",
    path: ["price"],
  })
  .refine((v) => (v.type === "auction" ? v.startPrice != null : true), {
    message: "Set a starting price",
    path: ["startPrice"],
  });
export type CreateListingInput = z.infer<typeof createListingSchema>;

export type ListingSort =
  | "newest"
  | "ending_soon"
  | "price_asc"
  | "price_desc"
  | "most_bids";

export type ListingFilters = {
  q?: string;
  categoryId?: string;
  condition?: Condition[];
  type?: ListingType;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  sort?: ListingSort;
  sellerId?: string;
  status?: ListingStatus;
  page?: number;
  pageSize?: number;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/* ---------- Display helpers ---------- */

export const CONDITION_LABEL: Record<Condition, string> = {
  new: "New",
  like_new: "Like New",
  good: "Good",
  fair: "Fair",
  for_parts: "For Parts",
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  completed: "Completed",
  refunded: "Refunded",
  cancelled: "Cancelled",
};

/** Listing enriched with seller + category for display. */
export type ListingWithSeller = Listing & {
  seller: User;
  category: Category;
};
