# Monorepo Adventure Labs

O repositório **dino** é a fonte da verdade do código.

No repositório **adventure-labs**, o caminho `tools/dino` é um **git submodule**:

```bash
git submodule update --init tools/dino
```

Documentação no monorepo: `knowledge/06_CONHECIMENTO/dino-repo-e-submodulo.md`.

Commits de feature: preferir no repo **dino**; no monorepo, atualizar o ponteiro do submodule quando quiser fixar a versão para o time.
