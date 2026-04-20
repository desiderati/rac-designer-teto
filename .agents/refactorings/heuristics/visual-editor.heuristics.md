---
title: "Refactoring Heuristic — Editor visual RAC"
doc_role: refactoring-heuristic
created: 2026-02-20
updated: 2026-04-20
heuristic_slug: visual-editor
scope_type: domain
status: active
confidence: high
applicable_resource_slugs:
  - rac-editor-architecture
  - elements-factory
consumers: [ refactoring ]
tags: [ refactoring, heuristic, visual-editor ]
---

# Refactoring Heuristic — Editor visual RAC

> Revisão humana recomendada antes de usar este arquivo como base durável.

## 1. Contexto e Escopo

- escopo heurístico: fluxos de criação, seleção, edição, confirmação e aplicação de mudanças no editor gráfico.
- superfície observada: toolbar, modais, editores inline, criação de elementos, fluxo de piloti, house views e
  contraventamento.
- `resource-slugs` associados: `rac-editor-architecture`, `elements-factory`
- prompts duráveis associados:
    - `.agents/prompts/refactoring-rac-editor-architecture.prompt.md`
    - `.agents/prompts/refactoring-elements-factory.prompt.md`
- evidências fortes:
    - docs em `docs/` descrevem o produto por comportamento visual, não por camadas técnicas.
    - o acervo antigo fala repetidamente em toolbar, views, piloti, contraventamento, editores lineares e snapshot 3D.
    - o estado atual mantém helpers de edição genérica e estratégias específicas por tipo de objeto.
- evidências fracas:
    - não há ainda catálogo formal único de comandos do editor.

## 2. Sinais de Ativação

- sinal: a frente envolve seleção ativa, objeto corrente, draft, aplicar/cancelar e feedback visual.
- evidência: fluxo atual de `GenericObjectEditor`, `PilotiEditor`, editores lineares e modais do editor.

- sinal: a criação/edição de objetos depende de toolbar, menu ou gesto visual.
- evidência: docs funcionais de `canvas.md`, `toolbar.md`, `piloti-*` e `vistas-por-tipo.md`.

- sinal: a mesma regra de edição aparece espalhada entre helpers, modais e runtime de canvas.
- evidência: histórico do `elements-factory` e dos editores de parede/linha/seta/distância.

## 3. Sinais de Suspensão

- condição de suspensão: a frente deixa de ser orientada por seleção e edição visual direta.
- por que suspender: a heurística é específica de editor visual, não de backend ou domínio puro.

- condição de suspensão: os fluxos passam a ser dirigidos por contratos estáveis e separados do gesto visual.
- por que suspender: nesse caso a heurística cede espaço a uma heurística mais arquitetural.

## 4. Heurísticas Ativas

### Heurística 1

- enunciado: separar claramente leitura do estado do objeto, draft de edição e aplicação final da mudança.
- por que tende a funcionar neste contexto: a maior parte dos bugs do editor visual nasce quando leitura, draft e commit
  se misturam.
- quando aplicar: em modais, editores inline e helpers de estado do objeto.
- quando suspender: quando a alteração for puramente cosmética e não tocar fluxo de edição.
- como falsificar: se a separação tornar o fluxo mais difícil de seguir ou duplicar transformação sem ganho.
- custo de errar: médio.
- reversibilidade: alta.

### Heurística 2

- enunciado: criação de elemento, normalização visual e integração com editor devem ser acopladas por contrato, não por
  conhecimento implícito.
- por que tende a funcionar neste contexto: o legado do `elements-factory` mostrou que conhecimento implícito gera
  duplicação e fragilidade.
- quando aplicar: ao tocar strategies, helpers compartilhados e leitores/escritores de editores.
- quando suspender: quando o objeto for simples o suficiente para não merecer abstração extra.
- como falsificar: se o contrato novo virar sobreengenharia para um único tipo de objeto.
- custo de errar: médio.
- reversibilidade: média.

### Heurística 3

- enunciado: a UX do editor deve ser preservada como contrato funcional durante a refatoração.
- por que tende a funcionar neste contexto: docs do projeto ancoram o comportamento esperado por fluxo de uso.
- quando aplicar: em toolbar, minimap, modais, seleção de vistas, piloti e 3D.
- quando suspender: nunca para frentes que ainda afetem uso diário do editor.
- como falsificar: se a refatoração “limpa” código, mas muda interação, bloqueios ou feedbacks visuais.
- custo de errar: alto.
- reversibilidade: média.

## 5. Anti-heurísticas e Falhas Comuns

### Anti-heurística 1

- enunciado: deixar o próprio objeto do canvas ditar todo o fluxo de edição.
- risco gerado: lógica de UX vazando para runtime e perda de rastreabilidade de estado.
- sintoma de abuso: modais leem/escrevem direto em objetos sem camada intermediária clara.

### Anti-heurística 2

- enunciado: duplicar lógica por tipo de objeto porque “cada editor é especial”.
- risco gerado: divergência silenciosa entre line/arrow/distance/wall e manutenção cara.
- sintoma de abuso: helpers quase idênticos com pequenas diferenças ad hoc.

## 6. Implicações para Refactoring

- smells e hotspots relacionados:
    - duplicated editor logic
    - hidden coupling between toolbar/editor/canvas
    - object-shape knowledge spread
- transformações preferenciais:
    - `extract helper`
    - `extract strategy`
    - `move`
    - `rename` quando o nome atual mascara responsabilidade
- transformações a evitar:
    - abstração “framework” de editor sem evidência
    - generalização prematura de todos os tipos em um único contrato pesado
- heurísticas irmãs relevantes:
    - `canvas`
    - `react`

## 7. Implicações para Regressão

- fluxos críticos afetados:
    - edição de parede, linha, seta, distância e piloti
    - toolbar e overflow
    - house views e seleção de lado
- riscos arquiteturais:
    - perda de draft
    - objeto errado sendo editado
    - divergência entre criação e edição do mesmo tipo
- validação mínima esperada:
    - smoke/E2E de criação, seleção, abrir editor, aplicar, cancelar e verificar persistência visual

## 8. Calibração e Limites

- quando esta heurística deixa de ajudar: quando a frente for puramente de domínio/infra, sem gesto visual relevante.
- o que mudou desde a versão anterior: primeira materialização retroativa usando docs funcionais e o acervo de
  fevereiro.
- critérios de deprecação: o editor deixar de ser superfície principal do produto ou os fluxos virarem APIs formais
  estáveis fora da UI.
- revisão humana recomendada: confirmar que a refatoração preserva o vocabulário funcional do produto descrito em
  `docs/`.
