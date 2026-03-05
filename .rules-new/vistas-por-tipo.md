# Regras de Vistas por Tipo de Casa

## Objetivo

Definir quais vistas podem existir por tipo de casa, em quais lados, e como o sistema decide inserção/bloqueio.

## Tipos e limites

1. Tipo 6 (`tipo6`)

   - `top`: 1
   - `front`: 1
   - `back`: 1
   - `side1` (quadrado fechado): 2
   - `side2` (quadrado aberto): 0

2. Tipo 3 (`tipo3`)

   - `top`: 1
   - `front`: 0
   - `back` (lateral): 2
   - `side1` (quadrado fechado): 1
   - `side2` (quadrado aberto): 1

## Regras de decisão para adicionar vista

1. Bloqueio por limite

   - Se já atingiu limite daquele tipo de vista, operação é bloqueada.

2. Inserção direta

   - Quando não exige escolha de lado/instância, a vista entra diretamente.

3. Seleção de instância pré-atribuída

   - Quando há pré-atribuição de lados, o sistema pode abrir seletor de slot.
   - Se só restar um slot livre, adiciona direto naquele lado.

4. Seleção de lado

   - Se houver mais de um lado possível e sem pré-atribuição aplicável, abre seletor de lado.

5. Sem lado disponível

   - Se não há lado livre para aquela vista, operação é bloqueada.

## Fluxo inicial de criação após escolher tipo

- Tipo 6 inicia com posicionamento da vista frontal (`front`) em `top`/`bottom`.
- Tipo 3 inicia com posicionamento do quadrado aberto (`side2`) em `left`/`right`.
- Na primeira definição (modo `position` sem pré-atribuição), o sistema:
    - autoatribui slots de lados;
    - abre definição de níveis (`NivelDefinitionEditor`);
    - após aplicar níveis, cria planta (`top`) e vista inicial, reposicionando empilhadas (planta acima, elevação
      abaixo).

## Regras de cancelamento

- Cancelar seletor inicial pode resetar tipo de casa quando ainda não havia slots pré-atribuídos.
- Cancelar modal de níveis na etapa inicial reseta tipo/casa para evitar estado parcial.

## Evidências no código

- Tipos e limites:
    - `src/shared/types/house.ts`

- Decisões de layout e lados:
    - `src/domain/house/use-cases/house-views-layout.use-case.ts`
    - `src/domain/house/use-cases/house-views.use-case.ts`

- Agregado:
    - `src/domain/house/house-aggregate.ts`

- Orquestração de inserção:
    - `src/components/rac-editor/hooks/canvas/useCanvasHouseViewActions.ts`
    - `src/components/rac-editor/hooks/useHouseTypeFlow.ts`
    - `src/components/rac-editor/lib/house-side.ts`

- Registro e sincronização de vistas:
    - `src/components/rac-editor/lib/house-manager.ts`
    - `src/components/rac-editor/lib/house-view.ts`

## Evidências em testes

- E2E:
    - `e2e/house-views-limits.spec.ts`
- Smoke domínio:
    - `src/domain/house/use-cases/house-views-layout.use-case.smoke.test.ts`
    - `src/domain/house/use-cases/house-views.use-case.smoke.test.ts`
    - `src/domain/house/use-cases/house-views-rebuild.use-case.smoke.test.ts`
