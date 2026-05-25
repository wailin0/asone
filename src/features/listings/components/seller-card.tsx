import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";
import type { User } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDate, initials } from "@/lib/utils";

export function SellerCard({ seller }: { seller: User }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <Avatar className="size-12">
          <AvatarImage src={seller.avatar} alt={seller.name} />
          <AvatarFallback>{initials(seller.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <p className="truncate font-semibold">{seller.name}</p>
            {seller.verified && <BadgeCheck className="size-4 shrink-0 text-primary" />}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="size-3.5 fill-accent text-accent" />
            <span className="font-medium text-foreground">{seller.ratingAvg.toFixed(1)}</span>
            ({seller.ratingCount} ratings)
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Member since {formatDate(seller.createdAt)} · {seller.location || "—"}
      </p>
      <Button asChild variant="outline" size="sm" className="mt-3 w-full">
        <Link href={`/u/${seller.id}`}>View seller profile</Link>
      </Button>
    </div>
  );
}
