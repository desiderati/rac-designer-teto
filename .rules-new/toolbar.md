# Regras da Toolbar

## Objetivo

Definir o comportamento dos comandos da interface principal e os bloqueios aplicados por estado do projeto.

## Regras gerais

1. A toolbar dispara comandos; validação de regra fica nos hooks e no domínio.
2. Ações indisponíveis devem retornar feedback (toast/mensagem), não falhar silenciosamente.
3. Menus e submenus devem ser mutuamente consistentes: abrir um fecha contextos conflitantes.
4. Comandos de risco (reinício, desagrupar etc.) devem passar por confirmação quando aplicável.

## Menus e comandos

1. Menu Casa

    - Abre seleção de tipo de casa.
    - Permite inserir vistas conforme limites por tipo.
    - Bloqueia inserção quando limite foi atingido.

2. Menu Elementos

    - Insere muro, árvore, água, fossa.
    - Porta e escada manuais permanecem marcadas como fora de serviço quando desativadas na configuração da toolbar.

3. Menu Linhas

    - Insere linha, seta e distância.

4. Overflow

    - Importar/exportar JSON.
    - Salvar PDF.
    - Abrir visualizador 3D.
    - Reiniciar tutorial/canvas.
    - Dicas e configurações.

## Regras de integração com estado

- `actions` da toolbar são composição única de handlers de hooks.
- Estado de contagem de vistas (frontal, traseira, laterais) alimenta desabilitação visual e mensagens.
- Ao abrir settings, submenu ativo é limpo para evitar sobreposição.

## Evidências no código

- UI:
    - `src/components/rac-editor/ui/toolbar/Toolbar.tsx`
    - `src/components/rac-editor/ui/toolbar/ToolbarMainMenu.tsx`
    - `src/components/rac-editor/ui/toolbar/ToolbarOverflowMenu.tsx`
    - `src/components/rac-editor/ui/toolbar/helpers/toolbar-config.ts`
    - `src/components/rac-editor/ui/toolbar/helpers/toolbar-types.ts`

- Orquestração:
    - `src/components/rac-editor/ui/RacEditor.tsx`

- Hooks:
    - `src/components/rac-editor/hooks/toolbar/useToolbarActions.ts`
    - `src/components/rac-editor/hooks/toolbar/useToolbarHouseViewCounts.ts`
    - `src/components/rac-editor/hooks/canvas/useCanvasTools.ts`
    - `src/components/rac-editor/hooks/canvas/useCanvasHouseViewActions.ts`
    - `src/components/rac-editor/hooks/useRacEditorJsonActions.ts`
    - `src/components/rac-editor/hooks/useRacEditorPdfExportAction.ts`

## Evidências em testes

- `e2e/toolbar-overflow.spec.ts`
- `e2e/house-views-limits.spec.ts`
