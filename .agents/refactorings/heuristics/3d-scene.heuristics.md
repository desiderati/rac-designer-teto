---
title: "Refactoring Heuristic — Cena 3D do editor RAC"
doc_role: refactoring-heuristic
created: 2026-02-20
updated: 2026-04-20
heuristic_slug: 3d-scene
scope_type: runtime
status: active
confidence: high
applicable_resource_slugs:
  - rac-editor-architecture
consumers: [ refactoring ]
tags: [ refactoring, heuristic, 3d-scene ]
---

# Refactoring Heuristic — Cena 3D do editor RAC

> Revisão humana recomendada antes de usar este arquivo como base durável.

## 1. Contexto e Escopo

- escopo heurístico: viewer 3D, cena 3D, parsers de elementos e sincronização com o projeto 2D.
- superfície observada: `ui/3d/House3DScene.tsx`, `ui/3d/House3DViewer.tsx`, `lib/3d/*`, `lib/house-snapshot.ts`, docs
  `viewer-3d.md`.
- `resource-slugs` associados: `rac-editor-architecture`
- prompts duráveis associados: `.agents/prompts/refactoring-rac-editor-architecture.prompt.md`
- evidências fortes:
    - o plano de `2026-02-20` tratou `House3DScene` e `House3DViewer` como fronteira crítica.
    - `viewer-3d.md` define explicitamente que o 3D é visualização do projeto, não versão alternativa das regras.
    - a árvore atual já separa parsers em `lib/3d/*`, confirmando a direção histórica.
- evidências fracas:
    - o estado atual ainda exige validação funcional manual para alguns cenários visuais específicos.

## 2. Sinais de Ativação

- sinal: a frente toca renderização 3D, parsers, snapshot ou sincronização com a casa atual.
- evidência: docs funcionais e hotspots históricos da cena 3D.

- sinal: regra de negócio começa a aparecer dentro do componente da cena.
- evidência: o acervo antigo criticou mistura de geometria, mapping e regra da casa em `House3DScene`.

- sinal: viewer 3D depende de contratos frágeis com `house-manager` ou tipo de casa.
- evidência: checklist de `2026-02-24` destaca divergência de contrato entre manager e 3D como risco alto.

## 3. Sinais de Suspensão

- condição de suspensão: a mudança é apenas cosmética de UI do modal 3D.
- por que suspender: a heurística estrutural deixa de ser o instrumento certo.

- condição de suspensão: a frente não toca renderização, parsing ou snapshot.
- por que suspender: o risco 3D não está em jogo.

## 4. Heurísticas Ativas

### Heurística 1

- enunciado: a cena 3D deve consumir projeções/payloads derivados, não decidir regra de negócio da casa.
- por que tende a funcionar neste contexto: separar projeção de regra reduz acoplamento entre viewer e modelo 2D.
- quando aplicar: em `House3DScene.tsx`, `House3DViewer.tsx` e parsers de elementos.
- quando suspender: quando a mudança for apenas de câmera ou layout do modal.
- como falsificar: se a derivação externa deixar a cena menos compreensível ou exigir duplicação sem reduzir
  acoplamento.
- custo de errar: médio.
- reversibilidade: média.

### Heurística 2

- enunciado: parsers 3D devem ser módulos puros e testáveis, separados do componente React.
- por que tende a funcionar neste contexto: o histórico mostrou que quando o parsing fica dentro da cena, a
  testabilidade despenca.
- quando aplicar: ao tocar `lib/3d/*` e qualquer transformação de house state para mesh/input do viewer.
- quando suspender: quando a lógica for estritamente de renderização local sem transformação estrutural.
- como falsificar: se a separação criar camadas artificiais sem ganho de teste ou legibilidade.
- custo de errar: baixo a médio.
- reversibilidade: alta.

### Heurística 3

- enunciado: snapshot do 3D para o 2D deve ser tratado como integração explícita, reversível e validável.
- por que tende a funcionar neste contexto: inserir imagem do 3D no canvas é um side effect sensível que cruza
  fronteiras.
- quando aplicar: em `house-snapshot`, viewer e integrações com canvas.
- quando suspender: quando o fluxo não tocar snapshot nem mutação do canvas.
- como falsificar: se a abstração ocultar demais o fluxo e dificultar diagnóstico de falha.
- custo de errar: médio.
- reversibilidade: média.

## 5. Anti-heurísticas e Falhas Comuns

### Anti-heurística 1

- enunciado: deixar o viewer 3D consultar o modelo de forma ad hoc e montar sua própria regra.
- risco gerado: divergência entre 2D e 3D.
- sintoma de abuso: condicionais de tipo de casa e lados espalhadas dentro da cena.

### Anti-heurística 2

- enunciado: tratar snapshot como detalhe cosmético e não como mutação de integração.
- risco gerado: imagem inserida sem coerência com o estado do canvas.
- sintoma de abuso: snapshot sem validação funcional posterior.

## 6. Implicações para Refactoring

- smells e hotspots relacionados:
    - business logic in scene component
    - fragile 2D/3D contract
    - parsing embedded in React component
    - snapshot side effect hidden in viewer code
- transformações preferenciais:
    - `extract parser`
    - `extract module`
    - `move`
    - `introduce adapter`
- transformações a evitar:
    - colocar regra da casa de volta dentro da cena
    - acoplar viewer diretamente ao manager como fonte principal
- heurísticas irmãs relevantes:
    - `canvas`
    - `visual-editor`

## 7. Implicações para Regressão

- fluxos críticos afetados:
    - abrir viewer
    - renderizar `tipo3` e `tipo6`
    - trocar cor de parede
    - resetar câmera / fullscreen
    - inserir snapshot no canvas 2D
- riscos arquiteturais:
    - divergência de contrato entre 2D e 3D
    - parse incorreto de contraventamento, pilotis, escadas e aberturas
    - snapshot quebrando estado visual do 2D
- validação mínima esperada:
    - smoke/E2E do modal 3D
    - validação manual dos cenários de render principais
    - evidência explícita de snapshot e sincronização

## 8. Calibração e Limites

- quando esta heurística deixa de ajudar: quando a rodada não toca viewer, parsers nem snapshot.
- o que mudou desde a versão anterior: primeira materialização retroativa ancorada nos planos de 20/02 e nos docs atuais
  de 3D.
- critérios de deprecação: a fronteira 2D/3D deixar de ser ponto de risco ou migrar para um pipeline completamente
  estável.
- revisão humana recomendada: validar com uso real do viewer, não apenas com leitura estática do código.
