# Work Item

> Artefato operacional local e efêmero para continuidade, compaction e handoff.
> Use este template por padrão. Só migre para `.agents/templates/work-item-full.template.md`
> quando a tarefa realmente exigir rastreamento detalhado por fase.
> Não substitui `.agents/changelogs/` nem `docs/`.
> Quando a tarefa terminar e o conteúdo relevante já tiver sido promovido, colapse este
> arquivo para um stub curto ou arquive-o localmente; não mantenha uma narrativa paralela
> sem valor operacional residual.
> Antes da resposta final de uma sessão que usou este item, reconcilie o status:
> feche, cancele, interrompa ou deixe ativo com handoff concreto.

## 1. Metadados

- título:
- slug:
- status: ativo | bloqueado | interrompido | concluído | cancelado
- modo: lite
- criado em:
- atualizado em:
- branch:

## 2. Motivo de existência

- gatilho de continuidade: compaction provável | pausa/handoff | investigação observacional | artefatos locais |
  skip/desvio relevante | outro
- motivo factual:

## 3. Contexto factual mínimo

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

## 4. Estado atual e continuidade

- estado atual:
- próximo passo:
- bloqueios:
- pendências:
- decisões recentes:
- pronto para retomar quando:

## 5. Skips e desvios relevantes

- skips registrados:
- desvios decididos:
- desvios silenciosos identificados depois:

## 6. Promoção e fechamento

- levar ao changelog:
- promover para `docs/`:
- elegível para colapso após promoção? sim | não | ainda não
- motivo para manter localmente:
- reter localmente? não | sim
- motivo da retenção local:
- referência do changelog / artefato durável:
- sidecar promovido para artefato durável:
