"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatMoney, formatRelative, initials } from "@/lib/utils";

export function BidHistory({ listingId }: { listingId: string }) {
  const { data: bids = [], isLoading } = useQuery({
    queryKey: ["bids", listingId],
    queryFn: () => api.bids.listByListing(listingId),
    refetchInterval: 5000,
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading bids…</p>;
  if (bids.length === 0)
    return <p className="text-sm text-muted-foreground">No bids yet — be the first to bid!</p>;

  return (
    <ul className="divide-y divide-border">
      {bids.map((b, i) => (
        <li key={b.id} className="flex items-center justify-between gap-3 py-2.5">
          <div className="flex items-center gap-2">
            <Avatar className="size-7">
              <AvatarImage src={b.bidder.avatar} alt={b.bidder.name} />
              <AvatarFallback>{initials(b.bidder.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">
                {maskName(b.bidder.name)}
                {i === 0 && <span className="ml-2 text-xs font-normal text-success">Highest</span>}
              </p>
              <p className="text-xs text-muted-foreground">{formatRelative(b.createdAt)}</p>
            </div>
          </div>
          <span className="font-semibold tabular-nums">{formatMoney(b.amount)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Bidder anonymity, eBay-style: "Ava R." */
function maskName(name: string) {
  const [first, last] = name.split(" ");
  return `${first} ${last ? last[0] + "." : ""}`.trim();
}
