-- Dino MVP — uma família por projeto Supabase; todos os authenticated compartilham dados.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  telegram_id BIGINT UNIQUE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bank TEXT,
  type TEXT NOT NULL DEFAULT 'checking' CHECK (
    type IN ('checking', 'savings', 'credit', 'investment', 'cash')
  ),
  balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  balance_updated_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  parent_id UUID REFERENCES public.categories (id),
  keywords TEXT[] NOT NULL DEFAULT '{}',
  merchant_patterns TEXT[] NOT NULL DEFAULT '{}',
  budget_monthly NUMERIC(12, 2),
  color TEXT NOT NULL DEFAULT '#66bb6a',
  icon TEXT NOT NULL DEFAULT '💰',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id UUID REFERENCES public.categories (id),
  account_id UUID REFERENCES public.accounts (id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'reconciled')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (
    source IN ('manual', 'extract', 'receipt', 'nf', 'sheets', 'telegram')
  ),
  raw_text TEXT,
  attachment_url TEXT,
  created_by UUID REFERENCES public.family_members (id),
  updated_by UUID REFERENCES public.family_members (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE OR REPLACE FUNCTION public.set_transactions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_transactions_updated_at();

INSERT INTO public.categories (name, type, keywords, icon, color)
VALUES
  ('Alimentação', 'expense', ARRAY['mercado','supermercado','padaria','hortifruti'], '🛒', '#4caf50'),
  ('Restaurantes', 'expense', ARRAY['restaurante','pizza','hamburger','delivery','ifood'], '🍽️', '#ff7043'),
  ('Transporte', 'expense', ARRAY['uber','99','combustível','posto','gasolina','etanol'], '🚗', '#42a5f5'),
  ('Saúde', 'expense', ARRAY['farmácia','remédio','consulta','hospital','dentista'], '💊', '#ef5350'),
  ('Educação', 'expense', ARRAY['escola','curso','livro','mensalidade','faculdade'], '📚', '#7e57c2'),
  ('Moradia', 'expense', ARRAY['aluguel','condomínio','iptu','água','luz','gás'], '🏠', '#8d6e63'),
  ('Lazer', 'expense', ARRAY['cinema','streaming','netflix','spotify','viagem'], '🎬', '#ab47bc'),
  ('Vestuário', 'expense', ARRAY['roupa','sapato','tênis','loja','moda'], '👕', '#ec407a'),
  ('Pets', 'expense', ARRAY['petshop','veterinário','ração','pet'], '🐾', '#26a69a'),
  ('Serviços', 'expense', ARRAY['internet','telefone','celular','plano'], '📡', '#78909c'),
  ('Outros gastos', 'expense', ARRAY[]::text[], '📦', '#bdbdbd'),
  ('Salário', 'income', ARRAY['salário','pagamento','holerite','folha'], '💼', '#66bb6a'),
  ('Freelance', 'income', ARRAY['freelance','projeto','consultoria','honorários'], '💻', '#29b6f6'),
  ('Investimentos', 'income', ARRAY['dividendo','rendimento','juros','fundo'], '📈', '#ffa726'),
  ('Outras receitas', 'income', ARRAY[]::text[], '💰', '#d4e157');

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- family_members: ver todos; inserir só o próprio vínculo; atualizar só a própria linha
CREATE POLICY "family_members_select" ON public.family_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "family_members_insert_own" ON public.family_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "family_members_update_own" ON public.family_members
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- categories: leitura para usuários logados (dados seed)
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT TO authenticated USING (true);

-- accounts: CRUD compartilhado (uma família)
CREATE POLICY "accounts_all" ON public.accounts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- transactions: CRUD compartilhado
CREATE POLICY "transactions_all" ON public.transactions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
