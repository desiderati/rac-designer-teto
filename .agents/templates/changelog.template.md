---
title: "Changelog - AAAA-MM-DD"
artifact_role: changelog
durable_curation:
  schema_version: 1
  default_classification: untriaged
  default_promotion_plan: untriaged
  entries: []
---

<!-- Destino obrigatório: .agents/changelogs/YYYY-MM/AAAAMMDD.changelog.md. O título usa
AAAA-MM-DD apenas para exibição; não criar arquivos soltos em .agents/changelogs/. -->

# Changelog - AAAA-MM-DD

---

## [HH:MM] Título objetivo da entrada

### Branch do projeto

- `nome-da-branch`

### Tipo

- investigação
- correção
- documentação

### Origem da demanda

- solicitação interna

### Escopo afetado

- módulo ou área impactada

### Contexto

Descrever o problema, objetivo ou decisão no contexto técnico correto.

### Sintoma observado

Descrever o comportamento, lacuna ou necessidade que motivou a ação.

### Impacto

- ambiente:
- serviço:
- módulo:
- risco operacional:

### Hipóteses consideradas

- hipótese 1
- hipótese 2

### Evidências

- evidência 1
- evidência 2

### Causa raiz

Descrever a causa raiz confirmada. Se ainda houver incerteza, registrar o melhor entendimento atual
e o que falta validar.

### Decisão tomada

Descrever a decisão realmente adotada.

### Alterações realizadas

- caminho/arquivo

### Validação

- comando executado
- evidência observada

### Regressão?

- não

### Necessita documentação derivada?

- não

### Curadoria estruturada

- fonte primária: work-item correlato quando existir; caso contrário, frontmatter
  `durable_curation.entries`

- classificação: untriaged | sem_promocao | conhecimento_duravel_novo |
  conhecimento_duravel_complementar | candidato_adr | candidato_refactoring

- plano de promoção: untriaged | claro_seguro | pendente_revisao | nao_se_aplica

- destino durável:

- requer operador:

### Necessita atualização de runbook?

- não

### Riscos ou pendências

- pendência 1

### Próximos passos

- próximo passo 1

### Tags

#tag1 #tag2
