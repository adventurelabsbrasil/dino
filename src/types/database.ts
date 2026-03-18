export type FamilyMember = {
  id: string;
  user_id: string;
  name: string;
  role: "admin" | "member" | "viewer";
};

export type Account = {
  id: string;
  name: string;
  bank: string | null;
  type: string;
  balance: number;
};

export type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string;
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
