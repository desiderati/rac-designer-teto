# OBSIDIAN.md

Este arquivo é o ponto de entrada versionado da base de conhecimento do repositório.

## Como usar

- Leia este arquivo antes de análise, implementação, revisão documental ou consolidação de conhecimento quando o
  repositório usar `OBSIDIAN.md`.
- Use `docs/` como diretório padrão da base de conhecimento versionada quando o repositório mantiver uma base de
  conhecimento versionada.
- Use `.obsidian/` apenas para metadados locais do aplicativo, nunca como base de conhecimento do repositório.
- Atualize este arquivo com links curados, não com listas exaustivas nem despejos de documentação.

## Base de conhecimento canônica

A base de conhecimento versionada padrão do repositório, quando existir, fica em:

- `docs/`

Substitua essa referência apenas quando o repositório já tiver uma localização canônica mais forte e claramente
estabelecida.

## Navegação inicial

- `docs/`, quando esse diretório existir
- `docs/architecture-decisions/`, quando houver decisões arquiteturais duráveis registradas
- `docs/architecture-decisions/ADR-001-fronteira-editor-runtime-fabric.md`, para a decisão vigente de fronteira do
  editor RAC com o runtime Fabric
- `docs/architecture-decisions/ADR-002-formato-canonico-projeto-rac.md`, para a decisão vigente sobre o formato
  canônico inicial de importação/exportação do projeto RAC
- `docs/engineering-playbook/PLAY-006-ports-and-adapters.md`, para a disciplina de continuidade de Ports and Adapters
  no editor RAC
- quando o repositório adotar acervos versionados de bug analysis ou incidentes em `.agents`, referenciar
  aqui os casos relevantes ou índices curados desses acervos
- quando o repositório adotar `.agents/refactorings/` como acervo versionado seletivo de frentes duráveis de
  refatoração, referenciar aqui os casos relevantes ou índices curados desse acervo
- registros locais de code review, quando existirem, permanecem locais e não devem entrar neste índice
- adicionar runbooks, decisões técnicas e notas recorrentes relevantes quando o repositório mantiver uma base de
  conhecimento versionada
- apontar para `README.md` quando ele for um complemento útil para leitores humanos

## Regras de curadoria

- manter links para documentos versionados
- preferir notas curadas a histórico bruto
- evitar duplicar texto de changelog
- não indexar a camada operacional efêmera de `.agents`, incluindo registros locais de code review, mas permitir
  referências seletivas a bug analysis, incidentes e `.agents/refactorings/` quando o repositório tratar
  esses registros como fontes documentais duráveis, com `.agents/refactorings/` restrito às frentes fechadas como
  `durável`
- manter o índice pequeno, estável e navegável
