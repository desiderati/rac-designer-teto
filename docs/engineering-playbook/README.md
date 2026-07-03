---
title: Engineering Playbook
doc_type: index
doc_set: engineering-playbook
status: active
lang: pt-BR
---

# Engineering Playbook

Este diretório reúne a constituição técnica do `RAC Designer TETO`.

Os arquivos daqui são duráveis e versionados. Eles definem princípios, arquitetura, stack,
convenções e critérios de decisão que orientam tanto humanos quanto agentes de codificação.

## Como usar

1. Use este `README.md` como índice canônico do playbook.
2. Comece a leitura por `PLAY-001-persona.md`.
3. Respeite a ordem numérica dos arquivos `PLAY-*`; ela expressa precedência.
4. Trate este diretório como a fonte canônica para decisões de engenharia locais do repositório.
5. Use `.agents/prompts/` apenas quando a frente exigir um prompt operacional especializado.

## Perfis detectados

- `frontend-react-vite`
    - Evidenciado por `vite.config.ts`, dependências React, scripts Vite e entrypoint `src/main.tsx`.

- `frontend-react-router-spa`
    - Evidenciado por `react-router-dom`, `BrowserRouter`, `Routes` e rotas em `src/App.tsx`.

- `architecture-ports-adapters`
    - Evidenciado por ports do editor, adapters Fabric no slice `@canvas`, composição em `src/bootstrap/` e guards em
      `src/test/rac-editor-boundary.smoke.test.ts`.

- `build-npm`
    - Evidenciado por `package-lock.json`, scripts npm em `package.json` e comandos oficiais no `README.md`.

- `backend`
    - Não detectado neste repositório.

- `api`
    - Não detectada como superfície externa versionada.

## Taxonomia atual

- `PLAY-001` a `PLAY-006`
    - Núcleo comum do playbook: persona, princípios, stack, estrutura e convenções gerais.

- `PLAY-101` a `PLAY-199`
    - Módulos específicos da família frontend.

- `PLAY-201` em diante
    - Reservado para famílias backend, arquitetura separada e API futura, ainda não materializadas neste repositório.

## Índice

- `PLAY-001-persona.md`
    - Porta de entrada do playbook e ordem de precedência dos demais guias.

- `PLAY-002-core-principles.md`
    - Princípios fundamentais e fluxo obrigatório de decisão antes de implementar.

- `PLAY-003-tech-stack.md`
    - Stack detectada e restrições de introdução de novas dependências.

- `PLAY-004-project-structure.md`
    - Estrutura atual, restrições vigentes e direção de evolução.

- `PLAY-005-naming-conventions.md`
    - Convenções de nomenclatura para arquivos, funções e tipos.

- `PLAY-006-ports-and-adapters.md`
    - Disciplina de Ports and Adapters no editor RAC, com fronteiras, riscos, critérios de corte e plano de
      continuidade.

- `PLAY-101-frontend-component-patterns.md`
    - Padrões de composição e responsabilidades dos componentes.

- `PLAY-102-frontend-state-and-hooks.md`
    - Regras para hooks, coordenação de estado e guardrails de evolução do editor.

- `PLAY-103-frontend-data-fetching.md`
    - Regras para integração remota e separação entre estado local e remoto.

- `PLAY-104-frontend-testing.md`
    - Estratégia de testes unitários, integração, smoke e E2E.

- `PLAY-105-frontend-security-and-a11y.md`
    - Segurança, acessibilidade e requisitos mínimos de interação.
