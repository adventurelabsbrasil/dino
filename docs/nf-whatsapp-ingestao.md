# Ingestão de NFs via WhatsApp → Dino (desenho)

> Status: **desenho aprovado** — pronto para virar plano de execução (Fase 0).
> Contexto: registrar Notas Fiscais enviadas no grupo de WhatsApp "Dino" (finanças
> pessoais), com granularidade **item a item**, para permitir consultas detalhadas
> e agregadas (ex.: *"quanto gastamos em erva mate este ano?"*) e, futuramente,
> conciliação **cartão × item**.

## Decisões tomadas

| Tema | Decisão |
|------|---------|
| Onde roda a ingestão | **Serviço próprio na VPS** (`dino-ingestor`), ao lado do Evolution API |
| Confirmação no grupo | **Grava como `pending` + pede 👍** (reação ou "ok" confirma) |
| Arquivo original (foto/PDF/XML) | **Supabase Storage** (bucket `nfs`, URLs assinadas) |
| Granularidade | **Item a item desde a Fase 0**, com normalização para catálogo canônico |
| UF | **RS** (Rio Grande do Sul) — SEFAZ via SVRS; programa **Nota Fiscal Gaúcha (NFG)** |

## Arquitetura

```
Grupo WhatsApp "Dino"
        │  (foto da NF / QR / chave de 44 díg. / PDF)
        ▼
Evolution API (VPS) ──webhook MESSAGES_UPSERT──► dino-ingestor (VPS)
                                                      │
                              valida token + filtra remoteJid do grupo (@g.us)
                                                      │
        ┌─────────────────────────────────────────────┼───────────────────────────┐
        ▼                         ▼                     ▼                            ▼
  Supabase Storage        Claude API            consulta SEFAZ/SVRS          Supabase (service_role)
  (arquivo original)   (extração/normalização)  (itens oficiais p/ chave)    (nf_documents + nf_items)
        │
        └──── resposta no grupo: "✅ NF registrada (pendente)… 👍 confirma?"
```

- **Stack:** Node 20 + Fastify + `@supabase/supabase-js` + `@anthropic-ai/sdk`. PM2 ou Docker, TLS pelo mesmo proxy que já serve o Evolution.
- **Segurança:** header secreto validado no ingestor; processa **apenas** mensagens cujo `key.remoteJid` é o JID do grupo Dino.

## Fluxo de processamento

```
1. Webhook → valida token → é do grupo Dino? senão ignora.
2. Identifica o tipo: imagem / documento(PDF) / texto.
3. Baixa a mídia → Supabase Storage (bucket nfs) → image_url / xml_url.
4. Acha a CHAVE DE ACESSO (44 díg.), em ordem:
     a) QR code na imagem (decodifica → URL SVRS contém a chave)
     b) regex \d{44} no texto
     c) senão → marca "sem_chave"
5. Extração dos itens:
     • COM chave → consulta SEFAZ/SVRS → itens oficiais (descrição, qtd, unidade,
       valor unitário, NCM, GTIN quando disponível)
     • SEM chave → Claude vision (fallback) → itens estimados (entram como pending)
6. Normaliza cada item → products (ver abaixo).
7. Anti-duplicata: dedup_hash = chave_acesso, ou sha1(emitente+valor+data) sem chave.
8. Grava nf_documents + nf_items (status = 'pending').
9. Responde no grupo com resumo + pede 👍.
```

### Confirmação / correção
- **Confirma:** reação 👍 (evento `messages.reaction`) ou resposta "ok" → `status = 'confirmed'`.
- **Corrige:** resposta em texto (ex.: "categoria transporte", "valor 152,90") → ingestor aplica o ajuste. Começa simples (categoria/valor), evolui depois.
- **Baixa confiança:** se `extraction_confidence < 0.7`, a resposta avisa para conferir antes do 👍.

## Modelo de dados

A `transactions` existente **não muda**: ela representa o **pagamento** (o que bate no
cartão/conta). A NF a **enriquece** via `transaction_id`, detalhando **o que** foi comprado.

```sql
create table public.nf_documents (
  id uuid primary key default gen_random_uuid(),
  chave_acesso text unique,                    -- 44 díg. (null se só foto)
  emitente_nome text, emitente_cnpj text, uf text,
  cpf_na_nota text,                            -- null quando não há CPF na nota
  total_amount numeric(12,2) not null,
  issued_at date,
  source_type text check (source_type in ('nfce','nfe','sat','foto')) default 'foto',
  image_url text, xml_url text,                -- Supabase Storage
  raw_json jsonb not null default '{}',        -- consulta SEFAZ / extração
  transaction_id uuid references public.transactions(id),  -- pagamento (cartão/conta)
  wa_message_id text, status text default 'pending',
  dedup_hash text, created_at timestamptz default now()
);

create table public.nf_items (
  id uuid primary key default gen_random_uuid(),
  nf_id uuid not null references public.nf_documents(id) on delete cascade,
  line_no int,
  raw_description text not null,               -- como veio na nota
  gtin text, ncm text,
  quantity numeric(12,3), unit text,
  unit_price numeric(12,4), total_price numeric(12,2) not null,
  product_id uuid references public.products(id),  -- canônico (null = pendente)
  category_id uuid references public.categories(id),
  metadata jsonb not null default '{}'
);

create table public.products (                 -- catálogo canônico
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,                -- ex.: "Erva Mate"
  category_id uuid references public.categories(id),
  ncm_default text,
  aliases text[] default '{}', gtins text[] default '{}',
  created_at timestamptz default now()
);

create index on public.nf_items (product_id);
create index on public.nf_documents (issued_at);
-- RLS: mesmo padrão do MVP (authenticated = família) + acesso service_role p/ o ingestor.
-- Anti-duplicata forte (opcional, fase posterior): índice único em chave_acesso (já é unique)
-- e índice parcial em dedup_hash.
```

> Sobre o XML: o XML autorizado nem sempre é acessível ao **consumidor** (em geral só o
> emitente, ou via portal com **certificado digital**). Quando der, guarda em `xml_url`;
> quando não der, guarda o JSON da consulta + a foto. Para as consultas de item, o JSON da
> consulta SVRS já basta — não dependemos do XML.

## Normalização (o que viabiliza "quanto de erva mate")

Para "ERVA MATE BARÃO 1KG", "Erva-mate Pikage", "CHIMARRAO ERVA 500G" virarem **um** produto somável:

```
Para cada item, na ordem:
 1. GTIN bate com products.gtins?      → vincula direto (exato)
 2. NCM + descrição parecida?          → vincula / sugere
 3. Claude normaliza a descrição       → nome canônico + categoria
    └─ usa ai_memory (já existe no schema) p/ aprender apelidos
 4. Confiança baixa                     → item fica pendente p/ confirmação (👍)
```

O `ai_memory` aprende com cada confirmação: uma vez que "ERVA MATE BARÃO 1KG → Erva Mate"
é aceito, não erra mais. **O sistema aprende com o uso.**

## Consultas que o modelo destrava

```sql
-- "Quanto gastamos em erva mate este ano?"
SELECT SUM(i.total_price) AS total, SUM(i.quantity) AS qtd
FROM nf_items i
JOIN products p ON p.id = i.product_id
JOIN nf_documents d ON d.id = i.nf_id
WHERE p.canonical_name = 'Erva Mate'
  AND d.issued_at >= date_trunc('year', now());
```

- **Agregada:** total por produto/categoria/período.
- **Detalhada:** cada compra, loja, data, preço unitário (e onde estava mais barata).
- **Conciliação cartão × item:** `transactions` (fatura, `source='extract'`) ⋈ `nf_documents`
  por valor + data + estabelecimento → abre os itens de cada lançamento do cartão.

## Roadmap

### Fase 0 — Ingestão WhatsApp + itens normalizados (próximo passo)
Webhook Evolution → Storage → extração (QR/regex/Claude) → `nf_documents` + `nf_items`
normalizados → `pending` + 👍 no grupo. Cobre o caso "manda a NF e registra", **inclusive
sem CPF na nota** (a extração não depende de CPF).

### Fase 1 — Itens oficiais por chave (SEFAZ/SVRS — RS)
Com a chave de 44 díg., consulta o portal **SVRS** (a URL do QR da NFC-e gaúcha já aponta
para lá) e substitui a estimativa do vision pelos itens oficiais (NCM/GTIN/valores reais).

### Fase 2 — Puxar tudo pelo CPF (RS)
RS tem a **Nota Fiscal Gaúcha (NFG)**, onde o CPF acumula as notas — caminho real para
listar/baixar todas as notas vinculadas ao CPF (login gov.br / cadastro NFG). Avaliar também
e-CAC/gov.br. Requer autenticação; é a fase mais sensível e dependente de portal.

## Pontos de atenção
- **CPF na nota não é requisito** para registrar — só importa na Fase 2 (vincular ao CPF).
- **Anti-duplicata** por chave (forte) ou hash emitente+valor+data (sem chave).
- **Segurança do webhook:** token + filtro do JID do grupo são obrigatórios.
