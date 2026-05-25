"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, MoreHorizontal, Search } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { UserRole, UserStatus } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/features/auth/session";
import { formatDate, initials } from "@/lib/utils";

const STATUS_VARIANT: Record<UserStatus, "success" | "accent" | "danger"> = {
  active: "success",
  suspended: "accent",
  banned: "danger",
};

export default function AdminUsersPage() {
  const { user: me } = useSession();
  const qc = useQueryClient();
  const [q, setQ] = React.useState("");
  const { data, isLoading } = useQuery({ queryKey: ["admin-users", q], queryFn: () => api.admin.listUsers(q) });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-users"] });
  const setStatus = useMutation({
    mutationFn: (v: { id: string; status: UserStatus }) => api.admin.setUserStatus(me!.id, v.id, v.status),
    onSuccess: (_, v) => { invalidate(); toast.success(`User ${v.status}`); },
  });
  const setRole = useMutation({
    mutationFn: (v: { id: string; role: UserRole }) => api.admin.setUserRole(me!.id, v.id, v.role),
    onSuccess: () => { invalidate(); toast.success("Role updated"); },
  });
  const setVerified = useMutation({
    mutationFn: (v: { id: string; verified: boolean }) => api.admin.setUserVerified(me!.id, v.id, v.verified),
    onSuccess: () => { invalidate(); toast.success("Verification updated"); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="relative w-64 max-w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users…" className="pl-9" />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><Skeleton className="h-8 w-full" /></td></tr>
                ))
              ) : (
                data!.map((u) => (
                  <tr key={u.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <Link href={`/u/${u.id}`} className="flex items-center gap-2">
                        <Avatar className="size-8"><AvatarImage src={u.avatar} /><AvatarFallback>{initials(u.name)}</AvatarFallback></Avatar>
                        <div>
                          <p className="flex items-center gap-1 font-medium">
                            {u.name}
                            {u.verified && <BadgeCheck className="size-3.5 text-primary" />}
                          </p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 capitalize">{u.role}</td>
                    <td className="px-4 py-3"><Badge variant={STATUS_VARIANT[u.status]} className="capitalize">{u.status}</Badge></td>
                    <td className="px-4 py-3 tabular-nums">{u.ratingAvg.toFixed(1)} ★</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Manage</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {u.status !== "active" && (
                            <DropdownMenuItem onClick={() => setStatus.mutate({ id: u.id, status: "active" })}>Reinstate</DropdownMenuItem>
                          )}
                          {u.status === "active" && (
                            <DropdownMenuItem onClick={() => setStatus.mutate({ id: u.id, status: "suspended" })}>Suspend</DropdownMenuItem>
                          )}
                          {u.status !== "banned" && (
                            <DropdownMenuItem className="text-danger" onClick={() => setStatus.mutate({ id: u.id, status: "banned" })}>Ban</DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setVerified.mutate({ id: u.id, verified: !u.verified })}>
                            {u.verified ? "Remove verification" : "Verify user"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setRole.mutate({ id: u.id, role: u.role === "admin" ? "user" : "admin" })}>
                            {u.role === "admin" ? "Demote to user" : "Make admin"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setRole.mutate({ id: u.id, role: "moderator" })}>Make moderator</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
