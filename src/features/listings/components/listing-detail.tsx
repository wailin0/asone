"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Flag, MapPin, Package } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { CONDITION_LABEL } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useListing } from "@/features/listings/hooks";
import { BidPanel } from "@/features/bidding/bid-panel";
import { BidHistory } from "@/features/bidding/bid-history";
import { ListingGallery } from "./listing-gallery";
import { SellerCard } from "./seller-card";
import { ListingCard, ListingGrid } from "./listing-card";

export function ListingDetail({ id }: { id: string }) {
  const { data: listing, isLoading, isError } = useListing(id);
  const related = useQuery({
    queryKey: ["related", id],
    queryFn: () => api.listings.related(id),
  });

  if (isLoading) return <DetailSkeleton />;
  if (isError || !listing) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-xl font-semibold">Listing not found</h1>
        <Button asChild className="mt-4"><Link href="/search">Browse listings</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="size-3.5" />
        <Link href={`/search?categoryId=${listing.category.id}`} className="hover:text-foreground">
          {listing.category.name}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-foreground">{listing.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <ListingGallery images={listing.images} title={listing.title} />

          <div className="hidden lg:block">
            <Details listing={listing} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="lg:sticky lg:top-20">
            <BidPanel listingId={id} />
          </div>
          <SellerCard seller={listing.seller} />
          <ReportButton />
        </div>

        <div className="lg:hidden">
          <Details listing={listing} />
        </div>
      </div>

      {related.data && related.data.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold">More in {listing.category.name}</h2>
          <ListingGrid>
            {related.data.map((l) => <ListingCard key={l.id} listing={l} />)}
          </ListingGrid>
        </section>
      )}
    </div>
  );
}

function Details({ listing }: { listing: import("@/lib/types").ListingWithSeller }) {
  return (
    <Tabs defaultValue="description">
      <TabsList>
        <TabsTrigger value="description">Description</TabsTrigger>
        {listing.type === "auction" && <TabsTrigger value="bids">Bid history</TabsTrigger>}
        <TabsTrigger value="shipping">Shipping</TabsTrigger>
      </TabsList>

      <TabsContent value="description">
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge variant="outline">Condition: {CONDITION_LABEL[listing.condition]}</Badge>
          <Badge variant="outline" className="gap-1">
            <MapPin className="size-3" /> {listing.location}
          </Badge>
          <Badge variant="muted">{listing.watchCount} watching</Badge>
        </div>
        <div className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {listing.description}
        </div>
      </TabsContent>

      {listing.type === "auction" && (
        <TabsContent value="bids">
          <BidHistory listingId={listing.id} />
        </TabsContent>
      )}

      <TabsContent value="shipping">
        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <Package className="size-5 shrink-0 text-primary" />
          <div className="space-y-1">
            <p><span className="font-medium text-foreground">Ships from:</span> {listing.location}</p>
            <p>Standard tracked shipping, 3–5 business days. Seller dispatches within 1 business day.</p>
            <p>Returns accepted within 14 days if not as described.</p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function ReportButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full text-muted-foreground"
      onClick={() => toast.success("Report submitted. Our team will review it.")}
    >
      <Flag className="size-4" /> Report this listing
    </Button>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
