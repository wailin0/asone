"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import type { Condition, ListingFilters, ListingSort, ListingType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useListings } from "@/features/listings/hooks";
import {
  ListingCard, ListingCardSkeleton, ListingGrid,
} from "@/features/listings/components/listing-card";
import { api } from "@/lib/api";
import { FiltersPanel, type SearchState } from "./filters-panel";

const SORTS: { value: ListingSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "ending_soon", label: "Ending soonest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "most_bids", label: "Most bids" },
];

const PAGE_SIZE = 20;

export function SearchClient() {
  const router = useRouter();
  const params = useSearchParams();

  const q = params.get("q") ?? undefined;
  const sort = (params.get("sort") as ListingSort) ?? "newest";
  const page = Number(params.get("page") ?? "1");

  const state: SearchState = {
    categoryId: params.get("categoryId") ?? undefined,
    type: (params.get("type") as ListingType) ?? undefined,
    condition: (params.get("condition")?.split(",").filter(Boolean) as Condition[]) ?? [],
    minPrice: params.get("minPrice") ? Number(params.get("minPrice")) : undefined,
    maxPrice: params.get("maxPrice") ? Number(params.get("maxPrice")) : undefined,
    location: params.get("location") ?? undefined,
  };

  const filters: ListingFilters = {
    q,
    sort,
    page,
    pageSize: PAGE_SIZE,
    categoryId: state.categoryId,
    type: state.type,
    condition: state.condition.length ? state.condition : undefined,
    minPrice: state.minPrice,
    maxPrice: state.maxPrice,
    location: state.location,
  };

  const { data, isLoading } = useListings(filters);

  function setParams(patch: Record<string, string | undefined>, resetPage = true) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") next.delete(k);
      else next.set(k, v);
    }
    if (resetPage) next.delete("page");
    router.push(`/search?${next.toString()}`);
  }

  function onFilterChange(patch: Partial<SearchState>) {
    const map: Record<string, string | undefined> = {};
    if ("categoryId" in patch) map.categoryId = patch.categoryId;
    if ("type" in patch) map.type = patch.type;
    if ("minPrice" in patch) map.minPrice = patch.minPrice?.toString();
    if ("maxPrice" in patch) map.maxPrice = patch.maxPrice?.toString();
    if ("location" in patch) map.location = patch.location;
    if ("condition" in patch) map.condition = patch.condition?.length ? patch.condition.join(",") : undefined;
    setParams(map);
  }

  function clearFilters() {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    router.push(`/search?${next.toString()}`);
  }

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const categoryName = state.categoryId
    ? api.categories.all().find((c) => c.id === state.categoryId)?.name
    : null;

  const heading = q ? `Results for “${q}”` : categoryName ?? "All listings";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{heading}</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Searching…" : `${total} ${total === 1 ? "item" : "items"}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile filters */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden">
                <SlidersHorizontal className="size-4" /> Filters
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Filters</DialogTitle>
              </DialogHeader>
              <FiltersPanel state={state} onChange={onFilterChange} onClear={clearFilters} />
            </DialogContent>
          </Dialog>

          <Select value={sort} onValueChange={(v) => setParams({ sort: v }, false)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 flex gap-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-20 rounded-xl border border-border bg-card p-4">
            <FiltersPanel state={state} onChange={onFilterChange} onClear={clearFilters} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {isLoading ? (
            <ListingGrid>
              {Array.from({ length: 10 }).map((_, i) => <ListingCardSkeleton key={i} />)}
            </ListingGrid>
          ) : total === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-24 text-center">
              <p className="text-lg font-medium">No listings match your filters</p>
              <p className="mt-1 text-sm text-muted-foreground">Try widening your search or clearing filters.</p>
              <Button onClick={clearFilters} variant="outline" className="mt-4">Clear filters</Button>
            </div>
          ) : (
            <>
              <ListingGrid>
                {data!.items.map((l) => <ListingCard key={l.id} listing={l} />)}
              </ListingGrid>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setParams({ page: String(page - 1) }, false)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setParams({ page: String(page + 1) }, false)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
