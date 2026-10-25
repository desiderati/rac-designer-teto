---
title: "Contrato da Base de Conhecimento"
doc_role: repository-knowledge-contract
---

# Base de Conhecimento

Este repositório pode usar a base de conhecimento compartilhada da SAT por meio da skill global
`knowledge-base`.

## Ativação

No início de uma sessão de desenvolvimento não trivial, carregue o contexto ativo manualmente:

```powershell
python ~/.codex/skills/knowledge-base/scripts/knowledge_base.py context --project .
```

## Comandos Manuais

```powershell
python ~/.codex/skills/knowledge-base/scripts/knowledge_base.py drift --project .
python ~/.codex/skills/knowledge-base/scripts/knowledge_base.py validate
python ~/.codex/skills/knowledge-base/scripts/knowledge_base.py update
```

Capture candidatos apenas quando houver evidência concreta no repositório:

```powershell
python ~/.codex/skills/knowledge-base/scripts/knowledge_base.py capture --project . --type decision --title "Decision title" --evidence path/to/evidence
```

## Contrato

- Caminho de Windows registrado no bootstrap: `C:\Users\felipe.desiderati_sa\.codex\knowledge-base`.
  É uma referência histórica externa ao projeto; o diretório efetivo deve ser resolvido pela
  configuração da skill `knowledge-base` no ambiente corrente, sem pressupor esse caminho no macOS.

- Esta KB compartilhada é opcional e distinta da documentação durável do produto, mantida em
  [docs/](docs/README.md), [DESIGN.md](DESIGN.md) e [OBSIDIAN.md](OBSIDIAN.md). Uma curadoria local
  não executa captura, atualização ou sincronização da base central.

- Repositório central: `git@bitbucket.org:satsistemadeapontamentos/sat-knowledge-base.git`

- Stacks detectadas no bootstrap: `universal, react, typescript, vite`

- Verificações e relatórios de drift são apenas manuais.

- Achados são contexto consultivo; eles não bloqueiam implementação.

- Capturas criam candidatos locais e não escrevem diretamente na KB central.
