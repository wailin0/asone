"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Check, ImagePlus, Loader2, Sparkles, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  CONDITION_LABEL, createListingSchema, type Condition, type CreateListingInput, type ListingType,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, formatMoney } from "@/lib/utils";
import { useSession } from "@/features/auth/session";

type Draft = {
  images: string[];
  title: string;
  categoryId: string;
  condition: Condition;
  description: string;
  location: string;
  type: ListingType;
  price: string;
  startPrice: string;
  buyNowPrice: string;
  reservePrice: string;
  durationDays: number;
};

const STEPS = ["Photos", "Details", "Pricing", "Review"] as const;

export function SellWizard() {
  const { user } = useSession();
  const router = useRouter();
  const categories = api.categories.all();
  const [step, setStep] = React.useState(0);
  const [draft, setDraft] = React.useState<Draft>({
    images: [],
    title: "",
    categoryId: "",
    condition: "good",
    description: "",
    location: user?.location || "",
    type: "fixed",
    price: "",
    startPrice: "",
    buyNowPrice: "",
    reservePrice: "",
    durationDays: 7,
  });

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const publish = useMutation({
    mutationFn: (input: CreateListingInput) => api.listings.create(input, user!.id),
    onSuccess: (listing) => {
      toast.success("Listing published!");
      router.push(`/listings/${listing.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Log in to start selling</h1>
        <p className="mt-1 text-sm text-muted-foreground">You need an account to list an item.</p>
        <Button asChild className="mt-4"><Link href="/login?redirect=/sell">Log in</Link></Button>
      </div>
    );
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).slice(0, 6).forEach((file) => {
      const reader = new FileReader();
      // Functional update so concurrent reads each append to the latest images.
      reader.onload = () =>
        setDraft((d) => ({ ...d, images: [...d.images, reader.result as string].slice(0, 6) }));
      reader.readAsDataURL(file);
    });
  }

  function addSample() {
    const seed = Math.random().toString(36).slice(2, 8);
    set({ images: [...draft.images, `https://picsum.photos/seed/${seed}/800/800`] });
  }

  function canAdvance() {
    if (step === 0) return draft.images.length > 0;
    if (step === 1) return draft.title.length >= 4 && draft.categoryId && draft.description.length >= 10 && draft.location.length >= 2;
    if (step === 2) return draft.type === "fixed" ? !!draft.price : !!draft.startPrice;
    return true;
  }

  function doPublish() {
    const input = {
      title: draft.title,
      description: draft.description,
      categoryId: draft.categoryId,
      condition: draft.condition,
      type: draft.type,
      images: draft.images,
      location: draft.location,
      price: draft.type === "fixed" ? Number(draft.price) : null,
      startPrice: draft.type === "auction" ? Number(draft.startPrice) : null,
      buyNowPrice: draft.buyNowPrice ? Number(draft.buyNowPrice) : null,
      reservePrice: draft.reservePrice ? Number(draft.reservePrice) : null,
      durationDays: draft.type === "auction" ? draft.durationDays : null,
    };
    const parsed = createListingSchema.safeParse(input);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please complete all fields");
      return;
    }
    publish.mutate(parsed.data);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">Sell an item</h1>
      <p className="text-sm text-muted-foreground">List it in a few quick steps.</p>

      {/* Stepper */}
      <ol className="mt-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                i < step ? "bg-success text-success-foreground" :
                i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {i < step ? <Check className="size-4" /> : i + 1}
            </button>
            <span className={cn("hidden text-sm sm:inline", i === step ? "font-medium" : "text-muted-foreground")}>
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardContent className="space-y-5 pt-6">
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-base">Add photos</Label>
                  <p className="text-sm text-muted-foreground">Up to 6 photos. The first is your cover image.</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {draft.images.map((src, i) => (
                    <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                      <Image src={src} alt="" fill sizes="120px" className="object-cover" />
                      {i === 0 && <Badge className="absolute left-1 top-1 text-[10px]">Cover</Badge>}
                      <button
                        onClick={() => set({ images: draft.images.filter((_, j) => j !== i) })}
                        className="absolute right-1 top-1 rounded-full bg-background/80 p-1 opacity-0 transition group-hover:opacity-100"
                        aria-label="Remove photo"
                      >
                        <Trash2 className="size-3.5 text-danger" />
                      </button>
                    </div>
                  ))}
                  {draft.images.length < 6 && (
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground transition hover:border-primary hover:text-primary">
                      <ImagePlus className="size-6" />
                      <span className="text-xs">Upload</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
                    </label>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={addSample} type="button">
                  <Sparkles className="size-4" /> Add a sample photo
                </Button>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={draft.title} maxLength={120} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Apple iPhone 13 Pro 256GB — Unlocked" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select value={draft.categoryId} onValueChange={(v) => set({ categoryId: v })}>
                      <SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.parentId ? `  ${c.name}` : c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Condition</Label>
                    <Select value={draft.condition} onValueChange={(v) => set({ condition: v as Condition })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(CONDITION_LABEL) as Condition[]).map((c) => (
                          <SelectItem key={c} value={c}>{CONDITION_LABEL[c]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="desc">Description</Label>
                  <Textarea id="desc" rows={6} value={draft.description} onChange={(e) => set({ description: e.target.value })} placeholder="Describe the item, its condition, and anything buyers should know." />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="loc">Location</Label>
                  <Input id="loc" value={draft.location} onChange={(e) => set({ location: e.target.value })} placeholder="City, State" />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-base">How do you want to sell?</Label>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    {([
                      { v: "fixed" as const, t: "Fixed price", d: "Sell instantly at a set price." },
                      { v: "auction" as const, t: "Auction", d: "Let buyers bid; highest wins." },
                    ]).map((opt) => (
                      <button
                        key={opt.v}
                        onClick={() => set({ type: opt.v })}
                        className={cn(
                          "rounded-lg border-2 p-3 text-left transition",
                          draft.type === opt.v ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                        )}
                      >
                        <p className="font-medium">{opt.t}</p>
                        <p className="text-xs text-muted-foreground">{opt.d}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {draft.type === "fixed" ? (
                  <PriceInput label="Price" value={draft.price} onChange={(v) => set({ price: v })} />
                ) : (
                  <div className="space-y-4">
                    <PriceInput label="Starting price" value={draft.startPrice} onChange={(v) => set({ startPrice: v })} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <PriceInput label="Buy It Now (optional)" value={draft.buyNowPrice} onChange={(v) => set({ buyNowPrice: v })} />
                      <PriceInput label="Reserve price (optional)" value={draft.reservePrice} onChange={(v) => set({ reservePrice: v })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Duration</Label>
                      <Select value={String(draft.durationDays)} onValueChange={(v) => set({ durationDays: Number(v) })}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1, 3, 5, 7, 10, 14].map((d) => (
                            <SelectItem key={d} value={String(d)}>{d} days</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Review & publish</h2>
                <dl className="divide-y divide-border text-sm">
                  <Row label="Title" value={draft.title} />
                  <Row label="Category" value={categories.find((c) => c.id === draft.categoryId)?.name ?? "—"} />
                  <Row label="Condition" value={CONDITION_LABEL[draft.condition]} />
                  <Row label="Type" value={draft.type === "fixed" ? "Fixed price" : `Auction · ${draft.durationDays} days`} />
                  <Row
                    label="Price"
                    value={draft.type === "fixed"
                      ? formatMoney(Number(draft.price) || 0)
                      : `Starts at ${formatMoney(Number(draft.startPrice) || 0)}`}
                  />
                  <Row label="Photos" value={`${draft.images.length} added`} />
                </dl>
                <p className="rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
                  A 10% platform fee applies when your item sells. By publishing you agree to aSone&apos;s seller terms.
                </p>
              </div>
            )}

            <div className="flex justify-between border-t border-border pt-4">
              <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
                Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={() => canAdvance() ? setStep((s) => s + 1) : toast.error("Please complete this step")} disabled={!canAdvance()}>
                  Continue
                </Button>
              ) : (
                <Button onClick={doPublish} disabled={publish.isPending}>
                  {publish.isPending ? <Loader2 className="size-4 animate-spin" /> : <Tag className="size-4" />}
                  Publish listing
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live preview */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Live preview</p>
          <PreviewCard draft={draft} />
        </aside>
      </div>
    </div>
  );
}

function PriceInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
        <Input type="number" min="0" step="0.01" value={value} onChange={(e) => onChange(e.target.value)} className="pl-7" placeholder="0.00" />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function PreviewCard({ draft }: { draft: Draft }) {
  const price = draft.type === "fixed" ? Number(draft.price) || 0 : Number(draft.startPrice) || 0;
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-square bg-muted">
        {draft.images[0] ? (
          <Image src={draft.images[0]} alt="" fill sizes="340px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Your cover photo
          </div>
        )}
        <Badge variant={draft.type === "auction" ? "accent" : "secondary"} className="absolute left-2 top-2">
          {draft.type === "auction" ? "Auction" : "Buy Now"}
        </Badge>
      </div>
      <div className="space-y-1 p-3">
        <Badge variant="outline" className="text-[10px]">{CONDITION_LABEL[draft.condition]}</Badge>
        <p className="line-clamp-2 text-sm font-medium">{draft.title || "Your item title"}</p>
        <p className="text-lg font-bold">{formatMoney(price)}</p>
      </div>
    </div>
  );
}
