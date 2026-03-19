# Publicar a Wiki no GitHub

## Passo obrigatório (uma vez)

O GitHub **só cria** o repositório da Wiki depois da **primeira página na web**:

1. **Settings → Features → Wikis** (ligado)
2. Aba **[Wiki](https://github.com/adventurelabsbrasil/dino/wiki)** → **Create the first page** → título `Home` → qualquer texto → **Save Page**

Sem o passo 2, `git clone …dino.wiki.git` falha com “repository not found”.

## Publicar a partir deste repositório

Os arquivos-fonte ficam em **`docs/wiki/`**. Para copiar para a Wiki:

```bash
# Na raiz do repo dino, após habilitar Wikis:
chmod +x scripts/publish-wiki.sh
./scripts/publish-wiki.sh
```

Ou manualmente:

```bash
git clone https://github.com/adventurelabsbrasil/dino.wiki.git
cp docs/wiki/*.md dino.wiki/
cd dino.wiki
git add -A
git commit -m "docs: sync wiki"
git push
```

Edits futuros: altere `docs/wiki/`, rode o script de novo (ou edite direto na Wiki no GitHub — o script sobrescreve com o que está no repo se você rodar de novo).

## Sidebar da Wiki

No GitHub, **Wiki → Edit sidebar** e adicione por exemplo:

```markdown
* [Home](Home)
* [Projeto GitHub](Projeto-GitHub)
* [Visão geral](Visão-geral)
* [Setup](Setup)
* [Arquitetura](Arquitetura)
* [Deploy](Deploy)
* [Roadmap](Roadmap)
* [Monorepo](Monorepo)
```
