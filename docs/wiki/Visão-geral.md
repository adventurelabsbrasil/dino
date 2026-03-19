# Visão geral

## Missão

Bot e painel web para a **família** registrar gastos/receitas, orçamento, contas a pagar, conciliação e relatórios — com apoio de IA e automações (Sheets, N8N, Telegram), conforme [DINO_MASTER_PROMPT.md](https://github.com/adventurelabsbrasil/dino/blob/main/DINO_MASTER_PROMPT.md).

## Estado atual (MVP)

- Login (e-mail/senha, Supabase Auth)
- Painel: KPIs do mês, gráficos (Recharts), últimas transações
- CRUD de transações com filtros
- Uma “família” por projeto Supabase; membros com `user_id` em `family_members`

## Próximas grandes entregas

Ver issues com label **`plano-dino`** e o épico **#22**: Telegram, pipeline Claude, Sheets, N8N, bills, orçamento, PDF, settings, CI/CD.

## Idioma

Interface e documentação voltadas ao **pt-BR**.
