## Plano: Redesign Visual do Editor de Pilotis

### Objetivo

Unificar visualmente o editor de pilotis usado tanto na inserção da casa (NivelDefinitionModal) quanto na edição no canvas (PilotiEditor), seguindo o layout do screenshot de referência.

### Layout do Novo Design

O editor terá a seguinte estrutura visual:

```text
+-----------------------------------------------+
| [minimap SVG]  Piloti A1           < >         |
+-----------------------------------------------+
| +-------------------------------------------+ |
| | Definir piloti como mestre?      [toggle]  | |
| |-------------------------------------------| |
| |        Nível do Piloti                     | |
| |     (-)   1.20  m   (+)                    | |
| |  ====O================================    | |
| |  0,00m                         3,00m       | |
| |-------------------------------------------| |
| |        Tamanho dos Pilotis                 | |
| |   [1.0]   [1.2]   [1.5]                   | |
| |   [2.0]   [2.5]   [3.0]                   | |
| +-------------------------------------------+ |
|                                               |
|      [Cancelar]         [Confirmar]           |
+-----------------------------------------------+
```

### Detalhes Visuais (baseado no screenshot)

1. **Cabeçalho**: PilotiGridIcon (mesmo SVG do minimap com bolinhas e sombra) à esquerda com o piloti selecionado destacado em azul e mestres em marrom. Título "Piloti A1" em negrito. Setas de navegação à direita em botões circulares com borda.
2. **Card central**: Fundo cinza claro arredondado (bg-muted/30 ou similar) contendo:
  - Toggle "Definir piloti como mestre?" (apenas para cantos A1, A4, C1, C4)
  - Separador horizontal
  - Seção "Nível do Piloti" (apenas para cantos):
    - Label centralizado em negrito
    - Display grande do valor (texto ~3rem em negrito) com sufixo "m" em cinza
    - Botões circulares (-) e (+) para ajuste em incrementos de 0,01m
    - Slider horizontal de 0,00m ao máximo (2/3 da altura)
    - Labels "0,00m" e "X,XXm" nas extremidades do slider
  - Separador horizontal
  - Seção "Tamanho dos Pilotis":
    - Label centralizado em negrito
    - Grid 3x2 de botões com cantos arredondados (rounded-xl)
    - Botão selecionado em azul (bg-primary), demais em cinza claro (bg-muted)
    - Texto grande nos botões (~1.5rem)
3. **Rodapé**: Dois botões "Cancelar" (outline) e "Confirmar" (primary) lado a lado.

### Mudancas Tecnicas

**Controle de Nivel (substituindo o input de texto):**

- Slider (Radix Slider) com min=0.20, max=maxNivel (2/3 da altura), step=0.01
- Botoes (-) e (+) incrementam/decrementam em 0.01m com clamp
- Display central mostra o valor formatado com virgula e 2 casas decimais
- O slider e os botoes atualizam o mesmo estado tempNivel

**PilotiGridIcon no cabecalho:**

- Reutilizar o componente PilotiGridIcon existente, mas precisamos de uma versao que destaque o piloti individual selecionado (nao um lado inteiro)
- Criar uma nova variante ou prop no PilotiGridIcon que aceite `selectedPiloti` (ex: "A1") e `masterPiloti` (ex: "C4") para destacar individualmente
- O piloti selecionado fica em azul, o mestre em marrom, os demais em cinza claro

**Grid de alturas 3x2:**

- Substituir o layout horizontal (flex-nowrap) por um grid de 3 colunas
- Botoes maiores com rounded-xl e texto grande
- Selecionado: bg-primary text-white com rounded-xl
- Nao selecionado: bg-muted/50 text-foreground com rounded-xl

### Arquivos Modificados

1. `**src/components/rac-editor/PilotiGridIcon.tsx**` - Adicionar props opcionais `selectedPiloti?: string` e `masterPiloti?: string` para destacar pilotis individuais (alem do modo de destaque por lado que ja existe). Quando selectedPiloti esta definido, aquele ponto fica em azul; quando masterPiloti esta definido, aquele ponto fica em marrom.
2. `**src/components/rac-editor/PilotiEditor.tsx**` - Redesign completo do layout:
  - Cabecalho com PilotiGridIcon + titulo + setas
  - Card central com master toggle, nivel (slider + display + botoes +/-), e grid 3x2 de alturas
  - Rodape com Cancelar/Confirmar
  - Substituir input de texto do nivel por slider + display + botoes
  - Manter toda a logica de negocio existente (navegacao, auto-navigate, drag no desktop, etc.)
3. `**src/components/rac-editor/NivelDefinitionModal.tsx**` - Redesign para usar o mesmo layout visual:
  - Cabecalho com PilotiGridIcon + titulo + setas (navegando entre A1, A4, C1, C4)
  - Card central com master toggle, nivel (slider + display + botoes +/-)
  - NAO tem secao "Tamanho dos Pilotis" durante insercao (ou tem, conforme regra de negocio atual)
  - Rodape com Cancelar/Inserir
  - Substituir input de texto do nivel por slider + display + botoes
  - Manter toda a logica de validacao (mestre deve ter menor nivel, etc.)

### Regras de Negocio Preservadas

- Apenas A1, A4, C1, C4 podem ser mestres e tem edicao de nivel
- Durante insercao: apenas 4 cantos para navegar
- Durante edicao no canvas: todos os 12 pilotis para navegar
- Piloti mestre evidenciado no minimap (marrom)
- Auto-navegacao com delay de 180ms ao clicar altura
- Popover arrastavel no desktop
- Drawer no mobile
- Nivel clampado entre 0,20 e 2/3 da altura
- Altura recomendada baseada em nivel * 3