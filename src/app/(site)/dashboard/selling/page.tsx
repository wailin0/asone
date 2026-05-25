"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ORDER_STATUS_LABEL } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Countdown } from "@/features/bidding/countdown";
import { useSession } from "@/features/auth/session";
import { formatMoney } from "@/lib/utils";
import { Empty } from "../bids/page";

export default function SellingPage() {
  const { user } = useSession();
  const qc = useQueryClient();

  const listings = useQuery({
    queryKey: ["my-listings-all", user?.id],
    queryFn: () => api.listings.list({ sellerId: user!.id, status: undefined, pageSize: 100 }),
    enabled: !!user,
  });
  // listing.list filters by status default "active"; fetch each status set:
  const allListings = useQuery({
    queryKey: ["seller-listings", user?.id],
    queryFn: async () => {
      const [active, sold, ended] = await Promise.all([
        api.listings.list({ sellerId: user!.id, status: "active", pageSize: 100 }),
        api.listings.list({ sellerId: user!.id, status: "sold", pageSize: 100 }),
        api.listings.list({ sellerId: user!.id, status: "ended", pageSize: 100 }),
      ]);
      return [...active.items, ...sold.items, ...ended.items];
    },
    enabled: !!user,
  });

  const sales = useQuery({
    queryKey: ["orders-seller", user?.id],
    queryFn: () => api.orders.listBySeller(user!.id),
    enabled: !!user,
  });

  const endEarly = useMutation({
    mutationFn: (id: string) => api.listings.endEarly(id, user!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seller-listings", user?.id] });
      toast.success("Listing ended");
    },
  });

  void listings;

  return (
    <Tabs defaultValue="listings">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="listings">My listings</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
        </TabsList>
        <Button asChild size="sm"><Link href="/sell"><Plus className="size-4" /> New listing</Link></Button>
      </div>

      <TabsContent value="listings">
        {allListings.isLoading ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : !allListings.data?.length ? (
          <Empty title="No listings yet" body="Create your first listing in under two minutes." href="/sell" cta="Sell an item" />
        ) : (
          <div className="space-y-3">
            {allListings.data.map((l) => (
              <Card key={l.id}>
                <CardContent className="flex items-center gap-4 p-3">
                  <Link href={`/listings/${l.id}`} className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <Image src={l.images[0]} alt="" fill sizes="64px" className="object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/listings/${l.id}`} className="line-clamp-1 font-medium hover:underline">{l.title}</Link>
                    <p className="text-sm text-muted-foreground">
                      {l.type === "auction"
                        ? `${formatMoney(l.currentPrice ?? 0)} · ${l.bidCount} bids`
                        : formatMoney(l.price ?? 0)}
                    </p>
                    {l.status === "active" && l.endAt && <Countdown endAt={l.endAt} className="text-xs" />}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={l.status === "active" ? "success" : l.status === "sold" ? "default" : "muted"} className="capitalize">
                      {l.status}
                    </Badge>
                    {l.status === "active" && (
                      <Button size="sm" variant="outline" onClick={() => endEarly.mutate(l.id)} disabled={endEarly.isPending}>
                        End early
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="sales">
        {sales.isLoading ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : !sales.data?.length ? (
          <Empty title="No sales yet" body="When someone buys your item, it'll show here." href="/sell" cta="List an item" />
        ) : (
          <div className="space-y-3">
            {sales.data.map((o) => <SaleRow key={o.id} order={o} />)}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function SaleRow({ order }: { order: Awaited<ReturnType<typeof api.orders.listBySeller>>[number] }) {
  const qc = useQueryClient();
  const [tracking, setTracking] = React.useState("");
  const ship = useMutation({
    mutationFn: () => api.orders.markShipped(order.id, tracking || `1Z${Math.floor(Math.random() * 1e9)}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders-seller"] });
      toast.success("Marked as shipped — buyer notified");
    },
  });

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-4 p-3">
        <Link href={`/listings/${order.listing.id}`} className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
          <Image src={order.listing.images[0]} alt="" fill sizes="64px" className="object-cover" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 font-medium">{order.listing.title}</p>
          <p className="text-sm text-muted-foreground">
            {formatMoney(order.amount)} · fee {formatMoney(order.fee)} · net {formatMoney(order.amount - order.fee)}
          </p>
        </div>
        <Badge variant="outline">{ORDER_STATUS_LABEL[order.status]}</Badge>
        {(order.status === "paid" || order.status === "pending") && (
          <div className="flex items-center gap-2">
            <Input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking #" className="h-9 w-36" />
            <Button size="sm" onClick={() => ship.mutate()} disabled={ship.isPending}>Mark shipped</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
