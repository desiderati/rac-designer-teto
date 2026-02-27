# Regras de Nível do Piloti

Este documento consolida as regras atuais de nível (`nivel`) dos pilotis.

Complemento: regras de mestre estão em `.rules/piloti-mestre.md`.

## 1. Conceitos e dados

Cada piloti possui:

1. `height`
2. `isMaster`
3. `nivel`

Valor padrão de nível: `0.20 m`.

## 2. Pilotis com edição direta de nível

No `PilotiEditor`, a seção de nível aparece somente nos cantos:

1. `piloti_0_0` (A1)
2. `piloti_3_0` (A4)
3. `piloti_0_2` (C1)
4. `piloti_3_2` (C4)

## 3. Limites do nível no PilotiEditor

No editor de piloti de canto:

1. mínimo absoluto: `0.20 m`
2. máximo dinâmico: `maxNivel = round(height / 2, 2)`
3. o valor aplicado sempre é `clamp(min, max)` com arredondamento de 2 casas

Observação importante:

- esta regra é local ao fluxo de edição do `PilotiEditor` (hook `usePilotiEditorLogic`).
- o hook sincroniza o draft com o piloti selecionado via `useEffect` (sem `setState` durante render), reduzindo risco
  de comportamento inesperado em modo estrito.

## 4. Fluxo inicial de níveis (NivelDefinitionEditor)

No fluxo inicial:

1. os 4 cantos são configurados sequencialmente
2. mínimo: `0.20 m`
3. máximo: `1.50 m`
4. exige ao menos um mestre para concluir
5. ao definir um canto como mestre, os demais cantos são elevados para no mínimo o nível do mestre
6. para cantos não mestre, o mínimo permitido é `max(nível do mestre, 0.20 m)`

## 5. Interpolação global de níveis (12 pilotis)

Após definir os cantos, o `HouseManager` calcula todos os pilotis por interpolação bilinear:

1. cantos base: `A1`, `A4`, `C1`, `C4`
2. para cada `piloti_<col>_<row>`:
    - `u = col / 3`
    - `v = row / 2`
    - `nivel = (1-u)(1-v)A1 + u(1-v)A4 + (1-u)vC1 + uvC4`
3. nível final arredondado para 2 casas

## 6. Alturas recomendadas (regra separada)

No cálculo global de recomendação:

1. `minHeight = nivel * 3`
2. escolhe a menor altura padrão `>= minHeight`
3. fallback para `3.0` quando ultrapassa a tabela

Implementação de domínio extraída:

1. o cálculo foi isolado no caso de uso `calculateRecommendedPilotiData`;
2. a camada de aplicação usa a interface `HouseRepository`;
3. reconstrução de dados de piloti a partir de objetos do canvas foi isolada em
   `house-piloti-rebuild-use-cases`;
4. `HouseManager` aplica o resultado via adaptador e sincroniza as vistas/canvas.

Tabela de alturas padrão:

1. `1.0`
2. `1.2`
3. `1.5`
4. `2.0`
5. `2.5`
6. `3.0`

Importante:

- a regra de altura recomendada (`nivel * 3`) não substitui o limite de edição local do `PilotiEditor` (`height / 2`).

## 6.1 Auto-navegação no editor de piloti

Quando `autoNavigatePiloti` está habilitado nas configurações:

1. clicar em um botão de altura aplica imediatamente `height` e `nivel` (clamp por altura);
2. após `TIMINGS.pilotiAutoNavigateDelayMs`, o editor navega para o próximo piloti;
3. se não houver próximo, o editor é fechado automaticamente.

## 7. Sincronização entre vistas

Quando `height`, `isMaster` ou `nivel` mudam:

1. `HouseManager` atualiza estado central
2. propagação para todas as vistas registradas
3. atualização visual de textos/estilo
4. exclusividade de mestre aplicada centralmente

Complemento de renderização extraído:

1. cálculo de posição de label de nível em cantos;
2. cálculo de posição de label de altura do piloti;
3. cálculo da faixa hachurada (`2/3` da altura);
4. patch visual do label de nível (texto/visibilidade/posição) em piloti de canto.
5. indexação de objetos de piloti por `pilotiId` para reaproveitar referências de círculo/retângulo.
6. geração de patches visuais de piloti/label foi centralizada em `house-piloti-visual-use-cases`.
7. essas fórmulas/casos estão em `house-piloti-render-use-cases`, `house-piloti-object-index-use-cases` e
   `house-piloti-visual-use-cases`.
8. no `HouseManager`, a aplicação visual é executada em passes separados (dados, labels, faixas), preservando o
   comportamento anterior.
9. feedback visual de seleção no canvas (amarelo geral, azul do piloti ativo e restauração no fechamento do editor)
   foi centralizado em `piloti-visual-feedback`.
10. no `RacEditor`, ações de seleção/navegação/fechamento do editor de piloti foram delegadas para
    `usePilotiActions`, mantendo a sincronização de elevações e histórico no mesmo fluxo.

## 8. Relação com contraventamento

`nivel` participa da habilitação de contraventamento:

1. criação exige `nivel > 0.40 m`
2. com `nivel <= 0.40 m`, lado livre fica desabilitado
3. remoção de contraventamento existente continua permitida

## 9. Referências de código

- `src/components/rac-editor/modals/editors/NivelDefinitionEditor.tsx`
- `src/components/rac-editor/hooks/usePilotiEditorLogic.ts`
- `src/components/rac-editor/hooks/usePilotiActions.ts`
- `src/components/lib/house-manager.ts`
- `src/domain/house/house-aggregate.ts`
- `src/components/lib/canvas/piloti.ts`
- `src/components/lib/canvas/piloti-visual-feedback.ts`
- `src/components/rac-editor/House3DScene.tsx`
