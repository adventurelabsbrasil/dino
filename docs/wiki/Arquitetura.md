# Arquitetura

## Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind, shadcn/ui (Base UI), Recharts
- **Backend / dados:** Supabase (Postgres, Auth, RLS)
- **Deploy:** Vercel (recomendado)

## Pastas principais

```
src/app/(dashboard)/   # Painel autenticado
src/app/login/         # Auth
src/lib/supabase/      # Client browser + server + middleware
src/lib/auth/          # ensureFamilyMember (primeiro acesso)
src/components/        # UI
supabase/migrations/   # SQL versionado
```

## Auth e sessão

- Middleware atualiza sessão Supabase e redireciona não autenticados para `/login`.
- Após primeiro login, cria linha em `family_members` e conta **Principal** se for o primeiro usuário.

## RLS

Políticas atuais: usuários autenticados compartilham `accounts` e `transactions`; cada um gerencia só a própria linha em `family_members`. Evoluir para roles (viewer/member/admin) está no plano (issue #18).

## Monorepo

O repositório **dino** é standalone; no monorepo Adventure Labs aparece como **submodule** em `tools/dino`. Ver [Monorepo](Monorepo).
