
## Objetivo (exatamente o que você descreveu)
Quando uma vista de elevação (Frontal/Traseira/Laterais) **já inserida no canvas** for **selecionada**, evidenciar na **Vista Planta** (top) o **lado (Superior/Inferior/Esquerda/Direita)** que foi escolhido no momento da inserção daquela vista.

Regras:
- Se **nenhuma vista** estiver selecionada (selection cleared), **não evidenciar nada**.
- Se a vista selecionada for a própria **Planta**, **não evidenciar nada**.
- Implementação deve ser **isolada**, sem mexer em outras funcionalidades.

---

## Diagnóstico do bug (por que o destaque “fica longe” da planta)
Hoje não existe (ou não está ativo) um mecanismo robusto para “atar” o destaque à Planta.
O sintoma que você descreve (“linha azul parada em um lugar fixo, longe da Planta”) é típico de:
1) o highlight ter sido desenhado como **objeto no canvas** (coordenadas absolutas), em vez de ser desenhado **dentro do Group** da Planta (coordenadas locais do grupo), ou  
2) o highlight ter sido desenhado com coordenadas locais erradas (considerando origin/scale de forma incorreta).

A correção correta é: **o highlight precisa ser um child do Group da Planta** (top view group) e calculado no **sistema de coordenadas local** daquele group (onde o corpo da casa está centrado em (0,0)).

---

## Estratégia “não quebrar nada” (mudanças mínimas e isoladas)
Vamos implementar somente:
- Uma função utilitária local no Canvas (ou helper bem contido) para:
  - remover highlights antigos (inclusive “stale” soltos no canvas, caso existam de tentativas antigas),
  - adicionar/atualizar a linha de destaque **dentro** do group da Planta,
  - remover a linha quando não for necessário.
- Um pequeno gancho na lógica de seleção já existente (o `updateHint` do `Canvas.tsx`) para chamar essa função.

Não vamos tocar em:
- HouseManager (regras de “uma vista por tipo”),
- Piloti editor, nivel, sincronização,
- inserção de vistas,
- qualquer lógica de dimensionamento, undo/redo etc.

---

## Onde implementar
Arquivo principal: `src/components/rac-editor/Canvas.tsx`

Por quê:
- É onde já existe a centralização da lógica de seleção (`selection:created/updated/cleared` -> `updateHint`).
- Permite reagir ao “objeto selecionado no canvas” sem interferir no fluxo de criação/registro das vistas.

---

## Como identificar “qual vista está selecionada” e “qual lado destacar”
1) Na seleção atual do Fabric (`canvas.getActiveObject()`):
   - se não houver active object: remover highlight.
   - se for um `group` com `(group as any).myType === 'house'`:
     - ler `(group as any).houseViewType` (setado no `houseManager.registerView`) e/ou `(group as any).houseView`.
2) Se `viewType` for `front/back/side1/side2`:
   - obter o `side` correspondente em `houseManager.getHouse()?.views[viewType]?.side`.
   - se não houver side (caso raro/legado), não destacar nada.

---

## Como desenhar o destaque corretamente (atrelado à Planta)
### 1) Encontrar o group da Planta
Usar a forma mais segura e independente:
- procurar no canvas: objeto `group` com `(obj as any).myType === 'house' && (obj as any).houseView === 'top'`.

Isso evita depender do estado interno do HouseManager caso haja algum “stale reference”.

### 2) Encontrar o “corpo da casa” dentro do group da Planta
No `canvas-utils.ts`, o retângulo do corpo tem `(rect as any).isHouseBody = true`.
Então:
- `const houseBody = topGroup.getObjects().find(o => (o as any).isHouseBody) as Rect`

### 3) Calcular a linha no espaço local do group
Na Planta, o `Rect` é criado com:
- `originX: "center"`, `originY: "center"`, e fica centrado em `(0,0)` dentro do grupo.
Logo:
- `w = houseBody.width * (houseBody.scaleX || 1)`
- `h = houseBody.height * (houseBody.scaleY || 1)`

Coordenadas locais da linha (exemplo):
- side = top:    de `(-w/2, -h/2)` até `( w/2, -h/2)`
- side = bottom: de `(-w/2,  h/2)` até `( w/2,  h/2)`
- side = left:   de `(-w/2, -h/2)` até `(-w/2,  h/2)`
- side = right:  de `( w/2, -h/2)` até `( w/2,  h/2)`

### 4) Criar um `Line` “não-interativo” e colocar dentro do group
Configurar o highlight para não interferir com seleção/piloti:
- `selectable: false`
- `evented: false`
- `excludeFromExport: true` (opcional)
- `strokeUniform: true` (para manter espessura coerente)
- marcar com flag: `(line as any).isSideHighlight = true` e `(line as any).highlightSide = side`

Adicionar ao group como último child (para ficar “por cima”):
- remover highlight anterior dentro do group (se existir),
- `topGroup.addWithUpdate(line)` (ou `topGroup.add(line)` seguido de `refreshHouseGroupRendering(topGroup)`/`canvas.requestRenderAll()` se necessário).

---

## Limpeza obrigatória (para resolver as “tentativas antigas”)
Antes de aplicar o highlight novo:
- Remover quaisquer objetos do canvas com `(obj as any).isSideHighlight === true` que estejam **soltos** no canvas (não dentro do group da planta).
- Dentro do topGroup, remover qualquer child com `isSideHighlight`.

Isso garante que nenhum “highlight fantasma” fique parado em outro lugar.

---

## Integração com o ciclo de seleção (sem alterar outras features)
No `updateHint` (Canvas.tsx), ao final (depois de atualizar strokes e etc.):
- chamar `syncPlantSideHighlight(activeObject)`.

Comportamento:
- Se `activeObject` for house view != top: aplica highlight.
- Se `activeObject` for top: remove highlight.
- Se `activeObject` for null (selection cleared): remove highlight.

---

## Casos de teste (manuais) para validar sem regressões
1) **Base**: Inserir Planta + inserir Frontal (escolher Superior).  
   - Selecionar Frontal no canvas -> Planta deve mostrar linha azul no lado Superior.  
   - Clicar no vazio (selection cleared) -> linha some.
2) Inserir Traseira (escolher Inferior).  
   - Selecionar Traseira -> highlight muda para Inferior (sem criar múltiplas linhas).
3) Inserir Lateral (escolher Esquerda).  
   - Selecionar Lateral -> highlight muda para Esquerda.
4) Mover/rotacionar/escalar a Planta.  
   - Selecionar Frontal/Traseira/Lateral -> highlight continua “colado” na Planta.
5) Regressão: abrir editor de Piloti / editar altura / mestre + nível.  
   - Garantir que nada muda: popover, navegação < >, nivel do mestre e regra de “single master” continuam ok.
6) Undo/Redo:  
   - Depois de Ctrl+Z / Ctrl+Y (ou o fluxo atual), selecionar uma vista -> highlight ainda encontra a Planta corretamente e desenha no lugar certo.

---

## Observações técnicas (para garantir que não mexemos no resto)
- Nenhuma alteração será feita em `house-manager.ts` (evita quebrar regra de uma vista por tipo).
- Não vamos alterar lógica de seleção de pilotis (apenas acrescentar um passo de render auxiliar depois do updateHint).
- A linha de highlight será não-interativa para não competir com subTargets do grupo.

---

## Arquivos a serem alterados (previsto)
- `src/components/rac-editor/Canvas.tsx` (apenas; mudança pequena e isolada)

