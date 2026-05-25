"use client";

import { useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative } from "@/lib/utils";

export default function AdminAuditPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-audit"], queryFn: () => api.admin.auditLog() });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Audit log</h1>
        <p className="text-sm text-muted-foreground">Read-only record of every admin action.</p>
      </div>
      <Card>
        <CardContent className="divide-y divide-border p-0">
          {data!.length === 0 && <p className="p-6 text-sm text-muted-foreground">No actions recorded yet.</p>}
          {data!.map((a) => (
            <div key={a.id} className="flex items-start gap-3 p-4">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                <ScrollText className="size-4 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-medium">{a.admin.name}</span>{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">{a.action}</code>{" "}
                  on {a.targetType} <span className="text-muted-foreground">{a.targetId}</span>
                </p>
                {a.meta && <p className="text-xs text-muted-foreground">{a.meta}</p>}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(a.createdAt)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
