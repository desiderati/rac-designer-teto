# Workflow de Testes e Validações

## Objetivo

Padronizar a execução de testes e validações para reduzir regressões, garantir consistência de nomenclatura dos smoke
tests e manter rastreabilidade no changelog.

## Escopo

Aplicável a mudanças em:

1. Código de produção.
2. Smoke tests (`*.smoke.test.ts` / `*.smoke.test.tsx`).
3. Fluxos cobertos por E2E.

## Regra de nomenclatura de smoke test

Cada arquivo de smoke deve representar o arquivo-alvo testado.

1. Para arquivo TypeScript:
    - alvo: `foo.ts`
    - teste: `foo.smoke.test.ts`
2. Para arquivo TSX:
    - alvo: `Foo.tsx`
    - teste: `Foo.smoke.test.tsx`
3. O `describe` principal deve usar o nome do arquivo-alvo:
    - exemplo: `describe('foo.ts', ...)`

### Casos especiais

1. Se dois testes distintos apontarem para o mesmo arquivo-alvo, consolidar em um único `*.smoke.test.*` para evitar
   colisão de nome.
2. Se o teste tiver nome legado e o alvo atual for outro arquivo, renomear o teste para refletir o alvo real.

## Checklist operacional por rodada

1. Ajustar/implementar testes do escopo alterado.
2. Validar coerência de nome dos smoke tests com arquivo-alvo.
3. Rodar smoke tests.
4. Rodar lint.
5. Rodar E2E.
6. Registrar resultados e exceções no changelog do dia.

## Comandos padrão

1. Smoke tests:

    ```bash
    npx vitest run smoke.test
    ```

2. Lint:

    ```bash
    npm run lint
    ```

3. E2E:

    ```bash
    npm run test:e2e
    ```

## Critério de aceitação mínimo

1. Smoke tests: 100% passando no escopo executado.
2. Lint: sem erros (warnings devem ser conhecidos e justificados).
3. E2E: 100% passando na suíte executada.
4. Nomes dos smoke tests coerentes com os arquivos-alvo.

## Tratamento de falhas

1. Se smoke falhar:
    - corrigir expectativa/contrato desatualizado;
    - validar se o erro é no teste ou no código.
2. Se lint falhar:
    - corrigir erro de regra obrigatória antes de avançar;
    - não ignorar erro estrutural (ex.: hooks condicionais).
3. Se E2E falhar:
    - reproduzir localmente;
    - corrigir regressão funcional antes de encerrar a rodada.

## Evidências obrigatórias no changelog

Registrar em `.changelogs/changelog-AAAAMMDD.md`:

1. Quais arquivos/testes foram ajustados.
2. Quais comandos foram executados.
3. Resultado (passou/falhou e contagens quando aplicável).
4. Exceções conhecidas (ex.: warning já aceito pelo projeto).
