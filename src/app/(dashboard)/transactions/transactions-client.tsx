"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { TransactionDialog } from "./transaction-dialog";
import { deleteTransaction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import type { Account, Category } from "@/types/database";

export type TxRow = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category_id: string | null;
  account_id: string | null;
  status: string;
  source: string;
};

function money(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function TransactionsClient({
  transactions,
  categories,
  accounts,
  catMap,
  accMap,
  defaultFrom,
  defaultTo,
}: {
  transactions: TxRow[];
  categories: Category[];
  accounts: Account[];
  catMap: Record<string, string>;
  accMap: Record<string, string>;
  defaultFrom: string;
  defaultTo: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editRow, setEditRow] = useState<TxRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [, startTransition] = useTransition();

  const q = searchParams.get("q") ?? "";
  const from = searchParams.get("from") ?? defaultFrom;
  const to = searchParams.get("to") ?? defaultTo;
  const categoryId = searchParams.get("category_id") ?? "";
  const accountId = searchParams.get("account_id") ?? "";
  const type = searchParams.get("type") ?? "";

  function applyFilters(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const p = new URLSearchParams();
    const f = formData.get("from") as string;
    const t = formData.get("to") as string;
    const cq = (formData.get("q") as string)?.trim();
    const cc = formData.get("category_id") as string;
    const ca = formData.get("account_id") as string;
    const ct = formData.get("type") as string;
    if (f) p.set("from", f);
    if (t) p.set("to", t);
    if (cq) p.set("q", cq);
    if (cc) p.set("category_id", cc);
    if (ca) p.set("account_id", ca);
    if (ct) p.set("type", ct);
    router.push(`/transactions?${p.toString()}`);
  }

  async function onDelete(id: string) {
    if (!confirm("Excluir esta transação?")) return;
    startTransition(async () => {
      const r = await deleteTransaction(id);
      if (r.error) toast.error(r.error);
      else {
        toast.success("Transação excluída");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transações</h1>
          <p className="text-muted-foreground">
            Lançamentos manuais e futuras integrações
          </p>
        </div>
        <Button
          onClick={() => {
            setEditRow(null);
            setDialogOpen(true);
          }}
        >
          Nova transação
        </Button>
      </div>

      <form
        onSubmit={applyFilters}
        className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 md:flex-row md:flex-wrap md:items-end"
      >
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">De</label>
          <Input name="from" type="date" defaultValue={from} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Até</label>
          <Input name="to" type="date" defaultValue={to} />
        </div>
        <div className="min-w-[140px] space-y-1">
          <label className="text-xs text-muted-foreground">Categoria</label>
          <select
            name="category_id"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
            defaultValue={categoryId}
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px] space-y-1">
          <label className="text-xs text-muted-foreground">Conta</label>
          <select
            name="account_id"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
            defaultValue={accountId}
          >
            <option value="">Todas</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[120px] space-y-1">
          <label className="text-xs text-muted-foreground">Tipo</label>
          <select
            name="type"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
            defaultValue={type}
          >
            <option value="">Todos</option>
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </select>
        </div>
        <div className="min-w-[200px] flex-1 space-y-1">
          <label className="text-xs text-muted-foreground">Busca</label>
          <Input name="q" placeholder="Descrição…" defaultValue={q} />
        </div>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      {/* Mobile: lista em cards */}
      <div className="space-y-3 md:hidden">
        {transactions.length === 0 ? (
          <p className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">
            Nenhuma transação no período.
          </p>
        ) : (
          transactions.map((row) => (
            <div
              key={row.id}
              className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{row.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(row.date), "dd/MM/yyyy")}
                    {row.account_id ? ` · ${accMap[row.account_id] ?? "—"}` : ""}
                  </p>
                </div>
                <span
                  className={
                    row.type === "income"
                      ? "shrink-0 font-semibold text-green-600 dark:text-green-400"
                      : "shrink-0 font-semibold text-red-600 dark:text-red-400"
                  }
                >
                  {row.type === "expense" ? "-" : "+"}
                  {money(Number(row.amount))}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {row.category_id ? (
                  <Badge
                    variant="secondary"
                    className="text-xs"
                    style={{
                      borderColor: categories.find((c) => c.id === row.category_id)?.color,
                    }}
                  >
                    {catMap[row.category_id] ?? "—"}
                  </Badge>
                ) : null}
                <Badge variant="outline" className="text-xs">
                  {row.status}
                </Badge>
                <div className="ml-auto flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="min-h-[44px] min-w-[44px]"
                    aria-label="Editar"
                    onClick={() => {
                      setEditRow(row);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-5 w-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="min-h-[44px] min-w-[44px] text-destructive"
                    aria-label="Excluir"
                    onClick={() => onDelete(row.id)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop: tabela */}
      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  Nenhuma transação no período.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    {format(parseISO(row.date), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate font-medium">
                    {row.description}
                  </TableCell>
                  <TableCell>
                    {row.category_id ? (
                      <Badge
                        variant="secondary"
                        style={{
                          borderColor: categories.find(
                            (c) => c.id === row.category_id,
                          )?.color,
                        }}
                      >
                        {catMap[row.category_id] ?? "—"}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.account_id ? accMap[row.account_id] ?? "—" : "—"}
                  </TableCell>
                  <TableCell
                    className={
                      row.type === "income"
                        ? "text-right font-medium text-green-600 dark:text-green-400"
                        : "text-right font-medium text-red-600 dark:text-red-400"
                    }
                  >
                    {row.type === "expense" ? "-" : "+"}
                    {money(Number(row.amount))}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Editar"
                        onClick={() => {
                          setEditRow(row);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        aria-label="Excluir"
                        onClick={() => onDelete(row.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TransactionDialog
        categories={categories}
        accounts={accounts}
        editRow={editRow}
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditRow(null);
        }}
      />
    </div>
  );
}
