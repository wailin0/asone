"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Gavel, Heart, Package, Plus, Store, Trophy } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "@/features/auth/session";
import { formatMoney } from "@/lib/utils";

export default function DashboardOverview() {
  const { user } = useSession();
  const bids = useQuery({ queryKey: ["my-bids", user?.id], queryFn: () => api.bids.byUser(user!.id), enabled: !!user });
  const watch = useQuery({ queryKey: ["watchlist", user?.id], queryFn: () => api.watchlist.list(user!.id), enabled: !!user });
  const selling = useQuery({ queryKey: ["my-listings", user?.id], queryFn: () => api.listings.list({ sellerId: user!.id, status: "active" }), enabled: !!user });
  const orders = useQuery({ queryKey: ["orders-buyer", user?.id], queryFn: () => api.orders.listByBuyer(user!.id), enabled: !!user });

  const winning = bids.data?.filter((b) => b.winning).length ?? 0;

  const stats = [
    { label: "Active bids", value: bids.data?.length ?? 0, icon: Gavel, href: "/dashboard/bids", hint: `${winning} winning` },
    { label: "Watching", value: watch.data?.length ?? 0, icon: Heart, href: "/dashboard/watchlist" },
    { label: "Active listings", value: selling.data?.total ?? 0, icon: Store, href: "/dashboard/selling" },
    { label: "Orders", value: orders.data?.length ?? 0, icon: Package, href: "/dashboard/orders" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Welcome back, {user?.name.split(" ")[0]}</h2>
          <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening with your account.</p>
        </div>
        <Button asChild><Link href="/sell"><Plus className="size-4" /> List an item</Link></Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition hover:border-primary hover:shadow-sm">
              <CardContent className="flex flex-col gap-1 p-4">
                <s.icon className="size-5 text-primary" />
                <span className="text-2xl font-bold">{s.value}</span>
                <span className="text-xs text-muted-foreground">{s.label}</span>
                {s.hint && <span className="text-xs text-success">{s.hint}</span>}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {winning > 0 && (
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Trophy className="size-6 text-success" />
            <div>
              <p className="font-medium">You&apos;re winning {winning} {winning === 1 ? "auction" : "auctions"}!</p>
              <p className="text-sm text-muted-foreground">Keep an eye on the clock so you don&apos;t get outbid.</p>
            </div>
            <Button asChild variant="outline" size="sm" className="ml-auto"><Link href="/dashboard/bids">View bids</Link></Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <h3 className="mb-1 font-medium">Account</h3>
          <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div><dt className="text-muted-foreground">Member rating</dt><dd className="font-medium">{user?.ratingAvg.toFixed(1)} ★</dd></div>
            <div><dt className="text-muted-foreground">Total sales</dt><dd className="font-medium">{formatMoney((orders.data ?? []).reduce((s, o) => s + o.amount, 0))}</dd></div>
            <div><dt className="text-muted-foreground">Verified</dt><dd className="font-medium">{user?.verified ? "Yes" : "No"}</dd></div>
            <div><dt className="text-muted-foreground">Role</dt><dd className="font-medium capitalize">{user?.role}</dd></div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
