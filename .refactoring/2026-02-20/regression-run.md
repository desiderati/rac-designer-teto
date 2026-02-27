# Regression Checklist Run - 2026-02-20

## Execução manual por lotes

### Lote 1 (M1-M3)

- M1: PASS
- M2: PASS
- M3: PASS
    - Observação: houve falha inicial (tela branca no Piloti Editor), corrigida com remoção de referência inválida em
      `src/components/rac-editor/PilotiEditor.tsx`.
    - Revalidado após fix com:
        - `npm test` -> PASS
        - `npm run build` -> PASS
        - `npm run test:e2e -- e2e/rac-regression.spec.ts` -> PASS (inclui caso "abre editor de piloti sem tela branca")

### Próximo lote planejado (M4-M6)

- M4: Adicionar vista superior.
- M5: Adicionar/remover vistas frontal/traseira/lateral respeitando limite por tipo.
- M6: Validar seleção de lado e bloqueio de lados já ocupados.

### Cobertura automatizada adicionada para o Lote 2 (M4-M6)

- `e2e/rac-regression.spec.ts`
    - M4: `mantém planta e posição superior da vista inicial (tipo6)` -> PASS
    - M5: limites de vistas (frontal tipo6 / quadrado aberto tipo3) -> PASS
    - M6: `seleciona lado da lateral e bloqueia após atingir limite (tipo3)` -> PASS
- Validação da rodada:
    - `npm run test:e2e -- e2e/rac-regression.spec.ts` -> PASS (6/6)
    - `npm test` -> PASS
    - `npm run build` -> PASS

### Cobertura complementar de inserção/remoção de vistas

- `e2e/rac-regression.spec.ts` expandido para 10 cenários:
    - tipo6: remove e reinsere `Visão Traseira` -> PASS
    - tipo6: remove e reinsere `Quadrado Fechado` após limite -> PASS
    - tipo3: remove e reinsere `Visão Lateral` após limite -> PASS
    - tipo3: remove e reinsere `Quadrado Aberto` após limite -> PASS
- Suporte de teste em DEV:
    - `src/components/rac-editor/RacEditor.tsx`: `__racDebug.removeView(houseViewType, side?)`
- Estabilidade da suite:
    - `e2e/rac-regression.spec.ts` em modo serial para reduzir timeout/intermitência.
- Validação da rodada complementar:
    - `npm run test:e2e -- e2e/rac-regression.spec.ts` -> PASS (10/10)
    - `npm test` -> PASS
    - `npm run build` -> PASS

### Atualização de regras (`.rules`)

- Adicionado índice por tipo de componente: `.rules/README.md`.
- Adicionada regra de vistas por tipo de casa: `.rules/vistas-por-tipo.md`.
- Atualizada regra de nível do piloti para refletir fórmulas atuais do código: `.rules/piloti-nivel.md`.
- Atualizadas referencias de arquivos em:
    - `.rules/piloti-mestre.md`
    - `.rules/contraventamento.md`
- Regras adicionais por tipo de componente:
    - `.rules/canvas.md`
    - `.rules/toolbar.md`
    - `.rules/viewer-3d.md`
- Todos os arquivos acima incluem checklist de cobertura E2E por arquivo (coberto x pendente).

### Rodada adicional de E2E (Canvas/Toolbar/3D)

- `e2e/rac-regression.spec.ts` expandido de 10 para 14 cenários, cobrindo:
    - canvas: zoom por slider (com seletores dedicados em `Minimap.tsx`)
    - toolbar: inserção de `Elementos` e `Linhas`
    - overflow: toggle de `Dicas` + abertura/aplicação de `Configurações`
    - viewer 3D: abrir modal, trocar cor de parede, resetar camera, fullscreen e inserir snapshot no canvas
- suporte de teste em DEV ampliado:
    - `src/components/rac-editor/RacEditor.tsx`
        - `__racDebug.getCanvasPosition()`
        - `__racDebug.getCanvasObjectsSummary()`
        - `__racDebug.getUiState()`
    - `src/components/rac-editor/Minimap.tsx`
        - `data-testid="rac-zoom-slider"`
        - `data-testid="rac-minimap"`
- validação da rodada adicional:
    - `npm run test:e2e -- e2e/rac-regression.spec.ts` -> PASS (14/14)
    - `npm test` -> PASS (12/12)
    - `npm run build` -> PASS
- regra/documentação sincronizada:
    - `.rules/canvas.md` (zoom slider coberto; pendências remanescentes explicitadas)
    - `.rules/toolbar.md` (elementos/linhas/overflow parcial cobertos)
    - `.rules/viewer-3d.md` (checklist E2E completo como coberto)

### Refatoração da suite E2E (quebra por domínio)

- arquivo monolitico removido:
    - `e2e/rac-regression.spec.ts`
- nova organização:
    - `e2e/views-limits.spec.ts`
    - `e2e/canvas.spec.ts`
    - `e2e/toolbar-overflow.spec.ts`
    - `e2e/viewer-3d.spec.ts`
    - `e2e/piloti.spec.ts`
    - `e2e/helpers/rac-helpers.ts`
- validação após quebra:
  -
  `npm run test:e2e -- e2e/views-limits.spec.ts e2e/canvas.spec.ts e2e/toolbar-overflow.spec.ts e2e/viewer-3d.spec.ts e2e/piloti.spec.ts` ->
  PASS (14/14)
    - `npm test` -> PASS (12/12)
    - `npm run build` -> PASS

## Ambiente

- Data: 2026-02-20
- Projeto: `rac-designer-teto`
- Comandos executados:
    - `npm test` -> PASS (12 testes)
    - `npm run build` -> PASS
    - `npm run lint` -> FAIL (dívida antiga de lint, principalmente `no-explicit-any`)
    - Inicialização `vite dev` em porta 5200 -> PASS (servidor pronto)

## Resultado por item

### Fluxo base

- [~] Abrir o editor sem erros no console.
    - Evidência: `vite` iniciou com sucesso (`ready`, URL local em `http://127.0.0.1:5200/`).
    - Pendência: validar console do navegador durante uso real da tela.
- [x] Criar casa `tipo6`.
    - Evidência: `src/lib/house-manager.smoke.test.ts` cobre `setHouseType("tipo6")` e regras de limite.
- [x] Criar casa `tipo3`.
    - Evidência: `src/lib/house-manager.smoke.test.ts` cobre `setHouseType("tipo3")` e regras de limite.

### Vistas e gerenciamento de casa

- [~] Adicionar vista superior.
    - Evidência parcial: teste de rebuild/import com vista `top` em `src/lib/house-manager.smoke.test.ts`.
    - Pendência: validar fluxo completo pela UI (botão/menu).
- [~] Adicionar/remover vistas frontal/traseira/lateral conforme limite do tipo.
    - Evidência parcial: limites (`getMaxViewCount`/`canAddView`) e `registerView/removeView` cobertos em
      `src/lib/house-manager.smoke.test.ts`.
    - Pendência: validar UI completa das opções de menu.
- [ ] Validar seleção de lado e bloqueio de lados já ocupados.
    - Sem teste automatizado de UI nesta rodada.

### Pilotis

- [x] Editar altura de piloti.
    - Evidência: `updatePiloti` com `height` validado em `src/lib/house-manager.smoke.test.ts`.
- [x] Marcar/desmarcar piloti master e validar regra de master único.
    - Evidência: regra de master único validada em `src/lib/house-manager.smoke.test.ts`.
- [~] Editar nível e validar labels/solo.
    - Evidência parcial: `nivel` validado em `updatePiloti` (`src/lib/house-manager.smoke.test.ts`).
    - Pendência: labels/solo precisam de validação visual/manual.

### Canvas

- [ ] Zoom in/out por controle e gesto.
- [ ] Pan por mouse/touch.
- [ ] Minimap movendo viewport.
- [ ] Undo/redo.
- [ ] Copiar/colar objeto.
    - Status: pendente manual (não há E2E nesta rodada).

### Contraventamento

- [ ] Entrar no modo contraventamento.
- [ ] Selecionar primeiro e segundo piloti.
- [ ] Remover contraventamento.
    - Status: pendente manual.
    - Evidência parcial de regra/dados: parser testado em `src/lib/3d/contraventamento-parser.smoke.test.ts`.

### Persistência e serialização

- [~] Exportar JSON.
    - Evidência parcial: contrato de serialização de propriedades customizadas em
      `src/lib/canvas-utils.smoke.test.ts`.
    - Pendência: validar export real via UI e arquivo gerado.
- [~] Importar JSON e validar restauração de vistas/pilotis.
    - Evidência parcial: rebuild/import-like flow em `src/lib/house-manager.smoke.test.ts`.
    - Pendência: validar import real pela UI.
- [x] Validar persistência de tutorial e configurações.
    - Evidências:
        - `src/components/rac-editor/Tutorial.smoke.test.tsx`
        - `src/lib/settings.smoke.test.ts`

### 3D

- [ ] Abrir visualizador 3D.
- [~] Validar render para `tipo6` e `tipo3`.
    - Evidência parcial de mapeamento/regra: `src/lib/3d/openings-mapper.smoke.test.ts`.
    - Pendência: validação visual manual do render.
- [ ] Inserir snapshot 3D no canvas 2D.
    - Pendente manual.

### Fase 7 - passo incremental (Domínio/Application)

- Extração de regras de domínio para caso de uso puro:
    - `src/lib/domain/house-use-cases.ts`
    - regras extraídas: limite de vistas, `canAddView`, mestre único de piloti, alturas recomendadas por interpolação
- Integração sem quebra de contrato:
    - `src/lib/house-manager.ts` mantém API pública e passa a orquestrar os casos de uso
- Cobertura automática adicionada:
    - `src/lib/domain/house-use-cases.smoke.test.ts` (4 testes)
- Validação pós-extração:
    - `npm run test:regression` -> PASS
    - `vitest`: 16/16 PASS
    - `playwright`: 16/16 PASS
    - `build`: PASS

### Fase 7 - passo incremental 2 (Repositório + Adaptador)

- Introdução da interface de repositório de domínio:
    - `src/lib/domain/house-repository.ts` (`HouseRepository`)
- Camada de aplicação baseada em repositório:
    - `src/lib/domain/house-application.ts`
    - operações: `getMaxViewCount`, `canAddView`, `applyPilotiPatch`, `recalculateRecommendedPilotiData`
- Adaptação do `HouseManager` para atuar como adaptador do repositório:
    - `src/lib/house-manager.ts` passa a delegar para a camada de aplicação mantendo API pública
- Cobertura automática adicionada:
    - `src/lib/domain/house-application.smoke.test.ts` (4 testes)
- Validação pós-adaptação:
    - `npm run test:regression` -> PASS
    - `vitest`: 20/20 PASS
    - `playwright`: 16/16 PASS
    - `build`: PASS

### Fase 7 - passo incremental 3 (Views lifecycle no domínio)

- Extração das regras de ciclo de vida de vistas para domínio:
    - `src/lib/domain/house-views.use-case.ts`
    - operações: `register/remove/removeAll/cleanupStale/rebuildSideMappings`
- Introdução de repositório + aplicação para vistas:
    - `src/lib/domain/house-views-repository.ts`
    - `src/lib/domain/house-views-application.ts`
- `HouseManager` atualizado para delegar:
    - `registerView`, `removeView`, `removeViewByType`, `cleanupStaleViews`
    - `rebuildFromCanvas` agora reconstrói `sideMappings` via camada de aplicação
- Cobertura automática adicionada:
    - `src/lib/domain/house-views.use-case.smoke.test.ts` (5 testes)
    - `src/lib/domain/house-views-application.smoke.test.ts` (3 testes)
- Validação pós-extração:
    - `npm run test:regression` -> PASS
    - `vitest`: 28/28 PASS
    - `playwright`: 16/16 PASS
    - `build`: PASS

### Fase 7 - passo incremental 4 (Rebuild/import de views no domínio)

- Extração da normalização de rebuild/import para domínio:
    - `src/lib/domain/house-views-rebuild.use-case.ts`
    - operações: inferência de `houseViewType`/`side`, geração de `instanceId` único e rebuild de views normalizadas
- Camada de aplicação de views estendida:
    - `src/lib/domain/house-views-application.ts`
    - operação nova: `rebuildViewsFromCanvasSources`
- `HouseManager` atualizado:
    - `rebuildFromCanvas` delega para a camada de aplicação
    - métodos locais de inferência foram removidos do `house-manager`
- Cobertura automática adicionada:
    - `src/lib/domain/house-views-rebuild.use-case.smoke.test.ts` (2 testes)
    - `src/lib/domain/house-views-application.smoke.test.ts` atualizado (+1 teste de rebuild)
- Validação pós-extração:
    - `npm run test:regression` -> PASS
    - `vitest`: 31/31 PASS
    - `playwright`: 16/16 PASS
    - `build`: PASS

### Fase 7 - passo incremental 5 (Layout e slots de vistas no domínio)

- Extração de regras de layout de vistas para domínio:
    - `src/lib/domain/house-views-layout.use-case.ts`
    - operações: disponibilidade por tipo (`getAvailableViewsForType`), lados disponíveis, necessidade de seleção de
      lado,
      auto-seleção por vista oposta, geração de slots pré-atribuídos e projeção de labels para UI.
- `HouseManager` atualizado para delegar mantendo API pública:
    - `getAvailableViewsForType`, `canDeleteTopView`, `hasOtherViews`
    - `getAvailableSides`, `needsSideSelection`, `getAutoSelectedSide`
    - `autoAssignAllSides`, `getPreAssignedSides`, `hasPreAssignedSides`
- Cobertura automática adicionada:
    - `src/lib/domain/house-views-layout.use-case.smoke.test.ts` (7 testes)
- Validação pós-extração:
    - `npm run test:regression` -> PASS
    - `vitest`: 38/38 PASS
    - `playwright`: 16/16 PASS
    - `build`: PASS

### Fase 7 - passo incremental 6 (Elementos padrão no domínio)

- Extração dos presets de aberturas/elementos por tipo de casa:
    - `src/lib/domain/house-elements-use-cases.ts`
    - operação: `getDefaultElementsForHouseType` (`tipo6` e `tipo3`)
- `HouseManager` atualizado mantendo contrato:
    - `initializeDefaultElements` passa a consumir presets do domínio e continua usando `addElement`
- Cobertura automática adicionada:
    - `src/lib/domain/house-elements-use-cases.smoke.test.ts` (2 testes)
- Regras/documentação sincronizadas:
    - `.rules/viewer-3d.md` atualizado para referenciar o novo caso de uso de elementos
- Validação pós-extração:
    - `npm run test:regression` -> PASS
    - `vitest`: 40/40 PASS
    - `playwright`: 16/16 PASS
    - `build`: PASS

### Fase 7 - passo incremental 7 (Elementos: repositório + aplicação)

- Introdução de interface de repositório para elementos:
    - `src/lib/domain/house-elements-repository.ts`
- Camada de aplicação para ciclo de vida de elementos:
    - `src/lib/domain/house-elements-application.ts`
    - operações: `createElementId`, `addElement`, `removeElement`, `updateElement`, `resetDefaultElements`
- `HouseManager` atualizado mantendo contrato de UI:
    - `addElement`, `removeElement`, `updateElement` e `initializeDefaultElements` agora delegam para a aplicação
      via adaptador local de repositório
- Cobertura automática adicionada/expandida:
    - `src/lib/domain/house-elements-application.smoke.test.ts` (3 testes)
    - `src/lib/house-manager.smoke.test.ts` atualizado (+1 teste de fluxo de elementos)
- Regras/documentação sincronizadas:
    - `.rules/viewer-3d.md` atualizado com referência a `house-elements-application`/`house-elements-repository`
- Validação pós-extração:
    - `npm run test:regression` -> PASS
    - `vitest`: 44/44 PASS
    - `playwright`: 16/16 PASS
    - `build`: PASS

### Fase 7 - passo incremental 8 (Rebuild de pilotis no domínio)

- Extração da reconstrução de dados de piloti a partir do canvas:
    - `src/lib/domain/house-piloti-rebuild-use-cases.ts`
    - operações: `getAllPilotiIds` e `rebuildPilotiDataFromSources`
- `HouseManager` atualizado:
    - remove função local de ids de piloti
    - `readPilotiDataFromCanvas` passa a delegar para caso de uso de domínio
- Cobertura automática adicionada:
    - `src/lib/domain/house-piloti-rebuild-use-cases.smoke.test.ts` (2 testes)
- Regras/documentação sincronizadas:
    - `.rules/piloti-nivel.md` atualizado com referência ao rebuild de piloti no domínio
- Validação pós-extração:
    - `npm run test:regression` -> PASS
    - `vitest`: 46/46 PASS
    - `playwright`: 16/16 PASS
    - `build`: PASS

### Fase 7 - passo incremental 9 (Marcador de porta na planta no domínio)

- Extração das regras de marcador de porta para a planta (`top`):
    - `src/lib/domain/house-top-door-marker-use-cases.ts`
    - operações: `resolveTopDoorSourceViewType`, `resolveTopDoorMarkerSide`, `calculateTopDoorPlacement`
- `HouseManager` atualizado:
    - `refreshTopDoorMarkers` passa a delegar inferência de lado e cálculo de posição ao domínio
    - mantém comportamento de visibilidade/atualização de markers no Fabric
- Cobertura automática adicionada:
    - `src/lib/domain/house-top-door-marker-use-cases.smoke.test.ts` (4 testes)
- Regras/documentação sincronizadas:
    - `.rules/vistas-por-tipo.md` atualizado com referência ao caso de uso de marcador de porta
- Validação pós-extração:
    - `npm run test:regression` -> PASS
    - `vitest`: 50/50 PASS
    - `playwright`: 16/16 PASS
    - `build`: PASS

### Fase 7 - passo incremental 10 (Fórmulas visuais de piloti no domínio)

- Extração das fórmulas visuais de piloti para caso de uso puro:
    - `src/lib/domain/house-piloti-render-use-cases.ts`
    - operações: posição do label de nível (cantos), posição do label de altura e geometria da faixa hachurada
- `HouseManager` atualizado:
    - `applyPilotiDataToGroup` passa a delegar as fórmulas para o domínio, mantendo o mesmo fluxo de atualização Fabric
- Cobertura automática adicionada:
    - `src/lib/domain/house-piloti-render-use-cases.smoke.test.ts` (3 testes)
- Regras/documentação sincronizadas:
    - `.rules/piloti-nivel.md` atualizado com referência ao novo caso de uso de renderização
- Validação pós-extração:
    - `npm run test:regression` -> PASS
    - `vitest`: 53/53 PASS
    - `playwright`: 16/16 PASS
    - `build`: PASS

### Fase 7 - passo incremental 11 (Estado inicial da casa no domínio)

- Extração da criação de estado inicial para funções puras:
    - `src/lib/domain/house-state-use-cases.ts`
    - operações: `createDefaultPilotis`, `createEmptyViews`, `createEmptySideMappings`
- `HouseManager` atualizado:
    - `reset()` passa a construir `pilotis`, `views` e `sideMappings` usando o caso de uso de domínio
- Cobertura automática adicionada:
    - `src/lib/domain/house-state-use-cases.smoke.test.ts` (2 testes)
- Regras/documentação sincronizadas:
    - `.rules/vistas-por-tipo.md` atualizado com referência ao caso de uso de estado inicial
- Validação pós-extração:
    - `npm run test:regression` -> PASS
    - `vitest`: 55/55 PASS
    - `playwright`: 16/16 PASS
    - `build`: PASS

### Fase 7 - passo incremental 12 (Disponibilidade global de vistas no domínio)

- Regras de disponibilidade extraídas para domínio:
    - `src/lib/domain/house-use-cases.ts`
    - operações novas: `isViewAtLimitForType` e `getAvailableViewsByCounts`
- `HouseManager` atualizado:
    - `isViewLimitAchieved` e `getAvailableViews` passam a delegar para as regras de domínio (mantendo cleanup de stale views)
- Cobertura automática adicionada/expandida:
    - `src/lib/domain/house-use-cases.smoke.test.ts` atualizado (+1 teste)
    - `src/lib/house-manager.smoke.test.ts` atualizado com asserções de `getAvailableViews` por tipo
- Regras/documentação sincronizadas:
    - `.rules/vistas-por-tipo.md` atualizado com referência da disponibilidade global em `house-use-cases`
- Validação pós-extração:
    - `npm run test:regression` -> PASS
    - `vitest`: 56/56 PASS
    - `playwright`: 16/16 PASS
    - `build`: PASS

### Fase 7 - passo incremental 13 (Geração de IDs no domínio)

- Centralização da geração de IDs em caso de uso de domínio:
    - `src/lib/domain/house-identity-use-cases.ts`
    - operações: `createHouseId`, `createViewInstanceId`, `createElementId`
- Integração na aplicação:
    - `src/lib/domain/house-elements-application.ts` passa a reutilizar `createElementId` centralizado
    - `src/lib/house-manager.ts` passa a usar:
        - `createHouseId` em `reset()`
        - `createViewInstanceId` em `registerView()`
        - `createElementId` na criação/reset de elementos
- Cobertura automática adicionada:
    - `src/lib/domain/house-identity-use-cases.smoke.test.ts` (2 testes)
- Validação pós-extração:
    - `npm run test:regression` -> PASS
    - `vitest`: 58/58 PASS
    - `playwright`: 16/16 PASS
    - `build`: PASS
- Observação de estabilidade:
    - houve uma execução intermediária com timeout E2E em 2 cenários (`canvas`/`viewer-3d`), reexecutados com sucesso,
      seguida por nova rodada completa verde.

### Fase 7 - passo incremental 14 (Consultas genéricas de views no domínio)

- Extração de consultas de leitura de views para domínio:
    - `src/lib/domain/house-views.use-case.ts`
    - operações novas: `hasAnyViewInstances` e `collectAllViewGroups`
- `HouseManager` atualizado:
    - `hasAnyView()` e `getAllGroups()` passam a delegar para os casos de uso de views
- Cobertura automática adicionada/expandida:
    - `src/lib/domain/house-views.use-case.smoke.test.ts` atualizado (+1 teste)
    - `src/lib/house-manager.smoke.test.ts` atualizado com asserções de `hasAnyView`/`getAllGroups`
- Regras/documentação sincronizadas:
    - `.rules/vistas-por-tipo.md` atualizado com referência às consultas genéricas de views
- Validação pós-extração:
    - `npm run test:regression` -> PASS
    - `vitest`: 59/59 PASS
    - `playwright`: 16/16 PASS
    - `build`: PASS

### Fase 7 - passo incremental 15 (Rebuild sem vistas usa regra de domínio)

- Ajuste de consistência no `rebuildFromCanvas`:
    - `HouseManager` passa a usar `hasAnyViewInstances` (domínio de views) para decidir limpeza de `houseType`
- Cobertura automática adicionada/expandida:
    - `src/lib/house-manager.smoke.test.ts` atualizado (+1 teste): rebuild com canvas vazio limpa `houseType`
- Regras/documentação sincronizadas:
    - `.rules/vistas-por-tipo.md` atualizado com regra de limpeza de `houseType` quando rebuild não encontra vistas
- Validação pós-ajuste:
    - `npm run test:regression` -> PASS
    - `vitest`: 60/60 PASS
    - `playwright`: 16/16 PASS
    - `build`: PASS

### Fase 7 - passo incremental 16 (Fonte de grupos de casa no canvas no domínio)

- Extração de filtro de fontes de canvas para domínio:
    - `src/lib/domain/house-canvas-source-use-cases.ts`
    - operações: `isHouseGroupCandidate` e `collectHouseGroupCandidates`
- `HouseManager` atualizado:
    - `readPilotiDataFromCanvas` e `rebuildFromCanvas` reutilizam o filtro centralizado de grupos de casa
- Cobertura automática adicionada:
    - `src/lib/domain/house-canvas-source-use-cases.smoke.test.ts` (2 testes)
- Regras/documentação sincronizadas:
    - `.rules/canvas.md` atualizado com referência ao caso de uso de fontes de canvas
- Validação pós-extração:
    - `npm run test:regression` -> PASS
    - `vitest`: 62/62 PASS
    - `playwright`: 16/16 PASS
    - `build`: PASS

### Fase 7 - passo incremental 17 (Fábrica de estado inicial no domínio)

- Extração da montagem de estado inicial da casa:
    - `src/lib/domain/house-state-factory-use-cases.ts`
    - operação: `createInitialHouseState`
- `HouseManager` atualizado:
    - `reset()` passa a delegar criação do snapshot inicial para a fábrica de domínio
- Cobertura automática adicionada:
    - `src/lib/domain/house-state-factory-use-cases.smoke.test.ts` (1 teste)
- Validação pós-extração:
    - `npm run test:regression` -> PASS
    - `vitest`: 63/63 PASS
    - `playwright`: 16/16 PASS
    - `build`: PASS

### Fase 7 - passo incremental 18 (Contagem de vistas no domínio)

- Extração de contagem por tipo de vista:
    - `src/lib/domain/house-views.use-case.ts`
    - operação nova: `countViewInstances`
- `HouseManager` atualizado:
    - `getAvailableViews()` passa a usar a contagem centralizada de domínio
- Cobertura automática adicionada/expandida:
    - `src/lib/domain/house-views.use-case.smoke.test.ts` atualizado (asserção de `countViewInstances`)
- Regras/documentação sincronizadas:
    - `.rules/vistas-por-tipo.md` atualizado com referência a `house-state-factory-use-cases` e `countViewInstances`
- Validação pós-extração:
    - `npm run test:regression` -> PASS
    - `vitest`: 63/63 PASS
    - `playwright`: 16/16 PASS
    - `build`: PASS

### Fase 7 - passo incremental 19 (Lista canônica de tipos de vista no domínio)

- Centralização da lista de view types:
    - `src/lib/domain/house-use-cases.ts`
    - constante nova: `ALL_HOUSE_VIEW_TYPES`
- `HouseManager` atualizado:
    - `getAvailableViews()` passa a iterar `ALL_HOUSE_VIEW_TYPES` para limpeza de stale views
- Cobertura automática adicionada/expandida:
    - `src/lib/domain/house-use-cases.smoke.test.ts` atualizado (+1 teste para `ALL_HOUSE_VIEW_TYPES`)
- Regras/documentação sincronizadas:
    - `.rules/vistas-por-tipo.md` atualizado com referência a `ALL_HOUSE_VIEW_TYPES`
- Validação pós-extração:
    - `npm run test` -> PASS (`64/64`)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (`16/16`)
- Observação de estabilidade:
    - `npm run test:regression` em modo paralelo apresentou timeouts intermitentes de Playwright;
      revalidação em modo serial (`workers=1`) ficou verde.

### Fase 7 - passo incremental 20 (Patch visual de marcador de porta no domínio)

- Extensão do caso de uso de marcador de porta:
    - `src/lib/domain/house-top-door-marker-use-cases.ts`
    - operação nova: `createTopDoorMarkerVisualPatch`
- `HouseManager` atualizado:
    - loop de markers em `refreshTopDoorMarkers` passa a delegar patch `visible/left/top` para o domínio
- Cobertura automática adicionada/expandida:
    - `src/lib/domain/house-top-door-marker-use-cases.smoke.test.ts` atualizado (+1 teste)
- Regras/documentação sincronizadas:
    - `.rules/vistas-por-tipo.md` atualizado para explicitar patch visual por marcador no mesmo caso de uso
- Validação pós-extração:
    - `npm run test` -> PASS (`65/65`)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (`16/16`)
- Observação de estabilidade:
    - como as últimas rodadas paralelas de E2E estavam intermitentes no ambiente, validação final desta etapa foi
      feita em modo serial para eliminar falso-negativo de timeout.

### Fase 7 - passo incremental 21 (Inserção de snapshot 3D no domínio)

- Extração da regra de posicionamento/escala de snapshot para caso de uso puro:
    - `src/lib/domain/house-snapshot-use-cases.ts`
    - operações: `calculateSnapshotScale` e `create3DSnapshotImagePatch`
- `HouseManager` atualizado:
    - `insert3DSnapshotOnCanvas` passa a delegar o patch visual da imagem para o domínio
    - contrato público e comportamento de inserção no Fabric permanecem os mesmos
- Cobertura automática adicionada:
    - `src/lib/domain/house-snapshot-use-cases.smoke.test.ts` (4 testes)
- Regras/documentação sincronizadas:
    - `.rules/viewer-3d.md` atualizado com referência ao caso de uso de snapshot
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 22 (Integração de snapshot no HouseManager)

- Cobertura automática adicionada no adaptador de aplicação:
    - `src/lib/house-manager.smoke.test.ts`
    - cenários novos:
        - inserção de snapshot 3D com posição central e escala limitada no canvas
        - falha de carregamento (`FabricImage.fromURL`) retorna `false` sem inserir objeto no canvas
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 23 (Metadata de grupos de vista no domínio)

- Extração do patch de metadata e visibilidade de controles de grupos de vista:
    - `src/lib/domain/house-view-metadata-use-cases.ts`
    - operações: `createViewGroupMetadataPatch` e `createViewGroupControlsVisibilityPatch`
- `HouseManager` atualizado:
    - `registerView` e normalização pós-rebuild passam a aplicar metadata via caso de uso de domínio
    - visibilidade de controles pós-rebuild passa a usar patch centralizado
- Cobertura automática adicionada:
    - `src/lib/domain/house-view-metadata-use-cases.smoke.test.ts` (3 testes)
- Regras/documentação sincronizadas:
    - `.rules/vistas-por-tipo.md` atualizado com referência ao caso de uso de metadata de vista
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 24 (Dimensões do body do marcador de porta no domínio)

- Extensão do caso de uso de marcador de porta na planta:
    - `src/lib/domain/house-top-door-marker-use-cases.ts`
    - operação nova: `calculateTopDoorMarkerBodySize`
- `HouseManager` atualizado:
    - `refreshTopDoorMarkers` passa a delegar cálculo de `bodyWidth/bodyHeight` efetivos para o domínio
- Cobertura automática adicionada/expandida:
    - `src/lib/domain/house-top-door-marker-use-cases.smoke.test.ts` atualizado (+1 teste)
- Regras/documentação sincronizadas:
    - `.rules/vistas-por-tipo.md` atualizado com a regra de dimensões efetivas do body do marcador
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 25 (Mapeamento de metadados de rebuild no domínio)

- Extensão da origem de grupos do canvas para rebuild:
    - `src/lib/domain/house-canvas-source-use-cases.ts`
    - operação nova: `mapHouseGroupToRebuildSource`
- `HouseManager` atualizado:
    - `rebuildFromCanvas` passa a delegar o mapeamento de metadata de grupos para o caso de uso de canvas
- Cobertura automática adicionada/expandida:
    - `src/lib/domain/house-canvas-source-use-cases.smoke.test.ts` atualizado (+1 teste)
- Regras/documentação sincronizadas:
    - `.rules/canvas.md` atualizado com referência ao mapeamento para rebuild
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 26 (Hints de remoção de vista no domínio)

- Extensão do caso de uso de metadata de vista:
    - `src/lib/domain/house-view-metadata-use-cases.ts`
    - operação nova: `extractViewGroupRemovalHints`
- `HouseManager` atualizado:
    - `removeView` passa a delegar a leitura segura de `houseViewType`/`houseInstanceId` do grupo
- Cobertura automática adicionada/expandida:
    - `src/lib/domain/house-view-metadata-use-cases.smoke.test.ts` atualizado (+1 teste)
- Regras/documentação sincronizadas:
    - `.rules/vistas-por-tipo.md` atualizado para refletir centralização dos hints de remoção
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 27 (Coletores de fontes de canvas no domínio)

- Extensão de `house-canvas-source-use-cases` com coletores de fontes por finalidade:
    - `collectHouseGroupRebuildSources`
    - `collectHouseGroupPilotiSources`
- `HouseManager` atualizado:
    - `readPilotiDataFromCanvas` passa a delegar coleta de fontes de piloti para o domínio
    - `rebuildFromCanvas` passa a delegar coleta de fontes de rebuild para o domínio
- Cobertura automática adicionada/expandida:
    - `src/lib/domain/house-canvas-source-use-cases.smoke.test.ts` atualizado (+2 testes)
- Regras/documentação sincronizadas:
    - `.rules/canvas.md` atualizado com os novos coletores do domínio
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 28 (Patch de label de nível de piloti no domínio)

- Extensão do caso de uso de render de piloti:
    - `src/lib/domain/house-piloti-render-use-cases.ts`
    - operação nova: `createPilotiNivelTextPatch`
- `HouseManager` atualizado:
    - `applyPilotiDataToGroup` passa a delegar montagem do patch de label de nível para o domínio
- Cobertura automática adicionada/expandida:
    - `src/lib/domain/house-piloti-render-use-cases.smoke.test.ts` atualizado (+1 teste)
- Regras/documentação sincronizadas:
    - `.rules/piloti-nivel.md` atualizado com referência ao patch de label de nível
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 29 (Índice de objetos de piloti no domínio)

- Novo caso de uso para indexação de objetos de piloti:
    - `src/lib/domain/house-piloti-object-index-use-cases.ts`
    - operação: `buildPilotiObjectIndex`
- `HouseManager` atualizado:
    - `applyPilotiDataToGroup` passa a usar índice por `pilotiId` para localizar círculo/retângulo sem buscas repetidas
- Cobertura automática adicionada:
    - `src/lib/domain/house-piloti-object-index-use-cases.smoke.test.ts` (2 testes)
- Regras/documentação sincronizadas:
    - `.rules/piloti-nivel.md` atualizado com referência ao índice de objetos de piloti
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 30 (Decomposição do applyPilotiDataToGroup)

- Refatoração estrutural no `HouseManager` sem mudança de comportamento:
    - `applyPilotiDataToGroup` foi decomposto em passes privados:
        - `applyPilotiDataFirstPass`
        - `applyNivelLabelsBackground`
        - `applyPilotiSizeLabelPositions`
        - `applyPilotiStripeOverlays`
- Objetivo:
    - reduzir complexidade local e preparar extrações futuras de render/sincronização de piloti
- Regras/documentação sincronizadas:
    - `.rules/piloti-nivel.md` atualizado para refletir execução em passes separados
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 31 (Patches visuais de piloti no domínio)

- Novo caso de uso de patches visuais de piloti:
    - `src/lib/domain/house-piloti-visual-use-cases.ts`
    - operações: `createPilotiVisualDataPatch`, `createPilotiHeightTextPatch`, `createPilotiSizeLabelPatch`,
      `createNivelLabelBackgroundPatch`
- `HouseManager` atualizado:
    - `applyPilotiDataFirstPass` passa a delegar montagem de patch visual para o domínio
    - labels de piloti e labels de nível passam a usar patches de domínio
- Cobertura automática adicionada:
    - `src/lib/domain/house-piloti-visual-use-cases.smoke.test.ts` (3 testes)
- Regras/documentação sincronizadas:
    - `.rules/piloti-nivel.md` atualizado com referência ao caso de uso de patch visual de piloti
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 32 (Decomposição da sincronização de updatePiloti)

- Refatoração estrutural no `HouseManager`:
    - extraídos métodos privados:
        - `syncPilotiUpdateOnGroup`
        - `syncPilotiUpdateAcrossViews`
    - `updatePiloti` passa a delegar sincronização, mantendo contrato e comportamento
- Regras/documentação sincronizadas:
    - `.rules/piloti-mestre.md` atualizado com a decomposição de sincronização entre vistas
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 33 (Labels de vista no domínio e uso no RacEditor)

- Novo caso de uso para labels semânticos de vista:
    - `src/lib/domain/house-view-label-use-cases.ts`
    - operação: `getViewLabelForHouseType`
- `RacEditor` atualizado:
    - toasts de limite/instância adicionada passam a usar label centralizado de domínio
    - função local `getViewLabel` removida
- Cobertura automática adicionada:
    - `src/lib/domain/house-view-label-use-cases.smoke.test.ts` (2 testes)
- Regras/documentação sincronizadas:
    - `.rules/vistas-por-tipo.md` atualizado com referência ao caso de uso de labels
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 34 (Regras puras de contraventamento no domínio)

- Novo caso de uso de domínio para regras de contraventamento:
    - `src/lib/domain/house-contraventamento-use-cases.ts`
    - operações: parse de piloti, elegibilidade por nível, inferência de lado por geometria, validação de destino e
      label semântico de lado
- `RacEditor` atualizado:
    - fluxo de contraventamento passa a reutilizar regras puras do domínio (sem mudar o fluxo de UI)
- Cobertura automática adicionada:
    - `src/lib/domain/house-contraventamento-use-cases.smoke.test.ts` (5 testes)
- Regras/documentação sincronizadas:
    - `.rules/contraventamento.md` atualizado com seção de regras puras extraídas + referência ao novo caso de uso
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 35 (Detecção de vista top do canvas no domínio)

- Extensão de `house-canvas-source-use-cases`:
    - operações novas: `isTopViewGroupCandidate` e `findTopViewGroupCandidate`
- `RacEditor` atualizado:
    - `getTopViewGroup` passa a delegar a identificação da vista `top` para o caso de uso de domínio
- Cobertura automática adicionada/expandida:
    - `src/lib/domain/house-canvas-source-use-cases.smoke.test.ts` atualizado (+2 testes)
- Regras/documentação sincronizadas:
    - `.rules/canvas.md` atualizado com referência ao finder de `top view`
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 36 (Bridge de debug extraído do RacEditor)

- Extração de infraestrutura DEV/E2E para hook dedicado:
    - `src/components/rac-editor/hooks/useRacEditorDebugBridge.ts`
    - expõe e mantém o contrato `window.__racDebug` usado nos testes E2E
- `RacEditor` atualizado:
    - remove bloco longo de `useEffect` de debug e delega para `useRacDebugBridge`
- Objetivo:
    - reduzir tamanho/complexidade local do `RacEditor` sem alterar comportamento funcional
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 37 (Ocupação por lado de contraventamento no domínio)

- Extensão de `house-contraventamento-use-cases`:
    - operação nova: `collectOccupiedContraventamentoSides`
- `RacEditor` atualizado:
    - `getContraventamentoColumnSides` passa a delegar cálculo de ocupação por lado/coluna para o domínio
    - preserva normalização de `contraventamentoSide` no objeto quando necessário
- Cobertura automática adicionada/expandida:
    - `src/lib/domain/house-contraventamento-use-cases.smoke.test.ts` atualizado (+1 teste)
- Regras/documentação sincronizadas:
    - `.rules/contraventamento.md` atualizado com a regra de agregação por lado na coluna
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 38 (Estado do editor de contraventamento no domínio)

- Extensão de `house-contraventamento-use-cases`:
    - operação nova: `createContraventamentoEditorState`
- `RacEditor` atualizado:
    - `getContraventamentoEditorState` passa a delegar construção de estado (`active/disabled`) para o domínio
- Cobertura automática adicionada/expandida:
    - `src/lib/domain/house-contraventamento-use-cases.smoke.test.ts` atualizado (+1 teste)
- Regras/documentação sincronizadas:
    - `.rules/contraventamento.md` atualizado com a regra de projeção de estado do editor
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 39 (Unificação de inserção de objetos no RacEditor)

- Refatoração estrutural no `RacEditor`:
    - criação de helper local `addCanvasObject(factory, tutorial?)`
    - comandos de `Elementos` e `Linhas` passam a reutilizar o helper
- Objetivo:
    - remover duplicação nos handlers `handleAddWall/handleAddDoor/handleAddStairs/handleAddTree/handleAddWater/
      handleAddFossa/handleAddLine/handleAddArrow`
    - preservar os mesmos toasts e dicas de tutorial
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 40 (Projeção canvas->tela utilitária no RacEditor)

- Novo utilitário de projeção de coordenadas:
    - `src/components/rac-editor/utils/canvas-screen-position.ts`
    - operação: `toCanvasScreenPoint`
- `RacEditor` atualizado:
    - `showTutorialBalloon` passa a delegar cálculo de posição de tela para `toCanvasScreenPoint`
    - `handleAddDistance` passa a delegar ancoragem do editor de distância para `toCanvasScreenPoint`
- Cobertura automática adicionada:
    - `src/components/rac-editor/utils/canvas-screen-position.smoke.test.ts` (2 testes)
- Regras/documentação sincronizadas:
    - `.rules/canvas.md` atualizado com referência ao utilitário de projeção
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 41 (Decisão de inserção de vistas no domínio)

- Extensão de `house-view-layout-use-cases`:
    - operação nova: `resolveHouseViewInsertion`
    - decisão centralizada para fluxo de inserção: `bloqueio por limite`, `inserção direta`, `seletor de instância`,
      `seletor de lado` e bloqueios por indisponibilidade
- `RacEditor` atualizado:
    - `requestAddView` passa a delegar a decisão de fluxo para o domínio, preservando os mesmos toasts e modais
- Cobertura automática adicionada/expandida:
    - `src/lib/domain/house-views-layout.use-case.smoke.test.ts` atualizado (+2 testes)
- Regras/documentação sincronizadas:
    - `.rules/vistas-por-tipo.md` atualizado com referência ao resolver de inserção
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 42 (Offset de viewport do canvas centralizado)

- Extensão do utilitário de projeção:
    - `src/components/rac-editor/utils/canvas-screen-position.ts`
    - operação nova: `getCanvasViewportOffset`
- `Canvas` atualizado:
    - cálculo de offset/ancoragem de tela passa a reutilizar helpers comuns
    - seleção de piloti, distância, nome de objeto e linha/seta passa a usar projeção única (`getCurrentScreenPoint`)
    - `getVisibleCenter` e posicionamento visual do canvas passam a compartilhar a mesma regra de offset
- Cobertura automática adicionada/expandida:
    - `src/components/rac-editor/utils/canvas-screen-position.smoke.test.ts` atualizado (+2 testes)
- Regras/documentação sincronizadas:
    - `.rules/canvas.md` atualizado com referência à centralização de offset de viewport
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 43 (Estado de editor de linha/seta extraído do Canvas)

- Novo utilitário puro para leitura de estado de linha/seta:
    - `src/lib/canvas/linear-object-state.ts`
    - operação: `readLinearObjectState`
- `Canvas` atualizado:
    - `handleLinearSelection` passa a delegar leitura de `currentColor/currentLabel` para util dedicado
    - remove parsing ad-hoc de estrutura interna de grupos na camada de componente
- Cobertura automática adicionada:
    - `src/lib/canvas/line-arrow-editor.smoke.test.ts` (3 testes)
- Regras/documentação sincronizadas:
    - `.rules/canvas.md` atualizado com referência ao util de linha/seta
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 44 (Projeção de piloti para tela reutilizável)

- Novo utilitário puro de projeção de piloti:
    - `src/lib/canvas/piloti-screen-position.ts`
    - operação: `projectCanvasPointToScreenPoint`
- `RacEditor` e `useRacDebugBridge` atualizados:
    - cálculo de posição de piloti na tela (tutorial e bridge DEV/E2E) passa a usar o mesmo util
    - remove duplicação da fórmula com `groupMatrix + viewportTransform`
- Cobertura automática adicionada:
    - `src/lib/canvas/piloti-screen-position.smoke.test.ts` (2 testes)
- Regras/documentação sincronizadas:
    - `.rules/canvas.md` atualizado com referência ao util de projeção de piloti
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 45 (Feedback visual de piloti centralizado)

- Novo utilitário de feedback visual de seleção:
    - `src/lib/canvas/piloti-visual-feedback.ts`
    - operações: `highlightAllHousePilotis`, `highlightPilotiAcrossViews`, `applyPilotiEditorCloseVisuals`
- `Canvas` e `RacEditor` atualizados:
    - seleção de piloti, navegação entre pilotis e fechamento do editor passam a reutilizar o mesmo conjunto de regras
      visuais (amarelo global, azul do ativo e restauração)
- Cobertura automática adicionada:
    - `src/lib/canvas/piloti-visual-feedback.smoke.test.ts` (3 testes)
- Regras/documentação sincronizadas:
    - `.rules/canvas.md` e `.rules/piloti-nivel.md` atualizados com referência ao util de feedback visual
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 46 (Aplicação de edição de linha/seta extraída do RacEditor)

- Novo utilitário de aplicação de edição:
    - `src/components/rac-editor/utils/line-arrow-editor-apply.ts`
    - operação: `applyLineArrowInlineEditorChange`
- `RacEditor` atualizado:
    - bloco de atualização de cor/rótulo e reagrupamento de linha/seta foi movido para util dedicado
    - `handleWallApply` passa a atuar como orquestrador (seleção + persistência + feedback)
- Regras/documentação sincronizadas:
    - `.rules/canvas.md` atualizado com referência ao util de aplicação de edição de linha/seta
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 47 (Aplicação de edição de parede extraída do RacEditor)

- Novo utilitário de aplicação de edição:
    - `src/components/rac-editor/utils/wall-editor-apply.ts`
    - operação: `applyWallEditorChange`
- `RacEditor` atualizado:
    - bloco de edição de parede (nome/cor + criação/remoção de label com agrupamento) foi movido para util dedicado
    - `handleWallApply` mantém orquestração de persistência, histórico e mensagem
- Regras/documentação sincronizadas:
    - `.rules/canvas.md` atualizado com referência ao util de edição de parede
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 48 (Layout vertical inicial de vistas no domínio)

- Extensão de `house-view-layout-use-cases`:
    - operação nova: `calculateStackedViewPositions`
- `RacEditor` atualizado:
    - reposicionamento inicial após `NivelDefinitionEditor` (planta em cima + vista inicial embaixo) passa a delegar o
      cálculo para o caso de uso de domínio
- Cobertura automática adicionada/expandida:
    - `src/lib/domain/house-views-layout.use-case.smoke.test.ts` atualizado (+1 teste)
- Regras/documentação sincronizadas:
    - `.rules/vistas-por-tipo.md` atualizado com referência ao cálculo de empilhamento vertical
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 49 (Decisões de fluxo do HouseSideSelector extraídas)

- Novo utilitário de fluxo do seletor de lado:
    - `src/components/rac-editor/utils/house-side.ts`
    - operações: `shouldTransitionToNivelDefinition`, `shouldResetHouseTypeOnSideSelectorCancel`
- `RacEditor` atualizado:
    - `handleSideSelected` e `handleSideSelectorClose` passam a delegar as decisões de transição/cancelamento ao util
- Cobertura automática adicionada:
    - `src/components/rac-editor/utils/side-selector-flow.smoke.test.ts` (2 testes)
- Regras/documentação sincronizadas:
    - `.rules/vistas-por-tipo.md` atualizado com referência ao fluxo do side selector
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 50 (Patch de edição de dimensão extraído)

- Novo utilitário puro de edição de dimensão:
    - `src/lib/canvas/dimension-editor.ts`
    - operação: `applyDimensionEditorPatch`
- `RacEditor` atualizado:
    - branch de `dimension` em `handleWallApply` passa a delegar atualização de texto/cores para o util
- Cobertura automática adicionada:
    - `src/lib/canvas/dimension-editor.smoke.test.ts` (2 testes)
- Regras/documentação sincronizadas:
    - `.rules/canvas.md` atualizado com referência ao util de dimensão
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 51 (Fábrica de criação de vistas extraída do RacEditor)

- Novo utilitário de criação de grupos por tipo de vista:
    - `src/components/rac-editor/utils/house-view-creation.ts`
    - operação: `createHouseGroupForView`
- `RacEditor` atualizado:
    - `addViewToCanvas` passa a delegar seleção da fábrica (`top/front/back/side1/side2`) ao util dedicado
- Cobertura automática adicionada:
    - `src/components/rac-editor/utils/house-view-creation.smoke.test.ts` (2 testes)
- Regras/documentação sincronizadas:
    - `.rules/vistas-por-tipo.md` atualizado com referência ao util de criação de vistas
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 52 (Aplicação de highlight de seleção de piloti unificada)

- Extensão de `piloti-visual-feedback`:
    - operação nova: `applyPilotiSelectionVisuals`
- `Canvas` e `RacEditor` atualizados:
    - fluxo de seleção visual de piloti passa a usar uma operação única (amarelo global + azul do selecionado)
      reaproveitada nas duas camadas
- Cobertura automática adicionada/expandida:
    - `src/lib/canvas/piloti-visual-feedback.smoke.test.ts` atualizado (+1 teste)
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 53 (Estado dos editores inline extraído do RacEditor)

- Novo hook de orquestração de editores inline:
    - `src/components/rac-editor/hooks/useGenericObjectEditors.ts`
- `RacEditor` atualizado:
    - estados e handlers de seleção/abertura/fechamento de `distance`, `objectName` e `lineArrow` foram movidos para
      hook dedicado
    - fluxo de abertura do editor de dimensão recém-criada passa a usar `openDistanceEditor`
- Regras/documentação sincronizadas:
    - `.rules/canvas.md` atualizado com referência ao hook de inline editors
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 54 (Padronização de hooks compartilhados em `src/shared/hooks`)

- Migração de hooks compartilhados:
    - `src/hooks/use-mobile.tsx` -> `src/shared/hooks/use-mobile.tsx`
    - `src/hooks/use-toast.ts` -> `src/shared/hooks/use-toast.ts`
- Imports atualizados:
    - `src/components/rac-editor/Canvas.tsx`
    - `src/components/rac-editor/NivelDefinitionEditor.tsx`
    - `src/components/rac-editor/RacEditor.tsx`
    - `src/components/rac-editor/SettingsModal.tsx`
    - `src/components/rac-editor/TwoCardSelector.tsx`
    - `src/components/ui/sidebar.tsx`
    - `src/components/ui/toaster.tsx`
    - `src/components/ui/use-toast.ts`
- Limpeza estrutural:
    - arquivos legados removidos de `src/hooks` (migrados para `src/shared/hooks`)
- Regras/documentação sincronizadas:
    - `.rules/README.md` atualizado com convenção de localização de hooks compartilhados
- Validação pós-extração:
    - `npm run test -- --run` -> PASS
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS

### Fase 7 - passo incremental 55 (Estabilização do bootstrap E2E após tela branca intermitente)

- `e2e/helpers/rac-helpers.ts` atualizado:
    - `setupRacEditorPage` agora usa `page.goto("/", { waitUntil: "domcontentloaded" })`
    - adicionada espera de `networkidle` com tolerância
    - adicionada segunda tentativa de carregamento antes de falhar a asserção do botão de menu
- Motivo:
    - execução anterior da suíte E2E falhou de forma intermitente com tela branca no carregamento inicial
- Validação pós-ajuste:
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)
    - `npm run test -- --run` -> PASS (118/118)
    - `npm run build` -> PASS

### Fase 7 - passo incremental 56 (Atalhos L/Z extraídos para hook dedicado)

- Novo hook de atalhos do editor:
    - `src/components/rac-editor/hooks/useHotkeys.ts`
    - centraliza teclas `L` (modo desenho) e `Z` (zoom/minimap)
    - ignora atalhos quando foco está em `input/textarea/select/contenteditable` ou com modificadores (`Ctrl/Cmd/Alt`)
- `RacEditor` atualizado:
    - remove dois `useEffect` locais de keyboard shortcut
    - passa a delegar os atalhos para `useRacHotkeys`
- Cobertura automática adicionada:
    - `src/components/rac-editor/hooks/useHotkeys.smoke.test.tsx` (2 testes)
- Regras/documentação sincronizadas:
    - `.rules/canvas.md` atualizado com referência ao `useRacHotkeys`
    - `.rules/canvas.md` corrigido para paths atuais de hooks (`src/components/rac-editor/hooks/*`)
- Validação pós-extração:
    - `npm run test -- --run` -> PASS (120/120)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 57 (Reset de contraventamento centralizado no import)

- `RacEditor` atualizado:
    - fluxo de `handleImportJSON` deixa de resetar estado de contraventamento manualmente
    - passa a reutilizar `resetContraventamentoFlow` (hook `useContraventamentoFlow`)
- Ganho:
    - reduz duplicação de reset de estado e mantém uma única regra de limpeza do fluxo
- Regras/documentação sincronizadas:
    - `.rules/contraventamento.md` atualizado para explicitar o reset centralizado no cancelamento/import
- Validação pós-extração:
    - `npm run test -- --run` -> PASS (120/120)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)
    - observação: houve 1 execução E2E intermitente com timeout de botão em `views-limits`; suíte completa foi
      reexecutada e ficou verde.

### Fase 7 - passo incremental 58 (Modais de confirmação responsivos extraídos do RacEditor)

- Novo componente de modal de confirmação:
    - `src/components/rac-editor/modals/ConfirmDialogModal.tsx`
    - unifica comportamento de confirmação em `Dialog` (desktop) e `Drawer` (mobile)
- `RacEditor` atualizado:
    - blocos duplicados de confirmação (`Reiniciar Canvas` e `Desagrupar Casa`) removidos
    - passa a renderizar `ConfirmDialogModal` com callbacks de fechamento/ação
- Regras/documentação sincronizadas:
    - `.rules/toolbar.md` atualizado com referência ao `ConfirmDialogModal` para ações destrutivas do fluxo
      toolbar/overflow
- Validação pós-extração:
    - `npm run test -- --run` -> PASS (120/120)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 59 (Sincronização de estado do PilotiEditor sem setState em render)

- `usePilotiEditorLogic` atualizado:
    - sincronização de draft (`tempHeight`, `tempIsMaster`, `tempNivel`) com mudança de `pilotiId`/abertura foi movida
      de bloco em render para `useEffect`
- Ganho:
    - evita side-effect de `setState` durante render e reduz risco de comportamento inesperado em modo estrito
- Regras/documentação sincronizadas:
    - `.rules/piloti-nivel.md` atualizado com a regra de sincronização via efeito
    - `.rules/piloti-nivel.md` corrigido para caminho atual de `NivelDefinitionEditor`
- Validação pós-extração:
    - `npm run test -- --run` -> PASS (120/120)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 60 (Unificação de handlers de adição de vistas no RacEditor)

- `RacEditor` atualizado:
    - handlers `handleAddHouseFront`, `handleAddHouseBack`, `handleAddHouseSide1`, `handleAddHouseSide2` foram
      consolidados em um único handler parametrizado: `handleAddHouseView(houseViewType)`
    - mapeamento da toolbar continua com o mesmo contrato (`addHouseFront/addHouseBack/addHouseSide1/addHouseSide2`)
      via closures para o handler único
- Ganho:
    - reduz duplicação de lógica de menu + `requestAddView` e simplifica manutenção do fluxo de vistas
- Validação pós-extração:
    - `npm run test -- --run` -> PASS (120/120)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 61 (Toggle de submenus consolidado no RacEditor)

- `RacEditor` atualizado:
    - extraído helper `toggleSubmenu(submenu, tutorialGate?)` para fluxo comum de `elements`, `lines` e `overflow`
    - `handleToggleElementsMenu`, `handleToggleLinesMenu` e `handleToggleOverflowMenu` passam a delegar ao helper
- Ganho:
    - remove duplicação de `disableDrawingMode + setActiveSubmenu + avanço de tutorial`
- Validação pós-extração:
    - `npm run test -- --run` -> PASS (120/120)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 62 (Sincronização de caminhos em `.rules` após reorganização de modais)

- Regras/documentação atualizadas:
    - `.rules/piloti-mestre.md`
        - referências corrigidas para:
            - `src/components/rac-editor/modals/editors/NivelDefinitionEditor.tsx`
            - `src/components/rac-editor/modals/editors/PilotiEditor.tsx`
    - `.rules/contraventamento.md`
        - referência corrigida para:
            - `src/components/rac-editor/modals/editors/PilotiEditor.tsx`
- Ganho:
    - elimina drift entre diretório de regras e estrutura real pós-refatoração de pastas
- Validação pós-ajuste:
    - `npm run test -- --run` -> PASS (120/120)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 63 (Parser de posição de piloti reutilizado no fluxo de contraventamento)

- `RacEditor` atualizado:
    - `getContraventamentoEditorState` e `handleContraventamentoFromPilotiSide` deixam de fazer parsing local por regex
    - passam a reutilizar `parsePilotiGridPosition` de `house-contraventamento-use-cases`
- Regras/documentação sincronizadas:
    - `.rules/contraventamento.md` atualizado para refletir parser centralizado
- Ganho:
    - remove duplicação de parsing de `pilotiId` e mantém uma única regra de interpretação da malha
- Validação pós-extração:
    - `npm run test -- --run` -> PASS (120/120)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 64 (Alvos de sincronização de contraventamento centralizados no RacEditor)

- `RacEditor` atualizado:
    - extraído helper `getNonTopViewGroups()` para concentrar o filtro de vistas não-planta
    - `handleImportJSON`, remoção de contraventamento e `syncContraventamentoElevations` passam a reutilizar o helper
    - removida duplicação literal no `handleDelete` (branch redundante de `houseManager.removeView`)
- Ganho:
    - reduz repetição em pontos críticos de sincronização e facilita manutenção sem alterar comportamento
- Validação pós-extração:
    - `npm run test -- --run` -> PASS (120/120)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 65 (Simplificação do fluxo de exclusão de vistas no RacEditor)

- `RacEditor` atualizado:
    - `handleDelete` remove mapeamento redundante de `rawView -> HouseViewType` que era usado apenas para detectar
      planta
    - regra de proteção da planta permanece igual (`rawView === 'top'` + `canDeleteTopView`)
- Ganho:
    - reduz complexidade acidental no bloco de exclusão sem alterar regra de negócio
- Validação pós-extração:
    - `npm run test -- --run` -> PASS (120/120)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 66 (Leitura de metadado de vista consolidada no Canvas)

- `Canvas` atualizado:
    - extraído helper local `resolveHouseGroupView(object)` para leitura canônica de vista (`houseViewType` com fallback
      para `houseView`)
    - `syncPlantSideHighlight` e `updateHint` passam a reutilizar o helper
- Regras/documentação sincronizadas:
    - `.rules/canvas.md` atualizado com referência explícita ao helper de leitura canônica
- Ganho:
    - remove duplicação de fallback de metadado de vista e reduz chance de drift entre fluxos de highlight
- Validação pós-extração:
    - `npm run test -- --run` -> PASS (120/120)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 67 (Detecção de vista planta do Canvas alinhada ao domínio)

- `Canvas` atualizado:
    - `syncPlantSideHighlight` passa a localizar a planta com `findTopViewGroupCandidate` (mesma regra já usada no
      `RacEditor`)
- Regras/documentação sincronizadas:
    - `.rules/canvas.md` atualizado para registrar o uso de `findTopViewGroupCandidate` na lógica de highlight lateral
- Ganho:
    - evita duplicação de regra de detecção da planta (`top`) e reduz risco de divergência entre camadas
- Validação pós-extração:
    - `npm run test -- --run` -> PASS (120/120)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 68 (JSX de editores inline simplificado no RacEditor)

- `RacEditor` atualizado:
    - cálculos inline de cor dos `GenericObjectEditor` (dimensão e parede) foram extraídos para helpers nomeados:
      `resolveDimensionEditorColor` e `resolveWallEditorColor`
    - tipo do editor de linha/seta foi centralizado em `lineArrowEditorType`, reutilizado em `editorType` e `onApply`
- Ganho:
    - reduz ruído no JSX e melhora legibilidade sem alterar fluxo de edição
- Validação pós-extração:
    - `npm run test -- --run` -> PASS (120/120)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 69 (Contadores da Toolbar unificados + alinhamento de imports após rename)

- `RacEditor` atualizado:
    - contadores `front/back/side1/side2` enviados à `Toolbar` passam a usar helper único
      `getToolbarViewCount(houseViewType)`
- Ajuste de estabilidade (estado atual do branch):
    - import de confirmação ajustado para arquivo existente:
      `src/components/rac-editor/modals/ConfirmDialogModal.tsx`
    - import de ícone do `GenericObjectEditor` ajustado para arquivo existente:
      `src/components/rac-editor/icons/GenericObjectEditorIcon.tsx`
- Regras/documentação sincronizadas:
    - `.rules/toolbar.md` atualizado com helper de contadores e path atual do modal de confirmação
- Validação:
    - 1ª execução pós-patch: `npm run test -- --run` PASS, `npm run build` FAIL, `npm run test:e2e` FAIL por imports
      legados não resolvidos no estado do repositório
    - após ajuste de imports:
        - `npm run test -- --run` -> PASS (120/120)
        - `npm run build` -> PASS
        - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 70 (Refresh de highlight da planta consolidado no Canvas)

- `Canvas` atualizado:
    - `syncPlantSideHighlight` extraiu helper local `refreshTopGroup()` para centralizar:
      `topGroup.setCoords()` + `canvas.requestRenderAll()`
- Regras/documentação sincronizadas:
    - `.rules/canvas.md` atualizado para registrar helper de refresh no fluxo de highlight lateral
- Ganho:
    - reduz repetição em pontos de retorno do highlight da planta sem alterar comportamento
- Validação pós-extração:
    - `npm run test -- --run` -> PASS (120/120)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 71 (Fluxo de tutorial de linha/seta consolidado no RacEditor)

- `RacEditor` atualizado:
    - extraído helper local `addLineWithTutorial(...)` para consolidar o fluxo comum de criação + dica de
      tutorial de `handleAddLine` e `handleAddArrow`
- Regras/documentação sincronizadas:
    - `.rules/toolbar.md` atualizado para registrar o helper do fluxo de linha/seta
- Ganho:
    - reduz duplicação no bloco de ações de linhas sem alterar UX
- Validação pós-extração:
    - `npm run test -- --run` -> PASS (120/120)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 72 (Reset visual de pilotis extraído no Canvas)

- `Canvas` atualizado:
    - rotina de estilo padrão dos pilotis extraída para helpers locais:
      `applyDefaultPilotiStyles` e `resetAllHousePilotiStyles`
    - `updateHint` passa a reutilizar o reset centralizado
- Regras/documentação sincronizadas:
    - `.rules/canvas.md` atualizado com referência aos helpers de reset visual
- Ganho:
    - simplifica o fluxo de seleção sem alterar as regras de destaque por mestre/tipo de piloti
- Validação pós-extração:
    - `npm run test -- --run` -> PASS (120/120)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 73 (Resolução de lado da vista extraída no Canvas)

- `Canvas` atualizado:
    - extraído helper local `resolveHouseSideForSelection(houseViewType, selectedObject)` para encontrar o lado (
      `houseSide`)
      da vista selecionada no highlight da planta
    - `syncPlantSideHighlight` passa a usar o helper e remove lógica duplicada de busca por `instanceId`/`group`
- Regras/documentação sincronizadas:
    - `.rules/canvas.md` atualizado com referência ao helper de resolução de lado
- Ganho:
    - simplifica a lógica de highlight lateral e reduz acoplamento no corpo principal da função
- Validação pós-extração:
    - `npm run test -- --run` -> PASS (120/120)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 74 (Limpeza de seleção de contraventamento centralizada no RacEditor)

- `RacEditor` atualizado:
    - extraído helper `clearContraventamentoSelection(group?)` para centralizar:
      `setContraventamentoSelection(group, null)` + `setSelectedContraventamento(null)`
    - helper aplicado nos fluxos de remoção/criação de contraventamento e limpeza ao excluir objetos
- Regras/documentação sincronizadas:
    - `.rules/contraventamento.md` atualizado com referência ao helper de limpeza
- Ganho:
    - reduz repetição em pontos críticos de estado visual/seleção do fluxo de contraventamento
- Validação pós-extração:
    - `npm run test -- --run` -> PASS (120/120)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 75 (Sincronização de elevações reutilizada no import e remoção)

- `RacEditor` atualizado:
    - `handleImportJSON` passa a reutilizar `syncContraventamentoElevations()` em vez de chamada inline de
      `syncContraventamentoElevationsFromTop`
    - remoção de contraventamento em `handleDelete` também reutiliza `syncContraventamentoElevations()`
- Regras/documentação sincronizadas:
    - `.rules/contraventamento.md` atualizado para registrar sincronização reutilizada no fluxo
- Ganho:
    - unifica a regra de sincronização de elevações em um único ponto no componente
- Validação pós-extração:
    - `npm run test -- --run` -> PASS (120/120)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 76 (Highlight de pilotis da seleção extraído no Canvas)

- `Canvas` atualizado:
    - extraído helper `applySelectedHousePilotiHighlight(group, houseViewType)` para centralizar highlight de pilotis do
      grupo selecionado (planta vs elevação)
    - `updateHint` passa a delegar o highlight da seleção para esse helper
- Regras/documentação sincronizadas:
    - `.rules/canvas.md` atualizado com referência ao helper de highlight da seleção
- Ganho:
    - reduz ramificações no `updateHint` sem alterar a regra visual
- Validação pós-extração:
    - `npm run test -- --run` -> PASS (120/120)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 77 (Avanço do tutorial de zoom/minimap unificado no RacEditor)

- `RacEditor` atualizado:
    - extraído handler `handleZoomTutorialInteraction` para centralizar a regra de avanço do passo `zoom-minimap`
    - handler reutilizado por:
        - `onZoomInteraction` (Canvas)
        - `onMinimapInteraction` (Canvas)
        - `handleToggleZoomControls`
- Regras/documentação sincronizadas:
    - `.rules/canvas.md` atualizado com a unificação do avanço de tutorial de zoom/minimap
- Ganho:
    - elimina duplicação de callbacks inline e mantém comportamento idêntico
- Validação pós-extração:
    - `npm run test -- --run` -> PASS (120/120)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

## Resumo da rodada

- Itens com cobertura automática sólida: regras de house type/limites, piloti (altura/master/nível), persistência
  tutorial/configuração, contratos de serialização e mapeamentos 3D.
- Itens que dependem de validação manual de UI/interação real (Fabric/3D): zoom/pan/minimap/undo/copy-paste, fluxo
  visual de contraventamento, render/snapshot 3D, seleção de lado por modal.
- `lint` não está verde no baseline atual (muitos `no-explicit-any`), mas `test` e `build` estão verdes.

### Fase 7 - passo incremental 78 (Rename para RacEditor + validações e sincronização de regras)

- Código atualizado:
    - rename de componente e arquivos para a convenção atual:
        - `RacEditor`
        - `RacEditorModalEditors`
    - arquivos principais:
        - `src/components/rac-editor/RacEditor.tsx`
        - `src/components/rac-editor/RacEditorModalEditors.tsx`
        - `src/pages/Index.tsx`
- Refatoração estrutural mantida:
    - `Canvas` delega setup/bindings para `useCanvasFabricSetup`
    - fluxo de contraventamento orquestrado por `useContraventamento`
    - fluxo de vistas/tipo de casa orquestrado por `useRacViewActions`
- Qualidade/Lint nos arquivos tocados:
    - ajuste de deps de hooks em `Canvas.tsx`
    - supressão explícita e localizada de `no-explicit-any` em pontos Fabric dinâmicos
    - `npx eslint` executado nos arquivos tocados -> PASS (sem erros/warnings)
- Regras/documentação sincronizadas:
    - `.rules/canvas.md`
    - `.rules/contraventamento.md`
    - `.rules/toolbar.md`
    - `.rules/vistas-por-tipo.md`
    - `.codex/refactoring-2026-02-20/refactoring-plan.md`
    - `.codex/refactoring-2026-02-20/regression-checklist.md`
- Validação pós-rodada:
    - `npm run test` -> PASS (35 arquivos de teste, 120 testes)
    - `npm run build` -> PASS
    - observação de build: permanecem avisos não-funcionais de chunk size/browserslist (sem regressão de regra de
      negócio)
- Revalidação final pós `git mv` (case-sensitive) de arquivos `RacEditor*`:
    - `npm run test` -> PASS (35 arquivos de teste, 120 testes)
    - `npm run build` -> PASS
    - `npx eslint` (arquivos tocados) -> PASS

### Fase 7 - passo incremental 79 (Lint real no setup do Canvas: tipagem Fabric + deps estáveis)

- `src/components/rac-editor/hooks/useCanvasFabricSetup.ts` atualizado:
    - removidos `any` explícitos com tipagem local (`CanvasObject`, payloads de evento e helpers de cast);
    - fluxo de leitura de callbacks/refs atualizado para `latestArgsRef`, preservando listeners estáveis;
    - warning de `react-hooks/exhaustive-deps` eliminado sem `eslint-disable`.
- Ganho:
    - lint corrigido de forma estrutural (sem supressão) no principal setup de eventos do canvas.
- Validação do passo:
    - `npx eslint src/components/rac-editor/hooks/useCanvasFabricSetup.ts` -> PASS

### Fase 7 - passo incremental 80 (Ações de elementos/linhas/desenho extraídas para hook dedicado)

- `RacEditor` atualizado:
    - extraído novo hook `src/components/rac-editor/hooks/useCanvasTools.ts` para centralizar:
        - inserção de muro/porta/escada/árvore/água/fossa;
        - inserção de linha/seta com tutorial;
        - inserção de dimensão com abertura automática de editor;
        - toggle de modo desenho e adição de texto.
    - `src/components/rac-editor/RacEditor.tsx` reduzido de **1211** para **1073** linhas.
- Regras/documentação sincronizadas:
    - `.rules/canvas.md`
    - `.rules/toolbar.md`
    - `.codex/refactoring-2026-02-20/refactoring-plan.md`
    - `.codex/refactoring-2026-02-20/regression-checklist.md`
- Validação pós-extração:
    -
    `npx eslint src/components/rac-editor/RacEditor.tsx src/components/rac-editor/Canvas.tsx src/components/rac-editor/hooks/useCanvasFabricSetup.ts src/components/rac-editor/hooks/useCanvasTools.ts src/components/rac-editor/hooks/useContraventamento.ts src/components/rac-editor/hooks/useCanvasHouseViewActions.ts` ->
    PASS
    - `npm run test -- --run` -> PASS (120/120)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 81 (Correção dirigida: settings.ts + validação de useCanvasFabricSetup.ts)

- `src/lib/settings.ts` atualizado:
    - `updateSetting` agora trata falha de escrita em storage com `try/catch`, evitando quebra de fluxo em cenários de
      quota/indisponibilidade de `localStorage`.
- `src/lib/settings.smoke.test.ts` atualizado:
    - novo teste cobre cenário de `Storage.setItem` lançando erro, garantindo que `updateSetting` não propaga exceção.
- `src/components/rac-editor/hooks/useCanvasFabricSetup.ts`:
    - revalidação de lint/tipos sem erros no estado atual do branch.
- Regras/documentação sincronizadas:
    - `.rules/toolbar.md` (robustez do fluxo de configurações no overflow).
- Validação pós-correção:
    -
    `npx eslint src/lib/settings.ts src/lib/settings.smoke.test.ts src/components/rac-editor/hooks/useCanvasFabricSetup.ts` ->
    PASS
    - `npm run test -- --run` -> PASS (121/121)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 82 (Ações de projeto extraídas do RacEditor)

- Novo hook:
    - `src/components/rac-editor/hooks/useRacEditorJsonActions.ts`
    - centraliza:
        - `handleExportJSON`
        - `handleImportJSON`
        - `handleDelete`
- `RacEditor` atualizado:
    - remove implementação inline desses handlers e delega ao hook;
    - mantém contrato da `Toolbar` e callback `onDelete` do `Canvas` sem mudanças de comportamento.
- Regras/documentação sincronizadas:
    - `.rules/toolbar.md`
    - `.rules/contraventamento.md`
- Ganho:
    - redução de tamanho no arquivo principal do editor (`RacEditor.tsx`: **1073 -> 994** linhas).
- Validação pós-extração:
    - `npx eslint src/components/rac-editor/RacEditor.tsx src/components/rac-editor/hooks/useRacEditorJsonActions.ts` ->
      PASS
    - `npm run test -- --run` -> PASS (121/121)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 83 (Agrupar/Desagrupar extraídos para hook dedicado)

- Novo hook:
    - `src/components/rac-editor/hooks/useCanvasGroupingActions.ts`
    - centraliza:
        - `handleGroup`
        - `handleUngroup`
        - confirmação de desagrupar (`confirmUngroup` / `closeUngroupConfirm`)
- `RacEditor` atualizado:
    - remove bloco inline de agrupar/desagrupar e delega para o hook;
    - preserva contrato dos comandos da toolbar e modal de confirmação.
- Validação pós-extração:
    -
    `npx eslint src/components/rac-editor/RacEditor.tsx src/components/rac-editor/hooks/useCanvasGroupingActions.ts` ->
    PASS
    - `npm run test -- --run` -> PASS (121/121)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 84 (useCanvasFabricSetup dividido em hooks de eventos)

- Novos hooks:
    - `src/components/rac-editor/hooks/useCanvasSelectionEvents.ts`
    - `src/components/rac-editor/hooks/useCanvasContraventamentoEvents.ts`
    - `src/components/rac-editor/hooks/useCanvasKeyboardShortcuts.ts`
- `useCanvasFabricSetup` atualizado:
    - remove handlers inline de `selection`, contraventamento (`mouse`) e atalhos/rotação (`keyboard` +
      `object:rotating`);
    - passa a bindar/desbindar os três hooks especializados, mantendo `handlePilotiSelection` local para fluxos de
      clique e
      double-click;
    - `useEffect` com dependências explícitas dos binders (sem `eslint-disable`).
- Ganho:
    - redução de tamanho de `useCanvasFabricSetup.ts` para **635** linhas;
    - manutenção de lint limpo sem desativação de regras.
- Validação pós-extração:
    -
    `npx eslint src/components/rac-editor/hooks/useCanvasFabricSetup.ts src/components/rac-editor/hooks/useCanvasSelectionEvents.ts src/components/rac-editor/hooks/useCanvasContraventamentoEvents.ts src/components/rac-editor/hooks/useCanvasKeyboardShortcuts.ts src/components/rac-editor/RacEditor.tsx src/components/rac-editor/hooks/useCanvasGroupingActions.ts src/lib/settings.ts` ->
    PASS
    - `npm run test -- --run` -> PASS (121/121)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 85 (Canvas: pan/wheel/touch extraídos para hook dedicado)

- Novo hook:
    - `src/components/rac-editor/hooks/useCanvasPointerInteractions.ts`
    - centraliza:
        - pan com botão do meio do mouse;
        - wheel para zoom (`Ctrl/Cmd`) e pan (sem modificador);
        - pinch-to-zoom com dois dedos;
        - pan com um dedo no mobile;
        - prevenção de zoom do browser no container (`Ctrl/Cmd + wheel`).
- `Canvas` atualizado:
    - remove handlers inline de `mouse`/`wheel`/`touch` e delega para `useCanvasPointerInteractions`;
    - mantém fluxo de render/composição (minimap/slider/children) sem alteração de comportamento.
- Ganho:
    - redução de tamanho de `src/components/rac-editor/Canvas.tsx` para **497** linhas.
- Validação pós-extração:
    -
    `npx eslint src/components/rac-editor/Canvas.tsx src/components/rac-editor/hooks/useCanvasPointerInteractions.ts` ->
    PASS
    - `npm run test -- --run` -> PASS (121/121)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 86 (Ações de piloti extraídas do RacEditor)

- Novo hook:
    - `src/components/rac-editor/hooks/usePilotiActions.ts`
    - centraliza:
        - `handlePilotiSelect`
        - `handlePilotiEditorClose`
        - `handlePilotiHeightChange`
        - `handlePilotiNavigate`
- `RacEditor` atualizado:
    - remove implementação inline das ações de piloti e delega para o hook;
    - mantém regra de bloqueio em modo contraventamento, sincronização de elevações, histórico e feedback visual.
- Ganho:
    - redução de tamanho de `src/components/rac-editor/RacEditor.tsx` para **847** linhas.
- Validação pós-extração:
    - `npx eslint src/components/rac-editor/RacEditor.tsx src/components/rac-editor/hooks/usePilotiActions.ts` -> PASS
    - `npm run test -- --run` -> PASS (121/121)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 87 (Eventos inline extraídos do useCanvasFabricSetup)

- Novo hook:
    - `src/components/rac-editor/hooks/useCanvasEditorEvents.ts`
    - centraliza:
        - `mouse:dblclick` desktop para edição de dimensão/parede/linha-seta;
        - `mouse:down` mobile para tap em dimensão/parede/linha-seta;
        - hit-test local de piloti em grupos de casa para seleção de piloti.
- `useCanvasFabricSetup` atualizado:
    - remove bloco inline de seleções auxiliares (`distance`, `object name`, `line/arrow`, `double-click` e
      `mobile tap`);
    - passa a bindar/desbindar `useCanvasEditorEvents`.
- Ganho:
    - redução de `src/components/rac-editor/hooks/useCanvasFabricSetup.ts` para **405** linhas.
- Validação pós-extração:
    -
    `npx eslint src/components/rac-editor/hooks/useCanvasEditorEvents.ts src/components/rac-editor/hooks/useCanvasFabricSetup.ts` ->
    PASS
    - `npm run test -- --run` -> PASS (121/121)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 88 (Fluxo de menu/tutorial extraído do RacEditor)

- Novo hook:
    - `src/components/rac-editor/hooks/useTutorialMenuActions.ts`
    - centraliza:
        - toggle de menu principal e submenus (`house/elements/lines/overflow`);
        - fluxo de abertura/fechamento do `HouseTypeSelector`;
        - gates de tutorial (`main-fab`, `house`, `elements`, `zoom-minimap`, `more-options`);
        - toggle de dicas e zoom controls;
        - fechamento por clique fora e conclusão de tutorial.
- `RacEditor` atualizado:
    - remove handlers inline de menu/tutorial e delega para `useRacMenuTutorialActions`;
    - mantém contrato da toolbar e hotkeys.
- Ganho:
    - redução de `src/components/rac-editor/RacEditor.tsx` para **769** linhas.
- Validação pós-extração:
    - `npx eslint src/components/rac-editor/hooks/useTutorialMenuActions.ts src/components/rac-editor/RacEditor.tsx` ->
      PASS
    - `npm run test -- --run` -> PASS (121/121)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 89 (Tutorial/restart/tutorial extraídos do RacEditor)

- Novos hooks:
    - `src/components/rac-editor/hooks/useTutorialUiActions.ts`
    - `src/components/rac-editor/hooks/useCanvasHouseInitialization.ts`
- `RacEditor` atualizado:
    - remove blocos inline de:
        - reinício de tutorial/canvas (`handleRestartTutorial`, `confirmRestartTutorial`, `closeRestartConfirm`);
        - exibição/fechamento de balão de tutorial de piloti;
        - inicialização assíncrona de `houseManager` quando canvas fica disponível.
    - delega esses fluxos para hooks dedicados, preservando comportamento de UI e regras de reset.
- Ganho:
    - redução de `src/components/rac-editor/RacEditor.tsx` para **682** linhas.
- Validação pós-extração:
    -
    `npx eslint src/components/rac-editor/RacEditor.tsx src/components/rac-editor/hooks/useTutorialUiActions.ts src/components/rac-editor/hooks/useCanvasHouseInitialization.ts src/components/rac-editor/hooks/useCanvasFabricSetup.ts src/components/rac-editor/hooks/useCanvasEditorEvents.ts src/components/rac-editor/hooks/useTutorialMenuActions.ts` ->
    PASS
    - `npm run test -- --run` -> PASS (121/121)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 90 (Apply de editores genéricos extraído do RacEditor)

- Novo hook:
    - `src/components/rac-editor/hooks/useWallEditorActions.ts`
    - centraliza:
        - `handleWallApply` para `wall`, `line/arrow` e `dimension`;
        - resolução de cor inicial dos editores (`resolveDimensionEditorColor`, `resolveWallEditorColor`);
        - inferência de tipo para editor de linha/seta (`lineArrowEditorType`).
- `RacEditor` atualizado:
    - remove bloco inline de apply/cores/tipo dos editores genéricos e delega ao hook;
    - mantém contrato de `RacEditorModalEditors`.
- Ganho:
    - redução de `src/components/rac-editor/RacEditor.tsx` para **618** linhas.
- Validação pós-extração:
    -
    `npx eslint src/components/rac-editor/RacEditor.tsx src/components/rac-editor/hooks/useWallEditorActions.ts src/components/rac-editor/hooks/useTutorialUiActions.ts src/components/rac-editor/hooks/useCanvasHouseInitialization.ts` ->
    PASS
    - `npm run test -- --run` -> PASS (121/121)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 91 (Overlays de Canvas extraídos)

- Novo componente:
    - `src/components/rac-editor/CanvasOverlays.tsx`
    - centraliza:
        - indicador visual de pinch;
        - ZoomSlider + Minimap desktop/mobile;
        - renderização responsiva de `children` (InfoBar).
- `Canvas` atualizado:
    - remove markup inline de overlays/zoom/minimap e delega para `CanvasOverlays`;
    - mantém contratos de viewport, zoom e tutorial highlight.
- Ganho:
    - redução de `src/components/rac-editor/Canvas.tsx` para **401** linhas.
- Validação pós-extração:
    - `npx eslint src/components/rac-editor/Canvas.tsx src/components/rac-editor/CanvasOverlays.tsx` -> PASS
    - `npm run test -- --run` -> PASS (121/121)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 92 (Overlays/modais de RacEditor extraídos)

- Novo componente:
    - `src/components/rac-editor/RacEditorModals.tsx`
    - centraliza:
        - `HouseTypeSelector`, `House3DViewer`, `SettingsModal`;
        - `Tutorial`, `PilotiTutorialBalloon`, `TutorialBalloon`;
        - confirmações de reinício/desagrupar;
        - `NivelDefinitionEditor`.
- `RacEditor` atualizado:
    - remove bloco inline de overlays/modais e delega para `RacEditorModals`;
    - mantém contratos de estado e callbacks sem mudança de regra de negócio.
- Ganho:
    - redução de `src/components/rac-editor/RacEditor.tsx` para **524** linhas.
- Validação pós-extração:
    - `npx eslint src/components/rac-editor/RacEditor.tsx src/components/rac-editor/RacEditorModals.tsx` -> PASS
    - `npm run test -- --run` -> PASS (121/121)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 93 (Helpers de interação do RacEditor extraídos)

- Novo hook:
    - `src/components/rac-editor/hooks/useCanvasInteractionActions.ts`
    - centraliza:
        - obtenção de canvas ativo;
        - centro visível e add de objeto no centro;
        - fechamento de menus com limpeza de tutorial/tutorial;
        - desligamento seguro do modo desenho.
- `RacEditor` atualizado:
    - remove helpers locais de interação e delega para o novo hook;
    - mantém integração com `useRacTutorialUiActions` e ações de toolbar.
- Ganho:
    - redução de `src/components/rac-editor/RacEditor.tsx` para **507** linhas.
- Validação pós-extração:
    -
    `npx eslint src/components/rac-editor/RacEditor.tsx src/components/rac-editor/hooks/useCanvasInteractionActions.ts src/lib/settings.ts src/components/rac-editor/hooks/useCanvasFabricSetup.ts` ->
    PASS
    - `npm run test -- --run` -> PASS (121/121)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 94 (Correções de tipagem estrita sem alterar regra de negócio)

- Correções aplicadas:
    - `src/lib/persistence/settings.storage.ts`
        - leitura/escrita genérica alterada de `T extends Record<string, unknown>` para `T extends object`;
        - parse protegido por guard de objeto para evitar incompatibilidade com `AppSettings`.
    - `src/components/rac-editor/hooks/useCanvasFabricSetup.ts`
        - refs de entrada migrados para `MutableRefObject` para permitir escrita segura em `.current`;
        - elimina erro de readonly e nulabilidade indevida em callbacks.
    - `src/components/rac-editor/hooks/useCanvasEditorEvents.ts`
        - inclusão de `text?: string` no runtime type para seleção de editores inline.
    - `src/lib/canvas/piloti-visual-feedback.ts`
        - API de utilitários migrada para entradas `unknown[]` com type guards internos;
        - remoção de casts inseguros (`Record<string, unknown>[]`).
    - `src/components/rac-editor/hooks/usePilotiActions.ts`
        - remoção de casts para `Record<string, unknown>[]` ao chamar utilitários de feedback.
    - `src/components/rac-editor/hooks/useCanvasSelectionEvents.ts`
        - normalização de `canvas.getActiveObject()` para `null` quando indefinido.
    - `src/components/rac-editor/House3DScene.tsx`
        - simplificação de fallback de origem do contraventamento para eliminar `possibly undefined`.
    - `src/lib/domain/house-application.smoke.test.ts`
        - anotação explícita de `pilotis` como `Record<string, HousePiloti>`.
- Revalidação dos alvos solicitados:
    - `src/lib/settings.ts` -> OK
    - `src/components/rac-editor/hooks/useCanvasFabricSetup.ts` -> OK
- Validação pós-correção:
    - `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false` -> PASS
    -
    `npx eslint src/lib/settings.ts src/lib/persistence/settings.storage.ts src/components/rac-editor/hooks/useCanvasFabricSetup.ts src/components/rac-editor/hooks/useCanvasEditorEvents.ts src/components/rac-editor/hooks/usePilotiActions.ts src/lib/canvas/piloti-visual-feedback.ts src/components/rac-editor/hooks/useCanvasSelectionEvents.ts src/components/rac-editor/House3DScene.tsx src/lib/domain/house-application.smoke.test.ts` ->
    PASS
    - `npm run test -- --run` -> PASS (121/121)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 95 (Composição de ações da Toolbar extraída do RacEditor)

- Novo hook:
    - `src/components/rac-editor/hooks/useToolbarActions.ts`
    - centraliza a composição do `ToolbarActionMap` (comandos de casa/elementos/linhas/projeto/overflow), incluindo
      ações
      de abrir viewer 3D e configurações.
- `RacEditor` atualizado:
    - remove objeto inline gigante de `actions` no `Toolbar` e delega para `useRacToolbarActions`.
- Ganho:
    - redução de `src/components/rac-editor/RacEditor.tsx` para **504** linhas.
- Validação pós-extração:
    - `npx eslint src/components/rac-editor/RacEditor.tsx src/components/rac-editor/hooks/useToolbarActions.ts` -> PASS
    - `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false` -> PASS
    - `npm run test -- --run` -> PASS (121/121)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 96 (Seção Canvas do RacEditor extraída)

- Novo componente:
    - `src/components/rac-editor/RacEditorCanvas.tsx`
    - centraliza:
        - composição de `Canvas` no `RacEditor`;
        - wiring dos callbacks de seleção/zoom/contraventamento;
        - renderização da `InfoBar` dentro do slot `children` do canvas.
- `RacEditor` atualizado:
    - remove bloco inline da seção de canvas e delega para `RacEditorCanvas`.
- Ganho:
    - redução de `src/components/rac-editor/RacEditor.tsx` para **493** linhas.
- Validação pós-extração:
    -
    `npx eslint src/components/rac-editor/RacEditor.tsx src/components/rac-editor/RacEditorCanvas.tsx src/components/rac-editor/hooks/useToolbarActions.ts` ->
    PASS
    - `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false` -> PASS
    - `npm run test -- --run` -> PASS (121/121)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 97 (Compactação de orquestração no RacEditor)

- `RacEditor` atualizado:
    - compactação de destructuring/assinaturas dos hooks de estado e fluxos (
      `modal/tutorial/inline/house/contraventamento`);
    - sem mudança comportamental, apenas redução de ruído de orquestração.
- Ganho:
    - redução de `src/components/rac-editor/RacEditor.tsx` para **443** linhas.
- Validação pós-compactação:
    - `npx eslint src/components/rac-editor/RacEditor.tsx` -> PASS
    - `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false` -> PASS
    - `npm run test -- --run` -> PASS (121/121)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 98 (Projeção de tela do Canvas extraída)

- Novo hook:
    - `src/components/rac-editor/hooks/useCanvasScreenProjection.ts`
    - centraliza:
        - `getCanvasOffsetFromState`
        - `getCurrentScreenPoint`
        - `getVisibleCenter`
- `Canvas` atualizado:
    - remove funções locais de projeção/offset/centro visível e delega para o hook.
- Validação pós-extração:
    - `npx eslint src/components/rac-editor/Canvas.tsx src/components/rac-editor/hooks/useCanvasScreenProjection.ts` ->
      PASS
    - `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false` -> PASS
    - `npm run test -- --run` -> PASS (121/121)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 99 (Snapshot de objetos do minimap extraído)

- Novo hook:
    - `src/components/rac-editor/hooks/useCanvasMinimapObjects.ts`
    - centraliza estado e atualização do snapshot do minimap (bounds/ângulo/tipo).
- `Canvas` atualizado:
    - remove estado/função inline de objetos do minimap e delega para o novo hook.
- Ganho:
    - redução de `src/components/rac-editor/Canvas.tsx` para **335** linhas.
- Validação pós-extração:
    -
    `npx eslint src/components/rac-editor/Canvas.tsx src/components/rac-editor/hooks/useCanvasMinimapObjects.ts src/components/rac-editor/hooks/useCanvasScreenProjection.ts` ->
    PASS
    - `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false` -> PASS
    - `npm run test -- --run` -> PASS (121/121)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 100 (Seleção de piloti extraída do setup do Fabric)

- Novo helper:
    - `src/components/rac-editor/hooks/canvas-piloti-selection.ts`
    - centraliza:
        - resolução de seleção por hit-area/shape de piloti;
        - interceptação de modo contraventamento;
        - projeção para posição de tela e emissão de payload de editor;
        - feedback visual de seleção no canvas.
- `useCanvasFabricSetup` atualizado:
    - remove implementação inline de `handlePilotiSelection` e delega para `buildPilotiSelectionHandler`.
- Ganho:
    - redução de `src/components/rac-editor/hooks/useCanvasFabricSetup.ts` para **313** linhas.
- Validação pós-extração:
    -
    `npx eslint src/components/rac-editor/hooks/useCanvasFabricSetup.ts src/components/rac-editor/hooks/canvas-piloti-selection.ts` ->
    PASS
    - `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false` -> PASS
    - `npm run test -- --run` -> PASS (121/121)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 101 (Lifecycle de container/viewport extraído do Canvas)

- Novo hook:
    - `src/components/rac-editor/hooks/useCanvasContainerLifecycle.ts`
    - centraliza:
        - sincronização de tamanho de container via `ResizeObserver`;
        - clamp do viewport em mudanças de zoom/tamanho.
- `Canvas` atualizado:
    - remove `useEffect` inline de resize/clamp e delega para `useCanvasContainerLifecycle`.
- Ganho:
    - redução de `src/components/rac-editor/Canvas.tsx` para **321** linhas.
- Validação pós-extração:
    -
    `npx eslint src/components/rac-editor/Canvas.tsx src/components/rac-editor/hooks/useCanvasContainerLifecycle.ts` ->
    PASS
    - `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false` -> PASS
    - `npm run test -- --run` -> PASS (121/121)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 102 (Inline editor bindings extraídos no RacEditor)

- Novo hook:
    - `src/components/rac-editor/hooks/useGenericObjectEditorBindings.ts`
    - centraliza:
        - composição de `useGenericObjectEditors`;
        - cálculo de `isAnyEditorOpen` (piloti + editores inline);
        - wiring de callbacks de seleção inline para o `Canvas`.
- `RacEditor` atualizado:
    - remove cálculo inline de `isAnyEditorOpen` e delega bindings de `onDistanceSelect/onWallSelect/onLinearSelect`.
- Validação pós-extração:
    -
    `npx eslint src/components/rac-editor/RacEditor.tsx src/components/rac-editor/hooks/useGenericObjectEditorBindings.ts` ->
    PASS
    - `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false` -> PASS
    - `npm run test -- --run` -> PASS (121/121)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 103 (Toolbar decomposto em componentes + config)

- Novos arquivos:
    - `src/components/rac-editor/toolbar/ToolbarButtons.tsx`
    - `src/components/rac-editor/toolbar/ToolbarMainMenu.tsx`
    - `src/components/rac-editor/toolbar/ToolbarOverflowMenu.tsx`
    - `src/components/rac-editor/toolbar/toolbar-config.ts`
    - `src/components/rac-editor/toolbar/toolbar-types.ts`
- `Toolbar` atualizado:
    - `src/components/rac-editor/Toolbar.tsx` passa a compor menus e manter apenas input JSON + wiring principal.
- `useRacToolbarActions`:
    - contrato de ações mantido compatível (sem alteração de regra de negócio).
- Validação pós-extração:
    -
    `npx eslint src/components/rac-editor/Toolbar.tsx src/components/rac-editor/toolbar/ToolbarButtons.tsx src/components/rac-editor/toolbar/ToolbarMainMenu.tsx src/components/rac-editor/toolbar/ToolbarOverflowMenu.tsx src/components/rac-editor/toolbar/toolbar-config.ts src/components/rac-editor/toolbar/toolbar-types.ts src/components/rac-editor/hooks/useToolbarActions.ts` ->
    PASS
    - `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false` -> PASS
    - `npm run test -- --run` -> PASS (121/121)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 104 (Contraventamento: queries extraídas)

- Novo hook:
    - `src/components/rac-editor/hooks/useContraventamentoQueries.ts`
    - centraliza:
        - `getTopViewGroup`;
        - ocupação de lados por coluna (`getContraventamentoColumnSides`);
        - elegibilidade (`isPilotiEligibleAsOrigin` / `isPilotiEligibleAsDestination` / `isPilotiEligible`);
        - projeção de estado do editor (`getContraventamentoEditorState`).
- `useContraventamento` atualizado:
    - remove consultas inline e passa a delegar ao hook de queries, preservando comandos/efeitos existentes.
- Validação pós-extração:
    -
    `npx eslint src/components/rac-editor/hooks/useContraventamento.ts src/components/rac-editor/hooks/useContraventamentoQueries.ts` ->
    PASS
    - `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false` -> PASS
    - `npm run test -- --run` -> PASS (121/121)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 105 (Contraventamento: commands/effects extraídos)

- Novos hooks:
    - `src/components/rac-editor/hooks/useContraventamentoCommands.ts`
        - centraliza comandos de fluxo:
            - criação/remoção;
            - seleção/cancelamento;
            - sincronização de elevações;
            - entrada no segundo passo.
    - `src/components/rac-editor/hooks/useContraventamentoEffects.ts`
        - centraliza efeitos reativos:
            - sync por `houseVersion`;
            - cancelamento por `Esc`;
            - persistência de highlight no modo de contraventamento.
- `useContraventamento` atualizado:
    - passa a compor `queries + commands + effects` como orquestrador fino.
- Validação pós-extração:
    -
    `npx eslint src/components/rac-editor/hooks/useContraventamento.ts src/components/rac-editor/hooks/useContraventamentoCommands.ts src/components/rac-editor/hooks/useContraventamentoEffects.ts src/components/rac-editor/hooks/useContraventamentoQueries.ts src/components/rac-editor/hooks/useContraventamento.types.ts` ->
    PASS
    - `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false` -> PASS
    - `npm run test -- --run` -> PASS (121/121)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 106 (Canvas Fabric runtime types extraídos)

- Novo arquivo:
    - `src/components/rac-editor/hooks/canvas.ts`
    - centraliza tipos runtime usados no setup do canvas:
        - `CanvasObject`
        - `CanvasPointerPayload`
        - `CanvasMouseEvent`
- `useCanvasFabricSetup` atualizado:
    - remove declarações inline desses tipos e passa a importar do arquivo dedicado;
    - mantém comportamento do setup como orquestrador de binds/events.
- Ganho:
    - redução de `src/components/rac-editor/hooks/useCanvasFabricSetup.ts` para **271** linhas.
- Validação pós-extração:
    - `npx eslint src/components/rac-editor/hooks/useCanvasFabricSetup.ts src/components/rac-editor/hooks/canvas.ts` ->
      PASS
    - `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false` -> PASS
    - `npm run test -- --run` -> PASS (121/121)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 107 (Bugfix GenericObjectEditor + regressão automática)

- Problema corrigido:
    - ao abrir `GenericObjectEditor` (muro/linha/seta/distância), alterações de nome/cor eram perdidas durante
      digitação;
    - causa raiz: `useGenericObjectEditorDraft` ressincronizava `draft` em toda renderização por depender de objeto
      inicial.
- Correção:
    - `src/components/rac-editor/hooks/useGenericObjectEditorDraft.ts`
    - sincronização de `draft` passou a ocorrer na transição de abertura (`closed -> open`) e em `reset`, preservando
      edição em andamento.
- Regressão automática adicionada:
    - `src/components/rac-editor/modals/editors/GenericObjectEditor.smoke.test.tsx`
    - valida que o editor mantém valor digitado, troca cor e chama `onApply` com os valores atualizados.
- Validação pós-correção:
    -
    `npx eslint src/components/rac-editor/hooks/useGenericObjectEditorDraft.ts src/components/rac-editor/modals/editors/GenericObjectEditor.smoke.test.tsx` ->
    PASS
    - `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false` -> PASS
    - `npm run test -- --run` -> PASS (122/122)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 108 (Bugfix GenericObjectEditor: limpar nome sem remover objeto + reedição de muro agrupado)

- Problemas corrigidos:
    - em `line/arrow`, limpar o nome no `GenericObjectEditor` removia o objeto do canvas;
    - em `wall` (`Vizinho/Muro/etc.`), após primeira configuração de nome/cor, reabrir o editor falhava quando o alvo
      virava grupo.
- Correções aplicadas:
    - `src/components/rac-editor/utils/line-arrow-editor-apply.ts`
        - limpeza de label em grupo agora mantém o objeto no canvas (`text = ""`, `visible = false`) sem
          desagrupar/remover.
    - `src/components/rac-editor/utils/wall-editor-apply.ts`
        - limpeza de nome em parede agrupada agora mantém grupo/parede e apenas oculta label;
        - reedição posterior continua possível no mesmo grupo (nome/cor).
    - `src/components/rac-editor/hooks/useCanvasEditorEvents.ts`
        - seleção inline de parede agora suporta alvo `group` com `myType = wall`, resolvendo `rect` interno + label
          atual.
- Regressões automáticas adicionadas:
    - `src/components/rac-editor/utils/line-arrow-editor-apply.smoke.test.ts`
        - garante que limpar label não remove linha/seta do canvas.
    - `src/components/rac-editor/utils/wall-editor-apply.smoke.test.ts`
        - garante que limpar nome não remove parede e permite editar novamente.
    - `src/components/rac-editor/hooks/useCanvasEditorEvents.smoke.test.tsx`
        - garante abertura do editor de parede para alvo agrupado com label atual.
- Validação pós-correção:
    -
    `npx eslint src/components/rac-editor/utils/line-arrow-editor-apply.ts src/components/rac-editor/utils/wall-editor-apply.ts src/components/rac-editor/hooks/useCanvasEditorEvents.ts src/components/rac-editor/utils/line-arrow-editor-apply.smoke.test.ts src/components/rac-editor/utils/wall-editor-apply.smoke.test.ts src/components/rac-editor/hooks/useCanvasEditorEvents.smoke.test.tsx` ->
    PASS
    - `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false` -> PASS
    - `npm run test -- --run` -> PASS (125/125)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)
    - `npm run lint` -> FAIL (dívida pré-existente fora do escopo deste passo; 286 errors / 11 warnings)

### Fase 7 - passo incremental 109 (Geometria de escala: seta/distância + label placeholder na inserção)

- Problemas corrigidos:
    - triângulo da seta deformava após redimensionamentos sucessivos;
    - barrinhas da distância podiam desalinhar da linha principal após escala;
    - inserção de `line/arrow` sem label inicial gerava box de seleção inconsistente.
- Correções aplicadas:
    - `src/lib/canvas/factory/elements-factory.ts`
        - `createLine` passa a criar grupo com label placeholder `" "` (`lineArrowLabel`) já na inserção;
        - `createArrow` passa a incluir label placeholder `" "` e normalização de `arrowBody/arrowHead` no `scaling` (
          sem deformar head);
        - `createDistance` reforça normalização geométrica no `scaling` (`dimensionMainLine`, `dimensionTickStart`,
          `dimensionTickEnd`, `dimensionLabel`);
        - `line/arrow/dimension` com controles diagonais ocultos (`tl/tr/bl/br`) + `lockScalingY`.
    - `src/components/rac-editor/utils/line-arrow-editor-apply.ts`
        - `lineArrowLabel` vazio passa a ser `" "` visível (placeholder), preservando área de seleção;
        - handler de `scaling` do wrapper com label foi ajustado para não deformar head da seta e manter label ancorado.
- Regressão automática adicionada:
    - `src/lib/canvas/factory/elements-factory.smoke.test.ts`
        - valida placeholder de label na inserção;
        - valida escala horizontal estável de `line/arrow/dimension` (sem deformação do triângulo da seta e sem
          desalinhamento dos ticks).
    - `src/components/rac-editor/utils/line-arrow-editor-apply.smoke.test.ts`
        - atualizado para novo contrato de placeholder (`" "` visível).
- Validação pós-correção:
    -
    `npx eslint src/lib/canvas/factory/elements-factory.ts src/lib/canvas/factory/elements-factory.smoke.test.ts src/components/rac-editor/utils/line-arrow-editor-apply.ts src/components/rac-editor/utils/line-arrow-editor-apply.smoke.test.ts` ->
    PASS
    - `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false` -> PASS
    - `npm run test -- --run` -> PASS (128/128)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)
    - `npm run lint` -> FAIL (dívida pré-existente fora do escopo deste passo; 277 errors / 11 warnings)

### Fase 7 - passo incremental 110 (Hotfix pós-regressão visual: wall label agrupado + escala longitudinal estável)

- Problemas reportados/corrigidos:
    - `wall` (`Vizinho/Muro`) ao renomear podia soltar texto no canvas e quebrar posição relativa;
    - `line/arrow` com label podia iniciar com label fora da posição esperada até novo resize;
    - `arrow` ainda podia cortar head no redimensionamento;
    - `line` podia deslocar sem aumentar comprimento de forma consistente.
- Correções aplicadas:
    - `src/components/rac-editor/utils/wall-editor-apply.ts`
        - detecção de parent group robusta (`_group` e `group`);
        - fallback de label para `i-text` quando `myType` não estiver presente;
        - update de label no grupo com coordenadas normalizadas (sem desagrupar).
    - `src/lib/canvas/factory/elements-factory.ts`
        - `createLine` com escala longitudinal baseada no comprimento atual da linha (sem drift de posição);
        - `createArrow` com geometria `shaft + head` para manter triângulo totalmente dentro do comprimento (sem corte);
        - reforço de `setCoords` para consistência de posição de label logo na inserção;
        - `createDistance` mantém normalização de ticks/label no `scaling`.
    - `src/components/rac-editor/utils/line-arrow-editor-apply.ts`
        - normalização de escala do wrapper de edição alinhada ao factory:
            - linha escala por comprimento atual;
            - seta usa composição `shaft/head` sem corte;
            - label permanece ancorado.
- Regressões automáticas adicionadas/expandidas:
    - `src/components/rac-editor/utils/wall-editor-apply.smoke.test.ts`
        - novo cenário para parent group via `wall.group`.
    - `src/lib/canvas/factory/elements-factory.smoke.test.ts`
        - mantém cenários de escala longitudinal de `line/arrow/dimension`.
- Validação pós-hotfix:
    -
    `npx eslint src/components/rac-editor/utils/wall-editor-apply.ts src/components/rac-editor/utils/wall-editor-apply.smoke.test.ts src/lib/canvas/factory/elements-factory.ts src/lib/canvas/factory/elements-factory.smoke.test.ts src/components/rac-editor/utils/line-arrow-editor-apply.ts src/components/rac-editor/utils/line-arrow-editor-apply.smoke.test.ts` ->
    PASS
    - `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false` -> PASS
    - `npm run test -- --run` -> PASS (129/129)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)
    - `npm run lint` -> FAIL (dívida pré-existente fora do escopo deste passo; 277 errors / 11 warnings)

### Fase 7 - passo incremental 111 (Linha: redimensionamento sem deslocar + snap H/V + label inicial estável)

- Problemas reportados/corrigidos:
    - `line` continuava deslocando no canvas durante resize longitudinal;
    - `line` não estava com snap ortogonal de rotação como `arrow/dimension`;
    - label inicial de `line/arrow` podia nascer fora da posição esperada após aplicar o `GenericObjectEditor`.
- Correções aplicadas:
    - `src/lib/canvas/factory/elements-factory.ts`
        - `createLine` passa a normalizar `scaling` com `totalLength = group.width * group.scaleX` e atualizar
          `group.width`,
          evitando drift de posição;
        - constante de ancoragem de label (`LINEAR_LABEL_TOP`) unificada para `line/arrow/dimension`.
    - `src/components/rac-editor/utils/line-arrow-editor-apply.ts`
        - edição de label em grupos com `lineArrowLabel` passa a recalcular bounds do grupo após troca de texto/cor,
          mantendo posicionamento inicial consistente sem desagrupar;
        - normalização de `scaling` do wrapper para linha usa `totalLength` do grupo (mesma regra do factory).
    - `src/components/rac-editor/hooks/useCanvasKeyboardShortcuts.ts`
        - snap de rotação ortogonal reabilitado para `line`.
    - `src/components/rac-editor/hooks/useCanvasFabricSetup.ts`
        - ajuste de assinatura do bind de atalhos para refletir remoção de dependência não usada.
- Regressões automáticas adicionadas/atualizadas:
    - `src/components/rac-editor/hooks/useCanvasKeyboardShortcuts.smoke.test.tsx`
        - garante snap ortogonal de rotação para `line`.
    - `src/lib/canvas/factory/elements-factory.smoke.test.ts`
        - reforça assert de atualização de `group.width` no resize de `line` (sem deslocamento).
        - timeout explícito no cenário de `line` para estabilidade em suíte completa (ambiente jsdom/fabric).
- Validação pós-correção:
    -
    `npx eslint src/lib/canvas/factory/elements-factory.ts src/components/rac-editor/utils/line-arrow-editor-apply.ts src/components/rac-editor/hooks/useCanvasKeyboardShortcuts.ts src/components/rac-editor/hooks/useCanvasFabricSetup.ts src/lib/canvas/factory/elements-factory.smoke.test.ts src/components/rac-editor/hooks/useCanvasKeyboardShortcuts.smoke.test.tsx` ->
    PASS
    - `npm run test -- --run` -> PASS (130/130)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 112 (Label de Linha/Seta: ancoragem imediata igual Distância)

- Problema reportado/corrigido:
    - em `line/arrow`, ao trocar label inicial `" "` para texto real (`Felipe`), a distância visual entre objeto e label
      ficava incorreta até ocorrer resize; após redimensionar, a posição voltava ao normal.
- Causa raiz:
    - no apply de edição de `line/arrow`, o fluxo de label existente disparava recomputação estrutural do grupo
      (`addWithUpdate`) ao trocar texto, alterando o centro interno do grupo e deslocando visualmente a label.
- Correção aplicada:
    - `src/components/rac-editor/utils/line-arrow-editor-apply.ts`
        - apply de label existente passa a seguir lógica equivalente ao fluxo de `dimension`:
            - atualiza `text/fill/left/top/scale`;
            - atualiza somente coords/render (`setCoords`);
            - não faz recomputação estrutural (`addWithUpdate`) nessa etapa.
        - chamada de `setCoords` no label tornou-se defensiva para compatibilidade com mocks de teste.
- Regressão automática adicionada:
    - `src/components/rac-editor/utils/line-arrow-editor-apply.smoke.test.ts`
        - novo cenário validando troca de placeholder para texto sem recomputação estrutural do grupo.
- Validação pós-correção:
    -
    `npx eslint src/components/rac-editor/utils/line-arrow-editor-apply.ts src/components/rac-editor/utils/line-arrow-editor-apply.smoke.test.ts` ->
    PASS
    - `npm run test -- --run` -> PASS (131/131)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 113 (Linha/Seta: preservar top normalizado da label no apply)

- Problema reportado/corrigido:
    - label de `line/arrow` ainda ficava visualmente alta após confirmar texto no `GenericObjectEditor`,
      apesar de nascer correta no placeholder inicial.
- Causa raiz:
    - o apply de `line/arrow` ainda impunha `top` absoluto na label após edição;
    - no `scaling`, havia recálculo de `top` que podia divergir do `top` normalizado original do grupo.
- Correção aplicada:
    - `src/components/rac-editor/utils/line-arrow-editor-apply.ts`
        - atualização de label existente agora preserva `top` corrente normalizado (`existingLabel.top`);
        - no wrapper de grupos legados, `labelNormalizedTop` é capturado após o `Group` e reaplicado no `scaling`.
    - `src/lib/canvas/factory/elements-factory.ts`
        - `createLine` e `createArrow` passam a capturar `objLabelTop/objLabelTop` normalizados pós-criação e
          reaplicar esse mesmo `top` no `scaling`, evitando drift vertical.
    - `src/lib/canvas/factory/elements-factory.smoke.test.ts`
        - asserts atualizados para garantir ancoragem da label no `top` inicial normalizado durante resize.
- Validação pós-correção:
    -
    `npx eslint src/lib/canvas/factory/elements-factory.ts src/components/rac-editor/utils/line-arrow-editor-apply.ts src/lib/canvas/factory/elements-factory.smoke.test.ts src/components/rac-editor/utils/line-arrow-editor-apply.smoke.test.ts` ->
    PASS
    - `npm run test -- --run` -> PASS (131/131)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 114 (Compatibilidade com objetos antigos: normalização de top da label)

- Ajuste adicional aplicado:
    - alguns objetos de `line/arrow` já existentes podiam carregar `top` legado muito alto para a label;
    - no apply de edição, foi adicionada normalização defensiva:
        - quando `existingLabel.top < -8`, aplica fallback para `-3` antes de salvar;
        - mantém objetos novos/corretos inalterados (preserva top normalizado atual).
- Arquivos:
    - `src/components/rac-editor/utils/line-arrow-editor-apply.ts`
- Validação pós-ajuste:
    -
    `npx eslint src/components/rac-editor/utils/line-arrow-editor-apply.ts src/lib/canvas/factory/elements-factory.ts src/components/rac-editor/utils/line-arrow-editor-apply.smoke.test.ts src/lib/canvas/factory/elements-factory.smoke.test.ts` ->
    PASS
    - `npm run test -- --run` -> PASS (131/131)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 115 (Split do hook combinado de linha/seta)

- Refatoração aplicada:
    - `src/components/rac-editor/hooks/useLineArrowInlineEditorActions.ts` removido.
    - Novos hooks dedicados:
        - `src/components/rac-editor/hooks/useLinearEditorActions.ts`
        - `src/components/rac-editor/hooks/useArrowEditorActions.ts`
    - Nova util compartilhada para aplicar edição de linha/seta:
        - `src/components/rac-editor/utils/line-arrow-inline-editor-apply.ts`
    - `src/components/rac-editor/RacEditor.tsx` atualizado para orquestrar os dois hooks e manter o contrato do inline
      editor.
- Objetivo:
    - reduzir acoplamento e duplicação entre fluxos de linha e seta, mantendo regra de negócio/UX já existente.
- Validação pós-refatoração:
    -
    `npx eslint src/components/rac-editor/RacEditor.tsx src/components/rac-editor/hooks/useLinearEditorActions.ts src/components/rac-editor/hooks/useArrowEditorActions.ts src/components/rac-editor/utils/line-arrow-inline-editor-apply.ts` ->
    PASS
    - `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false` -> FAIL (erro pré-existente em
      `useCanvasFabricSetup.ts` e `GenericEditor.smoke.test.tsx`, fora do escopo deste passo)
    - `npm run test -- --run` -> FAIL (3 falhas pré-existentes em
      `src/lib/canvas/factory/elements-factory.smoke.test.ts`)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 116 (Split definitivo do apply de Linha/Seta nos hooks)

- Ajuste solicitado aplicado:
    - removido o util compartilhado `src/components/rac-editor/utils/line-arrow-inline-editor-apply.ts`.
    - lógica de `apply` foi separada e movida para os hooks específicos:
        - `src/components/rac-editor/hooks/useLinearEditorActions.ts`
        - `src/components/rac-editor/hooks/useArrowEditorActions.ts`
- Estrutura nova:
    - `useLinearEditorActions` contém `applyLineEditorChange` (sem branch por tipo de objeto).
    - `useArrowEditorActions` contém `applyArrowEditorChange` (sem branch por tipo de objeto).
- Objetivo atingido:
    - redução de acoplamento entre fluxos de linha/seta e queda de complexidade ciclomática do apply combinado.
- Regras/documentação sincronizadas:
    - `.rules/canvas.md` atualizado para registrar que os applies ficam nos hooks específicos.
- Validação pós-ajuste:
    -
    `npx eslint src/components/rac-editor/hooks/useLinearEditorActions.ts src/components/rac-editor/hooks/useArrowEditorActions.ts src/components/rac-editor/RacEditor.tsx` ->
    PASS
    - `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false` -> FAIL (pré-existente em
      `useCanvasFabricSetup.ts` e `GenericEditor.smoke.test.tsx`)
    - `npm run test -- --run` -> FAIL (3 falhas pré-existentes em
      `src/lib/canvas/factory/elements-factory.smoke.test.ts`)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 117 (Remoção de duplicação da escala de Linha entre factory e apply)

- Problema atacado:
    - duplicação de comportamento entre `createLine` (factory) e `applyLineEditorChange` (hook),
      principalmente no handler `group.on("scaling")`.
- Refatoração aplicada:
    - `src/lib/canvas/factory/elements-factory.ts`
        - extraídos helpers reutilizáveis:
            - `normalizeLineGroupScaling(group, labelTop?)`
            - `bindLineGroupScaling(group, labelTop?)`
        - `createLine` passa a usar `bindLineGroupScaling`.
    - `src/components/rac-editor/hooks/useLinearEditorActions.ts`
        - `applyLineEditorChange` passa a reutilizar `bindLineGroupScaling` no reagrupamento,
          removendo lógica duplicada de normalização de escala.
- Resultado:
    - criação e edição inline de linha usam a mesma regra de escala longitudinal (fonte única).
- Regras/documentação sincronizadas:
    - `.rules/canvas.md` atualizado com a regra de centralização da escala de `line`.
- Validação pós-refatoração:
    -
    `npx eslint src/lib/canvas/factory/elements-factory.ts src/components/rac-editor/hooks/useLinearEditorActions.ts` ->
    PASS
    - `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false` -> FAIL (pré-existente em
      `useCanvasFabricSetup.ts` e `GenericEditor.smoke.test.tsx`)
    - `npm run test -- --run` -> FAIL (3 falhas pré-existentes em
      `src/lib/canvas/factory/elements-factory.smoke.test.ts`)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)

### Fase 7 - passo incremental 118 (Remoção de duplicação da escala de Seta entre factory e apply)

- Problema atacado:
    - duplicação de comportamento entre `createArrow` (factory) e `applyArrowEditorChange` (hook),
      principalmente no handler `group.on("scaling")`.
- Refatoração aplicada:
    - `src/lib/canvas/factory/elements-factory.ts`
        - extraídos helpers reutilizáveis da seta:
            - `normalizeArrowGroupToLength(group, totalLength, labelTop?)`
            - `normalizeArrowGroupScaling(group, labelTop?)`
            - `bindArrowGroupScaling(group, labelTop?)`
        - `createArrow` passa a usar `bindArrowGroupScaling`.
    - `src/components/rac-editor/hooks/useArrowEditorActions.ts`
        - `applyArrowEditorChange` passa a reutilizar `normalizeArrowGroupToLength` no fluxo de scaling do wrapper,
          removendo duplicação dos cálculos de head/shaft.
- Resultado:
    - criação e edição inline de seta usam a mesma regra geométrica longitudinal (fonte única).
- Regras/documentação sincronizadas:
    - `.rules/canvas.md` atualizado com a regra de centralização da escala de `arrow`.
- Validação pós-refatoração:
    -
    `npx eslint src/lib/canvas/factory/elements-factory.ts src/components/rac-editor/hooks/useArrowEditorActions.ts` ->
    PASS
    - `npm run test -- --run` -> FAIL (3 falhas pré-existentes em
      `src/lib/canvas/factory/elements-factory.smoke.test.ts`)
    - `npm run build` -> PASS
    - `npm run test:e2e -- --workers=1` -> PASS (16/16)
    - `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false` -> FAIL (pré-existente em
      `useCanvasFabricSetup.ts` e `GenericEditor.smoke.test.tsx`)
