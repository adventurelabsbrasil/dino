"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, List, LogOut, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/(dashboard)/actions";

const nav = [
  { href: "/", label: "Início", icon: LayoutDashboard },
  { href: "/transactions", label: "Transações", icon: List },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {nav.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={cn(
            "flex min-h-[44px] items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
            pathname === href
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50",
          )}
        >
          <Icon className="h-5 w-5 shrink-0" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function DashboardShell({
  children,
  familyName,
}: {
  children: React.ReactNode;
  familyName: string;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2 font-semibold">
        <span className="text-2xl" aria-hidden>
          🦕
        </span>
        <span className="truncate">{familyName}</span>
      </div>
      <NavLinks pathname={pathname} />
      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-sidebar-border pt-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="min-h-[44px] min-w-[44px]"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Alternar tema"
        >
          <Sun className="h-5 w-5 dark:hidden" />
          <Moon className="hidden h-5 w-5 dark:inline" />
        </Button>
        <form action={signOut}>
          <Button type="submit" variant="outline" size="sm" className="min-h-[44px]">
            <LogOut className="mr-1 h-4 w-4" />
            Sair
          </Button>
        </form>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop: sidebar fixa */}
      <aside className="hidden border-r border-sidebar-border bg-sidebar md:flex md:min-h-screen md:w-56 md:flex-col">
        <div className="flex min-h-screen flex-col gap-2 p-4">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile: header + sheet (drawer) */}
      <div className="flex flex-1 flex-col md:contents">
        <header className="flex min-h-[52px] items-center gap-2 border-b border-border bg-sidebar px-3 md:hidden">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="min-h-[44px] min-w-[44px]"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-72 flex-col bg-sidebar p-0">
              <SheetHeader className="border-b border-sidebar-border p-4 text-left">
                <SheetTitle className="flex items-center gap-2 font-semibold">
                  <span className="text-xl" aria-hidden>🦕</span>
                  {familyName}
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-1 flex-col gap-2 overflow-auto p-4">
                <NavLinks pathname={pathname} onNavigate={() => setSheetOpen(false)} />
                <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-sidebar-border pt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="min-h-[44px] min-w-[44px]"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    aria-label="Alternar tema"
                  >
                    <Sun className="h-5 w-5 dark:hidden" />
                    <Moon className="hidden h-5 w-5 dark:inline" />
                  </Button>
                  <form action={signOut}>
                    <Button type="submit" variant="outline" size="sm" className="min-h-[44px]">
                      <LogOut className="mr-1 h-4 w-4" />
                      Sair
                    </Button>
                  </form>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <span className="truncate font-semibold">{familyName}</span>
        </header>
        <main className="flex-1 overflow-auto p-4 pb-[env(safe-area-inset-bottom)] md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
