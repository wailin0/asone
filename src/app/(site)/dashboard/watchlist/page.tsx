"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingCard, ListingGrid } from "@/features/listings/components/listing-card";
import { useSession } from "@/features/auth/session";
import { Empty } from "../bids/page";

export default function WatchlistPage() {
  const { user } = useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["watchlist", user?.id],
    queryFn: () => api.watchlist.list(user!.id),
    enabled: !!user,
  });

  if (isLoading)
    return (
      <ListingGrid>
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-xl" />)}
      </ListingGrid>
    );

  if (!data?.length)
    return <Empty title="Your watchlist is empty" body="Tap the heart on any listing to save it here." href="/search" cta="Browse listings" />;

  return (
    <ListingGrid>
      {data.map((l) => <ListingCard key={l.id} listing={l} />)}
    </ListingGrid>
  );
}
