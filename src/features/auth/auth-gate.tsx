"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/features/auth/session";
import type { UserRole } from "@/lib/types";

/** Client-side route guard. Phase-0 stand-in for the real role-gated middleware. */
export function AuthGate({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: UserRole[];
}) {
  const { user, isLoading } = useSession();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <Gate
        title="Please log in"
        body="You need to be logged in to view this page."
        href={`/login?redirect=${encodeURIComponent(pathname)}`}
        cta="Log in"
      />
    );
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <Gate
        title="Access denied"
        body="You don't have permission to view this area."
        href="/"
        cta="Go home"
      />
    );
  }

  return <>{children}</>;
}

function Gate({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-secondary">
        <Lock className="size-6 text-muted-foreground" />
      </span>
      <h1 className="mt-4 text-xl font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      <Button asChild className="mt-4"><Link href={href}>{cta}</Link></Button>
    </div>
  );
}
