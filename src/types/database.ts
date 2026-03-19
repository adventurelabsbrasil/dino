export type FamilyMember = {
  id: string;
  user_id: string;
  name: string;
  role: "admin" | "member" | "viewer";
  telegram_id?: number | null;
  is_active?: boolean;
  preferences?: Record<string, unknown>;
};

export type Account = {
  id: string;
  name: string;
  bank: string | null;
  type: string;
  balance: number;
  is_active?: boolean;
  balance_updated_at?: string | null;
};

export type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  parent_id?: string | null;
  budget_monthly?: number | null;
  color: string;
  icon: string;
  is_active?: boolean;
};

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category_id: string | null;
  account_id: string | null;
  status: string;
  source: string;
  created_by: string | null;
};

export type Bill = {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  type: "payable" | "receivable";
  status: "open" | "paid" | "overdue" | "cancelled";
  recurrence: "none" | "monthly" | "weekly" | "yearly";
  recurrence_day: number | null;
  category_id: string | null;
  account_id: string | null;
  paid_at: string | null;
  paid_amount: number | null;
  notes: string | null;
};

export type CategoryRule = {
  id: string;
  pattern: string;
  pattern_type: "contains" | "starts_with" | "regex" | "exact";
  category_id: string;
  priority: number;
  is_active: boolean;
  match_count: number;
  created_at: string;
};

export type AiMemory = {
  id: string;
  key: string;
  value: string;
  context: string | null;
  source: "user_taught" | "auto_learned" | "rule";
  confirmed_by: string | null;
  usage_count: number;
  last_used: string | null;
  created_at: string;
};

export type BudgetPeriod = {
  id: string;
  period: string;
  category_id: string | null;
  planned_amount: number | null;
  actual_amount: number;
};

export type Reconciliation = {
  id: string;
  account_id: string | null;
  period: string;
  statement_balance: number | null;
  system_balance: number | null;
  difference: number | null;
  status: "pending" | "in_progress" | "completed";
  completed_at: string | null;
  notes: string | null;
};
