---
title: "Bug Analysis — Troca de casa no Canvas não preserva documento correto"
doc_role: bug-analysis
status: confirmed
created: 2026-05-12
updated: 2026-05-12
supersedes:
superseded_by:
tags: [ bug-analysis, bug, regression, prd-001, construction-site, canvas ]
aliases: [ troca de casa no canvas, canvas não carrega casa selecionada ]
---

# Análise Técnica de Bug ou Regressão

## 1. Identificação

- tipo do registro: análise técnica de bug
- bug, defeito ou regressão analisada: troca de casa pelo FAB Hamburger podia não salvar ou carregar o documento correto
- origem do relato: QA do usuário no PRD-001
- ambiente: local
- status analítico: confirmado
- estado da correção: reaberta, corrigida e validada manualmente em navegador

## 2. Contexto e Sintoma Observado

- contexto funcional: PRD-001 introduz múltiplas casas por Construção TETO, com persistência local do
  `HouseDrawingDocument` por casa.
- sintoma observado: ao trocar de casa pelo menu do Canvas, o desenho anterior podia não ser salvo e/ou a casa
  selecionada podia não ser carregada no Canvas.
- refinamento do sintoma após reabertura: ao inserir a casa A pela primeira vez, trocar para uma casa B vazia e voltar
  para A, o Canvas voltava em branco; uma segunda edição em A passava a persistir apenas os elementos da segunda edição.
- refinamento após nova reabertura: o IndexedDB podia conter o documento correto da casa A, com objetos e vistas, mas a
  restauração viva do Canvas falhava e o editor permanecia com estado lógico/visual vazio.
- impacto percebido: risco direto de perda ou mistura de estado entre casas.
- limitações ou incertezas iniciais: o relato não distinguia falha de persistência, falha de leitura ou corrida de
  hidratação.

## 3. Escopo Afetado

- fluxos afetados:
    - troca de casa pelo FAB Hamburger do RAC Editor;
    - retorno do gerenciamento para o Canvas com hidratação pendente;
    - alternâncias rápidas entre casas.
- regras de negócio afetadas:
    - uma casa deve carregar seu último estado salvo no Canvas;
    - a casa anterior deve ser salva antes da troca.
- módulos, componentes ou serviços envolvidos:
    - `src/components/construction-site/hooks/useConstructionSiteManagementController.ts`
    - `src/components/rac-editor/hooks/useRacEditorController.ts`
    - `src/components/rac-editor/@menus/lib/menu-types.ts`
    - `src/components/rac-editor/@menus/hooks/useRacEditorMenuActions.ts`
    - `src/components/rac-editor/@menus/ui/HamburgerMenu.tsx`
    - `src/components/rac-editor/@canvas/ui/adapters/fabric-canvas-document-port.ts`
- contratos, schemas ou interfaces envolvidos:
    - `MenuActionMap.activateHouse`
    - `ConstructionSiteManagementPort.activateHouse`
    - `HouseDrawingDocumentPort`
    - `CanvasDocumentPort`

## 4. Fluxo Esperado vs. Fluxo Real

- fluxo esperado:
    - cancelar qualquer hidratação obsoleta;
    - salvar o documento da casa atual;
    - ativar a casa de destino;
    - carregar o documento visual da casa de destino;
    - só então permitir que nova troca opere sobre Canvas e estado lógico alinhados.
- fluxo real:
    - havia hidratação via `requestAnimationFrame` que podia continuar pendente após troca explícita;
    - `activateHouse` atualizava estado lógico e iniciava carregamento visual assíncrono;
    - uma nova troca rápida podia salvar Canvas antigo combinado com estado lógico novo.
    - depois das primeiras correções, o documento durável podia estar correto no IndexedDB, mas `loadFromJSON` do
      Fabric falhava ao reidratar `itext` sem `text`, deixando o Canvas vazio.
- ponto de divergência identificado:
    - `loadOrQueueHouseDocument` não cancelava de forma suficiente hidratações antigas nem serializava transições;
    - `MenuActionMap.activateHouse` era tipado como `void`, apesar de a operação real ser assíncrona.
    - `toRuntimePayload` omitia `text` quando o valor era ausente ou string vazia; para shapes textuais, o Fabric exige
      string e tenta chamar `split` durante a reconstrução.

## 5. Hipóteses Causais

| Hipótese                                                                        | Evidências a favor                                                                                                                                    | Evidências contra                                       | Status     |
|---------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------|------------|
| Hidratação pendente da casa anterior sobrescrevia a casa recém-selecionada      | `scheduleHouseDocumentHydration` guarda documento pendente e roda em `requestAnimationFrame`; teste novo reproduziu segunda carga indevida após troca | não explica sozinho mistura por duas trocas rápidas     | confirmada |
| Trocas rápidas não serializadas misturavam Canvas antigo com estado lógico novo | `activateHouse` muda o estado lógico antes do `loadCanvasDocument` assíncrono terminar; teste novo demonstrou a necessidade de fila                   | fluxo normal com uma troca lenta tende a funcionar      | confirmada |
| Primeira inserção da casa não gerava snapshot durável após registro lógico      | `canvas.add` disparava histórico antes de `registerView`; persistência durável só ocorria na troca e podia competir com hidratação vazia pendente     | não afetava elementos comuns adicionados depois         | confirmada |
| Reidratação Fabric quebrava em textos vazios                                    | reprodução manual mostrou IndexedDB correto, Canvas vazio e console com `Cannot read properties of undefined (reading 'split')` em `fabric.js`        | não explica sozinha os problemas anteriores de fila     | confirmada |
| ID errado vindo do Hamburger                                                    | `HamburgerMenu` passa `construction.id` e `house.id`; smoke test valida a chamada                                                                     | sem evidência de ID errado                              | descartada |
| Sessão não persiste documento válido                                            | `construction-site-session.ts` grava `drawingDocument` e chama `persist()`                                                                            | testes de sessão restauram documentos entre construções | descartada |

## 6. Evidências e Pontos Envolvidos

### Evidências observadas

- teste adicionado em `useConstructionSiteManagementController.smoke.test.tsx` confirmou que hidratação pendente antiga
  podia chamar `loadCanvasDocument` após a troca.
- teste adicionado no mesmo arquivo confirmou que duas ativações rápidas precisam ser serializadas para preservar a
  ordem `save -> activate -> load`.
- teste adicionado em `useCanvasHouseViewActions.smoke.test.ts` confirmou que a inserção da casa persiste o desenho
  após `registerView`, quando o estado lógico e os objetos visuais já estão alinhados.
- teste adicionado em `fabric-canvas-document-port.smoke.test.ts` confirmou que shapes textuais sem conteúdo precisam
  ser reidratados com `text: ""` para não quebrar o Fabric.
- reprodução manual via Playwright semeou duas casas limpas, inseriu a casa A, alternou para B vazia e voltou para A:
  antes do ajuste, o IndexedDB tinha A com 2 objetos e 2 vistas, mas o editor vivo voltava vazio e o console registrava
  erro de `split`; após o ajuste, A voltou com 2 grupos e vistas `top/front`.
- análise do `support-analyst` apontou que `activateHouse` era tratado como best effort e que o carregamento visual do
  Canvas é assíncrono.

### Pontos de código, contrato ou regra

- `src/components/construction-site/hooks/useConstructionSiteManagementController.ts:100`: `loadOrQueueHouseDocument`
  passou a cancelar hidratação obsoleta, carregar o documento novo e agendar retry explícito quando necessário.
- `src/components/construction-site/hooks/useConstructionSiteManagementController.ts:126`: `saveActiveHouseDocument`
  passou a invalidar hidratações pendentes antes de exportar o Canvas.
- `src/components/construction-site/hooks/useConstructionSiteManagementController.ts:118`: `runDocumentTransition`
  passou a serializar transições documentais.
- `src/components/construction-site/hooks/useConstructionSiteManagementController.ts:144`: `activateHouse` passou a
  executar dentro da fila transacional.
- `src/components/rac-editor/@canvas/hooks/useCanvasHouseViewActions.ts:167`: a inserção de vistas da casa passou a
  disparar persistência durável após o registro lógico da vista.
- `src/components/rac-editor/@canvas/ui/adapters/fabric-canvas-document-port.ts`: a reidratação de shapes `itext`,
  `text` e `textbox` passou a fornecer `text: ""` quando o documento canônico não traz conteúdo textual.
- `src/components/rac-editor/hooks/useRacEditorController.ts`: o controller do editor passou a entregar
  `saveActiveHouseDocument` como `onHouseDrawingChange` para o fluxo do Canvas.
- `src/components/rac-editor/hooks/useRacEditorController.ts:134`: o handler do menu passou a retornar a promessa da
  ativação em vez de descartá-la semanticamente.
- `src/components/rac-editor/@menus/lib/menu-types.ts:23`: `activateHouse` passou a ser tipado como `Promise<void>`.

## 7. Classe do Defeito ou Regressão

- classe: combinação de condição de corrida documental e falha de reidratação do adapter Fabric.
- por que esta classificação se aplica: a falha dependia de ordem temporal entre `requestAnimationFrame`, `loadFromJSON`
  do Fabric e chamadas sucessivas de troca de casa; a persistência durável podia estar correta, mas a reconstrução
  visual quebrava em payload textual incompleto.

## 8. Correção Aplicada ou Recomendada

- menor mudança coerente:
    - cancelar hidratações pendentes ao carregar documento explícito;
    - cancelar hidratações pendentes antes de salvar a casa ativa;
    - manter documento pendente e agendar retry quando o Canvas ainda não estiver pronto;
    - serializar transições que combinam salvar casa atual, ativar destino e carregar documento;
    - persistir a primeira inserção de vistas da casa depois que `registerView` atualiza o estado lógico;
    - registrar a vista antes de inseri-la no Canvas, para que qualquer autosave disparado por `object:added` observe o
      estado lógico atualizado;
    - reidratar shapes textuais vazios com `text: ""` no adapter Fabric;
    - expor a nuvem como ícone de status, sem superfície visual de botão, e manter `dirty` visível antes do autosave;
    - ajustar a tipagem de `activateHouse` para refletir a operação assíncrona.
- por que resolve a causa:
    - impede que hidratação antiga aplique documento obsoleto;
    - impede que uma segunda troca salve Canvas antigo com estado lógico já alterado;
    - impede que `loadFromJSON` rejeite documentos válidos por texto vazio em filhos do grupo de casa;
    - torna a promessa da troca visível no contrato do menu.
- riscos e impactos laterais:
    - baixo a médio; a fila também ordena outras ações documentais do gerenciamento, reduzindo interleavings, mas pode
      atrasar ações subsequentes até o load atual terminar.

## 9. Validação Executada

- testes executados:
  - `rtk npm run test -- src/components/construction-site/hooks/useConstructionSiteManagementController.smoke.test.tsx`
    - `rtk npm run test -- src/components/rac-editor/@menus/ui/HamburgerMenu.smoke.test.tsx`
    - `rtk npm run test -- src/components/rac-editor/lib/construction-site-session.smoke.test.ts`
    - `rtk npm run test -- src/components/rac-editor/@canvas/hooks/useCanvasHouseViewActions.smoke.test.ts`
    - `rtk npm run test -- src/components/construction-site/hooks/useConstructionSiteManagementController.smoke.test.tsx src/components/rac-editor/lib/construction-site-session.smoke.test.ts src/components/rac-editor/@menus/ui/HamburgerMenu.smoke.test.tsx src/components/rac-editor/@canvas/hooks/useCanvasHouseViewActions.smoke.test.ts --testTimeout 20000`
  - `rtk npm run test -- src/components/rac-editor/@menus/ui/HamburgerMenu.smoke.test.tsx src/components/rac-editor/@menus/ui/CanvasToolsMenu.smoke.test.tsx src/components/rac-editor/@menus/ui/FamilyName.smoke.test.tsx src/components/construction-site/ui/ConstructionSiteManagementPanel.smoke.test.tsx --testTimeout 15000`
    - `rtk npm run test -- src/test/rac-editor-boundary.smoke.test.ts --testTimeout 60000`
    - `rtk npm run test -- --testTimeout 20000`: 102 arquivos, 316 testes.
    - `rtk npm run test -- src/components/rac-editor/@canvas/ui/adapters/fabric-canvas-document-port.smoke.test.ts --testTimeout 20000`
  - `rtk npm run test -- src/components/rac-editor/@canvas/ui/adapters/fabric-canvas-document-port.smoke.test.ts src/components/rac-editor/@canvas/hooks/useCanvasHouseViewActions.smoke.test.ts src/components/construction-site/hooks/useConstructionSiteManagementController.smoke.test.tsx src/components/rac-editor/@menus/ui/TopBar.smoke.test.tsx --testTimeout 20000`: 16 testes.
    - `rtk npm run test -- src/components/rac-editor/@canvas/ui/adapters/fabric-canvas-command-port.smoke.test.ts src/components/rac-editor/@canvas/ui/adapters/hooks/useCanvasHistory.smoke.test.ts --testTimeout 20000`: 9 testes.
    - `rtk npm run test -- --testTimeout 20000`: 103 arquivos, 324 testes.
- validação manual:
    - Playwright MCP em `http://127.0.0.1:5200/`: duas casas limpas; inserção da casa A; troca para B vazia; retorno
      para A restaurando 2 grupos e vistas `top/front`; adição de fossa mostrou `Alterações não salvas` antes de
      voltar para `Casa salva`.
- build, lint ou smoke relevante:
    - `rtk npm run lint`
    - `rtk npm run build`
    - `rtk git diff --check`
    - `rtk npm run test:architecture`
- critério de sucesso observado:
    - regressões focadas passaram com 3 testes;
    - testes de menu, sessão, painel e fronteira passaram quando executados com timeout compatível com a carga do
      ambiente.

## 10. Dúvidas Residuais de Regra de Negócio

- dúvida: nenhuma regra funcional residual para este bug.
- por que ainda importa: não aplicável.

## 11. Artefatos Relacionados

- incidente correlato: não há.
- PR, commit ou diff relacionado: mudanças locais na branch `codex/construction-site-management`.
- sidecar de anexos: não há.
- documentos correlatos:
    - `docs/product-requirements/PRD-001-evolucao-multicasa.prd.md`
    - `.agents/changelogs/2026-05/20260512.changelog.md`
