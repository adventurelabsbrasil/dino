# Deploy (Vercel + Supabase)

## Vercel

1. Importar o repositório **adventurelabsbrasil/dino** (root = raiz do app).
2. Variáveis de ambiente (Production):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_FAMILY_NAME` (opcional)
   - `NEXT_PUBLIC_APP_URL` = URL `.vercel.app` (útil para integrações futuras)

## Supabase — URLs de auth

Após o primeiro deploy:

**Authentication → URL Configuration**

- **Site URL:** `https://seu-app.vercel.app`
- **Redirect URLs:** inclua `https://seu-app.vercel.app/**` e mantenha `http://localhost:3000/**` para dev.

## CI/CD

Automatizar lint/type-check (e deploy) via GitHub Actions: ver issue **#19** e `DINO_MASTER_PROMPT.md`.
