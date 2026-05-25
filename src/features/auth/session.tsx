"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

type SessionContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginAs: (userId: string) => Promise<User>;
  register: (input: { name: string; email: string }) => Promise<User>;
  logout: () => Promise<void>;
};

const SessionContext = React.createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["me"], queryFn: () => api.auth.me() });

  const invalidateAll = () => qc.invalidateQueries();

  const login = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      api.auth.login(email, password),
    onSuccess: () => invalidateAll(),
  });
  const loginAs = useMutation({
    mutationFn: (userId: string) => api.auth.loginAs(userId),
    onSuccess: () => invalidateAll(),
  });
  const register = useMutation({
    mutationFn: (input: { name: string; email: string }) => api.auth.register(input),
    onSuccess: () => invalidateAll(),
  });
  const logout = useMutation({
    mutationFn: () => api.auth.logout(),
    onSuccess: () => invalidateAll(),
  });

  const value: SessionContextValue = {
    user: data ?? null,
    isLoading,
    login: (email, password) => login.mutateAsync({ email, password }),
    loginAs: (userId) => loginAs.mutateAsync(userId),
    register: (input) => register.mutateAsync(input),
    logout: () => logout.mutateAsync(),
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = React.useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
