

## Plano: Componente reutilizavel de selecao com grid de pilotis

### Resumo

Criar um componente reutilizavel `TwoCardSelector` baseado no design do `HouseTypeSelector`, e usa-lo para substituir os 4 modais atuais do `SideSelector` (posicionar vista frontal, posicionar quadrado aberto, escolher lateral, escolher quadrado fechado). Cada cartao tera um icone SVG representando a planta com os pilotis destacados no lado correspondente.

### 1. Novo componente: `PilotiGridIcon`

Componente SVG leve que renderiza a grade 3x4 de pontos (pilotis), com uma prop `highlight` indicando qual lado destacar em azul (`top`, `bottom`, `left`, `right`). Os pontos nao destacados ficam em cinza claro.

- `highlight="top"` -> linha A (4 pontos superiores) em azul
- `highlight="bottom"` -> linha C (4 pontos inferiores) em azul
- `highlight="left"` -> coluna 1 (A1, B1, C1) em azul
- `highlight="right"` -> coluna 4 (A4, B4, C4) em azul

### 2. Novo componente: `TwoCardSelector`

Componente modal reutilizavel com a mesma estrutura do `HouseTypeSelector`:
- Props: `isOpen`, `onClose`, `title` (string), `leftLabel`, `rightLabel`, `leftIcon` (ReactNode), `rightIcon` (ReactNode), `onSelectLeft`, `onSelectRight`, `leftDisabled?`, `rightDisabled?`, `leftSubtext?`, `rightSubtext?`
- Usa Dialog em desktop e Sheet em mobile
- Mesmos estilos: titulo `text-2xl`, cartoes com `bg-white`, icones em `text-4xl` equivalente, fontes `text-base font-semibold`

### 3. Refatorar `SideSelector`

Eliminar toda a logica de piloti grid + SideButton do SideSelector. Substituir por chamadas ao `TwoCardSelector`:

**Modo `position` (posicionamento inicial):**
- Para `viewType === 'front'` (Casa Tipo 6): titulo "Lado Porta Casa Tipo 6", botoes "Superior" / "Inferior" com `PilotiGridIcon` highlight top/bottom
- Para `viewType === 'side2'` (Casa Tipo 3): titulo "Lado Porta Casa Tipo 3", botoes "Esquerdo" / "Direito" com `PilotiGridIcon` highlight left/right

**Modo `choose-instance` (escolher qual instancia mostrar):**
- Para `viewType === 'back'` com tipo3 (laterais): titulo "Qual das laterais deseja mostrar?", botoes "Superior" / "Inferior" com `PilotiGridIcon` highlight top/bottom
- Para `viewType === 'side1'` (quadrados fechados): titulo "Qual dos quadrados deseja mostrar?", botoes "Esquerdo" / "Direito" com `PilotiGridIcon` highlight left/right
- Botoes desabilitados se o slot ja esta no canvas (com subtexto "(ja no canvas)")

### 4. Refatorar `HouseTypeSelector`

Migrar para usar `TwoCardSelector` internamente, passando os icones FontAwesome existentes (faHome/faDoorOpen) e labels "Casa Tipo 6" / "Casa Tipo 3".

### Detalhes Tecnicos

**Arquivo: `src/components/rac-editor/PilotiGridIcon.tsx`** (novo)
- SVG inline com 12 circulos em grade 3x4
- Prop `highlight: 'top' | 'bottom' | 'left' | 'right'`
- Circulos destacados em `hsl(var(--primary))`, demais em `#d1d5db` (gray-300)
- Tamanho controlavel via className

**Arquivo: `src/components/rac-editor/TwoCardSelector.tsx`** (novo)
- Interface generica com props para titulo, labels, icones e callbacks
- Mesmo padrao Dialog/Sheet do HouseTypeSelector
- Estilo dos cartoes identico: `bg-white`, `border-2`, `rounded-xl`, `hover:scale-105`

**Arquivo: `src/components/rac-editor/SideSelector.tsx`** (simplificado)
- Remove PilotiMinimap, SideButton e toda a logica de grid
- Usa TwoCardSelector para ambos os modos
- Mantem a mesma interface publica (isOpen, onClose, viewType, onSelectSide, mode, instanceSlots)

**Arquivo: `src/components/rac-editor/HouseTypeSelector.tsx`** (simplificado)
- Usa TwoCardSelector internamente

### Mapeamento de modais

```text
+------------------------------------------+-----------------------------------+---------------------------+
| Modal atual                              | Novo titulo                       | Botoes                    |
+------------------------------------------+-----------------------------------+---------------------------+
| Posicionar Vista Frontal (tipo6)         | Lado Porta Casa Tipo 6            | Superior / Inferior       |
| Posicionar Vista Quadrado Aberto (tipo3) | Lado Porta Casa Tipo 3            | Esquerdo / Direito        |
| Qual das laterais deseja mostrar?        | Qual das laterais deseja mostrar? | Superior / Inferior       |
| Qual dos quadrados fechados...?          | Qual dos quadrados deseja mostrar?| Esquerdo / Direito        |
+------------------------------------------+-----------------------------------+---------------------------+
```

