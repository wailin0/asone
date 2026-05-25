"use client";

import { X } from "lucide-react";
import { api } from "@/lib/api";
import { CONDITION_LABEL, type Condition, type ListingType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export type SearchState = {
  categoryId?: string;
  type?: ListingType;
  condition: Condition[];
  minPrice?: number;
  maxPrice?: number;
  location?: string;
};

const CONDITIONS = Object.keys(CONDITION_LABEL) as Condition[];

export function FiltersPanel({
  state,
  onChange,
  onClear,
}: {
  state: SearchState;
  onChange: (patch: Partial<SearchState>) => void;
  onClear: () => void;
}) {
  const categories = api.categories.all();
  const top = api.categories.top();

  const toggleCondition = (c: Condition) => {
    const set = new Set(state.condition);
    if (set.has(c)) set.delete(c);
    else set.add(c);
    onChange({ condition: [...set] });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Filters</h2>
        <Button variant="ghost" size="sm" onClick={onClear} className="h-7 text-muted-foreground">
          <X className="size-3.5" /> Clear
        </Button>
      </div>

      <div>
        <Label className="mb-2 block text-xs uppercase text-muted-foreground">Category</Label>
        <div className="max-h-56 space-y-0.5 overflow-y-auto pr-1 text-sm">
          <button
            onClick={() => onChange({ categoryId: undefined })}
            className={`block w-full rounded px-2 py-1 text-left hover:bg-secondary ${!state.categoryId ? "font-semibold text-primary" : ""}`}
          >
            All categories
          </button>
          {top.map((parent) => (
            <div key={parent.id}>
              <button
                onClick={() => onChange({ categoryId: parent.id })}
                className={`block w-full rounded px-2 py-1 text-left hover:bg-secondary ${state.categoryId === parent.id ? "font-semibold text-primary" : ""}`}
              >
                {parent.name}
              </button>
              {categories
                .filter((c) => c.parentId === parent.id)
                .map((child) => (
                  <button
                    key={child.id}
                    onClick={() => onChange({ categoryId: child.id })}
                    className={`block w-full rounded px-2 py-1 pl-5 text-left text-muted-foreground hover:bg-secondary ${state.categoryId === child.id ? "font-semibold text-primary" : ""}`}
                  >
                    {child.name}
                  </button>
                ))}
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <Label className="mb-2 block text-xs uppercase text-muted-foreground">Listing type</Label>
        <div className="flex gap-2">
          {([
            { v: undefined, label: "All" },
            { v: "auction" as const, label: "Auctions" },
            { v: "fixed" as const, label: "Buy Now" },
          ]).map((opt) => (
            <Button
              key={opt.label}
              size="sm"
              variant={state.type === opt.v ? "default" : "outline"}
              onClick={() => onChange({ type: opt.v })}
              className="flex-1"
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <Label className="mb-2 block text-xs uppercase text-muted-foreground">Price range</Label>
        <form
          key={`${state.minPrice ?? ""}-${state.maxPrice ?? ""}`}
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const minV = String(data.get("min") ?? "");
            const maxV = String(data.get("max") ?? "");
            onChange({
              minPrice: minV ? Number(minV) : undefined,
              maxPrice: maxV ? Number(maxV) : undefined,
            });
          }}
        >
          <Input name="min" type="number" inputMode="numeric" placeholder="Min" defaultValue={state.minPrice ?? ""} className="h-9" />
          <span className="text-muted-foreground">–</span>
          <Input name="max" type="number" inputMode="numeric" placeholder="Max" defaultValue={state.maxPrice ?? ""} className="h-9" />
          <Button type="submit" size="sm" variant="secondary">Go</Button>
        </form>
      </div>

      <Separator />

      <div>
        <Label className="mb-2 block text-xs uppercase text-muted-foreground">Condition</Label>
        <div className="space-y-2">
          {CONDITIONS.map((c) => (
            <label key={c} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={state.condition.includes(c)} onCheckedChange={() => toggleCondition(c)} />
              {CONDITION_LABEL[c]}
            </label>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <Label htmlFor="loc" className="mb-2 block text-xs uppercase text-muted-foreground">Location</Label>
        <form
          key={state.location ?? ""}
          onSubmit={(e) => {
            e.preventDefault();
            const loc = String(new FormData(e.currentTarget).get("location") ?? "").trim();
            onChange({ location: loc || undefined });
          }}
        >
          <Input id="loc" name="location" placeholder="e.g. Brooklyn" defaultValue={state.location ?? ""} className="h-9" />
        </form>
      </div>
    </div>
  );
}
