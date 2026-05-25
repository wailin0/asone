"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, CreditCard, Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatMoney } from "@/lib/utils";
import { useSession } from "@/features/auth/session";

const SHIPPING = 9.99;

export function CheckoutClient() {
  const params = useSearchParams();
  const listingId = params.get("listing") ?? "";
  const { user } = useSession();

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", listingId],
    queryFn: () => api.listings.getById(listingId),
    enabled: !!listingId,
  });
  const { data: orders } = useQuery({
    queryKey: ["orders-buyer", user?.id],
    queryFn: () => api.orders.listByBuyer(user!.id),
    enabled: !!user,
  });

  const [address, setAddress] = React.useState("");
  const [done, setDone] = React.useState<string | null>(null);

  // An order already exists when the user won this auction.
  const wonOrder = orders?.find((o) => o.listingId === listingId && o.status === "pending");

  const checkout = useMutation({
    mutationFn: async () => {
      if (wonOrder) return api.orders.payForOrder(wonOrder.id);
      return api.orders.buyNow(listingId, user!.id, address);
    },
    onSuccess: (order) => {
      setDone(order.id);
      toast.success("Payment successful!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!user) {
    return (
      <Centered>
        <h1 className="text-xl font-semibold">Log in to check out</h1>
        <Button asChild className="mt-4">
          <Link href={`/login?redirect=/checkout?listing=${listingId}`}>Log in</Link>
        </Button>
      </Centered>
    );
  }
  if (isLoading) return <Centered><Loader2 className="size-6 animate-spin text-muted-foreground" /></Centered>;
  if (!listing) return <Centered><p>Listing not found.</p></Centered>;

  if (done) {
    return (
      <Centered>
        <CheckCircle2 className="size-14 text-success" />
        <h1 className="mt-3 text-2xl font-bold">Order confirmed!</h1>
        <p className="mt-1 max-w-sm text-muted-foreground">
          Your payment is held securely in escrow until you confirm the item arrived.
        </p>
        <div className="mt-6 flex gap-2">
          <Button asChild><Link href="/dashboard/orders">View order</Link></Button>
          <Button asChild variant="outline"><Link href="/search">Keep shopping</Link></Button>
        </div>
      </Centered>
    );
  }

  const itemPrice = wonOrder
    ? wonOrder.amount
    : listing.type === "fixed"
      ? listing.price ?? 0
      : listing.buyNowPrice ?? listing.currentPrice ?? 0;
  const total = itemPrice + SHIPPING;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!wonOrder && address.trim().length < 5) return toast.error("Enter a shipping address");
    checkout.mutate();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <h2 className="font-semibold">Shipping address</h2>
              <div className="space-y-1.5">
                <Label htmlFor="addr">Address</Label>
                <Input
                  id="addr"
                  value={wonOrder ? wonOrder.shippingAddress || address : address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St, Apt 4, City, State, ZIP"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 pt-6">
              <h2 className="flex items-center gap-2 font-semibold">
                <CreditCard className="size-4" /> Payment
                <span className="ml-auto inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                  <Lock className="size-3" /> Demo — no real charge
                </span>
              </h2>
              <div className="space-y-1.5">
                <Label htmlFor="card">Card number</Label>
                <Input id="card" placeholder="4242 4242 4242 4242" defaultValue="4242 4242 4242 4242" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="exp">Expiry</Label>
                  <Input id="exp" placeholder="MM/YY" defaultValue="12/29" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cvc">CVC</Label>
                  <Input id="cvc" placeholder="123" defaultValue="123" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex gap-3">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image src={listing.images[0]} alt="" fill sizes="64px" className="object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-medium">{listing.title}</p>
                  <p className="text-xs text-muted-foreground">Sold by {listing.seller.name}</p>
                </div>
              </div>
              <Separator />
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Item</dt><dd>{formatMoney(itemPrice)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>{formatMoney(SHIPPING)}</dd></div>
                <Separator />
                <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd>{formatMoney(total)}</dd></div>
              </dl>
              <Button type="submit" size="lg" className="w-full" disabled={checkout.isPending}>
                {checkout.isPending ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
                Pay {formatMoney(total)}
              </Button>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4 shrink-0 text-success" />
                Funds are held in escrow and released after you confirm delivery.
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      {children}
    </div>
  );
}
