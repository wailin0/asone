import { Suspense } from "react";
import { SearchClient } from "@/features/search/search-client";

export const metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">Loading…</div>}>
      <SearchClient />
    </Suspense>
  );
}
