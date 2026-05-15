---
title: "Contrato da Base de Conhecimento"
doc_role: repository-knowledge-contract
---

# Base de Conhecimento

Este repositório pode usar a base de conhecimento compartilhada da SAT por meio
da skill global `knowledge-base-injector`.

## Ativação

No início de uma sessão de desenvolvimento não trivial, carregue o contexto
ativo manualmente:

```powershell
python ~/.codex/skills/knowledge-base-injector/scripts/knowledge_base_injector.py inject --project .
```

## Comandos Manuais

```powershell
python ~/.codex/skills/knowledge-base-injector/scripts/knowledge_base_injector.py drift --project .
python ~/.codex/skills/knowledge-base-injector/scripts/knowledge_base_injector.py validate-kb
python ~/.codex/skills/knowledge-base-injector/scripts/knowledge_base_injector.py update-kb
```

Capture candidatos apenas quando houver evidência concreta no repositório:

```powershell
python ~/.codex/skills/knowledge-base-injector/scripts/knowledge_base_injector.py capture --project . --type decision --title "Decision title" --evidence path/to/evidence
```

## Contrato

- Caminho local da KB: `C:\Users\felipe.desiderati_sa\.codex\knowledge-base`
- Repositório central: `git@bitbucket.org:satsistemadeapontamentos/sat-knowledge-base.git`
- Stacks detectadas no bootstrap: `react, typescript, vite`
- Verificações e relatórios de drift são apenas manuais.
- Achados são contexto consultivo; eles não bloqueiam implementação.
- Capturas criam candidatos locais e não escrevem diretamente na KB central.
