

## Ajustes visuais em multiplos componentes

### 1. EditorTypeIcon - Correcoes nos icones

**Muro/Objeto:** Trocar a cor do tracejado de cinza (`#dfe3e8`) para azul (`hsl(var(--primary))`), mantendo fundo cinza e tracejado nos 4 lados.

**Linha Reta:** Aumentar comprimento das linhas em 10% (x1 de 10 para 5, x2 de 90 para 95).

**Seta Simples:** Reduzir para uma unica seta em azul (remover a seta cinza). Ajustar posicao para centralizar verticalmente. Estender a largura para ocupar o mesmo espaco que a Linha Reta (x1=5, x2 proporcional).

**Distancia:** Trocar cor do tracejado e marcadores de cinza para azul (`hsl(var(--primary))`). Estender largura para igualar (x1=5, x2=95).

Todos os icones terao a mesma largura horizontal (5 a 95 no viewBox).

### 2. GenericEditor - Separador e titulo

- Trocar `space-y-4` do cartao branco para `space-y-5` para aumentar espacamento do separador (topo e inferior).
- Centralizar titulo do editor de piloti (PilotiEditor): adicionar `text-center` ao titulo "Piloti X".

### 3. PilotiEditor - Titulo centralizado

- Adicionar `text-center` ao `<span>` do titulo "Piloti {pilotiName}" (linha 294).

### 4. NivelDefinitionModal - Remover espaco extra

- Remover `pt-2` da div do nivel (linha 210: `space-y-4 pt-2` -> `space-y-4`).

### 5. PilotiEditor - Cursor de mover

- Adicionar `cursor-grab` ao container do painel desktop quando arrastavel e `cursor-grabbing` durante o arraste. Aplicar `cursor-grab` ao div principal do painel no desktop (linha 440).

### Detalhes tecnicos

**Arquivos modificados:**
- `src/components/rac-editor/EditorTypeIcon.tsx` - Icones com largura uniforme, cores corrigidas
- `src/components/rac-editor/GenericEditor.tsx` - Espacamento do separador
- `src/components/rac-editor/PilotiEditor.tsx` - Titulo centralizado + cursor grab
- `src/components/rac-editor/NivelDefinitionModal.tsx` - Remover pt-2 do nivel
