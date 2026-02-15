## Redesign do GenericEditor com identidade visual do PilotiEditor

### Objetivo

Refazer o visual do painel de edicao de objetos (muro, linha reta, seta simples e distancia) para seguir a mesma identidade visual do PilotiEditor: fundo azul claro (`bg-background`), cabecalho com icone + titulo + botao fechar, corpo em cartao branco, e botoes de acao embaixo.

### Alteracoes visuais baseadas no screenshot

**Estrutura do layout (desktop):**

1. **Cabecalho**: Icone a esquerda + titulo centralizado + botao X a direita (mesmo padrao do PilotiEditor com grid icon + titulo + setas)
2. **Corpo**: Cartao branco (`bg-white rounded-xl p-4`) contendo input de texto, separador e paleta de cores (quadrados arredondados 4x2 em vez dos circulos 5x2 atuais, conforme screenshot)
3. **Rodape**: Dois botoes "Cancelar" e "Confirmar" (renomeado de "Aplicar")

**Paleta de cores redesenhada:**

- Atualmente: circulos pequenos (w-8 h-8) em grid 5x2
- Novo: quadrados arredondados maiores (~w-14 h-14 rounded-xl) em grid 4x2, com borda azul e checkmark quando selecionado (conforme screenshot)
- Reduzir para 8 cores: Vermelho, Azul, Verde, Amarelo, Preto, Cinza, Marrom, Laranja

### Componente de Icone reutilizavel: `EditorTypeIcon`

Novo componente SVG reutilizavel com o mesmo tamanho do PilotiGridIcon (`w-16 h-12`):

- **Muro/Objeto**: Icone formando um retângulo traçejado com a inferior azul
- **Linha Reta**: Mesmo icone de 3 linhas horizontais (conforme screenshot de referencia, a última linha em ajuzl)
- **Seta Simples**: Duas setas apontando para a direita, com a última linha em azul
- **Distancia**: Linha tracejada com valor em cima, linha cinnza e valor azul.  
Todos possuem a mesma largura do minimap mantendo um padrão visual.

### Detalhes tecnicos

**Arquivo novo:**

- `src/components/rac-editor/EditorTypeIcon.tsx` - Componente SVG reutilizavel que aceita `type: 'wall' | 'line' | 'arrow' | 'dimension'`

**Arquivo modificado:**

- `src/components/rac-editor/GenericEditor.tsx` - Redesign completo:
  - Container externo: `bg-background rounded-xl border shadow-md p-6` (igual ao PilotiEditor)
  - Cabecalho: `EditorTypeIcon` + titulo + botao X circular
  - Corpo: cartao `bg-white rounded-xl p-4` com input + separador + paleta 4x2
  - Rodape: botoes "Cancelar" (outline bg-white) e "Confirmar" (primary)
  - Paleta de cores: quadrados arredondados com checkmark SVG branco quando selecionado
  - Mobile (Drawer): mesma estrutura visual adaptada

### Mapeamento de titulos

- `wall` -> "Editar Objeto"
- `line` -> "Linha Reta"
- `arrow` -> "Seta Simples"
- `dimension` -> "Distancia"