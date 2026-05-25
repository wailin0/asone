"use client";

import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Truck } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/features/auth/session";
import { formatDate, formatMoney } from "@/lib/utils";
import { Empty } from "../bids/page";

const STATUS_VARIANT: Record<OrderStatus, "default" | "success" | "muted" | "danger" | "outline" | "accent"> = {
  pending: "accent",
  paid: "default",
  shipped: "default",
  delivered: "success",
  completed: "success",
  refunded: "muted",
  cancelled: "danger",
};

export default function OrdersPage() {
  const { user } = useSession();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["orders-buyer", user?.id],
    queryFn: () => api.orders.listByBuyer(user!.id),
    enabled: !!user,
  });

  const confirm = useMutation({
    mutationFn: (id: string) => api.orders.confirmDelivery(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders-buyer", user?.id] });
      toast.success("Delivery confirmed — funds released to seller. Leave a review!");
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!data?.length)
    return <Empty title="No orders yet" body="Items you buy or win will appear here." href="/search" cta="Start shopping" />;

  return (
    <div className="space-y-3">
      {data.map((o) => (
        <Card key={o.id}>
          <CardContent className="flex flex-wrap items-center gap-4 p-3">
            <Link href={`/listings/${o.listing.id}`} className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
              <Image src={o.listing.images[0]} alt="" fill sizes="64px" className="object-cover" />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/listings/${o.listing.id}`} className="line-clamp-1 font-medium hover:underline">{o.listing.title}</Link>
              <p className="text-sm text-muted-foreground">
                {formatMoney(o.amount)} · ordered {formatDate(o.createdAt)}
              </p>
              {o.trackingNumber && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Truck className="size-3" /> Tracking: {o.trackingNumber}
                </p>
              )}
            </div>
            <Badge variant={STATUS_VARIANT[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge>
            {o.status === "pending" && (
              <Button asChild size="sm"><Link href={`/checkout?listing=${o.listing.id}`}>Pay now</Link></Button>
            )}
            {(o.status === "shipped" || o.status === "delivered") && (
              <Button size="sm" variant="outline" onClick={() => confirm.mutate(o.id)} disabled={confirm.isPending}>
                <CheckCircle2 className="size-4" /> Confirm receipt
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
