# Work Item - ajustes mobile da toolbar e canvas

Status: concluído
Data: 2026-04-28
Escopo: UI mobile/desktop do editor RAC

## Contexto

Solicitação do usuário via League of Agents para ajustar:

- menu do usuário mobile com ações 3D/PDF
- menu de zoom mobile/desktop e panning
- checkbox de minimapa nas configurações
- side rail mobile retrátil por gesto
- proporção visual dos submenus
- seleção, panning e pinch zoom mobile
- texto da opção de escada na planta
- edição do nome da família

## Decisões

- Usar subagentes apenas para exploração e qualidade, sem escrita concorrente.
- Manter implementação centralizada nos componentes de toolbar/canvas/settings.
- Escrever regressões automatizadas viáveis antes das alterações de produção.
- Implementar o menu lateral mobile como drawer por arraste e handle fino clicável, preservando acesso por toque.

## Evidências Consultadas

- `README.md`
- `CONTRIBUTING.md`
- `OBSIDIAN.md`
- `docs/business-rules/BUS-001-canvas.md`
- `docs/business-rules/BUS-002-toolbar.md`
- `docs/business-rules/BUS-007-viewer-3d.md`
- `docs/engineering-playbook/PLAY-101-frontend-component-patterns.md`
- `docs/engineering-playbook/PLAY-102-frontend-state-and-hooks.md`
- `docs/engineering-playbook/PLAY-104-frontend-testing.md`
- `docs/engineering-playbook/PLAY-105-frontend-security-and-a11y.md`
- `.agents/changelogs/2026-04/20260427.changelog.md`

## Progresso

- Contexto obrigatório lido.
- Subagentes `code-explorer` e `quality-analyst` disparados em modo read-only.
- Alterações de toolbar, canvas, hotkeys, settings, house manager, testes E2E e documentação aplicadas.
- Validações unitárias, E2E, build, lint e documentação executadas.

## Skips e Desvios

- Nenhum.

## Validação Executada

- `rtk npm run test`
- `rtk npm run build`
- `rtk npm run test:e2e`
- `rtk npm run lint`
- `rtk git diff --check`
- `rtk python C:/Users/felipe.desiderati_sa/.codex/skills/documentation/scripts/validate_readme_evidence.py --repo-root . docs/business-rules/BUS-001-canvas.md`
- `rtk python C:/Users/felipe.desiderati_sa/.codex/skills/documentation/scripts/validate_readme_evidence.py --repo-root . docs/business-rules/BUS-002-toolbar.md`
- `rtk python C:/Users/felipe.desiderati_sa/.codex/skills/documentation/scripts/validate_durable_links.py --repo-root . docs/business-rules/BUS-001-canvas.md docs/business-rules/BUS-002-toolbar.md`

## Handoff

- Sem pendências funcionais conhecidas nesta frente.
- `rtk npm run lint` passou com aviso já existente em `src/components/rac-editor/ui/3d/House3DScene.tsx`.
- O worktree continha alterações pré-existentes não relacionadas, preservadas sem reversão.

## Fechamento

- elegível para colapso após promoção? sim
- referência do changelog / artefato durável: `.agents/changelogs/2026-04/20260428.changelog.md`
- reter localmente? não
- motivo da retenção local: não aplicável
