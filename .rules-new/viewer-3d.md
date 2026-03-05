# Regras do Viewer 3D

## Objetivo

Assegurar que a visualização 3D seja um espelho fiel do estado 2D e permita inserir snapshot no canvas sem quebrar o
projeto.

## Regras de sincronização com o estado da casa

1. Fonte única

   - Viewer lê `houseManager.getHouse()` e reage à versão global (`useHouseStoreVersion`).

2. Mapeamento por tipo

   - Tipo 6: resolve qual lado (`top`/`bottom`) corresponde à frente no 3D.
   - Tipo 3: aplica mapeamento lateral com espelhamento semântico para manter coerência visual no eixo da cena.

3. Contraventamentos

   - Contraventamentos são parseados a partir da planta e renderizados no 3D.

## Regras de operação do modal 3D

1. Estado sem casa

   - Se não houver casa, modal mostra estado vazio orientando criação de planta.

2. Captura e inserção

   - Botão de câmera captura `canvas` WebGL em PNG.
   - Snapshot é inserido no canvas 2D via `houseManager.insert3DSnapshotOnCanvas`.
   - Falhas de captura/inserção geram mensagens de erro específicas.

3. Controles de cena

   - Orbit/pan/zoom ativos com limites de distância.
   - Reset de câmera por `resetKey` força remontagem da cena.

4. Cor de parede

   - Paleta de cor altera material de parede em tempo real sem mutar regras de domínio.

## Regras de consistência visual

- Piloti mestre/nível e contraventamentos devem corresponder ao estado 2D atual.
- Aberturas devem respeitar mapeamento de vistas/lados.

## Evidências no código

- UI:
    - `src/components/rac-editor/ui/House3DViewer.tsx`
    - `src/components/rac-editor/ui/House3DScene.tsx`

- Motor 3D:
    - `src/components/rac-editor/lib/3d/constants.ts`
    - `src/components/rac-editor/lib/3d/scene-openings-builder.ts`
    - `src/components/rac-editor/lib/3d/contraventamento-parser.ts`

- Integração/snapshot:
    - `src/components/rac-editor/lib/house-manager.ts`
    - `src/components/rac-editor/lib/house-snapshot.ts`

## Evidências em testes

- E2E:
    - `e2e/viewer-3d.spec.ts`

- Smoke:
    - `src/components/rac-editor/lib/3d/scene-openings-builder.smoke.test.ts`
    - `src/components/rac-editor/lib/3d/contraventamento-parser.smoke.test.ts`
    - `src/components/rac-editor/lib/house-manager.smoke.test.ts`
