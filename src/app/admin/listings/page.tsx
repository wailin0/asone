"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Search } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Listing } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/features/auth/session";
import { formatMoney } from "@/lib/utils";

export default function AdminListingsPage() {
  const { user: me } = useSession();
  const qc = useQueryClient();
  const [q, setQ] = React.useState("");
  const { data, isLoading } = useQuery({ queryKey: ["admin-listings", q], queryFn: () => api.admin.listListings(q) });

  const setStatus = useMutation({
    mutationFn: (v: { id: string; status: Listing["status"] }) => api.admin.setListingStatus(me!.id, v.id, v.status),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
      toast.success(v.status === "removed" ? "Listing taken down" : `Listing ${v.status}`);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Listing moderation</h1>
        <div className="relative w-64 max-w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search listings…" className="pl-9" />
        </div>
      </div>

      <Card className="divide-y divide-border">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="p-3"><Skeleton className="h-12 w-full" /></div>)
          : data!.map((l) => (
              <div key={l.id} className="flex items-center gap-3 p-3">
                <Link href={`/listings/${l.id}`} className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image src={l.images[0]} alt="" fill sizes="48px" className="object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/listings/${l.id}`} className="line-clamp-1 font-medium hover:underline">{l.title}</Link>
                  <p className="text-xs text-muted-foreground">
                    {l.seller.name} · {l.type} · {formatMoney(l.type === "fixed" ? l.price ?? 0 : l.currentPrice ?? 0)}
                  </p>
                </div>
                <Badge
                  variant={l.status === "active" ? "success" : l.status === "removed" ? "danger" : "muted"}
                  className="capitalize"
                >
                  {l.status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {l.status !== "removed" ? (
                      <DropdownMenuItem className="text-danger" onClick={() => setStatus.mutate({ id: l.id, status: "removed" })}>
                        Take down
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => setStatus.mutate({ id: l.id, status: "active" })}>Restore</DropdownMenuItem>
                    )}
                    {l.status === "active" && (
                      <DropdownMenuItem onClick={() => setStatus.mutate({ id: l.id, status: "ended" })}>Force-end</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
      </Card>
    </div>
  );
}
