# Engineering Playbook

Este diretório reúne a constituição técnica do `RAC Designer TETO`.

Os arquivos daqui são duráveis e versionados. Eles definem princípios, arquitetura, stack, convenções e critérios de
decisão que orientam tanto humanos quanto agentes de codificação.

## Como usar

1. Use este `README.md` como índice canônico do playbook.
2. Comece a leitura por `PLAY-001-persona.md`.
3. Respeite a ordem numérica dos arquivos `PLAY-*`; ela expressa precedência.
4. Trate este diretório como a fonte canônica para decisões de engenharia locais do repositório.
5. Use `.agents/prompts/` apenas quando a frente exigir um prompt operacional especializado.

## Índice

- `PLAY-001-persona.md`
  - Entry point do playbook e encadeamento dos demais guias.
- `PLAY-002-core-principles.md`
  - Princípios fundamentais e fluxo obrigatório de decisão antes de implementar.
- `PLAY-003-tech-stack.md`
  - Stack detectada e restrições de introdução de novas dependências.
- `PLAY-004-project-structure.md`
  - Estrutura atual, arquitetura-alvo e direção de dependências.
- `PLAY-005-naming-conventions.md`
  - Convenções de nomenclatura para arquivos, funções e tipos.
- `PLAY-006-component-patterns.md`
  - Padrões de composição e responsabilidades dos componentes.
- `PLAY-007-hooks-and-state.md`
  - Regras para hooks, estado local e direção arquitetural do editor.
- `PLAY-008-data-fetching.md`
  - Regras para integração remota e separação entre estado local e remoto.
- `PLAY-009-testing.md`
  - Estratégia de testes unitários, integração, smoke e E2E.
- `PLAY-010-security-and-a11y.md`
  - Segurança, acessibilidade e requisitos mínimos de interação.
