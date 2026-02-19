# Regras de Contraventamento

Este documento descreve as regras funcionais, visuais e geométricas de contraventamento no estado atual do projeto.

## 1. Objetivo

Permitir criar e remover contraventamentos por coluna de pilotis, com:

1. criação na planta (`top`);
2. projeção diagonal nas vistas quadrado (`houseView = side`);
3. exibição no modelo 3D.

## 2. Conceitos

- `Piloti de origem`: piloti selecionado primeiro para iniciar o contraventamento.
- `Piloti de destino`: piloti selecionado na sequência para completar o contraventamento.
- `Lado`: `left` (esquerdo) ou `right` (direito), relativo à coluna na planta.
- `Coluna`: índice `col` no id `piloti_<col>_<row>`.
- `Ocupação de coluna`: controle por lado; uma coluna pode ter no máximo 2 contraventamentos (`left` e `right`).

## 3. Ponto de entrada (UX)

O fluxo começa no `PilotiEditor`, na seção fixa `Contraventamento` (abaixo de `Tamanho dos Pilotis`).

A seção sempre aparece, com dois botões:

1. `Esquerdo`.
2. `Direito`.

## 4. Estados dos botões no editor

Para o piloti selecionado:

1. Se o lado já possui contraventamento na coluna:
    - botão fica habilitado;
    - botão aparece como ativo;
    - clique remove o contraventamento desse lado na coluna.
2. Se o lado ainda não possui contraventamento:
    - botão só habilita se `nível > 0,40 m`;
    - com `nível <= 0,40 m`, fica desabilitado.

Resumo prático:

- `nível > 0,40 m` habilita criação no lado livre.
- lado já ocupado permite remoção mesmo com nível baixo.

## 5. Regras de ocupação por coluna

1. Não pode existir mais de um contraventamento no mesmo lado da mesma coluna.
2. Pode existir até 1 no `left` e 1 no `right` na mesma coluna.
3. Se os dois lados já existem, a coluna está totalmente ocupada para criação.

## 6. Fluxo de criação

Ao clicar em um lado livre no `PilotiEditor`:

1. o editor fecha;
2. entra no modo de contraventamento;
3. o piloti atual vira origem;
4. o lado escolhido fica fixo;
5. o sistema vai direto para seleção de destino (`select-second`).

Não há modal de escolha de lado nesse fluxo atual.

## 7. Regras de seleção de destino

No passo de destino:

1. só pilotis da mesma coluna da origem são elegíveis;
2. a linha da origem não pode ser escolhida como destino;
3. seleção é por clique único;
4. ao selecionar destino válido:
    - cria o contraventamento na planta;
    - sai do modo de contraventamento;
    - limpa highlights;
    - sincroniza projeções nas demais vistas;
    - salva histórico.

## 8. Cancelamento do modo

Durante `select-second`, o fluxo cancela se:

1. usuário pressiona `Esc`;
2. usuário clica fora da casa;
3. usuário clica em objeto que não seja piloti elegível;
4. usuário clica em piloti não elegível.

No cancelamento:

1. estilos dos pilotis são restaurados;
2. estado volta para `select-first`;
3. origem e lado são limpos.

## 9. Feedback visual e cursor

No modo de contraventamento:

1. piloti elegível:
    - `fill` marrom de mestre;
    - borda amarela;
    - cursor `pointer`.
2. piloti não elegível:
    - cinza (`fill`/`stroke`);
    - cursor padrão.
3. piloti mestre não elegível também fica cinza para não confundir.

### 9.1 Relação com piloti mestre

1. ser mestre não altera, por si só, a elegibilidade para criar contraventamento;
2. a elegibilidade continua dependendo das regras de coluna, lado e seleção;
3. o destaque visual usa a paleta marrom associada ao mestre como padrão de contraste do modo.

## 10. Geometria na planta (top)

### 10.1 Constantes

- escala base: `s = 0.6`
- raio do piloti: `rad = 15 * s = 9`
- largura do contraventamento na planta: `5`
- centros de coluna: `[-1.5*cD, -0.5*cD, 0.5*cD, 1.5*cD]`, com `cD = 155*s = 93`
- linhas: `[-rD, 0, rD]`, com `rD = 135*s = 81`

### 10.2 Regras

1. origem e destino devem estar na mesma coluna e em linhas diferentes;
2. `topY = min(y1, y2)`;
3. `height = abs(y2 - y1)`;
4. tangência lateral:
    - `right`: `tangentX = colX + rad`;
    - `left`: `tangentX = colX - rad`;
5. encosto:
    - a borda oposta ao lado selecionado encosta na tangente;
    - `right`: `left = tangentX`;
    - `left`: `left = tangentX - beamWidth`.

## 11. Metadados persistidos por contraventamento

- `isContraventamento`
- `contraventamentoId`
- `contraventamentoCol`
- `contraventamentoStartRow`
- `contraventamentoEndRow`
- `contraventamentoSide`
- `contraventamentoAnchorPilotiId`

## 12. Projeção em vistas quadrado (não-planta)

### 12.1 Onde aparece

1. só em grupos com `houseView = side`;
2. não aparece em `front` e `back`;
3. em cada quadrado, mostra apenas o contraventamento externo:
    - quadrado esquerdo (`isRightSide = false`): coluna `0`, lado `left`;
    - quadrado direito (`isRightSide = true`): coluna `3`, lado `right`.

### 12.2 Geometria da projeção

Representação sempre diagonal.

1. origem: `20 cm acima` do terreno local:
    - `yOrigem = topRectOrigem + (nívelOrigem - 0,2) * baseHeight`
2. destino: `20 cm abaixo` da viga de piso:
    - `yDestino = topRectDestino + 0,2 * baseHeight`
3. espessura visual na vista quadrado:
    - preenchimento: `10`
    - borda: `10 + 2`

## 13. Exibição no modelo 3D

1. usa os contraventamentos da planta (`top`) como fonte;
2. seção do elemento no 3D:
    - largura correspondente à planta: `5` (escalado);
    - profundidade correspondente ao quadrado: `10` (escalado);
3. cor: mesma dos pilotis não mestre;
4. orientação: sempre diagonal entre origem e destino;
5. cotas verticais seguem a mesma regra de `20 cm` da projeção:
    - origem acima do terreno local;
    - destino abaixo da viga de piso.

## 14. Seleção e remoção

1. clique em contraventamento na planta seleciona o elemento;
2. `Excluir` remove o selecionado;
3. no editor de piloti, clicar no botão de um lado já ocupado remove o contraventamento daquele lado na coluna do piloti
   selecionado.

## 15. Sincronização

Ao criar/remover/editar dados relevantes:

1. remove projeções antigas de contraventamento nas vistas alvo;
2. recria projeções com base na planta;
3. renderiza novamente;
4. atualiza o modelo 3D via estado do `HouseManager`.

## 16. Arquivos principais

- `src/components/rac-editor/PilotiEditor.tsx`
- `src/components/rac-editor/RACEditor.tsx`
- `src/components/rac-editor/Canvas.tsx`
- `src/lib/canvas-utils.ts`
- `src/components/rac-editor/House3DViewer.tsx`
- `src/components/rac-editor/House3DScene.tsx`
