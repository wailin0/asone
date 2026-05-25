"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function ListingGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = React.useState(0);

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      <div className="flex gap-2 sm:flex-col">
        {images.map((src, i) => (
          <button
            key={src}
            onClick={() => setActive(i)}
            className={cn(
              "relative size-16 shrink-0 overflow-hidden rounded-lg border-2 bg-muted transition",
              i === active ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
            )}
            aria-label={`View image ${i + 1}`}
          >
            <Image src={src} alt="" fill sizes="64px" className="object-cover" />
          </button>
        ))}
      </div>
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-muted">
        <Image
          src={images[active]}
          alt={title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}
