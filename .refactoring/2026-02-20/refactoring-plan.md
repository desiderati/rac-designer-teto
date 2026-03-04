# Plano de Refatoração Incremental: RAC Designer TETO (v2)

**Data:** 20/02/2026  
**Objetivo:** reduzir acoplamento, quebrar arquivos monolíticos e aumentar testabilidade sem reescrita arriscada.

## 1) Diagnóstico Atualizado (repositório real)

### Hotspots confirmados

| Arquivo                                   | Linhas (aprox.) | Problema principal                                                | Prioridade |
|-------------------------------------------|----------------:|-------------------------------------------------------------------|------------|
| `src/lib/canvas-utils.ts`                 |            2477 | utilitário gigante (criação, transformação, serialização, regras) | Alta       |
| `src/components/rac-editor/RacEditor.tsx` |            2125 | orquestração de UI + fluxo + regras + tutorial                    | Alta       |
| `src/components/rac-editor/Canvas.tsx`    |            1634 | estado de viewport, eventos Fabric, histórico, seleção, atalhos   | Alta       |
| `src/lib/house-manager.ts`                |            1175 | estado global + regra de negócio + sincronização com Fabric       | Alta       |

### Arquivos adicionais que devem entrar na refatoração

| Arquivo                                           | Linhas (aprox.) | Motivo para incluir                                           | Prioridade |
|---------------------------------------------------|----------------:|---------------------------------------------------------------|------------|
| `src/components/rac-editor/House3DScene.tsx`      |             654 | mistura modelagem 3D, geometria e mapeamento da regra de casa | Alta       |
| `src/components/rac-editor/Toolbar.tsx`           |             568 | interface com 30+ callbacks; API inchada e acoplada ao editor | Alta       |
| `src/components/rac-editor/PilotiEditor.tsx`      |             504 | UI + regra de piloti + persistência indireta via manager      | Alta       |
| `src/components/rac-editor/House3DViewer.tsx`     |             317 | sync manual com `houseManager`, parsing de contraventamento   | Média      |
| `src/components/rac-editor/Minimap.tsx`           |             270 | lógica de interação (drag/touch/zoom) sem isolamento por hook | Média      |
| `src/components/rac-editor/Tutorial.tsx`          |             167 | persistência direta em `localStorage` e estados de fluxo      | Média      |
| `src/components/rac-editor/HouseSideSelector.tsx` |             139 | depende diretamente de `houseManager` (estado global na view) | Média      |
| `src/lib/settings.ts`                             |              29 | acesso direto a `localStorage` sem camada de persistência     | Média      |

### Fora de escopo por enquanto

- `src/components/ui/*` (ex.: `sidebar.tsx`): componentes genéricos de UI sem relação direta com regras do RAC.

---

## 2) Ajustes de Direção Arquitetural

O plano original está correto na direção, mas para reduzir risco de regressão vamos aplicar:

1. **Incremental por fatias funcionais**, sem "big bang".
2. **Compatibilidade primeiro**: manter API pública dos módulos até o fim de cada fase.
3. **Teste de comportamento antes da mudança estrutural**.
4. **Domain/Application/Clean Architecture completa apenas após modularização estabilizada**.

---

## 3) Plano Incremental Revisado

## Fase 0 - Baseline e segurança (3-5 dias)

**Objetivo:** ter rede de segurança antes de quebrar arquivos grandes.

**Entregas**

- Configurar testes de unidade/integração leve (Vitest + RTL).
- Criar smoke tests dos fluxos críticos:
    - criar casa tipo 6 e tipo 3;
    - editar piloti (altura/master/nível);
    - adicionar/remover vistas;
    - importar/exportar JSON.
- Criar checklist de regressão manual para Fabric/3D (zoom, pan, undo, seleção).

**Critério de aceite**

- suíte mínima executando no CI local;
- baseline de comportamento documentado.

---

## Fase 1 - Modularizar `canvas-utils` sem mudar comportamento (Semana 1)

**Objetivo:** diminuir risco central antes de mexer em componentes.

**Arquivos alvo**

- `src/lib/canvas-utils.ts` -> quebrar em:
    - `src/lib/canvas/constants.ts`
    - `src/lib/canvas/house-side.strategy.ts`
    - `src/lib/canvas/piloti-ops.ts`
    - `src/lib/canvas/elements-factory.ts`
    - `src/lib/canvas/contraventamento.ts`
    - `src/lib/canvas/hints.ts`
    - `src/lib/canvas/index.ts` (re-export para compatibilidade)

**Critério de aceite**

- `RacEditor` e `Canvas` continuam compilando sem mudança de uso;
- sem regressão nos smoke tests da Fase 0.

---

## Fase 2 - Isolar estado e persistência do domínio atual (Semana 2)

**Objetivo:** reduzir dependências diretas de singleton/localStorage.

**Arquivos alvo**

- `src/lib/house-manager.ts`
- `src/lib/settings.ts`
- `src/components/rac-editor/Tutorial.tsx`
- `src/components/rac-editor/HouseSideSelector.tsx`

**Mudanças**

- Criar `src/lib/state/house-store.ts` com adaptador para `houseManager`.
- Usar `useSyncExternalStore` para assinatura de estado (em vez de `forceUpdate`).
- Criar `src/lib/persistence/tutorial.storage.ts` e `src/lib/persistence/settings.storage.ts`.
- Remover acesso direto a `localStorage` de componentes.

**Critério de aceite**

- componentes seguem com mesmo comportamento visual;
- estado/tutorial testáveis sem renderizar tela completa.

---

## Fase 3 - Quebrar `RacEditor` por responsabilidades (Semana 3)

**Objetivo:** transformar `RacEditor` em orquestrador fino.

**Arquivos alvo**

- `src/components/rac-editor/RacEditor.tsx`
- `src/components/rac-editor/Toolbar.tsx`
- `src/components/rac-editor/PilotiEditor.tsx`

**Mudanças**

- Extrair hooks de fluxo:
    - `useRacTutorialFlow`
    - `useRacModalState`
    - `useContraventamentoFlow`
    - `useHouseTypeFlow`
- Reduzir prop drilling de `Toolbar` com `ToolbarActionMap`/`command handlers`.
- Separar `PilotiEditor` em:
    - componente de apresentação
    - hook de regra (`usePilotiEditor`)

**Meta técnica**

- `RacEditor.tsx` <= 900 linhas nesta fase.

**Critério de aceite**

- sem perda de funcionalidade de menu, tutorial e editores;
- callbacks de toolbar com contrato simplificado.

---

## Fase 4 - Quebrar `Canvas.tsx` em hooks de infraestrutura (Semana 4)

**Objetivo:** separar ciclo de vida do Fabric e interações.

**Arquivos alvo**

- `src/components/rac-editor/Canvas.tsx`
- `src/components/rac-editor/Minimap.tsx`

**Mudanças**

- Extrair hooks:
    - `useCanvasViewport`
    - `useCanvasHistory`
    - `useCanvasHouseSelection`
    - `useCanvasClipboard`
    - `useContraventamentoRefs`
- Isolar atalhos de teclado e manipulação touch/mouse.
- Deixar `Canvas.tsx` focado em composição.

**Meta técnica**

- `Canvas.tsx` <= 700 linhas nesta fase.

**Critério de aceite**

- undo/redo, copy/paste, zoom/pan, minimapa e seleção funcionando;
- testes de interação nos hooks principais.

---

## Fase 5 - Consolidar fronteira 2D/3D (Semana 5)

**Objetivo:** remover regra de negócio de componentes 3D.

**Arquivos alvo**

- `src/components/rac-editor/House3DScene.tsx`
- `src/components/rac-editor/House3DViewer.tsx`

**Mudanças**

- Extrair mapeamento para módulos puros:
    - `src/lib/3d/house-elements-parser.ts`
    - `src/lib/3d/contraventamento-parser.ts`
    - `src/lib/3d/constants.ts`
- `House3DViewer` fica como container de câmera/controles.

**Critério de aceite**

- render 3D preservado para tipo 3/tipo 6;
- parsing de contraventamento testado isoladamente.

---

## Fase 6 - Padronizar editores e preparar domínio (Semana 6)

**Objetivo:** remover duplicação entre editores e simplificar extensão.

**Arquivos alvo**

- `src/components/rac-editor/GenericObjectEditor.tsx`
- `src/components/rac-editor/DistanceEditor.tsx`
- `src/components/rac-editor/ObjectEditor.tsx`
- `src/components/rac-editor/LineArrowEditor.tsx`
- `src/components/rac-editor/PilotiEditor.tsx`

**Mudanças**

- Introduzir contrato comum de editor (strategy/adapters) de forma pragmática.
- Padronizar entrada/saída de seleção e aplicação de alterações.

**Critério de aceite**

- reduzir código duplicado e manter UX atual;
- adicionar novo editor sem tocar em múltiplos componentes centrais.

---

## Fase 7 - Domínio/Application (opcional e guiado por risco) (Semana 7-8)

**Objetivo:** aplicar Clean Architecture onde gerar ganho real.

**Escopo recomendado**

- iniciar por `Piloti` e `House` apenas;
- introduzir repositório e casos de uso sem migrar tudo de uma vez.

**Observação importante**

- evitar criar muitas camadas antes de estabilizar Fases 1-6.

---

## 4) Backlog de Arquivos Incluídos na Refatoração

### Prioridade Alta

- `src/lib/canvas-utils.ts`
- `src/lib/house-manager.ts`
- `src/components/rac-editor/RacEditor.tsx`
- `src/components/rac-editor/Canvas.tsx`
- `src/components/rac-editor/House3DScene.tsx`
- `src/components/rac-editor/Toolbar.tsx`
- `src/components/rac-editor/PilotiEditor.tsx`

### Prioridade Média

- `src/components/rac-editor/House3DViewer.tsx`
- `src/components/rac-editor/Minimap.tsx`
- `src/components/rac-editor/Tutorial.tsx`
- `src/components/rac-editor/HouseSideSelector.tsx`
- `src/lib/settings.ts`

---

## 5) Riscos e Mitigações

1. **Regressão em Fabric.js**  
   Mitigação: smoke tests + checklist manual por fase.

2. **Paralisia por overengineering**  
   Mitigação: adiar arquitetura completa para Fase 7.

3. **Propagação de mudanças em cadeia**  
   Mitigação: manter camada de compatibilidade (`index.ts` re-export) nas fases iniciais.

4. **Quebra de fluxo de tutorial/persistência**  
   Mitigação: centralizar `localStorage` em módulos de persistência na Fase 2.

---

## 6) Próximos Passos (execução)

1. Executar **Fase 0** imediatamente (baseline de testes + checklist).
2. Em seguida iniciar **Fase 1** com PR pequeno focado apenas em `canvas-utils`.
3. Validar com smoke tests antes de avançar para Fase 2.

---

## 7) Resumo

- A lógica geral do plano original faz sentido.
- O plano foi ajustado para reduzir risco de regressão com entregas incrementais.
- Foram validados e incluídos arquivos adicionais relevantes para a refatoração.

## 8) Atualização 2026-02-22 (Rodada de Continuidade)

### Escopo concluído nesta rodada

- Renomeação técnica de nomenclatura de componente para padrão atual:
    - componente raiz: `RacEditor`
    - componente de editores inline: `RacEditorModalEditors`
- Renomeação de arquivos e imports no código:
    - `src/components/rac-editor/RacEditor.tsx`
    - `src/components/rac-editor/RacEditorModalEditors.tsx`
    - atualização de usos em `src/pages/Index.tsx` e referências internas.
- Continuidade da quebra de responsabilidades:
    - setup de Fabric isolado em `useCanvasFabricSetup`
    - fluxo de contraventamento isolado em `useContraventamento`
    - fluxo de vistas/tipo de casa isolado em `useRacViewActions`.
- Sincronização de documentação:
    - `.rules` e `.codex` atualizados para refletir hooks extraídos e nomenclatura `RacEditor`.

### Estado de tamanho dos arquivos críticos

- `src/components/rac-editor/RacEditor.tsx`: 1033 linhas
- `src/components/rac-editor/Canvas.tsx`: 625 linhas

### Próximo alvo de refatoração

1. reduzir `RacEditor.tsx` para <= 900 linhas com extração do bloco de ações de toolbar/elementos;
2. reduzir `Canvas.tsx` para <= 550 linhas com extração dos handlers de pan/zoom/touch em hook dedicado;
3. manter validação obrigatória após cada lote (`eslint` alvo + `test` + `build`).

### Atualização 2026-02-22 (continuidade - passos 79/80)

- `useCanvasFabricSetup.ts`:
    - tipagem dos metadados Fabric consolidada em `CanvasObject`;
    - callbacks/refs consumidos por `latestArgsRef` para manter listeners estáveis sem violar `exhaustive-deps`;
    - remoção de `any` explícito sem desabilitar lint.
- `RacEditor.tsx`:
    - extraído `useCanvasTools` para concentrar ações de inserir elementos/linhas/dimensão/texto e toggle de desenho;
    - redução de tamanho: `1211 -> 1073` linhas.

Estado atual dos arquivos críticos:

- `src/components/rac-editor/RacEditor.tsx`: 994 linhas
- `src/components/rac-editor/Canvas.tsx`: 705 linhas
- `src/components/rac-editor/hooks/useCanvasFabricSetup.ts`: 1053 linhas

Próximos recortes planejados:

1. reduzir `RacEditor.tsx` para <= 950 com extração dos fluxos restantes de agrupamento/tutorial para hooks dedicados;
2. reduzir `useCanvasFabricSetup.ts` para <= 800 com divisão de handlers (`selection`, `contraventamento`, `keyboard`);
3. manter ciclo obrigatório por passo: `eslint` alvo + `npm run test -- --run` + `npm run build` +
   `npm run test:e2e -- --workers=1`.

### Atualização 2026-02-22 (continuidade - passos 83/84)

- `RacEditor.tsx`:
    - extração de `Agrupar/Desagrupar` para `useRacGroupingActions`.
- `useCanvasFabricSetup.ts`:
    - divisão dos bindings em hooks especializados:
        - `useCanvasSelectionActions`
        - `useContraventamentoEvents`
        - `useCanvasKeyboardShortcuts`
    - lint preservado sem supressões.

Estado atual dos arquivos críticos:

- `src/components/rac-editor/RacEditor.tsx`: 893 linhas
- `src/components/rac-editor/Canvas.tsx`: 705 linhas
- `src/components/rac-editor/hooks/useCanvasFabricSetup.ts`: 635 linhas

Próximos recortes planejados:

1. reduzir `Canvas.tsx` para <= 650 com extração dos blocos restantes de interação mobile/double-click para hooks
   utilitários;
2. reduzir `RacEditor.tsx` para <= 850 com extração dos fluxos restantes de modal/tutorial/viewer para hooks dedicados;
3. manter ciclo obrigatório por passo: `eslint` alvo + `npm run test -- --run` + `npm run build` +
   `npm run test:e2e -- --workers=1`.

### Atualização 2026-02-22 (continuidade - passo 85)

- `Canvas.tsx`:
    - extração dos handlers de ponteiro/touch para `useCanvasPointerInteractions`;
    - delegação de pan/wheel/pinch/single-finger pan e prevenção de zoom do browser no hook.

Estado atual dos arquivos críticos:

- `src/components/rac-editor/RacEditor.tsx`: 895 linhas
- `src/components/rac-editor/Canvas.tsx`: 497 linhas
- `src/components/rac-editor/hooks/useCanvasFabricSetup.ts`: 635 linhas

Próximos recortes planejados:

1. reduzir `RacEditor.tsx` para <= 850 com extração dos fluxos restantes de modal/tutorial/viewer para hooks dedicados;
2. revisar `useCanvasFabricSetup.ts` para quebrar o bloco remanescente de `double-click`/seleções auxiliares em sub-hook
   específico;
3. manter ciclo obrigatório por passo: `eslint` alvo + `npm run test -- --run` + `npm run build` +
   `npm run test:e2e -- --workers=1`.

### Atualização 2026-02-22 (continuidade - passo 86)

- `RacEditor.tsx`:
    - extração das ações de piloti para `usePilotiActions`;
    - delegação de seleção/fechamento/navegação/altura preservando regras existentes.

Estado atual dos arquivos críticos:

- `src/components/rac-editor/RacEditor.tsx`: 847 linhas
- `src/components/rac-editor/Canvas.tsx`: 497 linhas
- `src/components/rac-editor/hooks/useCanvasFabricSetup.ts`: 635 linhas

Próximos recortes planejados:

1. revisar `useCanvasFabricSetup.ts` para extrair o bloco remanescente de `double-click`/seleções auxiliares em hook
   dedicado;
2. reduzir `RacEditor.tsx` para <= 800 com extração dos fluxos de tutorial/menu restantes;
3. manter ciclo obrigatório por passo: `eslint` alvo + `npm run test -- --run` + `npm run build` +
   `npm run test:e2e -- --workers=1`.

### Atualização 2026-02-22 (continuidade - passos 87/88)

- `useCanvasFabricSetup.ts`:
    - extração do bloco remanescente de `double-click`/seleções auxiliares para `useCanvasEditorEvents`.
- `RacEditor.tsx`:
    - extração do fluxo de menu/tutorial para `useRacMenuTutorialActions`.

Estado atual dos arquivos críticos:

- `src/components/rac-editor/RacEditor.tsx`: 769 linhas
- `src/components/rac-editor/Canvas.tsx`: 497 linhas
- `src/components/rac-editor/hooks/useCanvasFabricSetup.ts`: 405 linhas

Próximos recortes planejados:

1. revisar `RacEditor` para extrair bloco de tutorial/restart/tutorial remanescente em hook dedicado;
2. manter `useCanvasFabricSetup` como orquestrador fino (avaliar split opcional de setup de histórico/brush);
3. manter ciclo obrigatório por passo: `eslint` alvo + `npm run test -- --run` + `npm run build` +
   `npm run test:e2e -- --workers=1`.

### Atualização 2026-02-22 (continuidade - passo 89)

- `RacEditor.tsx`:
    - extração de tutorial/restart/tutorial para `useRacTutorialUiActions`;
    - extração de inicialização de `houseManager` para `useRacHouseInitialization`.

Estado atual dos arquivos críticos:

- `src/components/rac-editor/RacEditor.tsx`: 682 linhas
- `src/components/rac-editor/Canvas.tsx`: 498 linhas
- `src/components/rac-editor/hooks/useCanvasFabricSetup.ts`: 405 linhas

Próximos recortes planejados:

1. revisar `RacEditor` para extrair utilitários restantes de edição genérica (cores/tipos) e reduzir para <= 650;
2. manter estabilização E2E de fluxo de criação de casa (evitar flake de elemento detached em clique de opção);
3. manter ciclo obrigatório por passo: `eslint` alvo + `npm run test -- --run` + `npm run build` +
   `npm run test:e2e -- --workers=1`.

### Atualização 2026-02-22 (continuidade - passo 90)

- `RacEditor.tsx`:
    - extração dos utilitários de edição genérica para `useWallEditorActions`.

Estado atual dos arquivos críticos:

- `src/components/rac-editor/RacEditor.tsx`: 618 linhas
- `src/components/rac-editor/Canvas.tsx`: 498 linhas
- `src/components/rac-editor/hooks/useCanvasFabricSetup.ts`: 405 linhas

Próximos recortes planejados:

1. revisar acoplamento residual de `RacEditor` com `houseManager` (`getToolbarViewCount` e `handleSavePDF`) para hooks
   utilitários finais;
2. manter estabilidade E2E do fluxo de criação de casa (monitorar flake eventual de detach em clique de opção);
3. manter ciclo obrigatório por passo: `eslint` alvo + `npm run test -- --run` + `npm run build` +
   `npm run test:e2e -- --workers=1`.

### Atualização 2026-02-22 (continuidade - passos 91/92/93)

- `Canvas.tsx`:
    - extração dos overlays visuais e de navegação para `CanvasOverlays`.
- `RacEditor.tsx`:
    - extração dos overlays/modais/tutoriais para `RacEditorModals`;
    - extração de helpers de interação canvas/menu para `useCanvasActions`.

Estado atual dos arquivos críticos:

- `src/components/rac-editor/RacEditor.tsx`: 507 linhas
- `src/components/rac-editor/Canvas.tsx`: 401 linhas
- `src/components/rac-editor/hooks/useCanvasFabricSetup.ts`: 368 linhas

Próximos recortes planejados:

1. reduzir `RacEditor.tsx` para <= 450 com extração do bloco remanescente de composição da `Toolbar`/ações;
2. revisar `Canvas.tsx` para extração opcional de utilitários de projeção/offset para hook dedicado e manter <= 380;
3. manter ciclo obrigatório por passo: `eslint` alvo + `npm run test -- --run` + `npm run build` +
   `npm run test:e2e -- --workers=1`.

### Atualização 2026-02-22 (correção de tipagem - passo 94)

- Objetivo da rodada:
    - zerar erros de tipagem reportados no editor (`TS2739`, `TS2345`, `TS2540`, `TS2339`, `TS2322`, `TS2352`) sem
      desabilitar lint/regras e sem alterar regra de negócio.
- Resultado:
    - `tsc` estrito validado (`--strict`) em `tsconfig.app.json`;
    - validações completas (`eslint` alvo + `test` + `build` + `e2e`) aprovadas.
- Estado atual dos arquivos críticos:
    - `src/components/rac-editor/RacEditor.tsx`: 507 linhas
    - `src/components/rac-editor/Canvas.tsx`: 401 linhas
    - `src/components/rac-editor/hooks/useCanvasFabricSetup.ts`: 368 linhas

### Atualização 2026-02-22 (continuidade - passos 95/96)

- `RacEditor.tsx`:
    - extração da composição de ações da toolbar para `useRacToolbarActions`;
    - extração da seção de canvas + infobar para `RacEditorCanvas`.

- Estado atual dos arquivos críticos:
    - `src/components/rac-editor/RacEditor.tsx`: 493 linhas
    - `src/components/rac-editor/Canvas.tsx`: 401 linhas
    - `src/components/rac-editor/hooks/useCanvasFabricSetup.ts`: 368 linhas

- Próximos recortes planejados:
    1. reduzir `RacEditor.tsx` para <= 450 com extração do wiring dos editores inline (`RacEditorModalEditors`) para
       seção dedicada;
    2. revisar `Canvas.tsx` para extração de projeção/offset/centro visível para hook dedicado e manter <= 380;
    3. manter ciclo obrigatório por passo: `eslint` alvo + `tsc --strict` + `npm run test -- --run` + `npm run build` +
       `npm run test:e2e -- --workers=1`.

### Atualização 2026-02-22 (continuidade - passos 97/98/99)

- `RacEditor.tsx`:
    - compactação de orquestração final (sem mudança de comportamento), atingindo **443** linhas.
- `Canvas.tsx`:
    - extração de projeção/offset/centro visível para `useCanvasScreenProjection`;
    - extração do snapshot de objetos do minimap para `useCanvasMinimapObjects`;
    - tamanho reduzido para **335** linhas.

Estado atual dos arquivos críticos:

- `src/components/rac-editor/RacEditor.tsx`: 443 linhas
- `src/components/rac-editor/Canvas.tsx`: 335 linhas
- `src/components/rac-editor/hooks/useCanvasFabricSetup.ts`: 368 linhas

Próximos recortes planejados:

1. reduzir `useCanvasFabricSetup.ts` para <= 320 com extração dos blocos remanescentes de bootstrap/configuração;
2. reduzir `RacEditorModalEditors`/`RacEditorModals` por composição de props em contratos menores para simplificar
   wiring;
3. manter ciclo obrigatório por passo: `eslint` alvo + `tsc --strict` + `npm run test -- --run` + `npm run build` +
   `npm run test:e2e -- --workers=1`.

### Atualização 2026-02-22 (bugfix - passo 107)

- Correção de regressão funcional:
    - `GenericObjectEditor` voltou a persistir alterações de nome/cor durante edição aberta;
    - ajuste aplicado em `useGenericObjectEditorDraft` para evitar ressincronização de draft a cada render.
- Cobertura automática nova:
    - `GenericObjectEditor.smoke.test.tsx` garante que o fluxo de editar + confirmar mantém valor e cor aplicados.

Estado atual dos arquivos críticos:

- `src/components/rac-editor/RacEditor.tsx`: 443 linhas
- `src/components/rac-editor/Canvas.tsx`: 321 linhas
- `src/components/rac-editor/hooks/useCanvasFabricSetup.ts`: 271 linhas
- `src/components/rac-editor/hooks/useContraventamento.ts`: 110 linhas

Próximos recortes planejados:

1. revisar contratos de props em `RacEditorModals` e `RacEditorModalEditors` para reduzir largura da interface;
2. reduzir acoplamento residual de `RacEditor` com `houseManager` (leituras diretas de estado);
3. manter ciclo obrigatório por passo: `eslint` alvo + `tsc --strict` + `npm run test -- --run` + `npm run build` +
   `npm run test:e2e -- --workers=1`.

### Atualização 2026-02-22 (continuidade - passo 104)

- `useContraventamento.ts`:
    - consultas de domínio/canvas extraídas para `useContraventamentoQueries`;
    - orquestrador principal preservado para comandos/efeitos.

Estado atual dos arquivos críticos:

- `src/components/rac-editor/RacEditor.tsx`: 443 linhas
- `src/components/rac-editor/Canvas.tsx`: 321 linhas
- `src/components/rac-editor/hooks/useCanvasFabricSetup.ts`: 313 linhas
- `src/components/rac-editor/hooks/useContraventamento.ts`: 340 linhas

Próximos recortes planejados:

1. extrair comandos de `useContraventamento` para `useContraventamentoCommands`;
2. extrair efeitos de `useContraventamento` para `useContraventamentoEffects`;
3. mover tipos runtime de `useCanvasFabricSetup.ts` para `canvas.ts`, mantendo ciclo completo de
   validação por passo.

### Atualização 2026-02-22 (continuidade - passos 105/106)

- `useContraventamento.ts`:
    - extração dos comandos para `useContraventamentoCommands`;
    - extração dos efeitos para `useContraventamentoEffects`;
    - composição final em orquestrador fino com `useContraventamentoQueries`.
- `useCanvasFabricSetup.ts`:
    - tipos runtime de Fabric movidos para `canvas.ts`.

Estado atual dos arquivos críticos:

- `src/components/rac-editor/RacEditor.tsx`: 443 linhas
- `src/components/rac-editor/Canvas.tsx`: 321 linhas
- `src/components/rac-editor/hooks/useCanvasFabricSetup.ts`: 271 linhas
- `src/components/rac-editor/hooks/useContraventamento.ts`: 110 linhas

Próximos recortes planejados:

1. revisar contratos de props em `RacEditorModals` e `RacEditorModalEditors` para reduzir largura da interface;
2. reduzir acoplamento residual de `RacEditor` com `houseManager` (leituras diretas de estado);
3. manter ciclo obrigatório por passo: `eslint` alvo + `tsc --strict` + `npm run test -- --run` + `npm run build` +
   `npm run test:e2e -- --workers=1`.

### Atualização 2026-02-22 (continuidade - passos 102/103)

- `RacEditor.tsx`:
    - extração do cálculo de `isAnyEditorOpen` e wiring de seleção inline para `useGenericObjectEditorBindings`.
- `Toolbar.tsx`:
    - decomposição em componentes dedicados:
        - `ToolbarButtons`
        - `ToolbarMainMenu`
        - `ToolbarOverflowMenu`
    - extração de ícones/comandos para `toolbar-config`;
    - extração de tipos compartilhados para `toolbar-types`.

Estado atual dos arquivos críticos:

- `src/components/rac-editor/RacEditor.tsx`: 443 linhas
- `src/components/rac-editor/Canvas.tsx`: 321 linhas
- `src/components/rac-editor/hooks/useCanvasFabricSetup.ts`: 313 linhas
- `src/components/rac-editor/Toolbar.tsx`: 61 linhas

Próximos recortes planejados:

1. quebrar `useContraventamento.ts` em:
    - `useContraventamentoQueries`
    - `useContraventamentoCommands`
    - `useContraventamentoEffects`
2. mover tipos runtime de `useCanvasFabricSetup.ts` para `canvas.ts`;
3. manter ciclo obrigatório por passo: `eslint` alvo + `tsc --strict` + `npm run test -- --run` + `npm run build` +
   `npm run test:e2e -- --workers=1`.

### Atualização 2026-02-22 (continuidade - passo 100)

- `useCanvasFabricSetup.ts`:
    - extração do fluxo de seleção de piloti para `piloti-selection.ts`;
    - setup principal permanece como orquestrador de binds/eventos.

Estado atual dos arquivos críticos:

- `src/components/rac-editor/RacEditor.tsx`: 443 linhas
- `src/components/rac-editor/Canvas.tsx`: 335 linhas
- `src/components/rac-editor/hooks/useCanvasFabricSetup.ts`: 313 linhas

Próximos recortes planejados:

1. reduzir `RacEditorModalEditors` e `RacEditorModals` consolidando payloads de props em contratos menores;
2. revisar `Canvas.tsx` para possível extração do bloco de resize/clamp de viewport em hook dedicado (redução
   adicional);
3. manter ciclo obrigatório por passo: `eslint` alvo + `tsc --strict` + `npm run test -- --run` + `npm run build` +
   `npm run test:e2e -- --workers=1`.

### Atualização 2026-02-22 (continuidade - passo 101)

- `Canvas.tsx`:
    - extração do lifecycle de container para `useCanvasContainerLifecycle` (resize + clamp de viewport);
    - manutenção do componente como composição de hooks e overlays.

Estado atual dos arquivos críticos:

- `src/components/rac-editor/RacEditor.tsx`: 443 linhas
- `src/components/rac-editor/Canvas.tsx`: 321 linhas
- `src/components/rac-editor/hooks/useCanvasFabricSetup.ts`: 313 linhas

Próximos recortes planejados:

1. reduzir `RacEditorModalEditors` e `RacEditorModals` consolidando payloads de props em contratos menores;
2. revisar `Canvas.tsx` para extração opcional do bloco de `useImperativeHandle` (helper de handle) para composição
   ainda mais fina;
3. manter ciclo obrigatório por passo: `eslint` alvo + `tsc --strict` + `npm run test -- --run` + `npm run build` +
   `npm run test:e2e -- --workers=1`.
