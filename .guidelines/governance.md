# RAC Editor - Governança de Refatoração Incremental

## Objetivo

Definir o protocolo operacional para evoluir/refatorar o editor com segurança, mantendo comportamento e reduzindo regressão.

## Regra de ouro

1. Refatorar em passos pequenos e isolados.
2. Não criar funcionalidade nova quando o objetivo for refatoração.
3. Reutilizar implementação existente antes de extrair ou criar módulo.

## Protocolo por passo (obrigatório)

1. Escolher 1 mudança pequena e isolada.
2. Implementar preservando contratos públicos.
3. Executar validação técnica mínima do escopo.
4. Registrar o passo em `.codex` (quando existir no fluxo da equipe).
5. Atualizar regras em `.rules` quando houver alteração de contrato/comportamento.
6. Só avançar para o próximo passo após validação.

## Gate de validação

### Gate mínimo por passo

1. Lint direcionado para arquivos alterados.
2. Teste direcionado para o fluxo alterado.

### Gate de rodada

1. `npm run test -- --run`
2. `npm run build`
3. `npm run test:e2e -- --workers=1`

### Gate de tipagem

1. `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false`
2. Se falhar por passivo pré-existente fora do escopo, registrar explicitamente.

## Política de reutilização vs. criação

1. Antes de criar módulo novo, auditar código existente com `rg`.
2. Se houver equivalente, estender contrato em vez de duplicar.
3. Se houver duplicação em 2+ pontos, extrair comum.
4. Criar novo módulo apenas quando a diferença de domínio/interação for comprovada.

## Governança de documentação

1. Atualizar `.guidelines/architecture-patterns.md` quando a regra arquitetural mudar.
2. Atualizar `.guidelines/ux-design.md` quando o contrato de interação mudar.
3. Atualizar `CHANGELOG.md` com marcos relevantes da rodada.
4. Registrar evidências de comando/validação no artefato de execução adotado pela equipe.

## Checklist de fechamento de rodada

1. Contrato funcional preservado.
2. Regra de negócio preservada.
3. Nenhuma funcionalidade removida sem intenção.
4. Validação executada e registrada.
5. Documentação de arquitetura/UX/changelog sincronizada.
