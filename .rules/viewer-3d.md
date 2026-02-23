# Regras dos Componentes 3D (Viewer e Scene)

Este documento descreve regras do visualizador 3D (`House3DViewer`) e da cena 3D (`House3DScene`).

## 1. Responsabilidade

1. `House3DViewer`
    - container de UI do modal 3D
    - sincroniza estado com `houseManager`
    - permite inserir snapshot 3D no canvas 2D
2. `House3DScene`
    - composição geométrica do modelo 3D
    - terreno/pilotis/casca/aberturas/contraventamentos

## 2. Sincronização de dados

Quando o viewer está aberto:

1. re-sincroniza em mudanças do `houseVersion`
2. carrega `houseType`, `pilotis`, `elements`
    - presets de `elements` por tipo de casa agora vêm de caso de uso dedicado (`house-elements-use-cases`)
    - ciclo de vida de `elements` (add/remove/update/reset defaults) foi extraído para `house-elements-application`
3. deriva orientações:
    - `tipo6FrontSide` por `sideAssignments` de `front`
    - `tipo3OpenSide` com espelhamento semântico de `side2`
4. parseia contraventamentos da planta com `parseContraventamentosFromTopGroup`

## 3. Regras de render

## 3.1 House3DScene

1. retorna `null` sem `houseType`
2. ordem de render:
    - terreno
    - pilotis
    - contraventamentos
    - casca da casa
    - aberturas (portas/janelas)
3. aberturas são mapeadas por `buildOpeningsFromCanvasModel`

## 3.2 Terreno e níveis

1. terreno usa interpolação bilinear dos níveis de canto
2. piloti ajusta altura visual conforme terreno/nível
3. mestre preserva destaque de cor no 3D

## 3.3 Contraventamentos 3D

1. fonte de verdade vem da planta (`top`)
2. parser normaliza metadados e descarta entradas inválidas
3. mesh 3D depende de coluna/linhas/lado e piloti ancora

## 4. Ações do viewer

1. reset de camera (`resetKey`)
2. toggle fullscreen
3. seleção de cor de parede
4. inserção de snapshot:
    - captura `toDataURL` do canvas WebGL
    - chama `houseManager.insert3DSnapshotOnCanvas(dataUrl)`
    - cálculo de escala/posicionamento centralizado em `house-snapshot-use-cases`
    - exibe `toast` de sucesso/erro

## 5. Checklist de cobertura E2E (arquivo)

Cobertura atual:

1. [x] abrir modal 3D
2. [x] alterar cor de parede
3. [x] reset de camera
4. [x] fullscreen
5. [x] inserir snapshot 3D no canvas

Arquivo E2E principal: `e2e/viewer-3d.spec.ts`

Cobertura automática existente (não-E2E):

1. [x] parser de contraventamento (`src/lib/3d/contraventamento-parser.smoke.test.ts`)
2. [x] mapeamento de aberturas (`src/lib/3d/openings-mapper.smoke.test.ts`)
3. [x] inserção de snapshot 3D no `houseManager` (`src/lib/house-manager.smoke.test.ts`)

## 6. Referências de código

- `src/components/rac-editor/House3DViewer.tsx`
- `src/components/rac-editor/House3DScene.tsx`
- `src/lib/3d/contraventamento-parser.ts`
- `src/lib/3d/openings-mapper.ts`
- `src/lib/3d/geometry-constants.ts`
- `src/lib/domain/house-elements-use-cases.ts`
- `src/lib/domain/house-elements-application.ts`
- `src/lib/domain/house-elements-repository.ts`
- `src/lib/domain/house-snapshot-use-cases.ts`
