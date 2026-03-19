-- Dino — extensão de schema para /bills e /settings
-- (issue #12/#16 dependem da estrutura da issue #7)

-- ── CONTAS A PAGAR / RECEBER ──────────────────────────────────
CREATE TABLE public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  type TEXT CHECK (type IN ('payable', 'receivable')) NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'paid', 'overdue', 'cancelled')),
  recurrence TEXT CHECK (recurrence IN ('none', 'monthly', 'weekly', 'yearly')) DEFAULT 'none',
  recurrence_day INT,
  category_id UUID REFERENCES public.categories(id),
  account_id UUID REFERENCES public.accounts(id),
  paid_at TIMESTAMPTZ,
  paid_amount DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── MEMÓRIA DA IA ─────────────────────────────────────────────
CREATE TABLE public.ai_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  context TEXT,
  source TEXT CHECK (source IN ('user_taught', 'auto_learned', 'rule')) DEFAULT 'user_taught',
  confirmed_by UUID REFERENCES public.family_members(id),
  usage_count INT DEFAULT 0,
  last_used TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── REGRAS DE CATEGORIZAÇÃO ───────────────────────────────────
CREATE TABLE public.category_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern TEXT NOT NULL,
  pattern_type TEXT CHECK (pattern_type IN ('contains', 'starts_with', 'regex', 'exact')) DEFAULT 'contains',
  category_id UUID REFERENCES public.categories(id) NOT NULL,
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  match_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── ORÇAMENTO POR PERÍODO ─────────────────────────────────────
CREATE TABLE public.budget_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period DATE NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  planned_amount DECIMAL(12,2),
  actual_amount DECIMAL(12,2) DEFAULT 0,
  UNIQUE(period, category_id)
);

-- ── CONCILIAÇÕES ──────────────────────────────────────────────
CREATE TABLE public.reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.accounts(id),
  period DATE NOT NULL,
  statement_balance DECIMAL(12,2),
  system_balance DECIMAL(12,2),
  difference DECIMAL(12,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── RLS (Row Level Security) ──────────────────────────────────
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliations ENABLE ROW LEVEL SECURITY;

-- Mantém padrão do MVP: authenticated acessa a família inteira (mesmo comportamento atual
-- em family_members/accounts/categories/transactions).
CREATE POLICY "bills_all" ON public.bills
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ai_memory_all" ON public.ai_memory
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "category_rules_all" ON public.category_rules
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "budget_periods_all" ON public.budget_periods
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "reconciliations_all" ON public.reconciliations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ativa CRUD de categorias para a aba /settings (issue #16).
-- Mantém o padrão do MVP: authenticated acessa os dados da família inteira.
CREATE POLICY "categories_all" ON public.categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

