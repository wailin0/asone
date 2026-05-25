"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/features/auth/session";

export function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, register, loginAs } = useSession();
  const [mode, setMode] = React.useState<"login" | "signup">(params.get("signup") ? "signup" : "login");
  const [pending, setPending] = React.useState(false);
  const [email, setEmail] = React.useState("demo@asone.app");
  const [password, setPassword] = React.useState("password");
  const [name, setName] = React.useState("");

  const redirect = params.get("redirect") || "/dashboard";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      if (mode === "signup") {
        await register({ name, email });
        toast.success(`Welcome to aSone, ${name.split(" ")[0]}!`);
      } else {
        const u = await login(email, password);
        toast.success(`Welcome back, ${u.name.split(" ")[0]}!`);
      }
      router.push(redirect);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-6 text-center">
        <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Tag className="size-6" />
        </span>
        <h1 className="text-2xl font-bold">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "login" ? "Log in to bid, buy, and sell." : "Join aSone in seconds."}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {mode === "login" ? "Log in" : "Create account"}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <Separator className="flex-1" /> demo accounts <Separator className="flex-1" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => { await loginAs("u-demo"); router.push("/dashboard"); }}
            >
              Demo buyer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => { await loginAs("u-admin"); router.push("/admin"); }}
            >
              Admin
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        {mode === "login" ? "New to aSone?" : "Already have an account?"}{" "}
        <button
          className="font-medium text-primary hover:underline"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login" ? "Create an account" : "Log in"}
        </button>
      </p>
    </div>
  );
}
