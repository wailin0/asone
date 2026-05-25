"use client";

import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "@/features/auth/session";
import { useToggleWatch, useWatchlistIds } from "@/features/listings/hooks";

export function WatchButton({
  listingId,
  variant = "icon",
  className,
}: {
  listingId: string;
  variant?: "icon" | "full";
  className?: string;
}) {
  const { user } = useSession();
  const router = useRouter();
  const { data: ids } = useWatchlistIds();
  const toggle = useToggleWatch();
  const watching = !!ids?.includes(listingId);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info("Log in to save items to your watchlist");
      router.push("/login");
      return;
    }
    toggle.mutate(listingId);
  }

  if (variant === "full") {
    return (
      <Button type="button" variant="outline" onClick={onClick} className={className}>
        <Heart className={cn("size-4", watching && "fill-danger text-danger")} />
        {watching ? "Watching" : "Watch"}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={watching ? "Remove from watchlist" : "Add to watchlist"}
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur transition hover:bg-background",
        className,
      )}
    >
      <Heart className={cn("size-4.5", watching && "fill-danger text-danger")} />
    </button>
  );
}
