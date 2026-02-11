

## Mudanca no Sistema de Nivel e Representacao do Solo

### Resumo das Mudancas

Tres areas principais serao modificadas:

1. **Restricao de Mestre e Nivel**: Apenas os pilotis de canto (A1, A4, C1, C4) podem ser mestre e terao o campo "Nivel do piloti (m)" sempre visivel
2. **Desvinculacao do Nivel do status de Mestre**: O campo de nivel passa a ser independente do switch de mestre
3. **Linha do solo nas vistas de elevacao**: Desenhar uma linha irregular representando o terreno, conectando os niveis dos pilotis de canto

---

### 1. PilotiEditor - Interface do Editor

**Arquivo: `src/components/rac-editor/PilotiEditor.tsx`**

- Definir constante `CORNER_PILOTI_IDS` com `['piloti_0_0', 'piloti_3_0', 'piloti_0_2', 'piloti_3_2']` (A1, A4, C1, C4)
- Computar `isCornerPiloti` baseado no `pilotiId` atual
- O switch "Definir piloti como mestre?" so aparece se `isCornerPiloti === true`
- O campo "Nivel do piloti (m)" (renomeado de "Nivel do mestre") aparece sempre para pilotis de canto, independente do status de mestre
- Remover a condicao `tempIsMaster &&` que atualmente esconde o campo de nivel
- Atualizar o label de "Nivel do mestre (m)" para "Nivel do piloti (m)"
- Atualizar a descricao para algo como "Distancia do solo ao topo do piloti"

### 2. canvas-utils - Logica de Dados

**Arquivo: `src/lib/canvas-utils.ts`**

- Na funcao `createHouseTop`: os pilotis de canto (A1, A4, C1, C4) sempre iniciam com nivel 0.3 e o texto de nivel sempre visivel
- Na funcao `updatePilotiMaster`: desacoplar a visibilidade do nivel do status de mestre. O texto "Nivel = X,X" deve ser visivel para os 4 pilotis de canto sempre, nao apenas quando sao mestres
- Na funcao `createHouseFrontBack` e `createHouseSide`: apos criar os pilotis, adicionar uma linha irregular (Polyline) representando o solo, conectando as posicoes de nivel dos dois pilotis de canto da vista
- A linha do solo sera um `Polyline` com pontos intermediarios gerados proceduralmente (ondulacoes suaves entre os dois extremos) para simular terreno irregular
- Adicionar custom property `isGroundLine = true` nos objetos de solo para identificacao

### 3. house-manager - Sincronizacao

**Arquivo: `src/lib/house-manager.ts`**

- Atualizar `updatePiloti` para que, ao alterar o nivel de um piloti de canto, recalcule e reposicione a linha do solo nas vistas de elevacao afetadas
- Atualizar `applyPilotiDataToGroup` para aplicar nivel a pilotis de canto independente de isMaster
- O nivel dos pilotis de canto agora e um campo obrigatorio (sempre 0.3 por padrao, e o menor valor possível é 0.2)

### 4. Linha do Solo - Detalhes Tecnicos

A linha do solo em cada vista de elevacao:

- **Front/Back** (4 pilotis): A linha conecta o nivel do piloti da esquerda ao da direita. O nivel define a posicao Y do solo em relacao ao topo do piloti (nivel = distancia do solo ao topo). Logo, solo_Y = topo_piloti + (altura_piloti - nivel_em_pixels)
- **Laterais** (3 pilotis): Mesma logica, conectando os dois pilotis de canto (primeiro e ultimo)
- A linha tera pontos intermediarios com pequenas variacoes aleatorias (mas deterministicas, baseadas em seed do pilotiId) para parecer terreno irregular
- A area abaixo da linha do solo sera preenchida com cor escura semi-transparente (simulando terra)
- Os pilotis continuam visiveis na totalidade (parte acima e parte abaixo do solo)

Mapeamento de quais pilotis de canto estao em cada vista:
- Front (bottom/normal): C1 (esquerda) e C4 (direita)
- Front (top/flipped): A4 (esquerda) e A1 (direita)
- Side left: A1 (esquerda) e C1 (direita)
- Side right: C4 (esquerda) e A4 (direita)

### 5. Propriedades Customizadas

Adicionar ao array `customProps`:
- `isGroundLine` - para identificar a polyline do solo
- `isGroundFill` - para identificar o preenchimento de terra

### 6. Impacto no 3D Viewer

O componente `House3DScene.tsx` tambem precisara ser atualizado futuramente para representar o solo, mas esta fora do escopo imediato desta tarefa (foco no canvas 2D).

