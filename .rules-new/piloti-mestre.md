# Regras de Piloti Mestre

## Objetivo

Definir o piloti de referência (mestre) e garantir que essa escolha seja única e refletida em 2D/3D.

## Regras de negócio

1. Mestre único

    - Só pode existir um piloti mestre ativo.
    - Ao marcar um novo mestre, o sistema desmarca mestres anteriores automaticamente.

2. Persistência e sincronização

    - Estado de mestre é persistido no `houseManager`/`house-aggregate`.
    - Atualização é propagada para todas as vistas de casa no canvas.

3. Regras de cantos

    - Fluxos de nível mestre são direcionados aos cantos estruturais (`A1`, `A4`, `C1`, `C4`).
    - UI de definição inicial de níveis usa exatamente os cantos como sequência de decisão.

4. Feedback visual

    - Piloti mestre recebe estilo visual dedicado (fill/stroke de mestre).
    - Visual deve ser consistente entre planta, elevações e cena 3D.

## Interações importantes

- Alterar mestre em editor de piloti deve atualizar imediatamente o estilo e nível associados.
- No fluxo de definição inicial, marcar mestre em um canto pode elevar níveis mínimos dos demais cantos conforme regra
  do editor.

## Evidências no código

- Editor e fluxo:
    - `src/components/rac-editor/ui/modals/editors/NivelDefinitionEditor.tsx`
    - `src/components/rac-editor/ui/modals/editors/piloti/PilotiEditor.tsx`
    - `src/components/rac-editor/hooks/usePilotiEditor.ts`

- Estado e regra de unicidade:
    - `src/components/rac-editor/lib/house-manager.ts`
    - `src/domain/house/house-aggregate.ts`

- Renderização:
    - `src/components/rac-editor/lib/canvas/piloti.ts`
    - `src/components/rac-editor/lib/canvas/piloti-visual.ts`
    - `src/components/rac-editor/ui/House3DScene.tsx`

## Evidências em testes

- `e2e/piloti.spec.ts` (mestre único)
- `src/components/rac-editor/lib/canvas/piloti-visual.smoke.test.ts`
