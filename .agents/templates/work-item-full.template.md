# Work Item (Full)

> Use este template apenas quando a tarefa realmente exigir rastreamento detalhado por fase,
> múltiplas sessões, handoff frequente ou coordenação fina entre frentes.
> Se a tarefa couber no fluxo normal da sessão, prefira `.agents/templates/work-item.template.md`.
> Mesmo no modo full, evite duplicar changelog, commits, tickets ou documentação durável.
> Quando a tarefa terminar e o conteúdo relevante já tiver sido promovido, colapse este
> arquivo para um stub curto ou arquive-o localmente; não mantenha uma segunda narrativa completa.
> Antes da resposta final de uma sessão que usou este item, reconcilie o status:
> feche, cancele, interrompa ou deixe ativo com handoff concreto.

## 1. Metadados

- título:
- slug:
- status: ativo | bloqueado | interrompido | concluído | cancelado
- modo: full
- criado em:
- atualizado em:
- branch:

## 2. Motivo de existência

- gatilho de continuidade: compaction provável | pausa/handoff | investigação observacional | artefatos locais |
  skip/desvio relevante | outro
- motivo factual:

## 3. Objetivo e contexto factual

- objetivo:
- fatos confirmados:
- restrições já conhecidas:
- artefatos locais / evidências efêmeras:
- sidecar local de assets: `.agents/work-items/YYYY-MM/AAAAMMDD-{slug}.work-item.assets/` | ausente
- artefatos estruturados opcionais no sidecar: `task-plan.json` (derivado de `implementation-planning`, quando útil) |
  `test-report.json` | `review-links.json` | ausentes
- artefatos de fase no sidecar: quando houver mais de um plano ou design no mesmo `work-item.assets/`, use naming por
  fase no basename e front matter ou metadata equivalente com `fase`, `status` (futuro | aprovado | implementado |
  invalidado | equivalente local) e relação de substituição | ausente

## 4. Estado por fase

### Diagnóstico

- status: não iniciado | em andamento | concluído | não aplicável
- resumo canônico:
- referência:

### Design

- status: não iniciado | em andamento | concluído | não aplicável
- resumo canônico:
- referência:

### Plano

- status: não iniciado | em andamento | concluído | não aplicável
- resumo canônico:
- referência:

### Testes

- status: não iniciado | em andamento | concluído | não aplicável
- resumo canônico:
- referência:

### Execução

- status: não iniciado | em andamento | concluído
- resumo canônico:
- referência:

### Verificação

- status: não iniciado | em andamento | concluído | não aplicável
- resumo canônico:
- referência:

## 5. Skips e desvios

### Skips

- fase/prompt:
- motivo:
- registrado em:

### Desvios decididos

- desvio:
- impacto:
- motivo:
- registrado em:

### Desvios silenciosos identificados depois

- desvio:
- impacto:
- ação necessária:

## 6. Estado atual e handoff

- estado atual:
- próximo passo:
- bloqueios:
- pendências:
- decisões recentes:
- skips/desvios ainda relevantes:
- pronto para retomar quando:

## 7. Promoção e fechamento

- levar ao changelog:
- promover para `docs/`:
- elegível para colapso após promoção? sim | não | ainda não
- motivo para manter localmente:
- reter localmente? não | sim
- motivo da retenção local:
- referência do changelog / artefato durável:
- sidecar promovido para artefato durável:
