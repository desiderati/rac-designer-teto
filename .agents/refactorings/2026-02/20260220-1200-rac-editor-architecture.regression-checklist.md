---
title: "Regression Checklist — Arquitetura do editor RAC"
doc_role: regression-checklist
created: 2026-02-20
updated: 2026-04-20
tags: [ refactoring, regression-checklist ]
---

# Regression Checklist — Arquitetura do editor RAC

> Documento retroconvertido em 2026-04-20 a partir do checklist e do ledger legados.

## 1. Identificação da Rodada

- prompt durável de origem:
  `.agents/prompts/refactoring-rac-editor-architecture.prompt.md`
- documento principal de refactoring:
  `.agents/refactorings/2026-02/20260220-1200-rac-editor-architecture.refactoring.md`
- review de origem:
  não aplicável
- slugs de candidatos selecionados:
  não aplicável
- perfil de risco: `high`
- modo de execução: `gated`
- razão do modo escolhido:
  frente ampla, com histórico explícito de regressões em editor, canvas, 3D e persistência.
- Fase 0 ativada?: `sim`

## 2. Contexto desta Rodada

- objetivo operacional:
  proteger a decomposição ampla do editor RAC com baseline funcional e regressão explícita.
- escopo incluído:
  criação de casa, vistas, piloti, canvas, toolbar, tutorial, 3D, import/export e flows de domínio/aplicação
  relacionados.
- escopo excluído:
  componentes genéricos de UI fora da feature RAC.
- blockers atuais:
  blast radius alto e cobertura incompleta em partes do editor.
- baseline esperado do comportamento:
  editor abre, tipos de casa funcionam, views respeitam limite, piloti e 3D não quebram, canvas preserva
  viewport/histórico e snapshot 3D integra corretamente.

## 3. Fluxos Críticos

### Fluxo 1

- nome:
  inicialização do editor e criação básica de casa
- por que é crítico:
  é o ponto de entrada de toda a feature.
- evidência mínima esperada:
  editor abre sem erro fatal; `tipo6` e `tipo3` são criáveis.
- risco se quebrar:
  bloqueio total de uso do editor.

### Fluxo 2

- nome:
  gestão de vistas e regras por tipo de casa
- por que é crítico:
  house views estruturam o restante do projeto.
- evidência mínima esperada:
  adicionar/remover vistas, respeitar limites e liberar slots após remoção.
- risco se quebrar:
  incoerência estrutural do projeto e regressão de layout.

### Fluxo 3

- nome:
  edição de piloti e contraventamento
- por que é crítico:
  são fluxos centrais do domínio funcional do produto.
- evidência mínima esperada:
  abrir editor de piloti, editar height/nivel/master e manter regras de contraventamento.
- risco se quebrar:
  quebra de regra estrutural e inconsistência visual.

### Fluxo 4

- nome:
  interações de canvas
- por que é crítico:
  zoom, pan, minimap, undo/redo e copy/paste são a base operacional do editor.
- evidência mínima esperada:
  smoke/E2E cobrindo viewport e histórico.
- risco se quebrar:
  editor usável apenas parcialmente.

### Fluxo 5

- nome:
  visualização 3D e snapshot
- por que é crítico:
  a fronteira 2D/3D é um hotspot histórico.
- evidência mínima esperada:
  abrir viewer, renderizar tipos centrais e inserir snapshot no canvas.
- risco se quebrar:
  divergência funcional entre 2D e 3D.

## 4. Riscos Arquiteturais

### Risco 1

- risco:
  `RacEditor` e `Canvas` continuarem centralizando coordenação excessiva durante a extração.
- gatilho ou área sensível:
  modais, toolbar, viewport e tutorial.
- evidência necessária para confiar:
  smoke/E2E cobrindo modais, toolbar, canvas e flows básicos.
- fallback ou rollback se falhar:
  reverter a fatia extraída e restaurar wiring anterior.

### Risco 2

- risco:
  `house-manager`, rebuild/import e domínio divergir do contrato esperado.
- gatilho ou área sensível:
  views, side mappings, import/export e recomposição do estado.
- evidência necessária para confiar:
  smoke tests de manager/use cases e validação funcional dos fluxos de house views.
- fallback ou rollback se falhar:
  interromper a rodada e restaurar a camada anterior da fatia tocada.

### Risco 3

- risco:
  3D passar a interpretar regra da casa incorretamente.
- gatilho ou área sensível:
  parsers, viewer e snapshot.
- evidência necessária para confiar:
  abrir viewer, renderizar `tipo3`/`tipo6`, trocar cor de parede e inserir snapshot.
- fallback ou rollback se falhar:
  reverter parser/adaptação e bloquear promoção da rodada.

## 5. Validação Automática Obrigatória

### Validação 1

- comando:
  `npm run test -- --run`
- escopo do comando:
  smoke/unit da rodada
- resultado esperado:
  verde
- obrigatória?: `sim`
- observações:
  o ledger histórico mostra contagens crescentes ao longo das subrodadas.

### Validação 2

- comando:
  `npm run build`
- escopo do comando:
  build de produção
- resultado esperado:
  verde
- obrigatória?: `sim`
- observações:
  usado de forma recorrente no ledger legado.

### Validação 3

- comando:
  `npm run test:e2e -- --workers=1`
- escopo do comando:
  E2E dos fluxos críticos do editor
- resultado esperado:
  verde ou subconjunto equivalente por spec
- obrigatória?: `sim`
- observações:
  o legado evoluiu de um spec monolítico para suites quebradas por domínio.

### Validação 4

- comando:
  `npm run lint`
- escopo do comando:
  lint geral
- resultado esperado:
  idealmente verde
- obrigatória?: `não`
- observações:
  a dívida legada foi registrada como lacuna estrutural, não como bloqueio automático.

## 6. Validação Manual Prevista

### Cenário 1

- cenário:
  abrir editor, criar `tipo6` e `tipo3`
- objetivo:
  validar fluxo base
- evidência esperada:
  editor utilizável sem erro fatal
- status planejado: `planejado`

### Cenário 2

- cenário:
  adicionar/remover vistas e validar bloqueio de lados
- objetivo:
  proteger regras por tipo de casa
- evidência esperada:
  slots e limites coerentes
- status planejado: `planejado`

### Cenário 3

- cenário:
  editar piloti, usar contraventamento e validar feedback visual
- objetivo:
  proteger fluxos estruturais do domínio
- evidência esperada:
  regra de master único e edição sem tela branca
- status planejado: `planejado`

### Cenário 4

- cenário:
  usar zoom/pan/minimap/undo/redo/copy-paste
- objetivo:
  proteger runtime do canvas
- evidência esperada:
  viewport e histórico coerentes
- status planejado: `planejado`

### Cenário 5

- cenário:
  abrir viewer 3D, trocar cor, resetar câmera e inserir snapshot
- objetivo:
  proteger a integração 2D/3D
- evidência esperada:
  viewer íntegro e snapshot válido no canvas
- status planejado: `planejado`

## 7. Critério de Aceite da Rodada

- condição de aceite:
  fluxos críticos preservados com evidência direta suficiente e sem regressão fatal de editor/canvas/3D.
- condições de bloqueio:
  tela branca, erro fatal, quebra de criação de casa, quebra de views, piloti, canvas ou snapshot 3D.
- lacunas toleradas nesta rodada:
  lint global legado e validações manuais ainda não automatizadas em todas as superfícies.

## 8. Gaps Intencionais e Adiamentos

- gap ou adiamento:
  parte da validação visual de 3D e contraventamento permaneceu manual.
- justificativa:
  o acervo legado não sustentava automação total dessas superfícies.
- evidência faltante:
  run visual completo por cenário.
- próximo passo esperado:
  tratar como foco de futuras ondas da frente.

## 9. Gate de Aprovação

- requer aprovação antes da execução estrutural?: `sim`
- estado atual: `aprovado`
- evidência da aprovação na sessão:
  o modelo legado explicitava handshake análise -> aprovação -> execução, e o ledger factual confirma que a execução
  estrutural ocorreu historicamente.

## 10. Artefatos Relacionados

- regression run da rodada:
  `.agents/refactorings/2026-02/20260220-1200-rac-editor-architecture.regression-run.md`
- sidecar de evidências:
  não aplicável
- changelog diário:
  `.changelogs/changelog-20260420.md`
- arquivos alvo:
  `ui/RacEditor.tsx`, `ui/canvas/Canvas.tsx`, `hooks/canvas/*`, `lib/house-manager.ts`,
  `lib/canvas/*`, `ui/3d/*`
