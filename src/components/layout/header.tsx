"use client";

import Link from "next/link";
import { Menu, Tag } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchBar } from "./search-bar";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { NotificationsMenu } from "./notifications-menu";

export function Header() {
  const top = api.categories.top();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-1.5 font-bold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Tag className="size-4" />
          </span>
          <span className="hidden text-lg tracking-tight sm:inline">aSone</span>
        </Link>

        {/* Categories dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="hidden shrink-0 md:inline-flex">
              <Menu className="size-4" /> Categories
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/search">All listings</Link>
            </DropdownMenuItem>
            {top.map((c) => (
              <DropdownMenuItem key={c.id} asChild>
                <Link href={`/search?categoryId=${c.id}`}>{c.name}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <SearchBar className="mx-1 max-w-xl" />

        <div className="flex shrink-0 items-center gap-1">
          <NotificationsMenu />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
