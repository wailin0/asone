"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSession } from "@/features/auth/session";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelative } from "@/lib/utils";

export function NotificationsMenu() {
  const { user } = useSession();
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => api.notifications.list(user!.id),
    enabled: !!user,
    refetchInterval: 5000,
  });
  const markRead = useMutation({
    mutationFn: () => api.notifications.markAllRead(user!.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  if (!user) return null;
  const unread = items.filter((n) => !n.readAt).length;

  return (
    <DropdownMenu onOpenChange={(open) => open && unread > 0 && markRead.mutate()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-danger-foreground">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
        )}
        <div className="max-h-80 overflow-y-auto">
          {items.map((n) => (
            <Link
              key={n.id}
              href={n.href}
              className="block rounded-md px-2 py-2 text-sm hover:bg-secondary"
            >
              <div className="flex items-start gap-2">
                {!n.readAt && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                <div className={n.readAt ? "opacity-60" : ""}>
                  <p className="font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.body}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{formatRelative(n.createdAt)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
