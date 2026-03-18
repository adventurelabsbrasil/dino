# 🦕 Dino — Assistente Financeiro Familiar
> Prompt master completo para o Cursor AI construir o sistema do zero.

---

## MISSÃO DO CURSOR

Você vai construir **do zero** um assistente financeiro familiar chamado **Dino**.  
Leia este documento inteiro antes de escrever qualquer código.  
Siga a ordem de implementação definida no final.  
A cada etapa, confirme o que foi feito antes de avançar.

---

## IDENTIDADE DO SISTEMA

| Campo | Valor |
|---|---|
| Nome do bot | **Dino** |
| Repositório GitHub | `dino` (privado) |
| Frontend deploy | Vercel |
| Automações | Railway (N8N) |
| Linguagem da interface | Português brasileiro |
| Público-alvo | Membros de uma família |

**Personalidade do Dino:**
- Amigável, direto, organizado
- Fala português brasileiro informal mas respeitoso
- Usa emojis com moderação
- Nunca julga os gastos da família
- Aprende e memoriza informações que a família ensina

---

## STACK TECNOLÓGICA

```
Frontend:    Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Recharts
Banco:       Supabase (PostgreSQL + Auth + Storage + Realtime)
Automação:   N8N (hospedado no Railway)
Bot:         Telegraf.js (webhook via Vercel API routes)
IA:          Anthropic Claude API — modelo claude-sonnet-4-20250514
Sheets:      Google Sheets API v4
PDF:         @react-pdf/renderer
Deploy:      Vercel (frontend + webhook) | Railway (N8N)
```

---

## PASSO 0 — SETUP DO REPOSITÓRIO E INFRAESTRUTURA

Execute estes comandos na pasta onde o projeto será criado:

```bash
# 1. Criar repositório privado no GitHub e clonar
gh repo create dino --private --clone --description "🦕 Assistente financeiro familiar com IA"
cd dino

# 2. Criar projeto Next.js dentro da pasta
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

# 3. Instalar dependências principais
npm install \
  @supabase/supabase-js \
  @supabase/ssr \
  @anthropic-ai/sdk \
  telegraf \
  googleapis \
  @react-pdf/renderer \
  recharts \
  date-fns \
  zod \
  lucide-react

# 4. Instalar shadcn/ui
npx shadcn@latest init

# 5. Instalar componentes shadcn necessários
npx shadcn@latest add button card input label select table badge dialog sheet tabs toast

# 6. Criar estrutura de pastas
mkdir -p \
  src/app/\(dashboard\)/transactions \
  src/app/\(dashboard\)/bills \
  src/app/\(dashboard\)/budget \
  src/app/\(dashboard\)/reconciliation \
  src/app/\(dashboard\)/reports \
  src/app/\(dashboard\)/settings \
  src/app/api/telegram/webhook \
  src/app/api/ai/categorize \
  src/app/api/ai/parse-document \
  src/app/api/ai/process-message \
  src/app/api/sheets/sync \
  src/app/api/reports/pdf \
  src/app/api/n8n/webhook \
  src/lib/supabase \
  src/lib/telegram/handlers \
  src/lib/ai \
  src/lib/sheets \
  src/lib/utils \
  src/components/dashboard \
  src/components/transactions \
  src/components/bills \
  src/components/reports \
  n8n/workflows \
  supabase/migrations

# 7. Criar .gitignore adicional
cat >> .gitignore << 'EOF'
.env.local
.env.production
*.log
.DS_Store
EOF

# 8. Criar branch de desenvolvimento
git checkout -b develop
git add .
git commit -m "chore: scaffold inicial do projeto Dino"
git push -u origin develop

# 9. Configurar Vercel (conectar ao repositório)
vercel link
vercel env pull .env.local

# 10. Configurar Railway para N8N
# Acesse railway.app → New Project → Deploy from template → N8N
# Ou via CLI:
railway login
railway init
railway add --plugin n8n
```

---

## VARIÁVEIS DE AMBIENTE NECESSÁRIAS

Crie o arquivo `.env.local` na raiz do projeto com as seguintes chaves.  
**Solicite ao usuário cada valor antes de prosseguir com a implementação.**

```env
# ─── SUPABASE ────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=
# Encontre em: supabase.com → seu projeto → Settings → API → Project URL

NEXT_PUBLIC_SUPABASE_ANON_KEY=
# Encontre em: supabase.com → seu projeto → Settings → API → anon public

SUPABASE_SERVICE_ROLE_KEY=
# Encontre em: supabase.com → seu projeto → Settings → API → service_role (NUNCA expor no frontend)

# ─── ANTHROPIC ───────────────────────────────────────────────
ANTHROPIC_API_KEY=
# Obtenha em: console.anthropic.com → API Keys → Create Key

# ─── TELEGRAM ────────────────────────────────────────────────
TELEGRAM_BOT_TOKEN=
# Obtenha com @BotFather no Telegram:
#   1. Abra @BotFather
#   2. Digite /newbot
#   3. Nome do bot: Dino
#   4. Username: DinoFinanceiroBot (ou disponível)
#   5. Copie o token fornecido

TELEGRAM_WEBHOOK_SECRET=
# Gere uma string aleatória segura: openssl rand -hex 32

# ─── GOOGLE SHEETS ───────────────────────────────────────────
GOOGLE_SERVICE_ACCOUNT_EMAIL=
# Crie em: console.cloud.google.com → IAM → Service Accounts → Create
# Depois compartilhe a planilha com este e-mail

GOOGLE_PRIVATE_KEY=
# Chave privada da Service Account (formato PEM, com \n escapados)
# Encontre em: console.cloud.google.com → Service Account → Keys → Add Key → JSON
# Copie o campo "private_key" do JSON baixado

GOOGLE_SHEETS_ID=
# ID da planilha Google Sheets da família
# Encontre na URL: docs.google.com/spreadsheets/d/[ESTE_ID_AQUI]/edit

# ─── N8N ─────────────────────────────────────────────────────
N8N_WEBHOOK_URL=
# URL do N8N no Railway após deploy (ex: https://dino-n8n.railway.app)

N8N_API_KEY=
# Gere em: N8N → Settings → API → Create API Key

# ─── APP ─────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=
# URL da aplicação na Vercel (ex: https://dino.vercel.app)
# Em desenvolvimento: http://localhost:3000

NEXT_PUBLIC_FAMILY_NAME=
# Nome da família (ex: "Família Silva") — aparece na interface

BOT_NAME=Dino
```

### Checklist de credenciais a solicitar ao usuário:

Antes de executar qualquer código, pergunte:

```
1. Você já tem um projeto no Supabase criado? (sim/não)
   → Se não: acesse supabase.com → New Project → anote URL e chaves

2. Você já tem uma API Key da Anthropic? (sim/não)
   → Se não: acesse console.anthropic.com → API Keys

3. Você criou o bot no @BotFather do Telegram? (sim/não)
   → Se não: abra o Telegram, procure @BotFather e siga os passos acima

4. Você tem um projeto no Google Cloud com Sheets API habilitada? (sim/não)
   → Se não: console.cloud.google.com → Enable APIs → Google Sheets API
   → Depois criar Service Account e baixar o JSON de credenciais

5. Qual é o ID da planilha Google Sheets da família?
   → Copie da URL da planilha

6. O N8N já está rodando no Railway? (sim/não)
   → Se não: execute os comandos Railway do Passo 0
```

---

## BANCO DE DADOS — MIGRATIONS SUPABASE

Crie o arquivo `supabase/migrations/001_initial_schema.sql`:

```sql
-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── MEMBROS DA FAMÍLIA ─────────────────────────────────────────
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  telegram_id BIGINT UNIQUE,
  role TEXT CHECK (role IN ('admin', 'member', 'viewer')) DEFAULT 'member',
  is_active BOOLEAN DEFAULT true,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── CONTAS BANCÁRIAS ──────────────────────────────────────────
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bank TEXT,
  type TEXT CHECK (type IN ('checking', 'savings', 'credit', 'investment', 'cash')),
  balance DECIMAL(12,2) DEFAULT 0,
  balance_updated_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── CATEGORIAS ────────────────────────────────────────────────
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  parent_id UUID REFERENCES categories(id),
  keywords TEXT[] DEFAULT '{}',
  merchant_patterns TEXT[] DEFAULT '{}',
  budget_monthly DECIMAL(12,2),
  color TEXT DEFAULT '#66bb6a',
  icon TEXT DEFAULT '💰',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── TRANSAÇÕES ────────────────────────────────────────────────
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  category_id UUID REFERENCES categories(id),
  account_id UUID REFERENCES accounts(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'reconciled')),
  source TEXT CHECK (source IN ('manual', 'extract', 'receipt', 'nf', 'sheets', 'telegram')),
  raw_text TEXT,
  attachment_url TEXT,
  created_by UUID REFERENCES family_members(id),
  updated_by UUID REFERENCES family_members(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- ── CONTAS A PAGAR / RECEBER ──────────────────────────────────
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  type TEXT CHECK (type IN ('payable', 'receivable')) NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'paid', 'overdue', 'cancelled')),
  recurrence TEXT CHECK (recurrence IN ('none', 'monthly', 'weekly', 'yearly')) DEFAULT 'none',
  recurrence_day INT,
  category_id UUID REFERENCES categories(id),
  account_id UUID REFERENCES accounts(id),
  paid_at TIMESTAMPTZ,
  paid_amount DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── MEMÓRIA DA IA ─────────────────────────────────────────────
CREATE TABLE ai_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  context TEXT,
  source TEXT CHECK (source IN ('user_taught', 'auto_learned', 'rule')) DEFAULT 'user_taught',
  confirmed_by UUID REFERENCES family_members(id),
  usage_count INT DEFAULT 0,
  last_used TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── REGRAS DE CATEGORIZAÇÃO ───────────────────────────────────
CREATE TABLE category_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern TEXT NOT NULL,
  pattern_type TEXT CHECK (pattern_type IN ('contains', 'starts_with', 'regex', 'exact')) DEFAULT 'contains',
  category_id UUID REFERENCES categories(id) NOT NULL,
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  match_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── ORÇAMENTO POR PERÍODO ─────────────────────────────────────
CREATE TABLE budget_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period DATE NOT NULL,
  category_id UUID REFERENCES categories(id),
  planned_amount DECIMAL(12,2),
  actual_amount DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  UNIQUE(period, category_id)
);

-- ── CONCILIAÇÕES ──────────────────────────────────────────────
CREATE TABLE reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id),
  period DATE NOT NULL,
  statement_balance DECIMAL(12,2),
  system_balance DECIMAL(12,2),
  difference DECIMAL(12,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── SEED: CATEGORIAS PADRÃO ───────────────────────────────────
INSERT INTO categories (name, type, keywords, icon, color) VALUES
  ('Alimentação',   'expense', ARRAY['mercado','supermercado','padaria','hortifruti'],     '🛒', '#4caf50'),
  ('Restaurantes',  'expense', ARRAY['restaurante','pizza','hamburger','delivery','ifood'],'🍽️', '#ff7043'),
  ('Transporte',    'expense', ARRAY['uber','99','combustível','posto','gasolina','etanol'],'🚗', '#42a5f5'),
  ('Saúde',         'expense', ARRAY['farmácia','remédio','consulta','hospital','dentista'],'💊', '#ef5350'),
  ('Educação',      'expense', ARRAY['escola','curso','livro','mensalidade','faculdade'],  '📚', '#7e57c2'),
  ('Moradia',       'expense', ARRAY['aluguel','condomínio','iptu','água','luz','gás'],    '🏠', '#8d6e63'),
  ('Lazer',         'expense', ARRAY['cinema','streaming','netflix','spotify','viagem'],   '🎬', '#ab47bc'),
  ('Vestuário',     'expense', ARRAY['roupa','sapato','tênis','loja','moda'],              '👕', '#ec407a'),
  ('Pets',          'expense', ARRAY['petshop','veterinário','ração','pet'],               '🐾', '#26a69a'),
  ('Serviços',      'expense', ARRAY['internet','telefone','celular','plano'],             '📡', '#78909c'),
  ('Outros gastos', 'expense', ARRAY[]::text[],                                            '📦', '#bdbdbd'),
  ('Salário',       'income',  ARRAY['salário','pagamento','holerite','folha'],            '💼', '#66bb6a'),
  ('Freelance',     'income',  ARRAY['freelance','projeto','consultoria','honorários'],    '💻', '#29b6f6'),
  ('Investimentos', 'income',  ARRAY['dividendo','rendimento','juros','fundo'],            '📈', '#ffa726'),
  ('Outras receitas','income', ARRAY[]::text[],                                            '💰', '#d4e157');

-- ── TRIGGERS: updated_at ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── RLS (Row Level Security) ──────────────────────────────────
ALTER TABLE family_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_memory        ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_rules   ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_periods   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliations  ENABLE ROW LEVEL SECURITY;

-- Políticas abertas para service_role (N8N e webhooks usam service_role)
CREATE POLICY "service_role_all" ON family_members   FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON accounts         FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON categories       FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON transactions     FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON bills            FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON ai_memory        FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON category_rules   FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON budget_periods   FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON reconciliations  FOR ALL USING (auth.role() = 'service_role');
```

Execute a migration:
```bash
npx supabase db push
# ou diretamente no Supabase SQL Editor
```

---

## ESTRUTURA DE ARQUIVOS — IMPLEMENTAÇÃO COMPLETA

### `src/lib/supabase/client.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### `src/lib/supabase/server.ts`
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options))
        },
      },
    }
  )
}

export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}
```

---

### `src/lib/ai/prompts.ts`

```typescript
export const DINO_SYSTEM_PROMPT = (context: {
  categories: { id: string; name: string; type: string; icon: string }[]
  accounts: { id: string; name: string; type: string }[]
  memory: { key: string; value: string }[]
  rules: { pattern: string; category_id: string }[]
  familyName: string
}) => `
Você é o Dino, assistente financeiro da ${context.familyName}.

PERSONALIDADE:
- Amigável, direto e organizado
- Fala português brasileiro informal mas respeitoso  
- Usa emojis com moderação para tornar as respostas mais claras
- Nunca julga os gastos da família
- Responde em no máximo 4 linhas, exceto quando listar itens

CAPACIDADES:
1. Registrar receitas e despesas pelo chat
2. Categorizar transações automaticamente
3. Controlar contas a pagar e receber
4. Explicar extratos bancários importados
5. Responder perguntas sobre orçamento e saldo
6. Aprender e memorizar informações que a família ensinar

CATEGORIAS DISPONÍVEIS:
${context.categories.map(c => `- ${c.icon} ${c.name} (${c.type}) [id: ${c.id}]`).join('\n')}

CONTAS DISPONÍVEIS:
${context.accounts.map(a => `- ${a.name} (${a.type}) [id: ${a.id}]`).join('\n')}

MEMÓRIA APRENDIDA:
${context.memory.map(m => `- "${m.key}" → ${m.value}`).join('\n') || 'Nenhuma memória registrada ainda.'}

REGRAS DE CATEGORIZAÇÃO:
${context.rules.map(r => `- Padrão "${r.pattern}" → categoria ${r.category_id}`).join('\n') || 'Nenhuma regra personalizada ainda.'}

INSTRUÇÕES DE COMPORTAMENTO:

1. LANÇAMENTOS: Quando identificar um gasto ou receita, extraia:
   - valor (número com ponto decimal, ex: 45.90)
   - descrição (nome do estabelecimento ou serviço)
   - tipo: "income" ou "expense"
   - categoria_id (use as disponíveis acima)
   - data (hoje se não informado)
   Responda SEMPRE com JSON estruturado no campo "action" + mensagem amigável.

2. APRENDIZADO: Se o usuário disser "o nome X é categoria Y" ou "sempre que ver X é Y",
   salve isso como regra. Confirme o aprendizado com entusiasmo.

3. DÚVIDA DE CATEGORIA: Se confiança < 70%, pergunte ao usuário com opções.

4. DUPLICATA: Se parecer duplicata (mesmo valor nas últimas 24h), avise e peça confirmação.

5. DOCUMENTOS: Se receber imagem/PDF, processe e retorne lista de transações extraídas.

FORMATO DE RESPOSTA PARA LANÇAMENTO (sempre inclua o JSON):
{
  "action": "create_transaction" | "create_bill" | "learn_rule" | "query" | "confirm_duplicate" | "ask_category",
  "data": { ... },
  "message": "mensagem amigável para o usuário",
  "confidence": 0.0-1.0
}
`

export const CATEGORIZATION_PROMPT = (
  description: string,
  amount: number,
  categories: { id: string; name: string; keywords: string[] }[],
  memory: { key: string; value: string }[]
) => `
Analise esta transação financeira e determine a melhor categoria.

Descrição: "${description}"
Valor: R$ ${amount}

Categorias disponíveis:
${categories.map(c => `- ${c.name} [id: ${c.id}] | palavras-chave: ${c.keywords.join(', ')}`).join('\n')}

Memória aprendida:
${memory.map(m => `- "${m.key}" → ${m.value}`).join('\n') || 'nenhuma'}

Responda APENAS com JSON válido, sem markdown:
{
  "category_id": "uuid da categoria",
  "category_name": "nome da categoria",
  "confidence": 0.0,
  "reasoning": "motivo da escolha em uma frase"
}
`

export const DOCUMENT_EXTRACTION_PROMPT = (fileType: string) => `
Você é especialista em análise de documentos financeiros brasileiros.
Extraia TODAS as informações financeiras do documento.

Tipo esperado: ${fileType}

Regras de extração:
- COMPROVANTES: valor, estabelecimento, data, forma de pagamento
- EXTRATOS: cada transação com data, descrição, valor, tipo (débito=expense/crédito=income)  
- NOTAS FISCAIS: emitente, itens principais, valor total, data
- PLANILHAS: identificar colunas de data, descrição e valor

Responda APENAS com JSON válido:
{
  "document_type": "receipt|statement|nf|spreadsheet",
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "nome do estabelecimento ou serviço",
      "amount": 0.00,
      "type": "income|expense"
    }
  ],
  "summary": "resumo em uma linha do que foi encontrado"
}
`
```

---

### `src/lib/ai/categorizer.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/server'
import { CATEGORIZATION_PROMPT } from './prompts'

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface CategorizationResult {
  category_id: string
  category_name: string
  confidence: number
  reasoning: string
  requires_confirmation: boolean
}

export async function categorizeTransaction(
  description: string,
  amount: number
): Promise<CategorizationResult> {
  const supabase = createServiceClient()
  
  const [{ data: categories }, { data: rules }, { data: memory }] = await Promise.all([
    supabase.from('categories').select('id, name, keywords, merchant_patterns').eq('is_active', true),
    supabase.from('category_rules').select('pattern, pattern_type, category_id').eq('is_active', true).order('priority', { ascending: false }),
    supabase.from('ai_memory').select('key, value').order('usage_count', { ascending: false }).limit(50)
  ])

  // 1. Tentar match por regras exatas primeiro (sem custo de API)
  const desc = description.toLowerCase()
  for (const rule of rules || []) {
    let matches = false
    switch (rule.pattern_type) {
      case 'exact':    matches = desc === rule.pattern.toLowerCase(); break
      case 'starts_with': matches = desc.startsWith(rule.pattern.toLowerCase()); break
      case 'contains': matches = desc.includes(rule.pattern.toLowerCase()); break
      case 'regex':    matches = new RegExp(rule.pattern, 'i').test(desc); break
    }
    if (matches) {
      const cat = categories?.find(c => c.id === rule.category_id)
      if (cat) {
        await supabase.from('category_rules').update({ match_count: supabase.rpc('increment', { row_id: rule.category_id }) }).eq('pattern', rule.pattern)
        return { category_id: cat.id, category_name: cat.name, confidence: 0.98, reasoning: 'Regra personalizada', requires_confirmation: false }
      }
    }
  }

  // 2. Chamar Claude apenas se necessário
  const response = await claude.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: CATEGORIZATION_PROMPT(description, amount, categories || [], memory || [])
    }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const result = JSON.parse(text.replace(/```json|```/g, '').trim())
  
  return {
    ...result,
    requires_confirmation: result.confidence < 0.70
  }
}
```

---

### `src/lib/ai/memory.ts`

```typescript
import { createServiceClient } from '@/lib/supabase/server'

export async function saveMemory(key: string, value: string, context?: string, memberId?: string) {
  const supabase = createServiceClient()
  
  await supabase.from('ai_memory').upsert({
    key: key.toLowerCase().trim(),
    value,
    context,
    source: 'user_taught',
    confirmed_by: memberId,
    last_used: new Date().toISOString()
  }, { onConflict: 'key' })
}

export async function saveRule(pattern: string, categoryId: string, patternType = 'contains') {
  const supabase = createServiceClient()
  
  await supabase.from('category_rules').upsert({
    pattern: pattern.toLowerCase().trim(),
    pattern_type: patternType,
    category_id: categoryId,
    priority: 10,
    is_active: true
  }, { onConflict: 'pattern' })
}

export async function getMemoryContext() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('ai_memory')
    .select('key, value')
    .order('usage_count', { ascending: false })
    .limit(100)
  return data || []
}
```

---

### `src/lib/telegram/bot.ts`

```typescript
import { Telegraf, Context } from 'telegraf'
import { message } from 'telegraf/filters'

if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN não definido')

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

// Middleware: registrar membro
bot.use(async (ctx, next) => {
  if (ctx.from) {
    const { createServiceClient } = await import('@/lib/supabase/server')
    const supabase = createServiceClient()
    await supabase.from('family_members').upsert({
      telegram_id: ctx.from.id,
      name: `${ctx.from.first_name}${ctx.from.last_name ? ' ' + ctx.from.last_name : ''}`,
    }, { onConflict: 'telegram_id', ignoreDuplicates: true })
  }
  return next()
})

export default bot
```

---

### `src/lib/telegram/handlers/messages.ts`

```typescript
import { Context } from 'telegraf'
import { createServiceClient } from '@/lib/supabase/server'
import { DINO_SYSTEM_PROMPT } from '@/lib/ai/prompts'
import { saveMemory, saveRule } from '@/lib/ai/memory'
import Anthropic from '@anthropic-ai/sdk'

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function handleTextMessage(ctx: Context & { message: { text: string } }) {
  const text = ctx.message.text
  const telegramId = ctx.from?.id
  
  const supabase = createServiceClient()
  
  // Buscar contexto completo
  const [{ data: categories }, { data: accounts }, { data: memory }, { data: rules }, { data: member }] = await Promise.all([
    supabase.from('categories').select('id, name, type, icon').eq('is_active', true),
    supabase.from('accounts').select('id, name, type').eq('is_active', true),
    supabase.from('ai_memory').select('key, value').limit(80),
    supabase.from('category_rules').select('pattern, category_id').eq('is_active', true),
    supabase.from('family_members').select('id, name, role').eq('telegram_id', telegramId).single()
  ])

  const systemPrompt = DINO_SYSTEM_PROMPT({
    categories: categories || [],
    accounts: accounts || [],
    memory: memory || [],
    rules: rules || [],
    familyName: process.env.NEXT_PUBLIC_FAMILY_NAME || 'Família'
  })

  // Enviar para Claude
  const response = await claude.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{ role: 'user', content: text }]
  })

  const responseText = response.content[0].type === 'text' ? response.content[0].text : ''
  
  // Tentar parsear ação estruturada
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      
      switch (parsed.action) {
        case 'create_transaction':
          // Verificar duplicata
          const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
          const { data: existing } = await supabase
            .from('transactions')
            .select('id, description, amount')
            .gte('created_at', twoDaysAgo)
            .eq('amount', parsed.data.amount)
          
          if (existing && existing.length > 0) {
            await ctx.reply(`⚠️ Parece duplicata! Já existe um lançamento de R$ ${parsed.data.amount} recente.\n\nConfirma mesmo assim? (responda "sim confirma" ou "não, cancela")`)
            return
          }
          
          await supabase.from('transactions').insert({
            ...parsed.data,
            created_by: member?.id,
            source: 'telegram'
          })
          await ctx.reply(parsed.message)
          break

        case 'learn_rule':
          await saveRule(parsed.data.pattern, parsed.data.category_id)
          await saveMemory(parsed.data.pattern, parsed.data.value, parsed.data.context, member?.id)
          await ctx.reply(parsed.message)
          break

        case 'ask_category':
          const { InlineKeyboard } = await import('grammy')
          // Usar reply com botões inline
          await ctx.reply(parsed.message, {
            reply_markup: {
              inline_keyboard: parsed.data.options.map((opt: { label: string; category_id: string }) => [{
                text: opt.label,
                callback_data: `cat_${opt.category_id}_${parsed.data.transaction_id}`
              }])
            }
          })
          break

        default:
          await ctx.reply(parsed.message || responseText)
      }
    } else {
      await ctx.reply(responseText)
    }
  } catch {
    await ctx.reply(responseText)
  }
}
```

---

### `src/lib/telegram/handlers/commands.ts`

```typescript
import { Context } from 'telegraf'
import { createServiceClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export async function commandStart(ctx: Context) {
  await ctx.reply(
    `🦕 Olá! Eu sou o *Dino*, seu assistente financeiro familiar!\n\n` +
    `Posso ajudar com:\n` +
    `💰 Registrar gastos e receitas\n` +
    `📋 Controlar contas a pagar\n` +
    `📊 Ver o saldo e orçamento\n` +
    `📄 Processar extratos e comprovantes\n\n` +
    `É só me contar! Ex: _"gastei 50 reais no mercado"_`,
    { parse_mode: 'Markdown' }
  )
}

export async function commandSaldo(ctx: Context) {
  const supabase = createServiceClient()
  const { data: accounts } = await supabase
    .from('accounts')
    .select('name, balance, type')
    .eq('is_active', true)
    .order('name')

  if (!accounts?.length) {
    await ctx.reply('📭 Nenhuma conta cadastrada ainda.')
    return
  }

  const total = accounts.reduce((sum, a) => sum + (a.balance || 0), 0)
  const lines = accounts.map(a =>
    `${a.type === 'credit' ? '💳' : '🏦'} ${a.name}: R$ ${a.balance?.toFixed(2)}`
  )

  await ctx.reply(
    `💰 *Saldo atual*\n\n${lines.join('\n')}\n\n*Total: R$ ${total.toFixed(2)}*`,
    { parse_mode: 'Markdown' }
  )
}

export async function commandContas(ctx: Context) {
  const supabase = createServiceClient()
  const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  const { data: bills } = await supabase
    .from('bills')
    .select('description, amount, due_date, type')
    .eq('status', 'open')
    .lte('due_date', sevenDaysLater)
    .order('due_date')

  if (!bills?.length) {
    await ctx.reply('✅ Nenhuma conta vencendo nos próximos 7 dias!')
    return
  }

  const lines = bills.map(b => {
    const emoji = b.type === 'payable' ? '🔴' : '🟢'
    const date = format(new Date(b.due_date), 'dd/MM', { locale: ptBR })
    return `${emoji} ${b.description} — R$ ${b.amount.toFixed(2)} (vence ${date})`
  })

  await ctx.reply(`📋 *Próximas contas (7 dias)*\n\n${lines.join('\n')}`, { parse_mode: 'Markdown' })
}

export async function commandOrcamento(ctx: Context) {
  const supabase = createServiceClient()
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]

  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, type, categories(name, icon, budget_monthly)')
    .gte('date', startOfMonth)
    .lte('date', endOfMonth)

  const totalIncome = transactions?.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0) || 0
  const totalExpense = transactions?.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0) || 0
  const result = totalIncome - totalExpense

  const emoji = result >= 0 ? '📈' : '📉'
  await ctx.reply(
    `📊 *Orçamento do mês*\n\n` +
    `✅ Receitas: R$ ${totalIncome.toFixed(2)}\n` +
    `❌ Despesas: R$ ${totalExpense.toFixed(2)}\n` +
    `${emoji} Resultado: R$ ${result.toFixed(2)}`,
    { parse_mode: 'Markdown' }
  )
}
```

---

### `src/app/api/telegram/webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { bot } from '@/lib/telegram/bot'
import { commandStart, commandSaldo, commandContas, commandOrcamento } from '@/lib/telegram/handlers/commands'
import { handleTextMessage } from '@/lib/telegram/handlers/messages'
import { message } from 'telegraf/filters'

// Registrar handlers
bot.command('start',     commandStart)
bot.command('saldo',     commandSaldo)
bot.command('contas',    commandContas)
bot.command('receber',   async (ctx) => { /* similar a commandContas mas type=receivable */ })
bot.command('orcamento', commandOrcamento)
bot.command('ajuda',     async (ctx) => ctx.reply('Use /start para ver o menu completo 🦕'))

bot.on(message('text'),     handleTextMessage)
bot.on(message('photo'),    async (ctx) => {
  await ctx.reply('📸 Recebi a imagem! Processando...')
  // Implementar: download da foto → enviar para Claude Vision → extrair transações
})
bot.on(message('document'), async (ctx) => {
  await ctx.reply('📄 Recebi o documento! Processando...')
  // Implementar: download do arquivo → processar conforme tipo → extrair transações
})

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-telegram-bot-api-secret-token')
    if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await req.json()
    await bot.handleUpdate(body)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

---

### `src/app/api/ai/categorize/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { categorizeTransaction } from '@/lib/ai/categorizer'

export async function POST(req: NextRequest) {
  const { description, amount } = await req.json()
  const result = await categorizeTransaction(description, amount)
  return NextResponse.json(result)
}
```

---

### `src/lib/sheets/client.ts`

```typescript
import { google } from 'googleapis'

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

export const sheets = google.sheets({ version: 'v4', auth })
export const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID!
```

### `src/lib/sheets/reader.ts`

```typescript
import { sheets, SPREADSHEET_ID } from './client'

export async function readTransactionsFromSheets(range = 'Lançamentos!A2:G') {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  })

  const rows = response.data.values || []
  return rows.map(row => ({
    date: row[0],
    description: row[1],
    amount: parseFloat(String(row[2]).replace(',', '.')),
    type: row[3] === 'R' ? 'income' : 'expense',
    category: row[4],
    account: row[5],
    synced: row[6] === 'SIM'
  })).filter(r => !r.synced && r.description && r.amount)
}
```

### `src/lib/sheets/writer.ts`

```typescript
import { sheets, SPREADSHEET_ID } from './client'

export async function writeTransactionToSheets(transaction: {
  date: string
  description: string
  amount: number
  type: string
  category: string
  account: string
}) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'App→Sheets!A:G',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        transaction.date,
        transaction.description,
        transaction.amount,
        transaction.type === 'income' ? 'R' : 'D',
        transaction.category,
        transaction.account,
        new Date().toLocaleString('pt-BR')
      ]]
    }
  })
}

export async function markAsSync(rowIndex: number) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Lançamentos!G${rowIndex + 2}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [['SIM']] }
  })
}
```

---

## DASHBOARD WEB — PÁGINAS

### Estrutura de layout `src/app/(dashboard)/layout.tsx`

Crie um layout com:
- Sidebar com navegação: Dashboard, Transações, Contas, Orçamento, Conciliação, Relatórios, Configurações
- Avatar do Dino no topo da sidebar (SVG inline verde, estilo Yoshi)
- Header com nome da família e usuário logado
- Área de conteúdo principal com scroll

### Página principal `src/app/(dashboard)/page.tsx`

**Scorecards (grid 2x2):**
- Saldo Total — soma de todas as contas ativas
- Receitas do mês — vs mês anterior (badge com % variação)
- Despesas do mês — barra de progresso vs orçamento
- Resultado do mês — receitas menos despesas

**Gráficos (Recharts):**
- `LineChart`: fluxo de caixa dos últimos 6 meses (receitas vs despesas)
- `PieChart`: despesas por categoria do mês atual
- `BarChart` horizontal: realizado vs planejado por categoria

**Tabelas/listas:**
- Próximas contas a vencer (7 dias) com badge de status
- Últimas 10 transações com categoria, valor e source (telegram/sheets/manual)

### Página `/transactions`
- Tabela com: data, descrição, categoria (badge colorido), conta, valor (verde/vermelho), status, source
- Filtros: período (date picker), categoria (select), conta (select), tipo, status, source
- Busca por descrição (debounced)
- Ação inline: clique na categoria para editar, botão confirmar, botão deletar
- Botão "Nova transação" (dialog com formulário)
- Botão "Importar CSV" (upload e processamento)

### Página `/bills`
- Duas abas: A Pagar | A Receber
- Cards por semana de vencimento
- Status colorido: aberto (azul), vencendo hoje (amarelo), vencido (vermelho), pago (verde)
- Ação: "Marcar como pago" (dialog com valor real e data)
- Botão "Nova conta" com opção de recorrência

### Página `/budget`
- Seletor de mês
- Grid de categorias com barra de progresso (realizado/planejado)
- Cores: verde < 80%, amarelo 80-100%, vermelho > 100%
- Clique na categoria: drawer com lista de transações do período
- Botão "Copiar do mês anterior"

### Página `/reconciliation`
- Seletor de conta + período
- Campo: "Saldo do extrato" (informado pelo usuário)
- Tabela de diferenças com transações não reconciliadas
- Checkbox para marcar como reconciliado
- Upload de extrato OFX/CSV para reconciliação automática

### Página `/reports`
- Seletor de tipo: Mensal | Por Categoria | Fluxo de Caixa | Anual
- Seletor de período
- Preview do relatório na tela (componente react-pdf)
- Botão "Exportar PDF"
- Histórico de relatórios gerados (com download)

### Página `/settings`
Abas:
- **Categorias**: CRUD, hierarquia, orçamento mensal padrão, cor, ícone
- **Regras**: criar/editar regras de categorização (pattern + categoria)
- **Memória do Dino**: ver e editar o que ele aprendeu, confirmar/rejeitar
- **Membros**: lista de membros com role, telegram_id, ativo/inativo
- **Contas**: gerenciar contas bancárias com saldo inicial
- **Google Sheets**: configurar ID da planilha e nome das abas
- **Integrações**: status de conexão Telegram, N8N, Sheets com badge verde/vermelho

---

## WORKFLOWS N8N

Importe os seguintes workflows via JSON no painel do N8N:

### Workflow 1 — Alertas de vencimento (diário às 8h)
```json
{
  "name": "Dino - Alertas de vencimento",
  "nodes": [
    { "type": "n8n-nodes-base.cron", "parameters": { "cronExpression": "0 8 * * *" } },
    { "type": "n8n-nodes-base.supabase", "parameters": { "operation": "getAll", "tableId": "bills", "filters": { "due_date": "lte.{{$now.plus(3, 'days').toISO()}}", "status": "eq.open" } } },
    { "type": "n8n-nodes-base.httpRequest", "parameters": { "url": "{{$env.NEXT_PUBLIC_APP_URL}}/api/n8n/webhook", "method": "POST" } }
  ]
}
```

### Workflow 2 — Sync Google Sheets (a cada 15 min)
```json
{
  "name": "Dino - Sync Sheets",
  "nodes": [
    { "type": "n8n-nodes-base.cron", "parameters": { "cronExpression": "*/15 * * * *" } },
    { "type": "n8n-nodes-base.httpRequest", "parameters": { "url": "{{$env.NEXT_PUBLIC_APP_URL}}/api/sheets/sync", "method": "POST" } }
  ]
}
```

### Workflow 3 — Relatório mensal (dia 1, 7h)
```json
{
  "name": "Dino - Relatório mensal",
  "nodes": [
    { "type": "n8n-nodes-base.cron", "parameters": { "cronExpression": "0 7 1 * *" } },
    { "type": "n8n-nodes-base.httpRequest", "parameters": { "url": "{{$env.NEXT_PUBLIC_APP_URL}}/api/reports/pdf", "method": "POST", "body": { "period": "last_month", "sendToTelegram": true } } }
  ]
}
```

### Workflow 4 — Contas recorrentes (dia 1 de cada mês)
```json
{
  "name": "Dino - Criar contas recorrentes",
  "nodes": [
    { "type": "n8n-nodes-base.cron", "parameters": { "cronExpression": "0 6 1 * *" } },
    { "type": "n8n-nodes-base.supabase", "parameters": { "operation": "getAll", "tableId": "bills", "filters": { "recurrence": "neq.none", "status": "neq.cancelled" } } }
  ]
}
```

---

## REGRAS DE NEGÓCIO OBRIGATÓRIAS

Implemente todas estas validações no backend:

```typescript
// 1. ANTI-DUPLICATA
// Bloquear se existir transação com mesmo valor (±2%) nas últimas 48h
// → Avisar usuário e pedir confirmação explícita

// 2. CONCILIAÇÃO
// status = 'reconciled' apenas quando valor do extrato === valor lançado (tolerância R$0,01)

// 3. ALERTA DE ORÇAMENTO
// Trigger no Supabase: ao inserir transaction, verificar se categoria atingiu 80% ou 100%
// → Enviar webhook para app → app envia Telegram

// 4. CONTAS RECORRENTES
// Workflow N8N dia 1: criar bills do mês com recurrence != 'none'

// 5. PERMISSÕES
// viewer  → apenas leitura (GET)
// member  → leitura + criar transações via Telegram
// admin   → acesso total incluindo configurações

// 6. PIPELINE DE CATEGORIZAÇÃO (ordem de prioridade)
// 1º: regras exatas do banco (category_rules)
// 2º: memória aprendida (ai_memory)  
// 3º: keywords das categorias
// 4º: Claude API (apenas se confiança < 85%)

// 7. AUDITORIA
// Todo UPDATE em transactions salva: updated_by, updated_at

// 8. CONFIANÇA DA IA
// < 70%  → sempre perguntar ao usuário
// 70-85% → sugerir e permitir rejeição fácil (botão "Outra categoria")
// > 85%  → lançar automaticamente com confirmação resumida
```

---

## CONFIGURAÇÃO DO WEBHOOK TELEGRAM

Após o deploy na Vercel, execute:

```bash
# Registrar webhook no Telegram
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://SEU-PROJETO.vercel.app/api/telegram/webhook",
    "secret_token": "'${TELEGRAM_WEBHOOK_SECRET}'"
  }'

# Verificar status do webhook
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
```

---

## GITHUB ACTIONS — CI/CD

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy Dino

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check

  deploy:
    needs: lint-and-type-check
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

Secrets necessários no GitHub (Settings → Secrets → Actions):
- `VERCEL_TOKEN` — Vercel → Account Settings → Tokens
- `VERCEL_ORG_ID` — Vercel → Settings → General → Team ID
- `VERCEL_PROJECT_ID` — `.vercel/project.json` após `vercel link`

---

## ORDEM DE IMPLEMENTAÇÃO

Siga estritamente esta ordem. Confirme cada etapa antes de avançar:

```
Etapa 1  → Setup do repositório e estrutura de pastas (Passo 0)
Etapa 2  → Solicitar e configurar todas as variáveis de ambiente
Etapa 3  → Executar migration do banco de dados no Supabase
Etapa 4  → Implementar lib/supabase (client + server)
Etapa 5  → Implementar lib/ai (prompts + categorizer + memory)
Etapa 6  → Implementar lib/telegram (bot + handlers)
Etapa 7  → Implementar API route do webhook Telegram
Etapa 8  → Implementar lib/sheets (client + reader + writer)
Etapa 9  → Implementar API route de sync com Sheets
Etapa 10 → Layout do dashboard + página principal com scorecards
Etapa 11 → Página de transações com tabela e filtros
Etapa 12 → Página de contas a pagar/receber
Etapa 13 → Página de orçamento
Etapa 14 → Página de conciliação
Etapa 15 → Página de relatórios com exportação PDF
Etapa 16 → Página de configurações (todas as abas)
Etapa 17 → Deploy na Vercel + configurar webhook Telegram
Etapa 18 → Configurar N8N no Railway + importar workflows
Etapa 19 → GitHub Actions para CI/CD
Etapa 20 → Testes end-to-end e ajustes finais
```

---

## NOTAS FINAIS

- **Todo texto da interface em português brasileiro**
- **Usar Server Components do Next.js onde possível**
- **Implementar loading states em todas as ações assíncronas**
- **Error boundaries em todas as páginas**
- **O avatar do Dino** (dinossauro verde estilo Yoshi, com casquinha vermelha e moedinha na mão) deve aparecer: no topo da sidebar do dashboard, na tela de boas-vindas do Telegram (/start), e no favicon/og:image
- **Responsividade**: o dashboard deve funcionar em mobile (membros da família podem acessar pelo celular)
- **Dark mode**: suporte completo via Tailwind `dark:`

---

*Documento gerado para o projeto Dino — Assistente Financeiro Familiar*  
*Repositório: github.com/[seu-usuario]/dino (privado)*
