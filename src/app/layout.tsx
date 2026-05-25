import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { DevToolbar } from "@/components/layout/dev-toolbar";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "aSone — Buy & sell anything second-hand",
    template: "%s · aSone",
  },
  description:
    "aSone (အစုံ, \"everything\") — a modern second-hand marketplace. Buy instantly or win in live auctions. Demo build with mock data.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} h-full`}>
      <body className="min-h-full">
        <Providers>
          {children}
          <DevToolbar />
        </Providers>
      </body>
    </html>
  );
}
