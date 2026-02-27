# 🏗️ Plano de Refatoração Dinâmico (Agent 1 v2)

**Data da Análise:** 27 de Fevereiro de 2026
**Commit Head:** `c18108c`

---

## 🎯 Resumo Executivo

A análise do Agent 1 v2, executada após a mega refatoração (`c18108c`), detectou **12 testes falhando**, que são a prioridade máxima para estabilizar a `main`. Além disso, foram identificadas oportunidades críticas de melhoria, como a correção de typos em nomes de arquivos e a eliminação de duplicação no padrão `scaling guard`.

Este plano é **dinâmico** e foca em resolver os problemas de maior impacto primeiro, garantindo que o código se torne mais estável e manutenível antes de prosseguir com novas funcionalidades.

---

## 📊 Análise das 6 Dimensões (Pós-Refatoração)

| Dimensão | Observação Chave | Status | Prioridade |
| :--- | :--- | :--- | :--- |
| **1. Estrutura de Arquivos** | 214 arquivos de código, 18.9k linhas (core), 19 testes unitários. | 🟡 **Alerta** | Média |
| **2. Clean Architecture** | Domínio, Infra e Shared bem definidos. `HouseAggregate` com 264 linhas. | ✅ **OK** | Baixa |
| **3. Hooks SRP** | `useCanvasContraventamento` (9 `useEffect`), `useCanvasViewport` (8 `useState`). | 🔴 **Crítico** | Alta |
| **4. Componentes** | `RacEditor.tsx` é um "God Component" com 94 hooks e 569 linhas. | 🔴 **Crítico** | Alta |
| **5. Testes** | **12 testes falhando** após a refatoração. Cobertura baixa (19/195). | 🚨 **BLOCKER** | **URGENTE** |
| **6. Padrões de Código** | Typos em `straregy.ts`, duplicação do `scaling guard`. | 🔴 **Crítico** | Alta |

---

## 🚀 Plano de Refatoração Priorizado

### **Fase 1: Estabilização da `main` (Críticos e Blockers)**

**Objetivo:** Corrigir todos os testes que estão falhando para garantir a integridade da `main`.

- **[ ] Tarefa 1.1: Corrigir Testes de `house-views-layout`**
  - **Problema:** Funções como `resolveHouseViewInsertion` e `calculateStackedViewPositions` não estão exportadas em `house-views-layout.use-case.ts`, quebrando os testes.
  - **Ação:** Adicionar `export` nas funções necessárias para que os testes possam importá-las.
  - **Commit:** `fix(tests): exportar funções ausentes em house-views-layout`

- **[ ] Tarefa 1.2: Corrigir Testes de `house-top-view-door-marker`**
  - **Problema:** Similar à anterior, múltiplas funções não estão exportadas em `house-top-view-door-marker.ts`.
  - **Ação:** Adicionar `export` nas funções para corrigir os testes de `smoke`.
  - **Commit:** `fix(tests): exportar funções ausentes em house-top-door-marker`

- **[ ] Tarefa 1.3: Corrigir `this` em `canvas-rebuild.ts`**
  - **Problema:** A função `readPilotiDataFromCanvas` usa `this.house`, mas é chamada em um contexto onde `this` é `undefined`, quebrando os testes de `house-manager`.
  - **Ação:** Refatorar `readPilotiDataFromCanvas` para receber o estado da `house` como parâmetro em vez de depender de `this`.
  - **Commit:** `fix(rebuild): remover dependência de 'this' em readPilotiDataFromCanvas`

- **[ ] Tarefa 1.4: Corrigir Typos em Nomes de Arquivo**
  - **Problema:** Arquivos `house-top.straregy.ts` e `house.straregy.ts` com erro de digitação.
  - **Ação:** Renomear para `*.strategy.ts` e atualizar todos os `import`s correspondentes.
  - **Commit:** `fix(naming): corrigir typo em nomes de arquivo de strategy`

### **Fase 2: Eliminação de Duplicação e Code Smells (Alta Prioridade)**

**Objetivo:** Abstrair padrões duplicados e resolver as violações de SRP mais graves.

- **[ ] Tarefa 2.1: Abstrair `withScalingGuard`**
  - **Problema:** O padrão de `__normalizingScale` está duplicado em 4 arquivos de `strategy`.
  - **Ação:** Criar uma função `withScalingGuard` genérica, conforme sugerido no plano de refatoração anterior, e aplicá-la nas 4 strategies, removendo o código duplicado.
  - **Commit:** `refactor(factory): abstrair withScalingGuard para remover duplicação`

- **[ ] Tarefa 2.2: Refatorar `useCanvasContraventamento`**
  - **Problema:** O hook usa 9 `useEffect`s apenas para sincronizar props com refs, um padrão verboso e ineficiente.
  - **Ação:** Substituir os múltiplos `useEffect`s por um único `useEffect` que atualiza um objeto ref contendo todas as props, ou usar um custom hook como `useLatest`.
  - **Commit:** `refactor(hooks): simplificar sincronização de props em useCanvasContraventamento`

### **Fase 3: Melhorias Arquiteturais (Médio Prazo)**

**Objetivo:** Atacar a complexidade do `RacEditor` e melhorar a organização do estado.

- **[ ] Tarefa 3.1: Refatorar `useCanvasViewport` para `useReducer`**
  - **Problema:** O hook `useCanvasViewport` gerencia 8 `useState`s relacionados, o que o torna complexo.
  - **Ação:** Migrar o gerenciamento de estado para um `useReducer` para centralizar a lógica de transição de estado do viewport.
  - **Commit:** `refactor(hooks): migrar useCanvasViewport para useReducer`

- **[ ] Tarefa 3.2: Quebrar o God Component `RacEditor.tsx`**
  - **Problema:** `RacEditor.tsx` tem 569 linhas e 94 hooks, centralizando responsabilidades demais.
  - **Ação:** Extrair lógicas específicas para componentes filhos ou hooks mais especializados. Ex: `useEditorState`, `useEditorActions`.
  - **Commit:** `refactor(editor): extrair lógica de estado do RacEditor para hooks dedicados`

---

## 📈 Métricas de Sucesso

| Métrica | Estado Atual | Meta Pós-Refatoração |
| :--- | :--- | :--- |
| **Testes Falhando** | 12 | **0** |
| **Duplicação de `scaling guard`** | 4 instâncias | **0** |
| **`useEffect`s em `useCanvasContraventamento`** | 9 | **1** |
| **`useState`s em `useCanvasViewport`** | 8 | **1 (useReducer)** |
| **Linhas em `RacEditor.tsx`** | 569 | **< 400** |
