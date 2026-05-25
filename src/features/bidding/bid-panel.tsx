"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Gavel, Loader2, ShieldCheck, Trophy, Zap } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { ListingWithSeller } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn, formatMoney, minIncrement, nextMinBid } from "@/lib/utils";
import { useSession } from "@/features/auth/session";
import { useListing } from "@/features/listings/hooks";
import { WatchButton } from "@/features/listings/components/watch-button";
import { Countdown } from "./countdown";

export function BidPanel({ listingId }: { listingId: string }) {
  const router = useRouter();
  const { user } = useSession();
  const qc = useQueryClient();

  // Poll for "live" updates — the MVP strategy (refetch every few seconds).
  const { data: listing } = useListing(listingId);

  React.useEffect(() => {
    const id = setInterval(() => {
      qc.invalidateQueries({ queryKey: ["listing", listingId] });
    }, 4000);
    return () => clearInterval(id);
  }, [listingId, qc]);

  if (!listing) return <BidPanelSkeleton />;

  return listing.type === "auction" ? (
    <AuctionPanel listing={listing} user={user} onRequireAuth={() => router.push("/login")} />
  ) : (
    <FixedPanel listing={listing} user={user} />
  );
}

function FixedPanel({ listing, user }: { listing: ListingWithSeller; user: ReturnType<typeof useSession>["user"] }) {
  const router = useRouter();
  const isOwn = user?.id === listing.sellerId;
  const sold = listing.status === "sold";

  return (
    <PanelShell listing={listing}>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-extrabold">{formatMoney(listing.price ?? 0)}</span>
        <Badge variant="secondary">Buy It Now</Badge>
      </div>
      {sold ? (
        <Badge variant="muted" className="mt-3">This item has sold</Badge>
      ) : (
        <div className="mt-4 space-y-2">
          <Button
            size="lg"
            className="w-full"
            disabled={isOwn}
            onClick={() => router.push(`/checkout?listing=${listing.id}`)}
          >
            <Zap className="size-4" /> Buy It Now
          </Button>
          <WatchButton listingId={listing.id} variant="full" className="w-full" />
          {isOwn && <p className="text-center text-xs text-muted-foreground">This is your listing.</p>}
        </div>
      )}
      <BuyerProtection />
      <SellerLine listing={listing} />
    </PanelShell>
  );
}

function AuctionPanel({
  listing,
  user,
  onRequireAuth,
}: {
  listing: ListingWithSeller;
  user: ReturnType<typeof useSession>["user"];
  onRequireAuth: () => void;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const current = listing.currentPrice ?? listing.startPrice ?? 0;
  const min = nextMinBid(current);
  const [amount, setAmount] = React.useState(min.toFixed(2));
  const [bumped, setBumped] = React.useState(false);
  const prevPrice = React.useRef(current);

  React.useEffect(() => {
    if (current !== prevPrice.current) {
      prevPrice.current = current;
      setAmount(nextMinBid(current).toFixed(2));
      setBumped(true);
      const t = setTimeout(() => setBumped(false), 1000);
      return () => clearTimeout(t);
    }
  }, [current]);

  const isOwn = user?.id === listing.sellerId;
  const isHighest = !!user && listing.highestBidderId === user.id;
  const ended = listing.status !== "active";

  const placeBid = useMutation({
    mutationFn: (value: number) => api.bids.place(listing.id, user!.id, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listing", listing.id] });
      qc.invalidateQueries({ queryKey: ["bids", listing.id] });
      toast.success("Bid placed — you're the highest bidder!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return onRequireAuth();
    const value = Number(amount);
    if (!value || value < min) return toast.error(`Enter at least ${formatMoney(min)}`);
    placeBid.mutate(value);
  }

  const wonByUser = ended && listing.status === "sold" && isHighest;

  return (
    <PanelShell listing={listing}>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Current bid</p>
          <span
            className={cn("inline-block rounded px-1 text-3xl font-extrabold", bumped && "animate-bid-bump")}
          >
            {formatMoney(current)}
          </span>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p>{listing.bidCount} {listing.bidCount === 1 ? "bid" : "bids"}</p>
          {listing.reservePrice != null && (
            <p className={current >= listing.reservePrice ? "text-success" : ""}>
              {current >= listing.reservePrice ? "Reserve met" : "Reserve not met"}
            </p>
          )}
        </div>
      </div>

      {listing.endAt && !ended && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs uppercase text-muted-foreground">Time left</p>
          <Countdown endAt={listing.endAt} variant="full" />
        </div>
      )}

      <Separator className="my-4" />

      {ended ? (
        <div className="space-y-2">
          {wonByUser ? (
            <div className="rounded-lg bg-success/10 p-3 text-center">
              <Trophy className="mx-auto size-6 text-success" />
              <p className="mt-1 font-semibold text-success">You won this auction!</p>
              <Button className="mt-2 w-full" onClick={() => router.push(`/checkout?listing=${listing.id}`)}>
                Complete checkout
              </Button>
            </div>
          ) : (
            <Badge variant="muted">Auction ended</Badge>
          )}
        </div>
      ) : isOwn ? (
        <p className="rounded-lg bg-muted p-3 text-center text-sm text-muted-foreground">
          You can&apos;t bid on your own listing.
        </p>
      ) : (
        <>
          {isHighest && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm font-medium text-success">
              <Trophy className="size-4" /> You&apos;re the highest bidder
            </div>
          )}
          <form onSubmit={submit} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min={min}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-12 pl-7 text-lg"
                  aria-label="Your bid amount"
                />
              </div>
              <Button type="submit" size="lg" className="h-12" disabled={placeBid.isPending}>
                {placeBid.isPending ? <Loader2 className="size-4 animate-spin" /> : <Gavel className="size-4" />}
                Place bid
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter {formatMoney(min)} or more (min. increment {formatMoney(minIncrement(current))}).
            </p>
          </form>

          {listing.buyNowPrice != null && (
            <>
              <div className="my-3 flex items-center gap-3 text-xs text-muted-foreground">
                <Separator className="flex-1" /> or <Separator className="flex-1" />
              </div>
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => (user ? router.push(`/checkout?listing=${listing.id}`) : onRequireAuth())}
              >
                <Zap className="size-4" /> Buy It Now for {formatMoney(listing.buyNowPrice)}
              </Button>
            </>
          )}

          <WatchButton listingId={listing.id} variant="full" className="mt-2 w-full" />
        </>
      )}

      <BuyerProtection />
      <SellerLine listing={listing} />
    </PanelShell>
  );
}

function PanelShell({ listing, children }: { listing: ListingWithSeller; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h1 className="mb-3 text-xl font-bold leading-snug">{listing.title}</h1>
      {children}
    </div>
  );
}

function BuyerProtection() {
  return (
    <div className="mt-4 flex items-start gap-2 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
      <ShieldCheck className="size-4 shrink-0 text-success" />
      <span>
        <span className="font-medium text-foreground">Buyer protection.</span> Your payment is held in
        escrow and only released to the seller after you confirm the item arrived as described.
      </span>
    </div>
  );
}

function SellerLine({ listing }: { listing: ListingWithSeller }) {
  return (
    <p className="mt-3 text-center text-xs text-muted-foreground">
      Ships from {listing.location}
    </p>
  );
}

function BidPanelSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-5">
      <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
      <div className="h-9 w-1/2 animate-pulse rounded bg-muted" />
      <div className="h-12 w-full animate-pulse rounded bg-muted" />
      <div className="h-10 w-full animate-pulse rounded bg-muted" />
    </div>
  );
}
