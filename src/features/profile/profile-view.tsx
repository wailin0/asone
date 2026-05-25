"use client";

import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Star } from "lucide-react";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingCard, ListingGrid } from "@/features/listings/components/listing-card";
import { formatDate, formatRelative, initials } from "@/lib/utils";

export function ProfileView({ userId }: { userId: string }) {
  const users = useQuery({ queryKey: ["admin-users-cache"], queryFn: () => api.admin.listUsers() });
  const listings = useQuery({ queryKey: ["seller-public", userId], queryFn: () => api.listings.list({ sellerId: userId, status: "active", pageSize: 50 }) });
  const reviews = useQuery({ queryKey: ["reviews", userId], queryFn: () => api.reviews.forUser(userId) });

  const user = users.data?.find((u) => u.id === userId);

  if (users.isLoading) return <div className="mx-auto max-w-5xl px-4 py-8"><Skeleton className="h-40 w-full rounded-xl" /></div>;
  if (!user) return <div className="mx-auto max-w-5xl px-4 py-24 text-center">User not found.</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Card>
        <CardContent className="flex flex-col items-start gap-4 pt-6 sm:flex-row sm:items-center">
          <Avatar className="size-20">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="text-xl">{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{user.name}</h1>
              {user.verified && <BadgeCheck className="size-5 text-primary" />}
              {user.status !== "active" && <Badge variant="danger" className="capitalize">{user.status}</Badge>}
            </div>
            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="size-4 fill-accent text-accent" />
              <span className="font-medium text-foreground">{user.ratingAvg.toFixed(1)}</span>
              ({user.ratingCount} ratings) · Member since {formatDate(user.createdAt)}
            </div>
            {user.bio && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{user.bio}</p>}
          </div>
        </CardContent>
      </Card>

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-bold">Active listings ({listings.data?.total ?? 0})</h2>
        {listings.isLoading ? (
          <ListingGrid>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-xl" />)}</ListingGrid>
        ) : listings.data?.items.length ? (
          <ListingGrid>{listings.data.items.map((l) => <ListingCard key={l.id} listing={l} />)}</ListingGrid>
        ) : (
          <p className="text-sm text-muted-foreground">No active listings.</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-bold">Reviews</h2>
        {reviews.data?.length ? (
          <div className="space-y-3">
            {reviews.data.map((r) => (
              <Card key={r.id}>
                <CardContent className="flex gap-3 pt-6">
                  <Avatar className="size-9">
                    <AvatarImage src={r.author.avatar} alt={r.author.name} />
                    <AvatarFallback>{initials(r.author.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.author.name}</span>
                      <span className="flex items-center text-accent">
                        {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="size-3.5 fill-accent" />)}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatRelative(r.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        )}
      </section>
    </div>
  );
}
