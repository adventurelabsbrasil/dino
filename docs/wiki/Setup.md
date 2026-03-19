# Setup (desenvolvimento)

## Requisitos

- Node 20+
- Conta [Supabase](https://supabase.com) (projeto dedicado ao Dino)

## Passos

1. Clone o repositório e instale dependências:
   ```bash
   git clone https://github.com/adventurelabsbrasil/dino.git
   cd dino
   npm install
   ```

2. Copie `.env.example` → `.env.local` e preencha:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_FAMILY_NAME` (opcional)

3. No Supabase, execute a migration:
   - `supabase/migrations/20250318220000_initial_mvp.sql` (SQL Editor)

4. Auth: **Email** provider habilitado; ajuste confirmação de e-mail conforme necessidade.

5. Rode:
   ```bash
   npm run dev
   ```
   Acesse `http://localhost:3000`.

## Scripts

| Comando | Função |
|---------|--------|
| `npm run dev` | Desenvolvimento |
| `npm run build` | Build produção |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript |
