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
- quando o repositório adotar `.agents/bug-analysis/` ou `.agents/incidents/` como acervos versionados, referenciar
  aqui os casos relevantes ou índices curados desses acervos
- quando o repositório adotar `.agents/refactorings/` como acervo versionado seletivo de frentes duráveis de
  refatoração, referenciar aqui os casos relevantes ou índices curados desse acervo
- `.agents/code-reviews/`, quando existir, permanece local e não deve entrar neste índice
- adicionar runbooks, decisões técnicas e notas recorrentes relevantes quando o repositório mantiver uma base de
  conhecimento versionada
- apontar para `README.md` quando ele for um complemento útil para leitores humanos

## Regras de curadoria

- manter links para documentos versionados
- preferir notas curadas a histórico bruto
- evitar duplicar texto de changelog
- não indexar a camada operacional efêmera de `.agents/`, incluindo `.agents/code-reviews/`, mas permitir referências
  seletivas a `.agents/bug-analysis/`, `.agents/incidents/` e `.agents/refactorings/` quando o repositório tratar
  esses registros como fontes documentais duráveis, com `.agents/refactorings/` restrito às frentes fechadas como
  `durável`
- manter o índice pequeno, estável e navegável
