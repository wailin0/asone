"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function SearchBarInner({ className }: { className?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = React.useState(params.get("q") ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <form onSubmit={submit} className={cn("relative flex-1", className)} role="search">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search for anything…"
        className="h-11 pl-9 pr-3"
        aria-label="Search listings"
      />
    </form>
  );
}

/**
 * Wraps the useSearchParams consumer in its own Suspense boundary so any page
 * embedding the search bar (home hero, header) can still be statically rendered.
 */
export function SearchBar({ className }: { className?: string }) {
  return (
    <React.Suspense
      fallback={<div className={cn("h-11 flex-1 rounded-md border border-input bg-background", className)} />}
    >
      <SearchBarInner className={className} />
    </React.Suspense>
  );
}
