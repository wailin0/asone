"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { FlaskConical, RotateCcw, UserCog } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { DEMO_ADMIN_ID, DEMO_USER_ID } from "@/lib/mock-data/seed";
import { useSession } from "@/features/auth/session";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Phase-0 only: jump between seeded demo accounts and reset the in-memory DB.
 * Lets you preview buyer vs. admin views without a real backend. Remove once
 * the mock layer is swapped for the live API.
 */
export function DevToolbar() {
  const { user, loginAs, logout } = useSession();
  const qc = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="secondary" className="shadow-lg border border-border">
            <FlaskConical className="size-4" />
            <span className="hidden sm:inline">Demo</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-60">
          <DropdownMenuLabel className="flex items-center gap-2">
            <UserCog className="size-4" /> Switch demo account
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={async () => {
              await loginAs(DEMO_USER_ID);
              toast.success("Now browsing as Demo Buyer");
            }}
          >
            Demo Buyer {user?.id === DEMO_USER_ID && "✓"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => {
              await loginAs(DEMO_ADMIN_ID);
              toast.success("Now browsing as Admin");
              router.push("/admin");
            }}
          >
            Admin Riley {user?.id === DEMO_ADMIN_ID && "✓"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={async () => { await logout(); toast.success("Logged out"); }}>
            Logged out (guest)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              api.dev.reset();
              qc.invalidateQueries();
              toast.success("Demo data reset");
              router.refresh();
            }}
          >
            <RotateCcw /> Reset demo data
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
