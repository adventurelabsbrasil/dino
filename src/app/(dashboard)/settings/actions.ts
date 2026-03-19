"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ensureFamilyMember } from "@/lib/auth/ensure-member";

export type SettingsActionState = { error?: string; ok?: boolean };

function parseUuidOrNull(raw: FormDataEntryValue | null) {
  const s = raw ? String(raw).trim() : "";
  return s.length ? s : null;
}

const upsertCategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  type: z.enum(["income", "expense"]),
  parent_id: z.string().uuid().nullable(),
  budget_monthly: z.coerce.number().nullable(),
  color: z.string().min(1),
  icon: z.string().min(1),
  is_active: z.boolean(),
});

export async function upsertCategory(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  await ensureFamilyMember(supabase, user);

  const rawId = formData.get("id");
  const raw = {
    id: rawId && typeof rawId === "string" && rawId.trim().length ? rawId : undefined,
    name: formData.get("name"),
    type: formData.get("type"),
    parent_id: parseUuidOrNull(formData.get("parent_id")),
    budget_monthly: formData.get("budget_monthly"),
    color: formData.get("color"),
    icon: formData.get("icon"),
    is_active: formData.get("is_active") !== null,
  };

  const parsed = upsertCategorySchema.safeParse({
    ...raw,
    budget_monthly:
      raw.budget_monthly && String(raw.budget_monthly).trim().length
        ? Number(String(raw.budget_monthly))
        : null,
    name: raw.name ? String(raw.name).trim() : "",
    color: raw.color ? String(raw.color).trim() : "",
    icon: raw.icon ? String(raw.icon).trim() : "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const data = parsed.data;

  const payload = {
    name: data.name,
    type: data.type,
    parent_id: data.parent_id,
    budget_monthly: data.budget_monthly,
    color: data.color,
    icon: data.icon,
    is_active: data.is_active,
  };

  const { error: dbError } = data.id
    ? await supabase.from("categories").update(payload).eq("id", data.id)
    : await supabase.from("categories").insert(payload);

  if (dbError) return { error: dbError.message };

  revalidatePath("/settings");
  return { ok: true };
}

export async function deleteCategory(
  formData: FormData,
): Promise<void> {
  const id = formData.get("id");
  if (!id || typeof id !== "string") throw new Error("ID inválido");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  await ensureFamilyMember(supabase, user);

  const { error: dbError } = await supabase.from("categories").delete().eq("id", id);
  if (dbError) throw new Error(dbError.message);

  revalidatePath("/settings");
}

const upsertAccountSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  bank: z.string().nullable(),
  type: z.enum(["checking", "savings", "credit", "investment", "cash"]),
  balance: z.coerce.number(),
  is_active: z.boolean(),
});

export async function upsertAccount(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  await ensureFamilyMember(supabase, user);

  const rawId = formData.get("id");
  const raw = {
    id: rawId && typeof rawId === "string" && rawId.trim().length ? rawId : undefined,
    name: formData.get("name"),
    bank: formData.get("bank"),
    type: formData.get("type"),
    balance: formData.get("balance"),
    is_active: formData.get("is_active") !== null,
  };

  const parsed = upsertAccountSchema.safeParse({
    id: raw.id,
    name: raw.name ? String(raw.name).trim() : "",
    bank: raw.bank && String(raw.bank).trim().length ? String(raw.bank).trim() : null,
    type: raw.type,
    balance: raw.balance,
    is_active: raw.is_active,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const data = parsed.data;
  const payload = {
    name: data.name,
    bank: data.bank,
    type: data.type,
    balance: data.balance,
    is_active: data.is_active,
  };

  const { error: dbError } = data.id
    ? await supabase.from("accounts").update(payload).eq("id", data.id)
    : await supabase.from("accounts").insert(payload);

  if (dbError) return { error: dbError.message };

  revalidatePath("/settings");
  return { ok: true };
}

export async function deleteAccount(
  formData: FormData,
): Promise<void> {
  const id = formData.get("id");
  if (!id || typeof id !== "string") throw new Error("ID inválido");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  await ensureFamilyMember(supabase, user);

  const { error: dbError } = await supabase.from("accounts").delete().eq("id", id);
  if (dbError) throw new Error(dbError.message);

  revalidatePath("/settings");
}

type IntegrationPrefs = {
  telegram?: boolean;
  n8n?: boolean;
  sheets?: boolean;
};

export async function updatePreferences(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { data: myMember } = await supabase
    .from("family_members")
    .select("id, preferences")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!myMember) return { error: "Família não encontrada" };

  await ensureFamilyMember(supabase, user);

  const googleSheetsId = String(formData.get("google_sheets_id") ?? "").trim();
  const tabsRaw = String(formData.get("google_sheets_tabs") ?? "").trim();
  const googleSheetsTabs = tabsRaw
    ? tabsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const integrations: IntegrationPrefs = {
    telegram: formData.get("integration_telegram") !== null,
    n8n: formData.get("integration_n8n") !== null,
    sheets: formData.get("integration_sheets") !== null,
  };

  const existingPrefs = (myMember.preferences ?? {}) as Record<string, unknown>;
  const nextPrefs = {
    ...existingPrefs,
    googleSheets: {
      id: googleSheetsId || null,
      tabs: googleSheetsTabs,
    },
    integrations,
  };

  const { error: dbError } = await supabase
    .from("family_members")
    .update({ preferences: nextPrefs })
    .eq("id", myMember.id);

  if (dbError) return { error: dbError.message };

  revalidatePath("/settings");
  return { ok: true };
}

