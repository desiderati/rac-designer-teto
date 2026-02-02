
Objetivo
- Eliminar de vez o problema do “centro em (0,0)” do highlight na Planta, evitando cálculo de coordenadas e evitando adicionar/remover um novo objeto (a linha azul) a cada seleção.
- Em vez disso, destacar o lado da Planta “mudando a borda daquele lado” (cor/espessura), como você sugeriu.

Por que isso é mais simples (e mais robusto)
- O `Rect` do Fabric não permite “stroke por lado” (um único rect tem um stroke único para todas as bordas).
- Então, para mudar “apenas um lado”, a forma confiável é desenhar as bordas como 4 segmentos (`fabric.Line`) fixos (top/bottom/left/right) dentro do grupo da Planta.
- Esses 4 segmentos ficam ancorados ao próprio retângulo (mesmo referencial interno do grupo) e não dependem de viewport/pan/zoom nem de “onde está o centro no canvas”.
- A lógica de highlight vira apenas “trocar estilo” (stroke/strokeWidth) do segmento correspondente, sem criar/remover objetos.

O que vamos mudar (arquivos e escopo)
1) `src/lib/canvas-utils.ts` (createHouseTop)
- Hoje a Planta é um único `Rect` com stroke preto.
- Vamos:
  - Manter esse `Rect` (principalmente para manter `isHouseBody` e facilitar outras lógicas existentes).
  - Tornar o stroke do `Rect` transparente (ou strokeWidth 0) para ele não “duplicar” com as novas linhas de borda.
  - Criar 4 `Line` que representam as bordas do retângulo:
    - top:    [-w/2, -h/2] -> [ w/2, -h/2]
    - bottom: [-w/2,  h/2] -> [ w/2,  h/2]
    - left:   [-w/2, -h/2] -> [-w/2,  h/2]
    - right:  [ w/2, -h/2] -> [ w/2,  h/2]
  - Marcar cada linha com metadados:
    - `isHouseBorderEdge = true`
    - `edgeSide = 'top' | 'bottom' | 'left' | 'right'`
    - `excludeFromExport = true` (se você não quiser isso no PDF) — ou manter exportável (decisão simples; abaixo eu proponho manter exportável por padrão, mas posso seguir seu desejo)
  - Configurar as linhas para não interferirem em seleção:
    - `selectable: false`, `evented: false`, `strokeUniform: true`

Observação importante sobre estilo:
- Borda “normal”: stroke preto, strokeWidth igual ao que já existia no rect (`2*s`).
- Borda “highlight”: stroke azul (#3b82f6), strokeWidth mais forte (ex.: `4` ou `4*s` dependendo do visual desejado; vamos manter coerente com o resto do app).

2) `src/lib/canvas-utils.ts` (customProps)
- Se o projeto serializa/deserializa o canvas (undo/redo e loadFromJSON), precisamos garantir que as props customizadas das bordas sobrevivam.
- Hoje `customProps` não inclui `isHouseBorderEdge` nem `edgeSide`.
- Vamos adicionar:
  - `"isHouseBorderEdge"`, `"edgeSide"`
- Assim, após undo/redo/import, ainda conseguimos localizar as bordas e atualizar o estilo corretamente.

3) `src/components/rac-editor/Canvas.tsx` (syncPlantSideHighlight)
- Vamos substituir a estratégia atual (adicionar/remover `isSideHighlight`) por “pintar as bordas”:
  - Encontrar `topGroup` como hoje.
  - Dentro do `topGroup`, localizar as 4 linhas com `isHouseBorderEdge`.
  - Resetar todas para estilo padrão (preto).
  - Se o objeto selecionado for uma elevação (front/back/side1/side2) e tiver `side` no `houseManager`, então:
    - pegar a linha cujo `edgeSide === side` e aplicar o estilo de highlight (azul/mais grossa).
  - Se não houver seleção, ou a seleção for “top”, então apenas resetar para padrão.
- Importante: aqui não existe mais o problema do “(0,0) vs centro real”, porque as bordas já estão desenhadas exatamente no contorno do retângulo, no mesmo sistema local do grupo.
- Também reduz o risco de “stale cache” por add/remove de children:
  - Mesmo assim, se necessário, manteremos `refreshHouseGroupRendering(topGroup)` ao mudar estilos (em geral, mudar stroke deveria renderizar; mas como vocês já tiveram casos de cache estranho em grupos, manter o refresh aqui é seguro, porém vamos fazê-lo de forma bem controlada para não reintroduzir bugs antigos).

Compatibilidade / risco de regressão (e como vamos evitar)
- Não mexeremos em HouseManager nem em regras de inserção/seleção.
- A Planta continua sendo um `Group` com um `Rect` marcado como `isHouseBody` (isso é crítico para outras partes).
- As bordas serão não-interativas (`evented:false`, `selectable:false`) para não alterar comportamento de seleção.
- Undo/redo:
  - Ao incluir `isHouseBorderEdge/edgeSide` em `customProps`, o estado é estável após Ctrl+Z / Ctrl+Y.
- Export PDF:
  - Decisão: se vocês querem que o highlight/bordas apareçam no PDF:
    - Se sim: não marcar `excludeFromExport`.
    - Se não: marcar `excludeFromExport` e/ou controlar no pipeline de export.
  - Como hoje o rect já era exportável (stroke preto), o padrão mais “sem surpresa” é manter as bordas exportáveis também. Eu vou propor manter exportável, e deixar só o highlight (azul) também exportável (porque é só uma cor da borda). Se você preferir que highlight nunca exporte, a gente marca as linhas como `excludeFromExport` e o PDF fica sem borda (aí precisaríamos manter o rect com borda preta exportável). Eu vou confirmar isso com você se necessário.

Plano de implementação (sequência)
1) Ajustar `createHouseTop`:
   - Criar 4 `Line` de borda e adicioná-las no `houseObjects` (ordem: primeiro bordas, depois elementos; ou o inverso — idealmente borda acima do fill, mas como fill é transparente, tanto faz; eu vou colocar as bordas por último para garantir que apareçam por cima).
   - Definir estilo padrão (preto).
   - Desativar o stroke do `Rect` (para evitar borda dupla).
2) Atualizar `customProps` com `isHouseBorderEdge` e `edgeSide`.
3) Atualizar `syncPlantSideHighlight` para:
   - Parar de criar/remover `Line` de highlight.
   - Em vez disso, atualizar o estilo das bordas existentes.
   - Remover a limpeza de `isSideHighlight` (deixa de existir), e manter uma limpeza defensiva apenas se você quiser remover highlights antigos de versões anteriores (opcional).
4) Render/refresh:
   - Depois de atualizar estilos, chamar `topGroup.setCoords()` e `canvas.requestRenderAll()`.
   - Se ainda houver qualquer artefato de cache, chamar `refreshHouseGroupRendering(topGroup)` (somente no topGroup).

Critérios de teste (o que você valida)
1) Inserir Planta.
2) Inserir Frontal escolhendo “Superior” e selecionar a Frontal:
   - Só a borda superior da Planta fica azul e mais grossa.
3) Inserir Frontal/Traseira “Inferior” e selecionar:
   - Só a borda inferior fica azul.
4) Inserir Lateral “Esquerda” e selecionar:
   - Só a borda esquerda fica azul.
5) Inserir Lateral “Direita” e selecionar:
   - Só a borda direita fica azul.
6) Clicar no vazio / selecionar Planta:
   - Volta tudo para preto (sem highlight).
7) Mover/rotacionar/escalar a Planta:
   - A borda destacada continua exatamente no contorno (sem “sumir”).
8) Regressão:
   - Inserção/seleção das vistas continua funcionando.
   - Editor de pilotis continua funcionando.

Notas técnicas (para garantir que essa solução resolve o seu ponto)
- O seu pedido “pegar onde está o centro da planta no momento atual” é exatamente o tipo de coisa que vira frágil com transformações/cache de group.
- Ao transformar “um lado do rect” em “um objeto real (Line) que já está no lado certo”, a necessidade de buscar centro atual desaparece. O grupo carrega o desenho consigo.

Pergunta rápida (única decisão que pode afetar o comportamento esperado)
- As bordas da Planta (pretas) precisam continuar aparecendo no PDF/exportação como hoje?
  - Se sim, manteremos as 4 linhas exportáveis e o rect sem stroke.
  - Se não, podemos manter o rect com stroke preto exportável e usar as 4 linhas somente para highlight (e com excludeFromExport=true).
