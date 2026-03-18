# Dino — MVP (finanças da família)

App **standalone** em Next.js 14 + Supabase: login, painel com resumo do mês, gráficos (Recharts) e CRUD de transações.

Especificação completa futura: [DINO_MASTER_PROMPT.md](./DINO_MASTER_PROMPT.md).

## Pré-requisitos

- Node 20+
- Projeto **Supabase dedicado** ao Dino (não usar tabelas `adv_*` do Admin Adventure Labs)

## 1. Banco de dados

No Supabase: **SQL Editor** → cole e execute o arquivo:

`supabase/migrations/20250318220000_initial_mvp.sql`

Ou, com CLI Supabase:

```bash
supabase db push
```

Ative **Authentication → Providers → Email** (senha). Ajuste confirmação de e-mail conforme preferir (desativar confirmação facilita o primeiro teste local).

## 2. Ambiente

```bash
cp .env.example .env.local
```

Preencha **`NEXT_PUBLIC_SUPABASE_URL`** e **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** (Supabase → Settings → API). Isso já basta para desenvolver e usar o app.

**`NEXT_PUBLIC_APP_URL`:** não é obrigatória no MVP (nada no código depende dela agora). Depois que você subir o repo no GitHub, ligar o projeto na **Vercel** e receber a URL (`https://seu-projeto.vercel.app`), aí sim vale definir essa variável na Vercel — útil para integrações futuras (N8N, Telegram, etc.).

## 3. Rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) → cadastro/login.

No **primeiro acesso**, o app cria:

- registro em `family_members` (primeiro usuário = `admin`);
- conta padrão **Principal**.

Demais usuários entram como `member` e compartilham os mesmos dados (uma família por projeto Supabase).

## Scripts

| Comando        | Descrição      |
|----------------|----------------|
| `npm run dev`  | Desenvolvimento |
| `npm run build`| Build produção |
| `npm run lint` | ESLint         |
| `npm run type-check` | `tsc --noEmit` |

## Deploy (Vercel)

1. Push do `tools/dino` (ou monorepo com **Root Directory** = `tools/dino` na Vercel).
2. Mesmas variáveis: Supabase URL + anon key (+ `NEXT_PUBLIC_FAMILY_NAME` se quiser).
3. **Só após o primeiro deploy:** copie a URL de produção e defina `NEXT_PUBLIC_APP_URL` no painel da Vercel (opcional até você precisar de webhooks/integrações).

## Backlog (fora do MVP)

Conforme [DINO_MASTER_PROMPT.md](./DINO_MASTER_PROMPT.md):

- Bot **Telegram** + webhook
- **N8N** (Railway) — alertas, sync Sheets, relatórios agendados
- **Google Sheets** sync
- Conciliação OFX, **relatórios PDF**
- Pipeline **Claude** / `ai_memory` / anti-duplicata 48h

## Segurança

- Credenciais apenas em `.env.local` (gitignored).
- RLS ativo: usuários autenticados compartilham contas/transações deste projeto; cada um só insere/atualiza a própria linha em `family_members`.
