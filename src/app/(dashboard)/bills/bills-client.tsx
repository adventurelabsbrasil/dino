"use client";

import { useMemo, useState } from "react";
import { format, isToday, parseISO, startOfDay, startOfWeek } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Account, Bill, Category } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { NewBillDialog, PayBillDialog } from "./bill-dialog";
import { Plus } from "lucide-react";

function money(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function statusBadgeForBill(bill: Bill) {
  const due = startOfDay(parseISO(bill.due_date));
  const today = startOfDay(new Date());

  const isDueToday = isToday(due);
  const isOverdueByDate = due.getTime() < today.getTime();

  if (bill.status === "paid") {
    return {
      label: "Pago",
      className:
        "border border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300",
    };
  }

  if (bill.status === "overdue" || isOverdueByDate) {
    return {
      label: "Vencido",
      className:
        "border border-destructive/30 bg-destructive/10 text-destructive dark:text-red-300",
    };
  }

  if (isDueToday) {
    return {
      label: "Vencendo hoje",
      className:
        "border border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300",
    };
  }

  return {
    label: "Aberto",
    className:
      "border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  };
}

function weekLabel(start: Date) {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${format(start, "dd/MM")}–${format(end, "dd/MM")}`;
}

export function BillsClient({
  bills,
  categories,
  accounts,
}: {
  bills: Bill[];
  categories: Category[];
  accounts: Account[];
}) {
  const [billType, setBillType] = useState<"payable" | "receivable">("payable");
  const [newOpen, setNewOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const catMap = useMemo(() => {
    return Object.fromEntries(
      categories.map((c) => [c.id, c]),
    ) as Record<string, Category>;
  }, [categories]);

  const accMap = useMemo(() => {
    return Object.fromEntries(
      accounts.map((a) => [a.id, a.name]),
    ) as Record<string, string>;
  }, [accounts]);

  const visibleBills = useMemo(() => {
    return bills
      .filter((b) => b.type === billType)
      .slice()
      .sort((a, b) => {
        const da = parseISO(a.due_date).getTime();
        const db = parseISO(b.due_date).getTime();
        return da - db;
      });
  }, [bills, billType]);

  const groupedByWeek = useMemo(() => {
    const groups: Record<
      string,
      { weekStart: Date; bills: Bill[] }
    > = {};

    for (const b of visibleBills) {
      const due = parseISO(b.due_date);
      const ws = startOfWeek(due, { weekStartsOn: 1 });
      const key = format(ws, "yyyy-MM-dd");
      if (!groups[key]) groups[key] = { weekStart: ws, bills: [] };
      groups[key].bills.push(b);
    }

    return Object.values(groups).sort(
      (a, c) => a.weekStart.getTime() - c.weekStart.getTime(),
    );
  }, [visibleBills]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contas</h1>
          <p className="text-muted-foreground">
            Acompanhe vencimentos e marque pagamentos.
          </p>
        </div>

        <Button
          onClick={() => setNewOpen(true)}
          className="min-h-[44px]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova conta
        </Button>
      </div>

      <Tabs
        value={billType}
        onValueChange={(v) =>
          setBillType(v as "payable" | "receivable")
        }
      >
        <TabsList className="grid h-12 w-full grid-cols-2 p-1">
          <TabsTrigger value="payable" className="min-h-[44px]">
            A Pagar
          </TabsTrigger>
          <TabsTrigger value="receivable" className="min-h-[44px]">
            A Receber
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payable" className="mt-4 space-y-4">
          {visibleBills.length === 0 ? (
            <p className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">
              Nenhuma conta para pagar.
            </p>
          ) : (
            groupedByWeek.map(({ weekStart, bills: weekBills }) => (
              <Card key={format(weekStart, "yyyy-MM-dd")} className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {weekLabel(weekStart)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {weekBills.map((b) => {
                    const badge = statusBadgeForBill(b);
                    const cat = b.category_id ? catMap[b.category_id] : null;
                    return (
                      <div
                        key={b.id}
                        className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{b.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Vence {format(parseISO(b.due_date), "dd/MM/yyyy")}
                            {cat ? ` · ${cat.name}` : ""}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {cat ? (
                              <Badge
                                variant="outline"
                                className="text-xs"
                                style={{ borderColor: cat.color }}
                              >
                                {cat.icon} {cat.name}
                              </Badge>
                            ) : null}
                            {b.account_id ? (
                              <Badge variant="secondary" className="text-xs">
                                {accMap[b.account_id] ?? "Conta"}
                              </Badge>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex items-start justify-between gap-3">
                          <div className="text-right">
                            <Badge variant="outline" className={cn("text-xs", badge.className)}>
                              {badge.label}
                            </Badge>
                            <p className="mt-2 text-sm font-semibold">
                              {money(Number(b.amount))}
                            </p>
                          </div>

                          {b.status !== "paid" ? (
                            <Button
                              variant="secondary"
                              className="min-h-[44px]"
                              onClick={() => {
                                setSelectedBill(b);
                                setPayOpen(true);
                              }}
                            >
                              Marcar como pago
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="receivable" className="mt-4 space-y-4">
          {visibleBills.length === 0 ? (
            <p className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">
              Nenhuma conta a receber.
            </p>
          ) : (
            groupedByWeek.map(({ weekStart, bills: weekBills }) => (
              <Card key={format(weekStart, "yyyy-MM-dd")} className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {weekLabel(weekStart)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {weekBills.map((b) => {
                    const badge = statusBadgeForBill(b);
                    const cat = b.category_id ? catMap[b.category_id] : null;
                    return (
                      <div
                        key={b.id}
                        className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{b.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Vence {format(parseISO(b.due_date), "dd/MM/yyyy")}
                            {cat ? ` · ${cat.name}` : ""}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {cat ? (
                              <Badge
                                variant="outline"
                                className="text-xs"
                                style={{ borderColor: cat.color }}
                              >
                                {cat.icon} {cat.name}
                              </Badge>
                            ) : null}
                            {b.account_id ? (
                              <Badge variant="secondary" className="text-xs">
                                {accMap[b.account_id] ?? "Conta"}
                              </Badge>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex items-start justify-between gap-3">
                          <div className="text-right">
                            <Badge variant="outline" className={cn("text-xs", badge.className)}>
                              {badge.label}
                            </Badge>
                            <p className="mt-2 text-sm font-semibold">
                              {money(Number(b.amount))}
                            </p>
                          </div>

                          {b.status !== "paid" ? (
                            <Button
                              variant="secondary"
                              className="min-h-[44px]"
                              onClick={() => {
                                setSelectedBill(b);
                                setPayOpen(true);
                              }}
                            >
                              Marcar como pago
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <NewBillDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        billType={billType}
        categories={categories}
        accounts={accounts}
      />

      <PayBillDialog
        open={payOpen}
        onOpenChange={(o) => {
          setPayOpen(o);
          if (!o) setSelectedBill(null);
        }}
        bill={selectedBill}
      />
    </div>
  );
}

