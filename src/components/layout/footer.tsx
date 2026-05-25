import Link from "next/link";
import { Tag } from "lucide-react";

const columns = [
  {
    title: "Buy",
    links: [
      { label: "Browse all", href: "/search" },
      { label: "Auctions", href: "/search?type=auction" },
      { label: "Buy It Now", href: "/search?type=fixed" },
      { label: "Ending soon", href: "/search?sort=ending_soon" },
    ],
  },
  {
    title: "Sell",
    links: [
      { label: "Start selling", href: "/sell" },
      { label: "Seller dashboard", href: "/dashboard/selling" },
      { label: "Fees", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Trust & Safety", href: "#" },
      { label: "Help center", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Tag className="size-4" />
            </span>
            aSone
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            aSone — အစုံ, &ldquo;everything.&rdquo; Buy and sell anything second-hand: instant Buy It
            Now or bid to win in live auctions.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="mb-3 text-sm font-semibold">{col.title}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-foreground">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} aSone — demo build with mock data. No real transactions.
      </div>
    </footer>
  );
}
