---
title: "Refactoring Heuristic — React no editor RAC"
doc_role: refactoring-heuristic
created: 2026-02-27
updated: 2026-04-20
heuristic_slug: react
scope_type: stack
status: active
confidence: high
applicable_resource_slugs:
  - rac-editor-architecture
consumers: [ refactoring ]
tags: [ refactoring, heuristic, react ]
---

# Refactoring Heuristic — React no editor RAC

> Revisão humana recomendada antes de usar este arquivo como base durável.

## 1. Contexto e Escopo

- escopo heurístico: orquestração React da feature `rac-editor`, especialmente componentes raiz, modais e hooks da UI.
- superfície observada: `ui/RacEditor.tsx`, `ui/RacEditor*.tsx`, `ui/modals/*`, `hooks/*`, `hooks/canvas/*`,
  `hooks/modals/*`, `hooks/toolbar/*`.
- `resource-slugs` associados: `rac-editor-architecture`
- prompts duráveis associados: `.agents/prompts/refactoring-rac-editor-architecture.prompt.md`
- evidências fortes:
    - o acervo de `2026-02-27` registra `RacEditor.tsx` como god component com 94 referências a hooks.
    - a árvore atual confirma ampla decomposição em hooks, mas ainda com superfície grande de coordenação em
      `ui/RacEditor.tsx`.
    - docs funcionais mostram forte dependência entre toolbar, modais, tutorial, hotkeys e estado do editor.
- evidências fracas:
  - ainda não há store formal única no padrão alvo descrito em `docs/engineering-playbook/PLAY-004-project-structure.md`.

## 2. Sinais de Ativação

- sinal: componente raiz concentra decisões demais de UI, estado e wiring.
- evidência: histórico de `RacEditor.tsx` como hotspot e presença atual de wrappers como `RacEditorCanvas`,
  `RacEditorModals`, `RacEditorTutorial`.

- sinal: hooks da feature começam a carregar múltiplos conceitos operacionais no mesmo arquivo.
- evidência: análise histórica de `useCanvasViewport`, `useContraventamentoRefs`, `usePilotiEditor` e presença atual de
  múltiplos grupos em `hooks/`.

- sinal: componente React toca storage, runtime de canvas ou parsing estrutural sem fronteira clara.
- evidência: legado com `localStorage` em tutorial/settings e acoplamento de editor com manager/canvas.

## 3. Sinais de Suspensão

- condição de suspensão: os componentes raiz passam a ser predominantemente de composição e encaminhamento.
- por que suspender: nessa situação, a heurística deixa de ser diferencial e vira apenas bom senso genérico.

- condição de suspensão: a feature adota uma fronteira explícita de store/comandos e a UI para de carregar lógica de
  coordenação ampla.
- por que suspender: o risco principal deixa de ser “React como orquestrador inchado”.

## 4. Heurísticas Ativas

### Heurística 1

- enunciado: componentes raiz do editor devem ser orquestradores finos, não centros de decisão estrutural.
- por que tende a funcionar neste contexto: o histórico do projeto mostra regressões e complexidade concentradas quando
  `RacEditor` virou hub de modais, ações, tutorial e canvas ao mesmo tempo.
- quando aplicar: ao tocar `ui/RacEditor.tsx`, `RacEditorModals.tsx`, `RacEditorCanvas.tsx` e wrappers equivalentes.
- quando suspender: quando a mudança for puramente visual e não adicionar nova coordenação.
- como falsificar: se a extração aumentar acoplamento, duplicar estado ou tornar o fluxo menos legível, a heurística
  falhou.
- custo de errar: médio, com risco de fragmentação artificial.
- reversibilidade: alta, porque extrações de hook/container podem ser consolidadas sem alterar contrato externo.

### Heurística 2

- enunciado: cada hook de editor deve encapsular um conceito operacional coeso, não apenas deslocar volume de código.
- por que tende a funcionar neste contexto: o histórico mostra que mover callbacks para hooks sem coesão suficiente
  produz “callback soup” com pouco ganho real.
- quando aplicar: ao refatorar hooks de viewport, contraventamento, piloti, tutorial, toolbar e modais.
- quando suspender: quando a coesão já estiver clara e a extração só trocar nomes sem reduzir acoplamento.
- como falsificar: se o hook novo exigir muitos parâmetros cruzados ou virar apenas fachada do antigo monólito.
- custo de errar: médio.
- reversibilidade: alta.

### Heurística 3

- enunciado: componentes React não devem carregar detalhes de storage, canvas ou parsing estrutural como
  responsabilidade primária.
- por que tende a funcionar neste contexto: o projeto já sofreu com `localStorage` e wiring de runtime vazando para a
  view.
- quando aplicar: ao tocar tutorial, settings, debug bridge, viewer 3D e integrações com canvas.
- quando suspender: quando a leitura for apenas adaptativa e superficial, sem decisão estrutural relevante.
- como falsificar: se a extração piorar a rastreabilidade do fluxo ou introduzir indireção desnecessária.
- custo de errar: médio.
- reversibilidade: média.

## 5. Anti-heurísticas e Falhas Comuns

### Anti-heurística 1

- enunciado: “quebrar em mais hooks” é sempre melhor.
- risco gerado: explosão de micro-hooks sem contrato claro, com dependências cruzadas e pouca melhoria real.
- sintoma de abuso: muitos hooks finos, mas `RacEditor` continua decidindo tudo.

### Anti-heurística 2

- enunciado: usar prop drilling e mapas de callback gigantes como substituto de fronteira arquitetural.
- risco gerado: API interna inchada e difícil de testar.
- sintoma de abuso: toolbar, modais e canvas trocando dezenas de callbacks específicos.

## 6. Implicações para Refactoring

- smells e hotspots relacionados:
    - god component
    - god hook
    - callback soup
    - storage/runtime vazando para view
- transformações preferenciais:
    - `extract hook`
    - `extract module`
    - `move`
    - `introduce parameter object` quando reduzir fan-out real
- transformações a evitar:
    - micro-hooks sem coesão
    - abstrações genéricas de UI sem lastro no fluxo do editor
- heurísticas irmãs relevantes:
    - `visual-editor`
    - `canvas`

## 7. Implicações para Regressão

- fluxos críticos afetados:
    - abertura/fechamento de modais
    - toolbar e overflow
    - tutorial e hotkeys
    - sincronização entre seleção ativa e editores
- riscos arquiteturais:
    - regressão silenciosa de wiring
    - perda de draft/contexto de modal
    - efeitos colaterais escondidos em callbacks
- validação mínima esperada:
    - smoke/E2E de toolbar, modais, tutorial, seleção e editores inline

## 8. Calibração e Limites

- quando esta heurística deixa de ajudar: quando a feature já estiver organizada por store/comandos e componentes finos.
- o que mudou desde a versão anterior: primeira materialização retroativa a partir do acervo `2026-02-27` e da árvore
  atual.
- critérios de deprecação: desaparecimento dos hotspots React como risco dominante da frente.
- revisão humana recomendada: validar se as extrações propostas reduzem acoplamento real ou apenas deslocam código.
