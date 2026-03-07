# 📜 Relatório de Análise de Refatoração: `rac-designer-teto`

**Data da Análise:** 26 de Fevereiro de 2026  
**Branch Analisada:** `manus`  
**Commit Head:** `34a57d3`

## 🚀 Resumo Executivo

Felipe, realizei uma análise completa do repositório `rac-designer-teto` conforme o playbook. O projeto demonstra uma
arquitetura bem pensada, com uso claro de **Domain-Driven Design (DDD)** e o padrão **Strategy** para a criação de
elementos no canvas. A base de código é robusta, mas identifiquei pontos críticos que, se endereçados, podem elevar
significativamente a estabilidade, manutenibilidade e a velocidade de desenvolvimento.

As prioridades imediatas são a **correção da suíte de testes**, que atualmente apresenta falhas importantes, e a *
*mitigação de riscos arquiteturais** relacionados ao acoplamento no componente `RacEditor` e no singleton
`houseManager`. O plano de refatoração anterior, encontrado em `.codex/`, foi um excelente ponto de partida e esta
análise o complementa com novas descobertas.

## 📊 Métricas do Código

| Métrica                         | Valor          | Observação                                              |
|---------------------------------|----------------|---------------------------------------------------------|
| **Arquivos TS/TSX (Total)**     | 239            | Complexidade considerável.                              |
| **Linhas de Código (TS/TSX)**   | ~23,510        | Base de código extensa.                                 |
| **Arquivos de Teste (`.test`)** | 33             | Boa quantidade inicial de testes.                       |
| **Suites de Teste (Status)**    | **4 Falhando** | **29 Passando**. Falhas bloqueiam a confiança no CI/CD. |
| **Testes Individuais (Status)** | **2 Falhando** | **110 Passando**. Erros em `house-view-creation`.       |
| **Usos de `any`**               | 190            | Pontos a serem refatorados para melhorar a tipagem.     |
| **`console.log` em produção**   | 8              | Logs de debug que devem ser removidos.                  |

## 📉 Análise de Testes: Falhas Críticas (Prioridade Alta)

A suíte de testes está instável, o que é um **risco para a integridade do projeto**. As falhas impedem a validação
automática de novas funcionalidades e refatorações.

### 1. Dependência Faltando: `@testing-library/dom`

- **Problema:** Três suítes de teste (`useHotkeys`, `Tutorial`, `useCanvasKeyboardShortcuts`) falham com o erro
  `Error: Cannot find module '@testing-library/dom'`. A investigação confirmou que `@testing-library/react` a requer
  como *peer dependency*, mas ela não está declarada no `package.json`.
- **Solução:** Adicionar a dependência que falta.

### 2. Mock Incompleto do Canvas no Ambiente de Teste (JSDOM)

- **Problema:** Dois testes em `house-view-creation.smoke.test.ts` falham porque o ambiente `jsdom` não simula a API do
  `<canvas>` do navegador, que é intensamente usada pela `fabric.js`.
    - `TypeError: Cannot set properties of null (setting 'textBaseline')`: Ocorre ao tentar criar um `new Text()` da
      `fabric`.
    - `TypeError: canvas.getObjects is not a function`: Confirma que o objeto `canvas` no teste não é uma instância
      completa da `fabric`.
- **Solução:** É necessário criar um mock robusto para a `fabric.Canvas` no arquivo de setup de testes (
  `src/test/setup.ts`).

## 🏛️ Análise Arquitetural e de Código

### 1. O Singleton `houseManager`: Alto Acoplamento (Risco Alto)

- **Observação:** O arquivo `house-manager.ts` (926 linhas) funciona como um **singleton** que centraliza quase todo o
  estado e a lógica de negócios do editor. Embora organize o código, ele se tornou um "God Object", criando um alto
  acoplamento com múltiplos componentes React, hooks e a lógica do canvas.
- **Riscos:**
    - **Dificuldade de Teste:** Testar componentes que dependem do `houseManager` é complexo.
    - **Manutenção:** Alterações no `houseManager` podem causar efeitos colaterais inesperados em todo o sistema.
    - **Escalabilidade:** Dificulta a paralelização de tarefas e a evolução modular do sistema.
- **Recomendação (Longo Prazo):** Planejar a **desconstrução gradual** do `houseManager`. A lógica pode ser migrada para
  hooks mais específicos e serviços menores, seguindo o Princípio da Responsabilidade Única (SRP).

### 2. O Componente `RacEditor.tsx`: Orquestrador Complexo (Risco Médio)

- **Observação:** `RacEditor.tsx` (571 linhas) é um componente orquestrador que inicializa mais de 20 hooks
  customizados, gerenciando estado, modais, e a lógica de interação entre a UI e o `houseManager`.
- **Riscos:** A complexidade e o número de dependências tornam este componente difícil de entender e depurar.
- **Recomendação:** Avaliar a possibilidade de agrupar hooks por funcionalidade (e.g., `useEditorState`,
  `useCanvasInteractions`) e extrair subcomponentes para reduzir a carga do `RacEditor`.

### 3. Padrão Strategy: Implementação e Inconsistências

- **Ponto Positivo:** O uso do padrão Strategy em `src/components/lib/canvas/factory/elements/` é excelente. O código é
  limpo, extensível e fácil de manter.
- **Inconsistência (Fácil de Corrigir):** Foram encontrados arquivos com um erro de digitação: `house-top.straregy.ts` e
  `house.straregy.ts`. O correto é `strategy`.
- **Recomendação:** Renomear os arquivos e atualizar as importações em `.../factory/house/index.ts` para manter a
  consistência do projeto.

### 4. Qualidade do Código: `any`, `console.log` e Números Mágicos

- **`any`:** Foram encontradas 190 ocorrências de `any`. Embora algumas sejam inevitáveis ao lidar com bibliotecas
  externas, muitas podem ser substituídas por tipos mais específicos, como o `CanvasObject` (que já é bem completo),
  melhorando a segurança do código.
- **`console.log`:** Existem 8 chamadas de `console.log` fora de arquivos de teste, que devem ser removidas para limpar
  o output em produção.
- **Números Mágicos:** Há um uso excessivo de números literais (e.g., `273`, `213`, `0.65`) diretamente no código,
  especialmente na lógica de renderização 3D. O arquivo `constants.ts` já existe e deve ser expandido para centralizar
  esses valores.

## 📝 Plano de Ação para Refatoração

Este plano é dividido em fases, priorizando o impacto e a urgência.

### **Fase 1: Estabilização da Suíte de Testes (Urgente)**

*O objetivo é ter uma suíte de testes 100% funcional para garantir a segurança das futuras refatorações.*

- **Tarefa 1.1:** Instalar a dependência `@testing-library/dom`.
    - **Comando:** `npm install --save-dev @testing-library/dom`
- **Tarefa 1.2:** Implementar um mock básico para `fabric.Canvas` em `src/test/setup.ts` para resolver as falhas de
  `house-view-creation`.
- **Tarefa 1.3:** Rodar todos os testes e garantir que 100% estão passando.
- **Commit Sugerido:** `fix(test): stabilize test suite by adding missing deps and canvas mock`

### **Fase 2: Melhorias de Baixo Esforço e Alto Impacto (Rápido)**

*Ações que limpam o código e melhoram a consistência com pouco esforço.*

- **Tarefa 2.1:** Renomear os arquivos `*.straregy.ts` para `*.strategy.ts` e corrigir as importações.
- **Tarefa 2.2:** Remover os 8 `console.log` encontrados no código-fonte da aplicação.
- **Tarefa 2.3:** Mover os "números mágicos" mais críticos (e.g., dimensões de componentes 3D) para o arquivo
  `constants.ts`.
- **Commit Sugerido:** `chore: apply quick wins (fix strategy typo, remove logs, centralize constants)`

### **Fase 3: Refatoração do Padrão `scalingGuard` (Médio Prazo)**

*O plano de refatoração anterior sugeriu um `withScalingGuard()`, mas a implementação atual é repetitiva. Vamos
refatorar isso.*

- **Observação:** O padrão de guarda contra recursão (`__normalizingScale`) está duplicado em 4 arquivos de estratégia (
  `arrow`, `distance`, `line`, `wall`).
- **Tarefa 3.1:** Criar uma função `withScalingGuard(group: Group, scalingFunction: () => void)` que encapsula essa
  lógica.
- **Tarefa 3.2:** Refatorar os 4 `bind...Scaling` para utilizar a nova função `withScalingGuard`, eliminando a
  duplicação.
- **Commit Sugerido:** `refactor(factory): abstract scaling guard logic to a reusable function`

### **Fase 4: Análise e Desacoplamento do `RacEditor` e `houseManager` (Longo Prazo)**

*Esta é uma iniciativa estratégica para garantir a saúde do projeto a longo prazo.*

- **Tarefa 4.1:** Iniciar a documentação da arquitetura do `houseManager`, mapeando suas responsabilidades e
  dependentes.
- **Tarefa 4.2:** Identificar a primeira peça de lógica a ser extraída do `houseManager` para um hook ou serviço
  independente (e.g., a lógica de manipulação de `pilotis`).
- **Tarefa 4.3:** Refatorar o `RacEditor` para agrupar hooks relacionados, melhorando a legibilidade e a organização.

## 🏁 Conclusão

O projeto está em um bom caminho, mas as **falhas nos testes representam um débito técnico que precisa ser pago
imediatamente**. A Fase 1 é crucial.

Após estabilizar a base, as Fases 2 e 3 trarão melhorias significativas de qualidade de código com esforço moderado. A
Fase 4 é uma maratona, não uma corrida, e deve ser planejada com cuidado para não introduzir instabilidade.

Recomendo fortemente focar na **Fase 1** como a próxima ação imediata. Uma base de testes sólida é o alicerce para
qualquer evolução futura do `rac-designer-teto`.
