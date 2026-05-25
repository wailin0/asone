import { AuthGate } from "@/features/auth/auth-gate";
import { DashboardNav } from "@/features/dashboard/dashboard-nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold">My account</h1>
        <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <DashboardNav />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </AuthGate>
  );
}
