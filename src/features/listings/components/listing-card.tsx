"use client";

import Image from "next/image";
import Link from "next/link";
import { Gavel, Star } from "lucide-react";
import type { ListingWithSeller } from "@/lib/types";
import { CONDITION_LABEL } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";
import { Countdown } from "@/features/bidding/countdown";
import { WatchButton } from "./watch-button";

export function ListingCard({ listing }: { listing: ListingWithSeller }) {
  const isAuction = listing.type === "auction";
  const price = isAuction ? listing.currentPrice ?? listing.startPrice ?? 0 : listing.price ?? 0;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={listing.images[0]}
          alt={listing.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2 flex gap-1">
          <Badge variant={isAuction ? "accent" : "secondary"}>
            {isAuction ? (
              <>
                <Gavel className="size-3" /> Auction
              </>
            ) : (
              "Buy Now"
            )}
          </Badge>
        </div>
        <WatchButton listingId={listing.id} className="absolute right-2 top-2" />
        {isAuction && listing.endAt && (
          <div className="absolute bottom-2 left-2 rounded-md bg-background/85 px-2 py-1 text-xs backdrop-blur">
            <Countdown endAt={listing.endAt} variant="compact" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <Badge variant="outline" className="w-fit text-[10px]">
          {CONDITION_LABEL[listing.condition]}
        </Badge>
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">{listing.title}</h3>
        <div className="mt-auto pt-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-lg font-bold">{formatMoney(price)}</span>
            {isAuction && (
              <span className="text-xs text-muted-foreground">
                {listing.bidCount} {listing.bidCount === 1 ? "bid" : "bids"}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3 fill-accent text-accent" />
            {listing.seller.ratingAvg.toFixed(1)}
            <span className="truncate">· {listing.location}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="aspect-square animate-pulse bg-muted" />
      <div className="flex flex-col gap-2 p-3">
        <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="mt-1 h-5 w-20 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

export function ListingGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {children}
    </div>
  );
}
