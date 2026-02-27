# Regras por Tipo de Componente

Este diretório consolida regras funcionais do RAC Designer TETO, separadas por tipo de componente.

## UI / Editor

- `canvas.md`
    - Regras operacionais do canvas 2D (viewport, atalhos, minimap e seleção).

- `toolbar.md`
    - Contrato de comandos e estrutura de menus da toolbar.

- `piloti-mestre.md`
    - Regras de mestre no `NivelDefinitionEditor` e `PilotiEditor`.

- `piloti-nivel.md`
    - Regras de nível, limites e sincronização visual.

- `contraventamento.md`
    - Regras de fluxo e geometria do contraventamento.

- `vistas-por-tipo.md`
    - Regras de inserção/remoção de vistas por tipo de casa.

- `viewer-3d.md`
    - Regras do visualizador/cena 3D e snapshot para canvas 2D.

## Estado / Domínio

- `canvas.md`
    - Contratos de eventos, seleção e comandos expostos por `CanvasHandle`.

- `toolbar.md`
    - Comandos enviados via `ToolbarActionMap` e acoplamentos de menu.

- `vistas-por-tipo.md`
    - Limites e mapeamentos em `house-manager`.

- `piloti-mestre.md`
    - Exclusividade global de mestre em `house-manager`.

- `piloti-nivel.md`
    - Interpolação de níveis e alturas recomendadas em `house-manager`.

- `viewer-3d.md`
    - Mapeamento 2D->3D (aberturas/contraventamentos/lados).

## Infra de Teste (E2E)

- `canvas.md`
    - Checklist de cobertura E2E do canvas (com gaps atuais).

- `toolbar.md`
    - Checklist de cobertura E2E da toolbar (vistas cobertas; overflow pendente).

- `viewer-3d.md`
    - Checklist de cobertura E2E do viewer 3D (pendente).

- `vistas-por-tipo.md`
    - Cenários automatizados de limite/inserção/remoção/reinserção.

## Convenções de Nomenclatura

Para manter consistência e reduzir churn em imports durante a refatoração:

1. Componentes React (`.tsx`) usam `PascalCase`.
   Ex.: `RacEditor.tsx`, `DistanceEditor.tsx`, `House3DViewer.tsx`.

2. Hooks usam `camelCase` com prefixo `use`.
   Ex.: `useRacEditorDebugBridge.ts`, `usePilotiEditorLogic.ts`.

3. Domínio/infra/utils (`.ts`) usam `kebab-case`.
   Ex.: `house-manager.ts`, `house-views-layout.use-case.ts`, `canvas-screen-position.ts`.

4. Hooks compartilhados ficam em `src/shared/hooks`; hooks específicos de feature ficam co-localizados
   (ex.: `src/components/rac-editor/hooks`).

Observação: evitar renomeação em massa apenas por estilo; priorizar mudanças funcionais com validação automática.


