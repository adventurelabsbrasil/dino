"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addDays, addMonths, addYears, format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { ensureFamilyMember } from "@/lib/auth/ensure-member";

export type BillsActionState = { error?: string; ok?: boolean };

function parseUuidOrNull(raw: FormDataEntryValue | null) {
  const s = raw ? String(raw).trim() : "";
  return s.length ? s : null;
}

function clampDayToMonth(day: number, date: Date) {
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return Math.max(1, Math.min(day, daysInMonth));
}

function computeNextDueDate({
  dueDate,
  recurrence,
  recurrenceDay,
}: {
  dueDate: string;
  recurrence: "none" | "monthly" | "weekly" | "yearly";
  recurrenceDay: number | null;
}): string | null {
  if (recurrence === "none") return null;

  const base = parseISO(dueDate);
  const day = recurrenceDay ?? base.getDate();

  if (recurrence === "weekly") {
    return format(addDays(base, 7), "yyyy-MM-dd");
  }

  if (recurrence === "monthly") {
    const nextMonth = addMonths(base, 1);
    const clamped = clampDayToMonth(day, nextMonth);
    nextMonth.setDate(clamped);
    return format(nextMonth, "yyyy-MM-dd");
  }

  // yearly
  const nextYear = addYears(base, 1);
  const clamped = clampDayToMonth(day, nextYear);
  nextYear.setDate(clamped);
  return format(nextYear, "yyyy-MM-dd");
}

const createBillSchema = z.object({
  description: z.string().min(1),
  amount: z.coerce.number().positive(),
  due_date: z.string().min(1),
  type: z.enum(["payable", "receivable"]),
  recurrence: z.enum(["none", "monthly", "weekly", "yearly"]).default("none"),
  recurrence_day: z.coerce.number().int().min(1).max(31).nullable(),
  category_id: z.string().uuid().nullable(),
  account_id: z.string().uuid().nullable(),
  notes: z.string().optional().nullable(),
});

export async function createBill(
  _prev: BillsActionState,
  formData: FormData,
): Promise<BillsActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  // garante que o membro existe (e cria "Principal" na primeira família)
  await ensureFamilyMember(supabase, user);

  const raw = {
    description: formData.get("description"),
    amount: formData.get("amount"),
    due_date: formData.get("due_date"),
    type: formData.get("type"),
    recurrence: formData.get("recurrence"),
    recurrence_day: formData.get("recurrence_day"),
    category_id: parseUuidOrNull(formData.get("category_id")),
    account_id: parseUuidOrNull(formData.get("account_id")),
    notes: formData.get("notes"),
  };

  const parsed = createBillSchema.safeParse({
    ...raw,
    notes: raw.notes ? String(raw.notes).trim() : null,
    recurrence_day:
      raw.recurrence_day && String(raw.recurrence_day).trim().length
        ? Number(String(raw.recurrence_day))
        : null,
    description: raw.description ? String(raw.description).trim() : "",
    due_date: raw.due_date ? String(raw.due_date) : "",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  const data = parsed.data;

  const { error: dbError } = await supabase.from("bills").insert({
    description: data.description,
    amount: data.amount,
    due_date: data.due_date,
    type: data.type,
    status: "open",
    recurrence: data.recurrence,
    recurrence_day: data.recurrence_day,
    category_id: data.category_id,
    account_id: data.account_id,
    notes: data.notes ?? null,
  });

  if (dbError) return { error: dbError.message };

  revalidatePath("/bills");
  return { ok: true };
}

const markBillPaidSchema = z.object({
  id: z.string().uuid(),
  paid_at: z.string().min(1),
  paid_amount: z.coerce.number().positive(),
});

export async function markBillPaid(
  _prev: BillsActionState,
  formData: FormData,
): Promise<BillsActionState> {
  const rawId = formData.get("id");
  if (!rawId || typeof rawId !== "string") return { error: "ID inválido" };

  const generate_next = formData.get("generate_next") !== null;

  const parsed = markBillPaidSchema.safeParse({
    id: rawId,
    paid_at: formData.get("paid_at"),
    paid_amount: formData.get("paid_amount"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  await ensureFamilyMember(supabase, user);

  const billId = parsed.data.id;
  const paidAt = new Date(parsed.data.paid_at);
  const paidAmount = parsed.data.paid_amount;

  const { data: bill } = await supabase
    .from("bills")
    .select(
      "id, due_date, recurrence, recurrence_day, type, amount, description, category_id, account_id, notes",
    )
    .eq("id", billId)
    .maybeSingle();

  if (!bill) return { error: "Conta não encontrada" };

  const { error: updateError } = await supabase
    .from("bills")
    .update({
      status: "paid",
      paid_at: paidAt,
      paid_amount: paidAmount,
    })
    .eq("id", billId);

  if (updateError) return { error: updateError.message };

  if (generate_next && bill.recurrence !== "none") {
    const nextDueDate = computeNextDueDate({
      dueDate: bill.due_date as string,
      recurrence: bill.recurrence as "none" | "monthly" | "weekly" | "yearly",
      recurrenceDay: bill.recurrence_day as number | null,
    });

    if (nextDueDate) {
      const { error: nextError } = await supabase.from("bills").insert({
        description: bill.description,
        amount: bill.amount,
        due_date: nextDueDate,
        type: bill.type,
        status: "open",
        recurrence: bill.recurrence,
        recurrence_day: bill.recurrence_day,
        category_id: bill.category_id,
        account_id: bill.account_id,
        notes: bill.notes ?? null,
      });

      if (nextError) return { error: nextError.message };
    }
  }

  revalidatePath("/bills");
  return { ok: true };
}

