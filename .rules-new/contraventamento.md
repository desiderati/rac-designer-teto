# Regras de Contraventamento

## Objetivo

Controlar quando e como o contraventamento pode ser criado/removido, incluindo automação por risco estrutural.

## Regra de elegibilidade estrutural

1. Nível mínimo

    - Contraventamento só é considerado quando o nível do piloti atende o mínimo estrutural da regra (
      `canCreateContraventamentoForNivel`).

2. Coluna fora de proporção

    - No fluxo atual, a coluna só habilita contraventamento quando há pelo menos um piloti fora de proporção (
      `height < nivel * 3`).

## Regras do fluxo manual

1. Primeiro piloti

    - Usuário seleciona piloti de origem.
    - Escolhe lado (`left`/`right`) no editor.

2. Segundo piloti

    - Deve estar na mesma coluna.
    - Deve ser linha diferente do primeiro.

3. Ocupação por lado

    - Cada coluna pode ter no máximo um contraventamento por lado.
    - Se clicar em lado já ocupado no editor, o comportamento é alternar/remover daquele lado.

4. Sincronização

    - Qualquer criação/remoção na planta deve sincronizar contraventamentos nas elevações.
    - Após sincronização, rotinas de auto-escada são reaplicadas para manter ordem de camadas correta.

## Regras do fluxo automático

1. Inicialização por vista top

    - Auto-contraventamento executa na planta quando não há contraventamentos preexistentes manuais/importados.

2. Critério de criação

    - Para cada coluna com necessidade, cria em lado disponível (`left` preferencial, depois `right`).
    - Define linhas de ancoragem/destino priorizando extremos da coluna e menor nível como origem.

3. Escopo

    - Quando há alteração automática, resultado é projetado para vistas elevadas.

## Regras de feedback

- Mensagens específicas para: falta de planta, coluna inválida, mesmo piloti, lado ocupado, erro de criação e sucesso.

## Evidências no código

- Fluxo e comandos:
    - `src/components/rac-editor/hooks/useContraventamento.ts`
    - `src/components/rac-editor/hooks/useContraventamentoFlow.ts`
    - `src/components/rac-editor/hooks/useContraventamentoCommands.ts`
    - `src/components/rac-editor/hooks/useContraventamentoQueries.ts`
    - `src/components/rac-editor/hooks/useContraventamentoEffects.ts`

- Motor 2D e sync:
    - `src/components/rac-editor/lib/canvas/contraventamento.ts`
    - `src/components/rac-editor/lib/canvas/contraventamento-top-view-highlight.ts`
    - `src/components/rac-editor/lib/canvas/piloti.ts`

- Automação:
    - `src/components/rac-editor/lib/house-auto-contraventamento.ts`

- Regras/tipos:
    - `src/shared/types/contraventamento.ts`
    - `src/shared/types/piloti.ts`

## Evidências em testes

- E2E:
    - `e2e/piloti.spec.ts`

- Smoke:
    - `src/components/rac-editor/lib/canvas/contraventamento.smoke.test.ts`
    - `src/components/rac-editor/lib/house-auto-contraventamento.smoke.test.ts`
    - `src/components/rac-editor/lib/3d/contraventamento-parser.smoke.test.ts`
