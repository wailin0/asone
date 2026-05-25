"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Countdown } from "@/features/bidding/countdown";
import { useSession } from "@/features/auth/session";
import { formatMoney } from "@/lib/utils";

export default function MyBidsPage() {
  const { user } = useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["my-bids", user?.id],
    queryFn: () => api.bids.byUser(user!.id),
    enabled: !!user,
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!data?.length)
    return (
      <Empty
        title="No bids yet"
        body="Find an auction and place your first bid."
        href="/search?type=auction"
        cta="Browse auctions"
      />
    );

  return (
    <div className="space-y-3">
      {data.map((b) => {
        const l = b.listing;
        const ended = l.status !== "active";
        const status = ended
          ? b.winning ? { label: "Won", variant: "success" as const } : { label: "Lost", variant: "muted" as const }
          : b.winning ? { label: "Winning", variant: "success" as const } : { label: "Outbid", variant: "danger" as const };
        return (
          <Card key={b.id}>
            <CardContent className="flex items-center gap-4 p-3">
              <Link href={`/listings/${l.id}`} className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image src={l.images[0]} alt="" fill sizes="64px" className="object-cover" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/listings/${l.id}`} className="line-clamp-1 font-medium hover:underline">{l.title}</Link>
                <p className="text-sm text-muted-foreground">
                  Your bid {formatMoney(b.amount)} · Current {formatMoney(l.currentPrice ?? 0)}
                </p>
                {!ended && l.endAt && <Countdown endAt={l.endAt} className="text-xs" />}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={status.variant}>{status.label}</Badge>
                {ended && b.winning && (
                  <Button asChild size="sm"><Link href={`/checkout?listing=${l.id}`}>Checkout</Link></Button>
                )}
                {!ended && !b.winning && (
                  <Button asChild size="sm" variant="outline"><Link href={`/listings/${l.id}`}>Bid again</Link></Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function Empty({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
      <p className="text-lg font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      <Button asChild className="mt-4"><Link href={href}>{cta}</Link></Button>
    </div>
  );
}
