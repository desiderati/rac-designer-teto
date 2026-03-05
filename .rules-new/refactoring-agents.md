# Guia para Atualizar as Regras (`.rules`)

## Objetivo

Garantir que as regras documentadas representem o comportamento real do sistema (e não opinião local de implementação).

## Checklist obrigatório antes de editar regras

1. Ler o código-fonte que executa a regra (UI + hook + lib + domínio).
2. Conferir tipos/constantes em `src/shared`.
3. Conferir testes relacionados (E2E e smoke).
4. Atualizar o texto da regra com linguagem de uso (o que a pessoa usuária percebe).
5. Incluir seção "Evidências no código" e "Evidências em testes".

## Mapeamento de caminhos legados

- src/components/hooks (legado) -> src/components/rac-editor/hooks
- src/components/libs (legado) -> src/components/rac-editor/lib
- src/components/lib (legado) -> src/components/rac-editor/lib

## Estrutura recomendada por arquivo de regra

- Objetivo
- Regras de negócio
- Fluxos (normal, bloqueio, cancelamento)
- Evidências no código
- Evidências em testes

## Critérios de qualidade

- Não resumir regra complexa sem incluir exceções e bloqueios.
- Não citar arquivo inexistente.
- Não usar linguagem só de dev (explicar impacto para uso).
- Sempre preferir comportamento observado no código/teste ao invés de suposição.

## Comandos úteis para revisão

```bash
rg -n "src/components/rac-editor/hooks|src/components/rac-editor/lib" .rules
rg -n "(test|it)\(" e2e
npm run lint
npx vitest run smoke.test
```
