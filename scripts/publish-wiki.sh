#!/usr/bin/env bash
# Publica docs/wiki/*.md na GitHub Wiki do repositório dino.
# Pré-requisito: Wikis habilitadas em Settings → Features.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WIKI_URL="https://github.com/adventurelabsbrasil/dino.wiki.git"
TMP="${TMPDIR:-/tmp}/dino-wiki-$$"
mkdir -p "$TMP"
if ! git clone "$WIKI_URL" "$TMP" 2>/dev/null; then
  echo "Não foi possível clonar a Wiki."
  echo "1. No GitHub: aba **Wiki** → **Create the first page** → título ex.: Home → Save Page."
  echo "   (Sem isso o repositório .wiki.git não existe — limitação do GitHub.)"
  echo "2. Rode este script de novo: ./scripts/publish-wiki.sh"
  exit 1
fi
cp "$ROOT/docs/wiki/"*.md "$TMP/"
cd "$TMP"
git add -A
if git diff --staged --quiet; then
  echo "Nada a commitar."
  exit 0
fi
git commit -m "docs(wiki): sync from repo docs/wiki"
git push
echo "Wiki atualizada."
