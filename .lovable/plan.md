

# Preencher 2/3 do piloti com listras diagonais nas vistas de elevacao

## Resumo

Adicionar um preenchimento visual de listras diagonais nos 2/3 inferiores de cada piloti retangular nas vistas de elevacao (frontal, traseira e laterais). O terco superior permanece branco (ou com a cor de fundo atual).

## Abordagem

Para cada piloti retangular nas vistas de elevacao, criar um objeto adicional (Rect) sobreposto que cobre apenas os 2/3 inferiores do piloti e utiliza um `Pattern` com linhas diagonais como preenchimento. Esse objeto acompanhara o piloti e sera atualizado junto quando a altura mudar.

## Detalhes tecnicos

### 1. Funcao auxiliar para criar o pattern de listras diagonais

Criar uma funcao `createDiagonalStripePattern(scale)` que gera um `Pattern` do Fabric.js usando um canvas auxiliar (HTML Canvas) com linhas diagonais desenhadas. O pattern sera repetido (repeat) para preencher a area.

### 2. Criacao do overlay listrado na insercao inicial

Nos pontos onde os pilotis retangulares sao criados (`createHouseFrontBack` e `createHouseSide`):

- Apos criar cada `Rect` do piloti, criar um segundo `Rect` com:
  - Mesma largura (`pilotW`)
  - Altura = 2/3 da altura visual do piloti
  - Posicionado no terco inferior (top = piloti.top + 1/3 da altura)
  - Fill = pattern de listras diagonais
  - Sem borda (strokeWidth: 0)
  - Propriedades customizadas: `isPilotiStripe = true`, `pilotiId` correspondente
  - `selectable: false`, `evented: false`

### 3. Atualizacao do overlay ao mudar a altura

Na funcao `updatePilotiHeight`, ao redimensionar o piloti:

- Localizar o objeto com `isPilotiStripe` e mesmo `pilotiId`
- Atualizar sua altura para 2/3 da nova altura visual
- Atualizar seu `top` para `piloti.top + 1/3 da nova altura`
- Marcar como dirty

### 4. Compatibilidade com destaque de cores

Na funcao `updatePilotiMaster` e nos trechos de destaque (amarelo/azul):

- O overlay listrado deve ter opacidade parcial ou ser renderizado de forma que o destaque de cor no piloti base ainda seja visivel por baixo
- Alternativa: aplicar o pattern diretamente no Rect do piloti e usar um overlay branco no terco superior

### 5. Registro de propriedade customizada

Adicionar `isPilotiStripe` ao array `customProps` para garantir persistencia na serializacao.

### 6. Ordem Z

O overlay listrado deve ficar logo acima do Rect do piloti na ordem Z, mas abaixo dos labels e marcadores de nivel.

### Arquivos a editar

- `src/lib/canvas-utils.ts`: Funcao auxiliar de pattern, criacao dos overlays em `createHouseFrontBack` e `createHouseSide`, atualizacao em `updatePilotiHeight`, `updatePilotiMaster`, e `refreshHouseGroupRendering`
