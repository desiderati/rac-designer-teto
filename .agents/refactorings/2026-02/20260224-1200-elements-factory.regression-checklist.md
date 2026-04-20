---
title: "Regression Checklist — Elements Factory"
doc_role: regression-checklist
created: 2026-02-24
updated: 2026-04-20
tags: [ refactoring, regression-checklist ]
---

# Regression Checklist — Elements Factory

> Documento retroconvertido em 2026-04-20 a partir do checklist legado da rodada de `2026-02-24`.

## 1. Identificação da Rodada

- prompt durável de origem:
  `.agents/prompts/refactoring-elements-factory.prompt.md`
- documento principal de refactoring:
  `.agents/refactorings/2026-02/20260224-1200-elements-factory.refactoring.md`
- review de origem:
  não aplicável
- slugs de candidatos selecionados:
  não aplicável
- perfil de risco: `high`
- modo de execução: `direct`
- razão do modo escolhido:
  refatoração estrutural alta, mas sem gate explícito preservado no acervo desta rodada.
- Fase 0 ativada?: `sim`

## 2. Contexto desta Rodada

- objetivo operacional:
  validar regressões funcionais e de integração após a mega refatoração da factory e da arquitetura associada.
- escopo incluído:
  strategies de elementos, helpers compartilhados, wiring com editores lineares/parede, toolbar, path migration, tipagem
  e E2E relacionados.
- escopo excluído:
  frentes não ligadas diretamente à criação/edição de elementos.
- blockers atuais:
  risco de path migration, contratos de tipo e regressões de scaling/toolbar.
- baseline esperado do comportamento:
  criação e edição de elementos preservadas, build/testes/E2E verdes e sem dependência residual de módulos removidos.

## 3. Fluxos Críticos

### Fluxo 1

- nome:
  criação de objetos lineares e de parede
- por que é crítico:
  é o núcleo funcional da factory refatorada.
- evidência mínima esperada:
  criar linha, seta, distância, parede e editar via modais inline.
- risco se quebrar:
  editor perde utilidade básica de desenho.

### Fluxo 2

- nome:
  wiring de toolbar e comandos de criação
- por que é crítico:
  a factory é acionada por fluxos de UI e toolbar.
- evidência mínima esperada:
  ações de toolbar disparam comandos corretos.
- risco se quebrar:
  no-op acidental ou criação do objeto errado.

### Fluxo 3

- nome:
  scaling, normalização e tipagem dos elementos
- por que é crítico:
  regressões aqui distorcem objetos e quebram edição.
- evidência mínima esperada:
  guards, normalizações e tipagem strict passam sem quebrar runtime.
- risco se quebrar:
  bugs visuais e falhas só em runtime.

## 4. Riscos Arquiteturais

### Risco 1

- risco:
  dependências residuais de paths antigos.
- gatilho ou área sensível:
  imports e aliases após a mega refatoração.
- evidência necessária para confiar:
  guard automatizado contra imports legados e build verde.
- fallback ou rollback se falhar:
  restaurar import correto e reexecutar validação.

### Risco 2

- risco:
  divergência de contrato entre factory, editor linear e tipos compartilhados.
- gatilho ou área sensível:
  helpers de estado e `CanvasObject`.
- evidência necessária para confiar:
  edição inline e tipagem strict verdes.
- fallback ou rollback se falhar:
  reverter a fatia de helper/typing tocada.

### Risco 3

- risco:
  regressão silenciosa de scaling e guards duplicados.
- gatilho ou área sensível:
  strategies de line, arrow, distance e wall.
- evidência necessária para confiar:
  smoke/E2E cobrindo edição e resize, com build/testes verdes.
- fallback ou rollback se falhar:
  reverter helper compartilhado/guard recém-introduzido.

## 5. Validação Automática Obrigatória

### Validação 1

- comando:
  `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false`
- escopo do comando:
  tipagem estrita da aplicação
- resultado esperado:
  verde
- obrigatória?: `sim`
- observações:
  explicitamente prevista no checklist legado.

### Validação 2

- comando:
  `npm run test -- --run`
- escopo do comando:
  smoke/unit
- resultado esperado:
  verde
- obrigatória?: `sim`
- observações:
  o ledger preserva `117/117`.

### Validação 3

- comando:
  `npm run build`
- escopo do comando:
  build de produção
- resultado esperado:
  verde
- obrigatória?: `sim`
- observações:
  reexecutado após hotfixes.

### Validação 4

- comando:
  `npm run test:e2e -- --workers=1`
- escopo do comando:
  E2E serial
- resultado esperado:
  verde
- obrigatória?: `sim`
- observações:
  o ledger preserva `17/17`.

### Validação 5

- comando:
  `npm run test:regression`
- escopo do comando:
  pacote consolidado da rodada
- resultado esperado:
  verde
- obrigatória?: `sim`
- observações:
  consolidou Vitest, build e Playwright.

## 6. Validação Manual Prevista

### Cenário 1

- cenário:
  criar parede, porta, escada, árvore, água e fossa
- objetivo:
  validar criação de elementos visuais variados
- evidência esperada:
  objetos aparecem corretamente no canvas
- status planejado: `planejado`

### Cenário 2

- cenário:
  criar linha, seta, distância e texto livre
- objetivo:
  validar objetos lineares e tipagem associada
- evidência esperada:
  criação e edição sem quebra
- status planejado: `planejado`

### Cenário 3

- cenário:
  editar objetos lineares e parede
- objetivo:
  validar integração entre factory e editores
- evidência esperada:
  modais inline sincronizados com seleção ativa
- status planejado: `planejado`

## 7. Critério de Aceite da Rodada

- condição de aceite:
  tipagem, build, smoke, E2E e regressão verdes, com fluxos centrais da factory preservados.
- condições de bloqueio:
  criação quebrada, editor inline quebrado, imports legados residuais, regressão de toolbar ou snapshot relacionado.
- lacunas toleradas nesta rodada:
  lint global legado e parte da criação manual detalhada de todos os elementos.

## 8. Gaps Intencionais e Adiamentos

- gap ou adiamento:
  lint global da base.
- justificativa:
  explicitamente documentado como dívida herdada fora do foco da rodada.
- evidência faltante:
  execução verde de `npx eslint .`
- próximo passo esperado:
  tratar em frente própria de higiene.

- gap ou adiamento:
  alguns cenários manuais detalhados de criação de todos os elementos.
- justificativa:
  o ledger factual priorizou smoke/E2E críticos e integrações principais.
- evidência faltante:
  rodada manual completa por tipo de elemento.
- próximo passo esperado:
  usar este checklist como contrato em futuras ondas da frente.

## 9. Gate de Aprovação

- requer aprovação antes da execução estrutural?: `não`
- estado atual: `não aplicável`
- evidência da aprovação na sessão:
  o acervo desta rodada não preserva gate explícito.

## 10. Artefatos Relacionados

- regression run da rodada:
  `.agents/refactorings/2026-02/20260224-1200-elements-factory.regression-run.md`
- sidecar de evidências:
  não aplicável
- changelog diário:
  `.changelogs/changelog-20260420.md`
- arquivos alvo:
  `src/components/rac-editor/lib/canvas/factory/elements/*`,
  `src/components/rac-editor/ui/modals/editors/generic/helpers/*`
