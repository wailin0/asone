"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, Dumbbell, Gamepad2, Gavel, Gem, Music, ShieldCheck, Shirt,
  Smartphone, Sofa, Tag, Truck,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/layout/search-bar";
import {
  ListingCard, ListingCardSkeleton, ListingGrid,
} from "@/features/listings/components/listing-card";

const ICONS: Record<string, React.ElementType> = {
  Smartphone, Shirt, Sofa, Gem, Gamepad2, Dumbbell, Music, Tag,
};

export default function HomePage() {
  const top = api.categories.top();
  const endingSoon = useQuery({ queryKey: ["ending-soon"], queryFn: () => api.listings.endingSoon(10) });
  const featured = useQuery({ queryKey: ["featured"], queryFn: () => api.listings.featured(10) });

  return (
    <div>
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-border">
        {/* Layered backdrop: soft wash, faint grid, primary glow */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-secondary via-background to-background" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-50 [mask-image:radial-gradient(ellipse_60%_55%_at_50%_0%,black,transparent)]"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div
          aria-hidden
          className="absolute left-1/2 top-[-6rem] -z-10 h-72 w-[42rem] max-w-[90vw] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
        />

        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-16">
          <div className="mx-auto flex max-w-xl items-center gap-2">
            <SearchBar className="[&_input]:shadow-sm" />
            <Button asChild size="lg" className="h-11 shrink-0">
              <Link href="/sell">
                <Tag className="size-4" /> Sell
              </Link>
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-2 text-sm">
            {top.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                href={`/search?categoryId=${c.id}`}
                className="rounded-full border border-border bg-background/70 px-3 py-1 text-muted-foreground backdrop-blur transition hover:border-primary hover:text-foreground"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Trust strip — slim, single row */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-b border-border py-5 text-sm text-muted-foreground">
          {[
            { icon: ShieldCheck, label: "Buyer protection" },
            { icon: Gavel, label: "Live auctions" },
            { icon: Truck, label: "Tracked shipping" },
          ].map((f) => (
            <span key={f.label} className="inline-flex items-center gap-2">
              <f.icon className="size-4 text-primary" />
              {f.label}
            </span>
          ))}
        </div>

        {/* Categories */}
        <section className="py-6">
          <h2 className="mb-4 text-xl font-bold">Shop by category</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-8">
            {top.map((c) => {
              const Icon = ICONS[c.icon ?? "Tag"] ?? Tag;
              return (
                <Link
                  key={c.id}
                  href={`/search?categoryId=${c.id}`}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition hover:border-primary hover:shadow-sm"
                >
                  <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-xs font-medium leading-tight">{c.name}</span>
                </Link>
              );
            })}
          </div>
        </section>

        <Section
          title="Ending soon"
          subtitle="Auctions closing fast — place your bid before the clock runs out."
          href="/search?type=auction&sort=ending_soon"
          loading={endingSoon.isLoading}
          items={endingSoon.data ?? []}
        />

        <Section
          title="Trending now"
          subtitle="The most-watched listings on aSone right now."
          href="/search"
          loading={featured.isLoading}
          items={featured.data ?? []}
        />
      </div>
    </div>
  );
}

function Section({
  title, subtitle, href, loading, items,
}: {
  title: string;
  subtitle: string;
  href: string;
  loading: boolean;
  items: import("@/lib/types").ListingWithSeller[];
}) {
  return (
    <section className="py-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href={href}>
            View all <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
      <ListingGrid>
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <ListingCardSkeleton key={i} />)
          : items.slice(0, 10).map((l) => <ListingCard key={l.id} listing={l} />)}
      </ListingGrid>
    </section>
  );
}
