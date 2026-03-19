"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import type { Account, Bill, Category } from "@/types/database";
import { createBill, markBillPaid, type BillsActionState } from "./actions";
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

const initial: BillsActionState = {};

const baseSelectClass =
  "min-h-[44px] text-base";

const inputClass = "min-h-[44px] text-base";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function NewBillDialog({
  open,
  onOpenChange,
  billType,
  categories,
  accounts,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  billType: "payable" | "receivable";
  categories: Category[];
  accounts: Account[];
}) {
  const router = useRouter();
  const [recurrence, setRecurrence] = useState<
    "none" | "monthly" | "weekly" | "yearly"
  >("none");

  const allowedCats = useMemo(() => {
    const catType = billType === "payable" ? "expense" : "income";
    return categories.filter((c) => c.type === catType);
  }, [billType, categories]);

  const [state, action] = useFormState(createBill, initial);

  useEffect(() => {
    if (!open) return;
    setRecurrence("none");
  }, [open]);

  useEffect(() => {
    if (state.ok) {
      onOpenChange(false);
      router.refresh();
    }
  }, [state.ok, onOpenChange, router]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-md pb-[env(safe-area-inset-bottom)]"
      >
        <DialogHeader>
          <DialogTitle>{billType === "payable" ? "Nova conta a pagar" : "Nova conta a receber"}</DialogTitle>
        </DialogHeader>

        <form action={action} className="space-y-4">
          <input type="hidden" name="type" value={billType} />

          <div className="space-y-2">
            <Label htmlFor="bill-desc">Descrição</Label>
            <Input
              id="bill-desc"
              name="description"
              required
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bill-amount">Valor (R$)</Label>
            <Input
              id="bill-amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bill-due">Vencimento</Label>
            <Input
              id="bill-due"
              name="due_date"
              type="date"
              required
              defaultValue={todayISO()}
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <Label>Recorrência</Label>
            <Select
              value={recurrence}
              onValueChange={(v) =>
                setRecurrence(v as "none" | "monthly" | "weekly" | "yearly")
              }
            >
              <SelectTrigger className={cn(baseSelectClass, "w-full")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="recurrence" value={recurrence} />
          </div>

          {(recurrence === "monthly" || recurrence === "yearly") && (
            <div className="space-y-2">
              <Label htmlFor="bill-recurrence-day">
                Dia da recorrência (1-31)
              </Label>
              <Input
                id="bill-recurrence-day"
                name="recurrence_day"
                type="number"
                min={1}
                max={31}
                className={inputClass}
                defaultValue={new Date().getDate()}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="bill-cat">Categoria</Label>
            <select
              id="bill-cat"
              name="category_id"
              className={cn(
                "flex min-h-[44px] w-full items-center rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring",
              )}
              defaultValue=""
            >
              <option value="">—</option>
              {allowedCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bill-acc">Conta</Label>
            <select
              id="bill-acc"
              name="account_id"
              className={cn(
                "flex min-h-[44px] w-full items-center rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring",
              )}
              defaultValue=""
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
            <Label htmlFor="bill-notes">Notas (opcional)</Label>
            <textarea
              id="bill-notes"
              name="notes"
              className="min-h-[96px] w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-base shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Ex.: aluguel, internet, parcela, etc."
            />
          </div>

          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}

          <SubmitButton className="w-full" pendingLabel="Salvando…">
            Criar
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PayBillDialog({
  open,
  onOpenChange,
  bill,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  bill: Bill | null;
}) {
  const router = useRouter();
  const [state, action] = useFormState(markBillPaid, initial);

  const formKey = `${bill?.id ?? "new"}-${open}`;

  useEffect(() => {
    if (state.ok) {
      onOpenChange(false);
      router.refresh();
    }
  }, [state.ok, onOpenChange, router]);

  if (!bill) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md pb-[env(safe-area-inset-bottom)]">
          <DialogHeader>
            <DialogTitle>Marcar como pago</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">Nenhuma conta selecionada.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-md pb-[env(safe-area-inset-bottom)]"
      >
        <DialogHeader>
          <DialogTitle>Marcar como pago</DialogTitle>
        </DialogHeader>

        <form key={formKey} action={action} className="space-y-4">
          <input type="hidden" name="id" value={bill.id} />

          <div className="space-y-2">
            <Label htmlFor="bill-paid-at">Data do pagamento</Label>
            <Input
              id="bill-paid-at"
              name="paid_at"
              type="date"
              required
              defaultValue={bill.paid_at ? bill.paid_at.slice(0, 10) : todayISO()}
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bill-paid-amount">Valor pago (R$)</Label>
            <Input
              id="bill-paid-amount"
              name="paid_amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={bill.paid_amount ?? bill.amount}
              className={inputClass}
            />
          </div>

          {bill.recurrence !== "none" ? (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <input
                type="checkbox"
                name="generate_next"
                value="1"
                defaultChecked
                aria-label="Gerar próxima conta recorrente"
              />
              <div className="min-w-0">
                <p className="font-medium">Gerar próxima conta (recorrente)</p>
                <p className="text-xs text-muted-foreground">
                  Mantém a recorrência configurada.
                </p>
              </div>
            </div>
          ) : null}

          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}

          <SubmitButton className="w-full" pendingLabel="Salvando…">
            Confirmar
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

