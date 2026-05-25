import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { AuthGate } from "@/features/auth/auth-gate";
import { AdminNav } from "@/features/admin/admin-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Admin" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate roles={["admin", "moderator"]}>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-card px-4">
          <Link href="/admin" className="flex items-center gap-2 font-bold">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="size-4" />
            </span>
            aSone Admin
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link href="/"><ArrowLeft className="size-4" /> Back to site</Link>
            </Button>
            <ThemeToggle />
          </div>
        </header>
        <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-6 lg:grid-cols-[200px_1fr]">
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-xl border border-border bg-card lg:p-0">
              <AdminNav />
            </div>
          </aside>
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </AuthGate>
  );
}
