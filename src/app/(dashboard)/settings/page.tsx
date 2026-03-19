import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ensureFamilyMember } from "@/lib/auth/ensure-member";
import type { Account, Category, FamilyMember } from "@/types/database";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // rota protegida pelo layout, mas mantém segurança extra
    return null;
  }

  await ensureFamilyMember(supabase, user);

  const [
    { data: categories },
    { data: accounts },
    { data: members },
    { data: myMember },
  ] =
    await Promise.all([
      supabase
        .from("categories")
        .select("id, name, type, parent_id, budget_monthly, color, icon, is_active")
        .order("name"),
      supabase
        .from("accounts")
        .select("id, name, bank, type, balance, is_active, balance_updated_at")
        .order("name"),
      supabase
        .from("family_members")
        .select("id, user_id, name, role, telegram_id, is_active, preferences")
        .order("created_at"),
      supabase
        .from("family_members")
        .select("id, preferences")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  const myPreferences = (myMember?.preferences ?? {}) as Record<string, unknown>;

  return (
    <Suspense
      fallback={<div className="p-8 text-muted-foreground">Carregando…</div>}
    >
      <SettingsClient
        categories={(categories ?? []) as Category[]}
        accounts={(accounts ?? []) as Account[]}
        members={(members ?? []) as FamilyMember[]}
        myPreferences={myPreferences}
      />
    </Suspense>
  );
}

