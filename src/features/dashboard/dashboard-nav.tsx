"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gavel, Heart, LayoutDashboard, Package, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/bids", label: "My bids", icon: Gavel },
  { href: "/dashboard/watchlist", label: "Watchlist", icon: Heart },
  { href: "/dashboard/selling", label: "Selling", icon: Store },
  { href: "/dashboard/orders", label: "Orders", icon: Package },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
