"use client";

import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/features/auth/session";
import { formatDate, formatMoney } from "@/lib/utils";

export default function AdminOrdersPage() {
  const { user: me } = useSession();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-orders"], queryFn: () => api.admin.listOrders() });

  const update = useMutation({
    mutationFn: (v: { id: string; status: OrderStatus }) => api.admin.refundOrder(me!.id, v.id, v.status),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ["admin-orders"] }); toast.success(`Order ${ORDER_STATUS_LABEL[v.status].toLowerCase()}`); },
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders</h1>
      <Card className="divide-y divide-border">
        {data!.map((o) => (
          <div key={o.id} className="flex flex-wrap items-center gap-3 p-3">
            <Link href={`/listings/${o.listing.id}`} className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
              <Image src={o.listing.images[0]} alt="" fill sizes="48px" className="object-cover" />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 font-medium">{o.listing.title}</p>
              <p className="text-xs text-muted-foreground">
                {o.buyer.name} ← {o.seller.name} · {formatDate(o.createdAt)}
              </p>
            </div>
            <span className="font-medium tabular-nums">{formatMoney(o.amount)}</span>
            <Badge variant="outline">{ORDER_STATUS_LABEL[o.status]}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => update.mutate({ id: o.id, status: "refunded" })}>Issue refund</DropdownMenuItem>
                <DropdownMenuItem className="text-danger" onClick={() => update.mutate({ id: o.id, status: "cancelled" })}>Cancel order</DropdownMenuItem>
                <DropdownMenuItem onClick={() => update.mutate({ id: o.id, status: "completed" })}>Mark completed</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </Card>
    </div>
  );
}
