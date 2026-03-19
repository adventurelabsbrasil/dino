import { createClient } from "@/lib/supabase/server";
import {
  endOfMonth,
  format,
  startOfMonth,
  subMonths,
  parseISO,
  addDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  CashflowChart,
  ExpenseByCategoryChart,
} from "@/components/dashboard/dashboard-charts";

function money(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");
  const chartFrom = format(startOfMonth(subMonths(now, 5)), "yyyy-MM-dd");

  const { data: monthTx } = await supabase
    .from("transactions")
    .select("amount, type, category_id, date")
    .gte("date", monthStart)
    .lte("date", monthEnd);

  const { data: chartTx } = await supabase
    .from("transactions")
    .select("amount, type, date")
    .gte("date", chartFrom)
    .lte("date", monthEnd);

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, type");

  const catMap = new Map(
    (categories ?? []).map((c) => [c.id, c.name] as const),
  );

  let receitas = 0;
  let despesas = 0;
  for (const t of monthTx ?? []) {
    const a = Number(t.amount);
    if (t.type === "income") receitas += a;
    else despesas += a;
  }

  const expenseByCat = new Map<string, number>();
  for (const t of monthTx ?? []) {
    if (t.type !== "expense") continue;
    const name = t.category_id ? catMap.get(t.category_id) ?? "Outros" : "Sem categoria";
    expenseByCat.set(name, (expenseByCat.get(name) ?? 0) + Number(t.amount));
  }
  const pieData = Array.from(expenseByCat.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const monthKeys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    monthKeys.push(format(startOfMonth(subMonths(now, i)), "yyyy-MM"));
  }
  const byMonth = new Map<string, { receitas: number; despesas: number }>();
  for (const k of monthKeys) {
    byMonth.set(k, { receitas: 0, despesas: 0 });
  }
  for (const t of chartTx ?? []) {
    const key = format(parseISO(t.date as string), "yyyy-MM");
    if (!byMonth.has(key)) continue;
    const cur = byMonth.get(key)!;
    const a = Number(t.amount);
    if (t.type === "income") cur.receitas += a;
    else cur.despesas += a;
  }
  const barData = monthKeys.map((k) => ({
    month: format(parseISO(`${k}-01`), "MMM", { locale: ptBR }),
    receitas: byMonth.get(k)!.receitas,
    despesas: byMonth.get(k)!.despesas,
  }));

  const { data: recent } = await supabase
    .from("transactions")
    .select(
      "id, date, description, amount, type, status, source, category_id",
    )
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(10);

  const today = format(now, "yyyy-MM-dd");
  const inSevenDays = format(addDays(now, 7), "yyyy-MM-dd");
  const { data: upcomingBills } = await supabase
    .from("bills")
    .select("id, description, amount, due_date, type, status")
    .eq("status", "open")
    .gte("due_date", today)
    .lte("due_date", inSevenDays)
    .order("due_date", { ascending: true })
    .limit(10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Painel</h1>
        <p className="text-muted-foreground">
          Resumo de {format(now, "MMMM yyyy", { locale: ptBR })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Receitas do mês</CardDescription>
            <CardTitle className="text-2xl text-green-600 dark:text-green-400">
              {money(receitas)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Despesas do mês</CardDescription>
            <CardTitle className="text-2xl text-red-600 dark:text-red-400">
              {money(despesas)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resultado</CardDescription>
            <CardTitle
              className={
                receitas - despesas >= 0
                  ? "text-2xl text-green-600 dark:text-green-400"
                  : "text-2xl text-red-600 dark:text-red-400"
              }
            >
              {money(receitas - despesas)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {(upcomingBills ?? []).length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Próximas contas a vencer (7 dias)</CardTitle>
            <CardDescription>Contas a pagar e a receber</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingBills!.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      {format(parseISO(b.due_date as string), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {b.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {b.type === "payable" ? "A pagar" : "A receber"}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={
                        b.type === "payable"
                          ? "text-right text-red-600 dark:text-red-400"
                          : "text-right text-green-600 dark:text-green-400"
                      }
                    >
                      {b.type === "payable" ? "-" : "+"}
                      {money(Number(b.amount))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fluxo — últimos 6 meses</CardTitle>
            <CardDescription>Receitas e despesas por mês</CardDescription>
          </CardHeader>
          <CardContent>
            <CashflowChart data={barData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Despesas por categoria</CardTitle>
            <CardDescription>Mês atual</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseByCategoryChart data={pieData} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimas transações</CardTitle>
          <CardDescription>10 mais recentes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Origem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(recent ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhuma transação ainda.
                  </TableCell>
                </TableRow>
              ) : (
                (recent ?? []).map((row) => {
                  const catName = row.category_id
                    ? catMap.get(row.category_id) ?? "—"
                    : "—";
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        {format(parseISO(row.date as string), "dd/MM/yy")}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {row.description}
                      </TableCell>
                      <TableCell>{catName}</TableCell>
                      <TableCell
                        className={
                          row.type === "income"
                            ? "text-right text-green-600 dark:text-green-400"
                            : "text-right text-red-600 dark:text-red-400"
                        }
                      >
                        {row.type === "expense" ? "-" : "+"}
                        {money(Number(row.amount))}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{row.source}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
