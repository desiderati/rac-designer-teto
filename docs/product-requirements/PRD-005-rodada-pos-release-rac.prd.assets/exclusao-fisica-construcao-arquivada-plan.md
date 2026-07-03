---
title: Plano de Execução - Exclusão Física Com Cascata
doc_type: execution-plan
doc_set: product-requirements
prd: PRD-005
status: planned
lang: pt-BR
---

# Plano de Execução - Exclusão Física Com Cascata

## 1. Resumo de Contexto

O produto passará a permitir exclusão física local em três situações controladas:
Construção TETO `Arquivada`, casa `Arquivada` e monitor `Inativo`. Cada exclusão remove
fisicamente o item alvo e todos os dados abaixo dele em cascata.

A decisão aprovada é não abrir exclusão granular dentro de construção arquivada. Casas e monitores
podem ser excluídos fisicamente apenas em construções navegáveis, desde que a casa esteja
`Arquivada` ou o monitor esteja `Inativo`.

## 2. Objetivo

Implementar ações destrutivas, explícitas e confirmadas para excluir definitivamente:

- uma Construção TETO arquivada, removendo toda a construção e seus dados filhos;
- uma casa arquivada em construção navegável, removendo seus dados filhos e a família quando ela não
  for referenciada por outra casa;
- um monitor inativo em construção navegável, removendo os dados próprios do monitor.

## 3. Escopo

### Incluso

- Exibir ação `Excluir definitivamente` para Construções TETO com status `Arquivada`.
- Exibir ação `Excluir definitivamente` para casas `Arquivadas` em construção navegável.
- Exibir ação `Excluir definitivamente` para monitores `Inativos` em construção navegável.
- Confirmar cada exclusão com aviso de ação permanente, local e sem desfazer.
- Remover fisicamente o `ConstructionSiteState` da sessão local ao excluir construção.
- Remover fisicamente a casa e seus dados agregados ao excluir casa.
- Remover fisicamente o monitor ao excluir monitor.
- Resolver seleção e disponibilidade do Canvas depois da exclusão.
- Atualizar regras de negócio em `BUS-010` e `BUS-011`.
- Cobrir a regra em testes de sessão, porta/controlador e UI.

### Fora Do Escopo

- Exclusão física de construção `Em andamento` ou `Concluída`.
- Exclusão granular dentro de construção arquivada.
- Lixeira, desfazer, recuperação ou histórico de restauração.
- Backend remoto, sincronização, permissões por perfil, auditoria externa ou deploy.
- Alterar regras de arquivamento, desarquivamento, inativação ou reativação.

## 4. Premissas e Restrições

### Premissas

- A persistência atual é local e grava a lista de `ConstructionSiteState`.
- Remover a construção da lista remove todos os dados filhos porque casas, famílias, monitores e
  comunidades estão agregados dentro do estado da construção.
- Remover uma casa remove o `PersistedHouseRecord`, incluindo documento RAC, canvas, vistas, pilotis,
  avaliação de terreno, materiais e metadados próprios.
- A família vinculada a uma casa removida só deve ser excluída se nenhuma outra casa restante
  referenciar o mesmo `familyId`.
- Remover um monitor remove apenas o `MonitorRecord` e seus campos próprios.
- Construções arquivadas aparecem na listagem de construções, mas não são abertas para edição
  detalhada.

### Restrições

- A exclusão física deve ser separada das ações de status, porque arquivar/desarquivar e
  inativar/reativar são reversíveis
  e excluir não é.
- A validação deve existir na sessão, não apenas na UI.
- A ação de exclusão é exceção explícita ao bloqueio de edição de construção arquivada; não deve
  liberar outras mutações.
- A exclusão granular de casa/monitor não é exceção ao bloqueio de construção concluída ou arquivada.
- O fluxo deve preservar o contrato atual de Canvas: após excluir a construção, o editor só pode
  abrir se existir outra construção em andamento com casa não arquivada.

## 5. Áreas Afetadas

- Sessão e persistência local:
  - `src/components/rac-editor/lib/construction-site-session.ts`
  - `src/components/rac-editor/lib/editor-house-construction-site-bridge.ts`
  - `src/components/rac-editor/lib/editor-house-controller.ts`
- Porta e controller do gerenciamento:
  - `src/components/construction-site/ports/ConstructionSiteManagementPort.ts`
  - `src/components/construction-site/hooks/useConstructionSiteManagementController.ts`
  - `src/components/construction-site/hooks/useConstructionSiteManagementNavigation.ts`
  - `src/components/construction-site/ui/lib/types.ts`
- UI:
  - `src/components/construction-site/ui/ConstructionListScreen.tsx`
  - `src/components/construction-site/ui/ConstructionSiteManagementPanel.tsx`
  - `src/components/construction-site/ui/lib/shared-controls.tsx`
  - `src/components/construction-site/ui/lib/status-dialogs.tsx`
- Testes:
  - `src/components/rac-editor/lib/construction-site-session.smoke.test.ts`
  - `src/components/construction-site/hooks/useConstructionSiteManagementController.smoke.test.tsx`
  - `src/components/construction-site/ui/ConstructionSiteManagementPanel.smoke.test.tsx`
- Documentação:
  - `docs/business-rules/BUS-010-status-casa.md`
  - `docs/business-rules/BUS-011-status-construcao.md`
  - este asset de plano

## 6. Riscos e Dependências

### Riscos

- Estado ativo ficar apontando para construção removida.
  - Mitigação: normalizar `state` via próxima construção navegável ou `null` após a exclusão.
- Usuário confundir `Arquivar` com `Excluir definitivamente`.
  - Mitigação: botão e diálogo destrutivos com texto explícito de permanência e cascata.
- Exposição acidental de exclusão em construção não arquivada.
  - Mitigação: checagem de UI e guarda na sessão.
- Regressão no retorno ao Canvas.
  - Mitigação: testes de `canOpenRacEditor` e seleção após exclusão.

### Dependências

- A listagem de construções precisa continuar recebendo summaries de construções arquivadas para
  exibir a ação destrutiva.
- A porta de gerenciamento precisa propagar as ações até a sessão e notificar subscribers.
- As telas de casas e monitores precisam diferenciar ações reversíveis de exclusão definitiva.

## 7. Plano de Execução Proposto

### Ciclo 1: Documentar Plano Executável

- objetivo:
  Registrar escopo, fases, arquivos prováveis, testes e decisões aprovadas.
- resultado esperado:
  Asset documental em `docs/product-requirements/PRD-005-rodada-pos-release-rac.prd.assets/`.
- verificação:
  Inspeção do documento e commit isolado.
- arquivos-chave:
  - `docs/product-requirements/PRD-005-rodada-pos-release-rac.prd.assets/exclusao-fisica-construcao-arquivada-plan.md`
- commit esperado:
  `docs(rac): documentar plano de exclusao fisica`

### Ciclo 2: Implementar Regras Na Sessão e Nas Portas

- objetivo:
  Criar os comandos de exclusão física e garantir as cascatas no aggregate local.
- resultado esperado:
  `deleteArchivedConstructionSite(constructionSiteId)`, `deleteArchivedHouse(houseId)` e
  `deleteInactiveMonitor(monitorId)` disponíveis na sessão, bridge, controller e porta de
  gerenciamento.
- verificação:
  Smoke tests de sessão cobrindo sucesso, bloqueios e normalização de estado.
- arquivos-chave:
  - `src/components/rac-editor/lib/construction-site-session.ts`
  - `src/components/rac-editor/lib/editor-house-construction-site-bridge.ts`
  - `src/components/rac-editor/lib/editor-house-controller.ts`
  - `src/components/construction-site/ports/ConstructionSiteManagementPort.ts`
  - `src/components/construction-site/hooks/useConstructionSiteManagementController.ts`
  - `src/components/construction-site/ui/lib/types.ts`
  - `src/components/rac-editor/lib/construction-site-session.smoke.test.ts`
- commit esperado:
  `feat(rac): excluir itens arquivados da sessao`

### Ciclo 3: Implementar UI e Confirmação Destrutiva

- objetivo:
  Expor as ações destrutivas nas listagens permitidas e confirmar a cascata.
- resultado esperado:
  Construções arquivadas exibem `Excluir definitivamente`; construções não arquivadas não exibem a
  ação. Casas arquivadas e monitores inativos em construção navegável exibem exclusão definitiva.
  As confirmações chamam os comandos corretos.
- verificação:
  Smoke tests de UI e controller.
- arquivos-chave:
  - `src/components/construction-site/hooks/useConstructionSiteManagementNavigation.ts`
  - `src/components/construction-site/ui/ConstructionListScreen.tsx`
  - `src/components/construction-site/ui/ConstructionSiteManagementPanel.tsx`
  - `src/components/construction-site/ui/lib/shared-controls.tsx`
  - `src/components/construction-site/ui/lib/status-dialogs.tsx`
  - `src/components/construction-site/hooks/useConstructionSiteManagementController.smoke.test.tsx`
  - `src/components/construction-site/ui/ConstructionSiteManagementPanel.smoke.test.tsx`
- commit esperado:
  `feat(rac): adicionar exclusao definitiva nas listagens`

### Ciclo 4: Atualizar Regras De Negócio

- objetivo:
  Consolidar as regras de exclusão física nos documentos de status.
- resultado esperado:
  `BUS-011` descreve que construção arquivada bloqueia edição, mas permite desarquivar ou excluir
  definitivamente a construção inteira. `BUS-010` descreve que casa arquivada pode ser excluída
  fisicamente em construção navegável.
- verificação:
  Inspeção documental e validação de formatação dos documentos tocados.
- arquivos-chave:
  - `docs/business-rules/BUS-010-status-casa.md`
  - `docs/business-rules/BUS-011-status-construcao.md`
  - `docs/product-requirements/PRD-005-rodada-pos-release-rac.prd.assets/exclusao-fisica-construcao-arquivada-plan.md`
- commit esperado:
  `docs(rac): documentar exclusao fisica de construcao`

### Ciclo 5: Curadoria Final De Documentação

- objetivo:
  Executar `documentation-curator` em `docs/` e aplicar formatação correta.
- resultado esperado:
  Documentos em `docs/` formatados conforme governança local, preservando conteúdo existente.
- verificação:
  Rodar formatter/checker de Markdown quando disponível e revisar diff.
- arquivos-chave:
  - `docs/`
- commit esperado:
  `docs(rac): formatar documentacao`

### Ciclo 6: Validação Final e Fechamento

- objetivo:
  Confirmar que as mudanças foram endereçadas, registrar changelog e fechar work-item local.
- resultado esperado:
  Testes focados e lint executados; changelog atualizado; work-item reconciliado.
- verificação:
  - `npm run test -- src/components/rac-editor/lib/construction-site-session.smoke.test.ts`
  - `npm run test -- src/components/construction-site/hooks/useConstructionSiteManagementController.smoke.test.tsx src/components/construction-site/ui/ConstructionSiteManagementPanel.smoke.test.tsx`
  - `npm run lint`
- arquivos-chave:
  - `.agents/changelogs/2026-07/20260703.changelog.md`
  - `.agents/work-items/2026-07/20260703-exclusao-fisica-construcao-arquivada.work-item.md`
- commit esperado:
  Sem commit obrigatório se apenas artefatos locais `.agents/` forem alterados e estiverem ignorados.

## 8. Estratégia De Validação

- Testar a regra no limite da sessão antes da UI.
- Validar bloqueio de exclusão para construção `Em andamento` e `Concluída`.
- Validar remoção de construção `Arquivada` com dados filhos.
- Validar remoção de casa `Arquivada` em construção navegável.
- Validar remoção de monitor `Inativo` em construção navegável.
- Validar que `canOpenRacEditor` não considera casas da construção removida.
- Validar que o botão destrutivo aparece só para construção arquivada.
- Validar que botões destrutivos de casa e monitor aparecem só nos estados permitidos.
- Validar que os diálogos informam exclusão permanente e cascata aplicável.

## 9. Estratégia De Rollout e Compatibilidade

Não há migration ou rollout remoto neste ciclo. A compatibilidade é local: registros existentes
continuam válidos, e a exclusão só acontece por ação explícita do usuário em construção arquivada.

## 10. Estratégia De Rollback ou Recuperação

- Durante desenvolvimento, rollback por Git revert dos commits do ciclo.
- Em uso do produto, a exclusão física não terá recuperação na aplicação.
- A confirmação destrutiva deve informar que a ação é permanente e sem desfazer.
