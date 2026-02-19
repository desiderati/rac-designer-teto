# Regras de Contraventamento

Este documento descreve as regras funcionais e geométricas do contraventamento no editor.
Ele reflete o comportamento atual implementado no código.

## 1. Objetivo

Permitir inserir um contraventamento entre dois pilotis da mesma coluna na vista planta e projetar esse contraventamento nas vistas quadrado (laterais), com representação diagonal.

## 2. Conceitos

- `Piloti de origem`: piloti selecionado no editor para iniciar o contraventamento.
- `Piloti de destino`: piloti selecionado depois, na mesma coluna, para finalizar.
- `Lado do contraventamento`: `left` ou `right`, em relação à coluna na planta.
- `Coluna`: índice `col` do piloti (`piloti_<col>_<row>`).
- `Linha de terreno local`: cota visual do terreno no piloti (derivada do `nível`).

## 3. Ponto de entrada da UX

O fluxo começa no `PilotiEditor` (não pela toolbar).

Ordem:

1. Usuário abre um piloti.
2. Se elegível, aparece o botão `Contraventar` acima de `Cancelar` e `Aplicar`.
3. Ao clicar `Contraventar`, o editor fecha e o modo de contraventamento é ativado.

## 4. Regras para exibir o botão `Contraventar`

O botão só aparece quando:

1. Existe piloti selecionado.
2. Existe vista planta no canvas.
3. O `nível` do piloti selecionado é `> 0,40 m`.
4. A coluna do piloti não está totalmente ocupada (`left` e `right` ao mesmo tempo).

## 5. Regras de ocupação

Ocupação é controlada por coluna e lado:

- Não pode criar dois contraventamentos no mesmo lado da mesma coluna.
- Pode haver até dois por coluna: um `left` e um `right`.

## 6. Escolha de lado

Ao iniciar pelo piloti de origem:

1. Se a coluna tem somente um lado livre:
   - lado é definido automaticamente (o oposto do já ocupado);
   - o fluxo vai direto para seleção de destino.
2. Se a coluna tem os dois lados livres:
   - abre modal para escolher `Esquerdo` ou `Direito`.
3. Se a coluna não tem lado livre:
   - o fluxo é bloqueado.

## 7. Seleção do piloti de destino

Depois de definir o lado:

1. Somente pilotis da mesma coluna ficam ativos para destino.
2. O piloti de origem fica excluído.
3. A seleção do destino é com clique único.
4. Clique em piloti fora da coluna é inválido.
5. Clique no mesmo piloti (mesma linha) é inválido.

Quando o destino é válido:

1. O contraventamento é criado na planta.
2. O modo de contraventamento é encerrado.
3. Os highlights são resetados.
4. As elevações são sincronizadas.
5. O histórico é salvo.

## 8. Cancelamento do fluxo

O modo de contraventamento é cancelado quando:

1. Usuário pressiona `Esc`.
2. No passo de seleção do segundo piloti (`select-second`), o usuário clica em qualquer coisa que não seja um piloti elegível de destino:
   - clique fora da casa;
   - clique em outro objeto;
   - clique em piloti não elegível.
3. O modal de lado é fechado sem concluir.

No cancelamento:

1. Os pilotis voltam ao visual normal.
2. O estado retorna para `select-first`.
3. Origem/lado selecionados são limpos.

## 9. Feedback visual e cursor

Durante o modo de contraventamento:

1. Piloti elegível: destaque marrom (`stroke/fill`) e cursor de ponteiro.
2. Piloti não elegível: cinza e cursor padrão.
3. O canvas também força `pointer` apenas sobre piloti clicável.

## 10. Geometria na planta (vista top)

### 10.1 Constantes base

- `s = 0.6`
- `rad = 15 * s = 9`
- `beamWidth = 10`
- `colX = [-1.5*cD, -0.5*cD, 0.5*cD, 1.5*cD]` com `cD = 155*s = 93`
- `rowY = [-rD, 0, rD]` com `rD = 135*s = 81`

### 10.2 Regras de criação

1. Origem e destino precisam estar na mesma coluna e em linhas diferentes.
2. `topY = min(yOrigem, yDestino)`.
3. `height = abs(yDestino - yOrigem)`.
4. Tangência lateral:
   - lado `right`: `tangentX = colX + rad`;
   - lado `left`: `tangentX = colX - rad`.
5. Encosto da peça:
   - a borda oposta ao lado selecionado encosta na tangente;
   - `left = tangentX` quando lado `right`;
   - `left = tangentX - beamWidth` quando lado `left`.

### 10.3 Metadados persistidos

Cada contraventamento salva:

- `isContraventamento`
- `contraventamentoId`
- `contraventamentoCol`
- `contraventamentoStartRow`
- `contraventamentoEndRow`
- `contraventamentoSide`
- `contraventamentoAnchorPilotiId`

## 11. Projeção nas vistas não-planta

### 11.1 Regras de exibição

A projeção de contraventamento é mostrada somente nas vistas quadrado (`houseView = side`).

Não exibe nas vistas:

- frontal (`front`);
- traseira/lateral longa (`back`);
- planta (`top`) já exibe o elemento real.

Além disso, nas vistas quadrado mostra somente o contraventamento mais externo:

1. Quadrado esquerdo (`isRightSide = false`):
   - coluna visível: `col = 0`;
   - lado exibido: `left`.
2. Quadrado direito (`isRightSide = true`):
   - coluna visível: `col = 3`;
   - lado exibido: `right`.

Contraventamentos “internos” não são desenhados nessas projeções.

### 11.2 Geometria e espessura na projeção

Representação sempre diagonal.

- Espessura da linha projetada: `20`.

Cotas verticais:

1. Origem:
   - `20 cm acima` do terreno local do piloti de origem.
   - `yOrigem = topRectOrigem + (nívelOrigem - 0.2) * baseHeight`.
2. Destino:
   - `20 cm abaixo` da viga de piso.
   - `yDestino = topRectDestino + 0.2 * baseHeight`.

Onde:

- `topRect` = topo do piloti na elevação;
- `baseHeight` = `pilotiBaseHeight` da vista (escala local);
- `nívelOrigem` vem de `getPilotiNivel(pilotiId)`.

Coordenadas horizontais:

1. `xOrigem` = centro X do piloti de origem na vista.
2. `xDestino` = centro X do piloti de destino na vista.
3. Linha: `(xOrigem, yOrigem) -> (xDestino, yDestino)`.

## 12. Sincronização das elevações

A cada atualização relevante:

1. remove todas as projeções antigas de contraventamento nas vistas alvo;
2. reconstrói as projeções a partir da planta;
3. renderiza novamente.

## 13. Regras de integridade

1. Não criar contraventamento com origem e destino iguais.
2. Não criar contraventamento fora da mesma coluna.
3. Não criar no lado já ocupado da coluna.
4. Não iniciar com `nível <= 0,40 m`.
5. Não iniciar sem planta.

## 14. Estruturas de estado (alto nível)

- `isContraventamentoMode`
- `contraventamentoStep: select-first | select-second`
- `contraventamentoFirst`
- `contraventamentoSide`
- `contraventamentoSideSelectorOpen`
- `selectedContraventamento`

## 15. Locais principais no código

- `src/components/rac-editor/PilotiEditor.tsx`
- `src/components/rac-editor/RACEditor.tsx`
- `src/components/rac-editor/Canvas.tsx`
- `src/lib/canvas-utils.ts`

## 16. Observações

1. Este documento descreve o comportamento atual.
2. Se mudar regra de negócio (ex.: critério de nível, lógica de lado, geometria, visibilidade por vista), este arquivo deve ser atualizado junto com o código.
