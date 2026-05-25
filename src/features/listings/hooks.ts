"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { ListingFilters } from "@/lib/types";
import { useSession } from "@/features/auth/session";

export function useListings(filters: ListingFilters) {
  return useQuery({
    queryKey: ["listings", filters],
    queryFn: () => api.listings.list(filters),
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: ["listing", id],
    queryFn: () => api.listings.getById(id),
  });
}

export function useWatchlistIds() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["watchlist-ids", user?.id],
    queryFn: () => api.watchlist.ids(user!.id),
    enabled: !!user,
  });
}

export function useToggleWatch() {
  const { user } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (listingId: string) => api.watchlist.toggle(user!.id, listingId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["watchlist-ids", user?.id] });
      qc.invalidateQueries({ queryKey: ["watchlist", user?.id] });
      toast.success(res.watching ? "Added to watchlist" : "Removed from watchlist");
    },
  });
}
