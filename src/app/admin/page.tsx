"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, FileWarning, Gavel, Package, Receipt, Store, Users } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompactMoney, formatMoney } from "@/lib/utils";

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: () => api.admin.stats() });

  if (isLoading || !data)
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );

  const cards = [
    { label: "GMV", value: formatCompactMoney(data.gmv), icon: DollarSign },
    { label: "Platform fees", value: formatCompactMoney(data.fees), icon: Receipt },
    { label: "Active listings", value: data.activeListings, icon: Store },
    { label: "Live auctions", value: data.liveAuctions, icon: Gavel },
    { label: "Users", value: data.users, icon: Users },
    { label: "Orders", value: data.orders, icon: Package },
    { label: "Open reports", value: data.openReports, icon: FileWarning, href: "/admin/reports" },
  ];

  const max = Math.max(...data.salesByDay.map((d) => d.value), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Marketplace health at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => {
          const inner = (
            <Card className={c.href ? "transition hover:border-primary" : ""}>
              <CardContent className="flex flex-col gap-1 p-4">
                <c.icon className="size-5 text-primary" />
                <span className="text-2xl font-bold tabular-nums">{c.value}</span>
                <span className="text-xs text-muted-foreground">{c.label}</span>
              </CardContent>
            </Card>
          );
          return c.href ? <Link key={c.label} href={c.href}>{inner}</Link> : <div key={c.label}>{inner}</div>;
        })}
      </div>

      <Card>
        <CardContent className="pt-6">
          <h2 className="font-semibold">Sales — last 7 days</h2>
          <div className="mt-6 flex h-48 items-end gap-3">
            {data.salesByDay.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-primary/80 transition-all hover:bg-primary"
                    style={{ height: `${(d.value / max) * 100}%` }}
                    title={formatMoney(d.value)}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{d.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
