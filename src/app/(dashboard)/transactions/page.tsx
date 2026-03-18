import { Suspense } from "react";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { TransactionsClient, type TxRow } from "./transactions-client";
import type { Account, Category } from "@/types/database";

type Search = {
  from?: string;
  to?: string;
  q?: string;
  category_id?: string;
  account_id?: string;
  type?: string;
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const supabase = await createClient();
  const now = new Date();
  const defaultFrom = format(startOfMonth(now), "yyyy-MM-dd");
  const defaultTo = format(endOfMonth(now), "yyyy-MM-dd");

  const from = searchParams.from ?? defaultFrom;
  const to = searchParams.to ?? defaultTo;
  const q = searchParams.q?.trim();
  const categoryId = searchParams.category_id;
  const accountId = searchParams.account_id;
  const type = searchParams.type;

  let query = supabase
    .from("transactions")
    .select("*")
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (categoryId) query = query.eq("category_id", categoryId);
  if (accountId) query = query.eq("account_id", accountId);
  if (type === "income" || type === "expense") query = query.eq("type", type);
  if (q) query = query.ilike("description", `%${q}%`);

  const { data: transactions, error } = await query;
  if (error) throw new Error(error.message);

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, type, color, icon")
    .order("name");

  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name, bank, type, balance")
    .eq("is_active", true)
    .order("name");

  const cats = (categories ?? []) as Category[];
  const accs = (accounts ?? []) as Account[];
  const catMap = Object.fromEntries(cats.map((c) => [c.id, c.name]));
  const accMap = Object.fromEntries(accs.map((a) => [a.id, a.name]));

  return (
    <Suspense
      fallback={<div className="p-8 text-muted-foreground">Carregando…</div>}
    >
      <TransactionsClient
        transactions={(transactions ?? []) as TxRow[]}
        categories={cats}
        accounts={accs}
        catMap={catMap}
        accMap={accMap}
        defaultFrom={defaultFrom}
        defaultTo={defaultTo}
      />
    </Suspense>
  );
}
