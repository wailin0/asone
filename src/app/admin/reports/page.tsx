"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Report, ReportStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/features/auth/session";
import { formatRelative } from "@/lib/utils";

const VARIANT: Record<ReportStatus, "accent" | "default" | "success" | "muted"> = {
  open: "accent",
  reviewing: "default",
  resolved: "success",
  dismissed: "muted",
};

export default function AdminReportsPage() {
  const { user: me } = useSession();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-reports"], queryFn: () => api.admin.listReports() });

  const resolve = useMutation({
    mutationFn: (v: { id: string; status: Report["status"] }) => api.admin.resolveReport(me!.id, v.id, v.status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-reports"] }); toast.success("Report updated"); },
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports queue</h1>
      {data!.length === 0 && <p className="text-sm text-muted-foreground">No reports.</p>}
      <div className="space-y-3">
        {data!.map((r) => {
          const targetName = r.target
            ? "title" in r.target ? r.target.title : r.target.name
            : r.targetId;
          const href = r.targetType === "listing" ? `/listings/${r.targetId}` : `/u/${r.targetId}`;
          return (
            <Card key={r.id}>
              <CardContent className="flex flex-wrap items-start gap-4 pt-6">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{r.targetType}</Badge>
                    <Badge variant={VARIANT[r.status]} className="capitalize">{r.status}</Badge>
                    <span className="text-xs text-muted-foreground">{formatRelative(r.createdAt)}</span>
                  </div>
                  <Link href={href} className="mt-1 block font-medium hover:underline">{targetName}</Link>
                  <p className="mt-1 text-sm text-muted-foreground">“{r.reason}”</p>
                </div>
                {(r.status === "open" || r.status === "reviewing") && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => resolve.mutate({ id: r.id, status: "dismissed" })}>
                      <X className="size-4" /> Dismiss
                    </Button>
                    <Button size="sm" onClick={() => resolve.mutate({ id: r.id, status: "resolved" })}>
                      <Check className="size-4" /> Resolve
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
