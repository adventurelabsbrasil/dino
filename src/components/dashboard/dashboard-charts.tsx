"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "#4caf50",
  "#ff7043",
  "#42a5f5",
  "#ab47bc",
  "#78909c",
];

export function CashflowChart({
  data,
}: {
  data: { month: string; receitas: number; despesas: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
        <Tooltip
          formatter={(value) =>
            typeof value === "number"
              ? value.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })
              : String(value ?? "")
          }
        />
        <Legend />
        <Bar dataKey="receitas" name="Receitas" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="despesas" name="Despesas" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ExpenseByCategoryChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  if (data.length === 0) {
    return (
      <p className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        Nenhuma despesa neste mês.
      </p>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ name, percent }) =>
            `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
          }
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) =>
            typeof value === "number"
              ? value.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })
              : String(value ?? "")
          }
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
