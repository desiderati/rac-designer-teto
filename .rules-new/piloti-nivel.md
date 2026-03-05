# Regras de Nível de Piloti

## Objetivo

Garantir coerência estrutural entre nível (`nivel`) e altura (`height`) dos pilotis.

## Regra estrutural principal

- Relação de referência: `altura >= nivel * 3`.
- Quando essa relação não é atendida, o piloti está fora de proporção.

## Limites de nível

1. Limite mínimo

    - Valor base: nível padrão do projeto (`PILOTI_DEFAULT_NIVEL`).

2. Limite máximo por altura

    - `maxNivel = pilotiHeight / 2`.
    - Toda edição de nível no editor é clampada por esse limite.

3. Arredondamento

    - Valores de nível e clamping são arredondados para 2 casas decimais.

## Altura recomendada

- Dado um nível, a altura recomendada é o menor valor da tabela padrão (`1.0, 1.2, 1.5, 2.0, 2.5, 3.0`) que satisfaça
  `altura >= nivel * 3`.
- Se exceder a maior opção, usa `3.0`.

## Fluxo de aplicação no editor

1. Alterações temporárias

    - Editor mantém estado temporário (`tempHeight`, `tempNivel`, `tempIsMaster`).

2. Aplicação

    - Ao confirmar, o sistema clampa nível por altura e persiste no `houseManager`.

3. Auto navegação (opcional)

    - Se habilitada em settings, após selecionar altura o foco avança para o próximo piloti.

## Níveis iniciais no onboarding da casa

- No fluxo inicial (após escolher tipo/lado), o sistema recebe níveis dos cantos (`A1`, `A4`, `C1`, `C4`),
  interpola bilinearmente os 12 pilotis e calcula altura recomendada para todos.

## Evidências no código

- Regras matemáticas:
    - `src/shared/types/piloti.ts`

- Editor de piloti:
    - `src/components/rac-editor/hooks/usePilotiEditor.ts`
    - `src/components/rac-editor/ui/modals/editors/piloti/PilotiEditor.tsx`
    - `src/components/rac-editor/ui/modals/editors/NivelDefinitionEditor.tsx`

- Persistência e aplicação:
    - `src/components/rac-editor/lib/house-manager.ts`
    - `src/domain/house/house-aggregate.ts`

- Renderização e feedback:
    - `src/components/rac-editor/lib/canvas/piloti.ts`
    - `src/components/rac-editor/lib/canvas/piloti-visual-feedback.ts`

## Evidências em testes

- `src/components/rac-editor/lib/canvas/piloti.smoke.test.ts`
- `src/components/rac-editor/lib/house-manager.smoke.test.ts`
