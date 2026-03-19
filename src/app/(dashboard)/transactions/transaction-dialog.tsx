"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import {
  createTransaction,
  updateTransaction,
  type TxActionState,
} from "./actions";
import { SubmitButton } from "@/components/submit-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Account, Category } from "@/types/database";

const initial: TxActionState = {};

type TxRow = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category_id: string | null;
  account_id: string | null;
  status: string;
};

const selectClass =
  "flex min-h-[44px] w-full items-center rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function TransactionDialog({
  categories,
  accounts,
  editRow,
  open,
  onOpenChange,
}: {
  categories: Category[];
  accounts: Account[];
  editRow: TxRow | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const router = useRouter();
  const [type, setType] = useState<"income" | "expense">(
    editRow?.type ?? "expense",
  );

  const [createState, createAction] = useFormState(createTransaction, initial);
  const [updateState, updateAction] = useFormState(updateTransaction, initial);

  const state = editRow ? updateState : createState;
  const formAction = editRow ? updateAction : createAction;
  const formKey = `${editRow?.id ?? "new"}-${open}`;

  useEffect(() => {
    if (state.ok) {
      onOpenChange(false);
      router.refresh();
    }
  }, [state.ok, onOpenChange, router]);

  useEffect(() => {
    if (open && editRow) setType(editRow.type);
    if (open && !editRow) setType("expense");
  }, [open, editRow]);

  const filteredCats = categories.filter((c) => c.type === type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-md pb-[env(safe-area-inset-bottom)]"
      >
        <DialogHeader>
          <DialogTitle>
            {editRow ? "Editar transação" : "Nova transação"}
          </DialogTitle>
        </DialogHeader>
        <form key={formKey} action={formAction} className="space-y-4">
          {editRow ? <input type="hidden" name="id" value={editRow.id} /> : null}
          <div className="space-y-2">
            <Label htmlFor="tx-date">Data</Label>
            <Input
              id="tx-date"
              name="date"
              type="date"
              className="min-h-[44px]"
              required
              defaultValue={
                editRow?.date?.slice(0, 10) ??
                new Date().toISOString().slice(0, 10)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tx-desc">Descrição</Label>
            <Input
              id="tx-desc"
              name="description"
              required
              className="min-h-[44px]"
              defaultValue={editRow?.description ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tx-amount">Valor (R$)</Label>
            <Input
              id="tx-amount"
              name="amount"
              type="number"
              className="min-h-[44px]"
              step="0.01"
              min="0.01"
              required
              defaultValue={editRow?.amount ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <input type="hidden" name="type" value={type} />
            <Select
              value={type}
              onValueChange={(v) => setType(v as "income" | "expense")}
            >
              <SelectTrigger
                aria-label="Tipo"
                className="min-h-[44px] text-base"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Despesa</SelectItem>
                <SelectItem value="income">Receita</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tx-cat">Categoria</Label>
            <select
              id="tx-cat"
              name="category_id"
              className={cn(selectClass)}
              key={`${type}-${open}`}
              defaultValue={editRow?.category_id ?? ""}
            >
              <option value="">—</option>
              {filteredCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tx-acc">Conta</Label>
            <select
              id="tx-acc"
              name="account_id"
              className={cn(selectClass)}
              defaultValue={editRow?.account_id ?? ""}
            >
              <option value="">—</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tx-status">Status</Label>
            <select
              id="tx-status"
              name="status"
              className={cn(selectClass)}
              defaultValue={editRow?.status ?? "pending"}
            >
              <option value="pending">Pendente</option>
              <option value="confirmed">Confirmada</option>
            </select>
          </div>
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          <SubmitButton className="w-full" pendingLabel="Salvando…">
            {editRow ? "Atualizar" : "Criar"}
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
