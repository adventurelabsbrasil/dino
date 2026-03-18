"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ensureFamilyMember } from "@/lib/auth/ensure-member";
import { z } from "zod";

const txSchema = z.object({
  date: z.string().min(1),
  description: z.string().min(1, "Descrição obrigatória"),
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  type: z.enum(["income", "expense"]),
  category_id: z.string().uuid().optional().nullable(),
  account_id: z.string().uuid().optional().nullable(),
  status: z.enum(["pending", "confirmed"]),
});

export type TxActionState = { error?: string; ok?: boolean };

function parseForm(formData: FormData) {
  const raw = {
    date: formData.get("date"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    category_id: formData.get("category_id") || null,
    account_id: formData.get("account_id") || null,
    status: formData.get("status") || "pending",
  };
  const parsed = txSchema.safeParse({
    ...raw,
    category_id:
      raw.category_id && String(raw.category_id).length > 0
        ? String(raw.category_id)
        : null,
    account_id:
      raw.account_id && String(raw.account_id).length > 0
        ? String(raw.account_id)
        : null,
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((i) => i.message).join("; "),
      data: null as null,
    };
  }
  return { error: null, data: parsed.data };
}

export async function createTransaction(
  _prev: TxActionState,
  formData: FormData,
): Promise<TxActionState> {
  const { error, data } = parseForm(formData);
  if (error || !data) return { error: error ?? "Dados inválidos" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { memberId } = await ensureFamilyMember(supabase, user);

  const { error: dbError } = await supabase.from("transactions").insert({
    date: data.date,
    description: data.description.trim(),
    amount: data.amount,
    type: data.type,
    category_id: data.category_id,
    account_id: data.account_id,
    status: data.status,
    source: "manual",
    created_by: memberId,
    updated_by: memberId,
  });

  if (dbError) return { error: dbError.message };
  revalidatePath("/");
  revalidatePath("/transactions");
  return { ok: true };
}

export async function updateTransaction(
  _prev: TxActionState,
  formData: FormData,
): Promise<TxActionState> {
  const id = formData.get("id");
  if (!id || typeof id !== "string") return { error: "ID inválido" };

  const { error, data } = parseForm(formData);
  if (error || !data) return { error: error ?? "Dados inválidos" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { memberId } = await ensureFamilyMember(supabase, user);

  const { error: dbError } = await supabase
    .from("transactions")
    .update({
      date: data.date,
      description: data.description.trim(),
      amount: data.amount,
      type: data.type,
      category_id: data.category_id,
      account_id: data.account_id,
      status: data.status,
      updated_by: memberId,
    })
    .eq("id", id);

  if (dbError) return { error: dbError.message };
  revalidatePath("/");
  revalidatePath("/transactions");
  return { ok: true };
}

export async function deleteTransaction(id: string): Promise<TxActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/transactions");
  return { ok: true };
}
