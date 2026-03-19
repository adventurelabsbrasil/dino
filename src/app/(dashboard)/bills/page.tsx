import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Account, Bill, Category } from "@/types/database";
import { BillsClient } from "./bills-client";

export default async function BillsPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: accounts }, { data: bills }] =
    await Promise.all([
      supabase
        .from("categories")
        .select("id, name, type, color, icon, is_active, budget_monthly, parent_id")
        .order("name"),
      supabase
        .from("accounts")
        .select("id, name, bank, type, balance, is_active")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("bills")
        .select(
          "id, description, amount, due_date, type, status, recurrence, recurrence_day, category_id, account_id, paid_at, paid_amount, notes, created_at",
        )
        .order("due_date", { ascending: true })
        .order("created_at", { ascending: false }),
    ]);

  const cats = (categories ?? []) as Category[];
  const accs = (accounts ?? []) as Account[];
  const bs = (bills ?? []) as Bill[];

  return (
    <Suspense
      fallback={<div className="p-8 text-muted-foreground">Carregando…</div>}
    >
      <BillsClient bills={bs} categories={cats} accounts={accs} />
    </Suspense>
  );
}

