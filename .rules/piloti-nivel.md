# Regras de Nível do Piloti

Este documento consolida as regras de nível (`nível`) dos pilotis no estado atual do projeto.

## 1. Conceitos e dados

Cada piloti possui:

1. `height` (altura estrutural).
2. `isMaster` (mestre).
3. `nivel` (cota do terreno local naquele ponto).

Valor padrão de nível: `0,20 m`.

## 2. Pilotis com edição direta de nível

No `PilotiEditor`, a seção `Nível do Piloti` aparece somente para os pilotis de canto:

1. `piloti_0_0` (A1)
2. `piloti_3_0` (A4)
3. `piloti_0_2` (C1)
4. `piloti_3_2` (C4)

Os demais pilotis não exibem controle direto de nível no editor.

## 3. Limites do nível no PilotiEditor

Ao editar um piloti de canto:

1. mínimo absoluto: `0,20 m`;
2. máximo dependente da altura do piloti:
    - `maxNivel = round((height * 2 / 3), 2)`
    - equivalente no código: `Math.round(height * 200 / 3) / 100`.

O valor sempre é arredondado para 2 casas decimais.

## 4. Relação nível x altura (regra 2/3)

A regra prática adotada:

1. para um `nível` ser viável, a altura precisa atender `height >= nivel * 3`;
2. no editor, isso aparece como limite superior dinâmico do nível em função da altura;
3. quando a altura muda, o nível é recalculado com `clamp` para não ultrapassar o novo limite.

## 5. Modal de definição inicial de níveis

No `NivelDefinitionModal` (fluxo inicial):

1. os quatro cantos (`A1`, `A4`, `C1`, `C4`) são configurados sequencialmente;
2. nível mínimo geral: `0,20 m`;
3. nível máximo geral: `1,50 m`;
4. é obrigatório definir pelo menos um `piloti mestre` para aplicar.

## 6. Regras do piloti mestre no modal

Ao marcar um canto como mestre:

1. ele se torna o único mestre;
2. os outros cantos perdem `isMaster`;
3. níveis menores que o nível do mestre são elevados para, no mínimo, o valor do mestre.

Ao aumentar o nível do mestre:

1. qualquer canto abaixo desse valor é automaticamente elevado.

Para cantos não mestre:

1. o mínimo permitido passa a ser o nível do mestre atual.

## 7. Alturas recomendadas

O sistema usa alturas padrão:

1. `1,0`
2. `1,2`
3. `1,5`
4. `2,0`
5. `2,5`
6. `3,0`

Altura recomendada para um nível:

1. `minHeight = nivel * 3`;
2. escolhe a menor altura padrão `>= minHeight`;
3. se exceder `3,0`, usa `3,0`.

## 8. Interpolação de nível para todos os 12 pilotis

Após definição dos cantos, o `HouseManager` calcula nível para toda a malha com interpolação bilinear:

1. cantos base: `A1`, `A4`, `C1`, `C4`;
2. para cada `piloti_<col>_<row>`:
    - `u = col / 3`
    - `v = row / 2`
    - `nivel = (1-u)(1-v)A1 + u(1-v)A4 + (1-u)vC1 + uvC4`
3. o nível interpolado é arredondado para 2 casas;
4. a altura do piloti também é definida pela regra recomendada (`nivel * 3` + tabela padrão).

## 9. Sincronização entre vistas

Quando `height`, `isMaster` ou `nivel` mudam:

1. o dado central no `HouseManager` é atualizado;
2. a alteração é propagada para todos os grupos (planta, frontal, traseira, quadrado);
3. se houver novo mestre, mestres anteriores são removidos globalmente;
4. textos e estilos são atualizados em todas as vistas.

## 10. Regras visuais ligadas ao nível

Na planta:

1. texto de nível aparece apenas nos cantos;
2. A1 e A4 ficam com label acima do círculo;
3. C1 e C4 ficam com label abaixo do círculo.

Nas elevações:

1. linha de terreno e marcadores de nível usam os níveis dos cantos visíveis da vista;
2. posição vertical do marcador:
    - `nivelY = topDoPiloti + nivel * 100 * escalaLocal`.

## 11. Relação com contraventamento

O nível participa diretamente da regra de contraventamento:

1. criação de contraventamento exige `nível > 0,40 m` no piloti de origem;
2. com `nível <= 0,40 m`, lados livres ficam desabilitados no editor;
3. remoção de contraventamento existente continua permitida.

## 12. Relação com o modelo 3D

No 3D:

1. o terreno é calculado por interpolação bilinear a partir dos níveis dos cantos;
2. cada piloti ajusta sua altura final para encostar no terreno;
3. contraventamentos usam o nível da origem para posicionar o ponto inicial (`20 cm` acima do terreno local).

## 13. Referências de código

- `src/components/rac-editor/PilotiEditor.tsx`
- `src/components/rac-editor/NivelDefinitionModal.tsx`
- `src/lib/house-manager.ts`
- `src/lib/canvas-utils.ts`
- `src/components/rac-editor/House3DScene.tsx`
