# Changelog — 2026-03-05

## Viga de reforço perpendicular (tipo 3)

- Adicionado componente `DoorReinforcementBeam` em `House3DScene.tsx`
- Renderiza uma viga perpendicular abaixo do piso, na posição da porta, conectando a linha de vigas central (B) à linha
  da borda (A ou C), exclusivamente para `houseType === 'tipo3'`
- Dimensões e material idênticos às vigas de piso existentes (`FLOOR_BEAM_HEIGHT` × `FLOOR_BEAM_STRIP_DEPTH`)

## Auto Contraventamento no commit de nível (editor de nível/piloti)

- Removido o disparo global de auto contraventamento via `notify` no `HouseManager`; agora o gatilho não ocorre em ações genéricas.
- `houseManager.updatePiloti(...)` passou a chamar auto contraventamento apenas quando há mudança real de `nivel` e já existe vista superior registrada.
- Removido o bloqueio de execução única do auto contraventamento em `house-auto-contraventamento.ts` (flag `__autoContraventamentoInitialized`).
- Ajustado smoke test de `house-auto-contraventamento.ts` para refletir o novo comportamento de reaplicação quando a rotina é chamada novamente.

### Validações executadas

1. `npm run lint`
- Resultado: passou, com 1 warning existente em `src/components/rac-editor/ui/3d/House3DScene.tsx` (`react-refresh/only-export-components`).

2. `npx vitest run src/components/rac-editor/lib/house-auto-contraventamento.smoke.test.ts`
- Resultado: 6/6 testes passando.

3. `npx vitest run src/components/rac-editor/lib/house-manager.smoke.test.ts`
- Resultado: 8/10 passando, 2 falhas preexistentes de expectativa de altura (`1.5` vs `2.0` e `1.5` vs `DEFAULT_HOUSE_PILOTI.height`).

## Ajuste fino — Auto Contraventamento (inserção + reconciliação por nível)

- Ajustado `HouseManager.registerView(...)` para disparar auto contraventamento ao inserir a vista superior (`top`), cobrindo o cenário de inserção da casa no canvas.
- Mantido o gatilho de auto contraventamento em `updatePiloti(...)` apenas para mudança real de `nivel`.
- `house-auto-contraventamento.ts` agora reconcilia por coluna:
  - cria quando a coluna exige e não possui contraventamento;
  - remove contraventamento existente (inclusive manual) quando a coluna deixa de exigir por mudança de nível.
- Não houve gatilho adicional em mudanças que não alteram `nivel`.

### Validações executadas (rodada)

1. `npx vitest run src/components/rac-editor/lib/house-auto-contraventamento.smoke.test.ts`
- Resultado: 7/7 testes passando.

2. `npx vitest run src/components/rac-editor/lib/house-manager.smoke.test.ts -t "aplica auto contraventamento ao inserir a vista superior da casa"`
- Resultado: 1 teste alvo passando (10 cenários da suíte foram pulados por filtro).

3. `npm run lint`
- Resultado: passou com 1 warning preexistente em `src/components/rac-editor/ui/3d/House3DScene.tsx`.

## Correção — Sincronização dos botões de tamanho no editor de piloti

- Ajustado `usePilotiEditor` para sincronizar `tempHeight`, `tempIsMaster` e `tempNivel` sempre que os valores atuais (`currentHeight/currentIsMaster/currentNivel`) mudarem com o editor aberto.
- Removido o bloqueio por `lastPilotiIdRef`, que mantinha o estado local desatualizado após mudança de nível com recálculo de altura proposta.
- Efeito prático: após alterar nível, os botões de tamanho no editor passam a refletir imediatamente o novo tamanho proposto do piloti, consistente com o estado atualizado.

### Validações executadas (rodada)

1. `npx tsc --noEmit`
- Resultado: passou.

2. `npm run lint`
- Resultado: passou com 1 warning preexistente em `src/components/rac-editor/ui/3d/House3DScene.tsx`.

## Correção complementar — Atualização imediata dos botões após commit de nível

- Corrigido o fluxo de retorno do `usePilotiEditor` para usar os valores canônicos do `houseManager` após `updatePiloti(...)`.
- Antes: o hook notificava o estado pai com `tempHeight/tempIsMaster/tempNivel` (valor pré-recalculo), mantendo os botões com valor antigo até fechar/reabrir o editor.
- Agora: após `updatePiloti(...)`, o hook lê `houseManager.getPilotiData(pilotiId)` e propaga `height/isMaster/nivel` atualizados para `onHeightChange` e `onNavigate`.

### Validações executadas (rodada)

1. `npx tsc --noEmit`
- Resultado: passou.

2. `npm run lint`
- Resultado: passou com 1 warning preexistente em `src/components/rac-editor/ui/3d/House3DScene.tsx`.
