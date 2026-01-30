
## O que o seu sintoma indica (por que só “inferior” e “direita” aparecem)
Do jeito que o highlight está hoje, nós assumimos que o “corpo” da casa (o `Rect` com `isHouseBody`) está centrado em `(0,0)` **no sistema local do grupo da Planta**.

Pelo seu relato (“parece como se o centro da planta estivesse em (0,0)… os lados esquerdo e superior ficam fora do canvas”), isso significa que, na prática:
- o `houseBody` dentro do `topGroup` **não está com centro local em (0,0)** (por algum offset interno do group: `houseBody.left/top` diferentes de 0), ou
- a linha está sendo calculada em torno de (0,0) enquanto o corpo está deslocado, então “top” e “left” vão para coordenadas negativas e somem da área visível.

A correção não é usar o “centro do canvas” nem o “centro visível”. O highlight precisa ser **relativo ao centro real do corpo da casa dentro do topGroup**, que é o que garante que ele fique colado à Planta independentemente de pan/zoom.

---

## Correção proposta (isolada e mínima, sem mexer em mais nada)
### Arquivo: `src/components/rac-editor/Canvas.tsx`
Vamos ajustar a função `syncPlantSideHighlight` para:
1) Continuar encontrando o `topGroup` e o `houseBody` como hoje.
2) Em vez de assumir que o centro do corpo é `(0,0)`, vamos **ancorar o highlight no centro local do próprio `houseBody`**, usando os offsets locais dele:
   - `const bodyCx = houseBody.left ?? 0`
   - `const bodyCy = houseBody.top ?? 0`
   (Como o `houseBody` é criado com `originX/Y: "center"`, `left/top` dele representam o centro local dele dentro do grupo.)
3) Calcular `coords` do highlight do mesmo jeito, mas agora como offsets em torno do corpo (continua em coordenadas locais):
   - top: `[-w/2, -h/2, +w/2, -h/2]`
   - bottom: `[-w/2, +h/2, +w/2, +h/2]`
   - left: `[-w/2, -h/2, -w/2, +h/2]`
   - right: `[+w/2, -h/2, +w/2, +h/2]`
4) Posicionar a linha no centro do corpo explicitamente (a mudança principal):
   - criar `new Line(coords, { originX:'center', originY:'center', ... })`
   - e então setar `left/top` **para o centro do corpo** (não para 0):
     - `highlightLine.set({ left: bodyCx, top: bodyCy })`
   Isso resolve o “(0,0) errado” sem voltar ao bug do canto superior esquerdo, porque agora o `left/top` não é (0,0) fixo; ele é o centro real do corpo.
5) Manter exatamente o que já está funcionando:
   - remoção de todos os `isSideHighlight` dentro do `topGroup`
   - `refreshHouseGroupRendering(topGroup)` após add/remove
   - `selectable: false`, `evented: false`, `strokeUniform: true`, `excludeFromExport: true`
   - a integração no `updateHint` permanece igual (não mexer em seleção/pilotis/etc.)

---

## Detalhe técnico importante (por que isso é o “certo” no Fabric)
- `topGroup` pode estar com children com offsets locais (especialmente depois de `refreshHouseGroupRendering` que remove e re-adiciona).
- O único “referencial confiável” para o highlight colar onde você quer é: **o centro local do retângulo do corpo** (`houseBody.left/top` com origin center).
- Pan/zoom/viewport não entram no cálculo porque o highlight é child do grupo: ele acompanha tudo automaticamente.

---

## Passos de implementação (curtos)
1) Em `syncPlantSideHighlight`, após encontrar `houseBody` e calcular `w/h`, ler `bodyCx/bodyCy` do `houseBody`.
2) Após criar `highlightLine`, aplicar:
   - `highlightLine.set({ left: bodyCx, top: bodyCy })`
3) Manter `topGroup.add(highlightLine)` + `refreshHouseGroupRendering(topGroup)` + `canvas.requestRenderAll()`.

---

## Critérios de teste (para você validar)
1) Inserir Planta + inserir Frontal escolhendo “Superior”; selecionar Frontal:
   - highlight aparece no lado superior do retângulo da Planta (visível, colado).
2) Inserir Frontal/Traseira escolhendo “Inferior”; selecionar:
   - highlight aparece embaixo (continua ok).
3) Inserir Lateral escolhendo “Esquerda”; selecionar:
   - highlight aparece à esquerda (agora deve aparecer, não “sumir”).
4) Inserir Lateral escolhendo “Direita”; selecionar:
   - highlight aparece à direita (continua ok).
5) Mover/rotacionar/escalar a Planta:
   - highlight continua colado no corpo.
6) Regressão: abrir editor de pilotis / mestre / nível:
   - deve permanecer intacto (não mexemos nisso).

---

## Escopo garantido (o que NÃO será tocado)
- `house-manager.ts` (nenhuma alteração)
- lógica de inserção de vistas
- lógica de “uma vista por tipo”
- editor de pilotis / nível do mestre
- lógica de viewport / pan / zoom
