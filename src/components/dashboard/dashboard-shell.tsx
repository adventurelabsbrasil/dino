"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, List, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/(dashboard)/actions";

const nav = [
  { href: "/", label: "Início", icon: LayoutDashboard },
  { href: "/transactions", label: "Transações", icon: List },
];

export function DashboardShell({
  children,
  familyName,
}: {
  children: React.ReactNode;
  familyName: string;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-border bg-sidebar md:w-56 md:border-b-0 md:border-r md:min-h-screen">
        <div className="flex items-center gap-2 p-4 font-semibold">
          <span className="text-2xl" aria-hidden>
            🦕
          </span>
          <span className="truncate">{familyName}</span>
        </div>
        <nav className="flex gap-1 px-2 pb-2 md:flex-col md:px-2">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                pathname === href
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-sidebar-border p-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Alternar tema"
          >
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="hidden h-4 w-4 dark:inline" />
          </Button>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              <LogOut className="mr-1 h-3 w-3" />
              Sair
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-4 md:p-8">{children}</main>
    </div>
  );
}
