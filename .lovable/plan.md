

# Plano: Novo Fluxo de Criacao e Gerenciamento de Vistas

## Resumo

Atualmente, o usuario cria cada vista individualmente e escolhe o lado a cada vez. O novo fluxo simplifica isso: ao selecionar o tipo de casa, o usuario posiciona apenas a vista frontal. Todas as outras vistas sao automaticamente atribuidas aos lados restantes. Depois, ao adicionar vistas pelo menu, o usuario apenas escolhe qual vista pre-atribuida quer mostrar no canvas.

---

## Fluxo Detalhado

### Casa Tipo 6

1. Usuario seleciona "Casa Tipo 6" na modal
2. Modal de posicionamento abre automaticamente perguntando: "Onde fica a Vista Frontal?" (Superior / Inferior)
3. Ao escolher, a Planta + Vista Frontal sao adicionadas ao canvas
4. Automaticamente se atribuem:
   - Vista Traseira = lado oposto da Frontal
   - Quadrado Fechado 1 = lado direito (relativo a quem olha a frontal)
   - Quadrado Fechado 2 = lado esquerdo
5. No menu, ao clicar "Quadrado Fechado", aparece uma mini-modal: "Mostrar: Esquerda ou Direita?"
6. Ao clicar "Vista Traseira", ela e adicionada diretamente (so tem um lado possivel)
7. Ao apagar uma vista do canvas, ela some visualmente mas mantem a atribuicao de lado
8. Ao re-adicionar, ela ja sabe qual lado usar
9. Remover a Planta reseta tudo

### Casa Tipo 3

1. Usuario seleciona "Casa Tipo 3" na modal
2. Modal pergunta: "Onde fica o Quadrado Aberto?" (Esquerda / Direita)
3. Planta + Quadrado Aberto sao adicionados ao canvas
4. Automaticamente:
   - Quadrado Fechado = lado oposto
   - Lateral 1 = lado superior
   - Lateral 2 = lado inferior
5. No menu, ao clicar "Vista Lateral", aparece: "Mostrar: Superior ou Inferior?"
6. Quadrado Fechado e adicionado diretamente
7. Mesma logica de remocao/re-insercao

---

## Alteracoes Tecnicas

### 1. HouseManager (`src/lib/house-manager.ts`)

**Novo conceito: Pre-atribuicao de lados**

Adicionar ao `HouseState`:
```typescript
// Mapeia cada "slot" de vista a um lado fixo
// Ex: { front: 'top', back: 'bottom', side1_left: 'left', side1_right: 'right' }
preAssignedSlots: Record<string, HouseSide>;

// Vistas que ja estiveram no canvas (para re-insercao com mesmo lado)
// Quando "removida" do canvas, o slot permanece aqui
removedSlots: Set<string>;
```

**Novos metodos:**
- `autoAssignAllSides(frontViewType: ViewType, frontSide: HouseSide)`: Calcula e atribui todos os lados automaticamente com base na posicao da vista frontal
- `getPreAssignedSlots(viewType: ViewType)`: Retorna os slots disponiveis para um tipo de vista (ex: para side1 do tipo6, retorna [{label: 'Esquerda', side: 'left'}, {label: 'Direita', side: 'right'}])
- `isSlotOnCanvas(viewType: ViewType, side: HouseSide)`: Verifica se esse slot ja esta no canvas
- `markSlotRemoved(viewType: ViewType, side: HouseSide)`: Marca como removido (logico)
- `getSlotSide(viewType: ViewType, slotIndex: number)`: Retorna o lado pre-atribuido

**Logica de auto-atribuicao para tipo6:**
```text
Se frontSide = 'top':
  front -> top
  back -> bottom
  side1 (instancia 1) -> right  ("a direita da frontal")
  side1 (instancia 2) -> left   ("a esquerda da frontal")

Se frontSide = 'bottom':
  front -> bottom
  back -> top
  side1 (instancia 1) -> left   (invertido)
  side1 (instancia 2) -> right
```

**Logica de auto-atribuicao para tipo3:**
```text
Se side2 (quadrado aberto) = 'left':
  side2 -> left
  side1 -> right (oposto)
  back (lateral 1) -> top  ("a direita do quadrado aberto")
  back (lateral 2) -> bottom ("a esquerda do quadrado aberto")

Se side2 = 'right':
  side2 -> right
  side1 -> left
  back (lateral 1) -> top
  back (lateral 2) -> bottom
```

### 2. SideSelector (`src/components/rac-editor/SideSelector.tsx`)

**Novo modo de operacao: "Escolher Instancia"**

Adicionar uma prop `mode`:
- `'position'` (atual): Mostra a grade de pilotis e pede para clicar no lado
- `'choose-instance'`: Mostra botoes simples para escolher qual instancia pre-atribuida mostrar

No modo `choose-instance`, a modal exibe:
- Titulo: "Qual vista deseja mostrar?"
- Botoes com os labels dos slots disponiveis (ex: "Esquerda" / "Direita" para quadrado fechado tipo6, ou "Superior" / "Inferior" para lateral tipo3)
- Slots ja no canvas ficam desabilitados com indicacao "(ja no canvas)"

### 3. RACEditor (`src/components/rac-editor/RACEditor.tsx`)

**Mudanca no fluxo de selecao de tipo:**

```text
handleHouseTypeSelected(type)
  -> setHouseType(type)
  -> initializeDefaultElements()
  -> Abrir SideSelector para a vista frontal do tipo:
     - tipo6: viewType='front', sides=['top','bottom']
     - tipo3: viewType='side2', sides=['left','right']
```

**Callback apos selecao do lado frontal:**
```text
handleFrontSideSelected(side)
  -> houseManager.autoAssignAllSides(frontViewType, side)
  -> addViewToCanvas('top')  // Planta
  -> addViewToCanvas(frontViewType, side)  // Vista frontal
  -> toast de sucesso
```

**Mudanca no menu de vistas (requestAddView):**

Para vistas com multiplas instancias (side1 do tipo6, back do tipo3):
- Em vez de abrir SideSelector no modo 'position', abrir no modo 'choose-instance'
- Listar apenas os slots pre-atribuidos que nao estao no canvas

Para vistas com instancia unica (back do tipo6, side1/side2 do tipo3):
- Adicionar diretamente usando o lado pre-atribuido
- Se ja estiver no canvas, mostrar toast de erro

**Mudanca na exclusao (handleDelete):**

Ao apagar uma vista:
- Chamar `houseManager.markSlotRemoved(viewType, side)` em vez de apenas `removeView`
- A atribuicao de lado permanece no `preAssignedSlots`
- Ao re-adicionar, o sistema sabe qual lado usar

**Reset ao apagar a Planta:**
- `houseManager.reset()` limpa tudo (preAssignedSlots, removedSlots, sideAssignments)
- Permite selecionar novo tipo

### 4. Toolbar (`src/components/rac-editor/Toolbar.tsx`)

**Mudanca nos contadores de limite:**

Os botoes do submenu agora refletem:
- "Disponivel" = pre-atribuido mas nao no canvas
- "No limite" = todas as instancias ja estao no canvas
- A logica de `isAtLimit` muda para verificar instancias no canvas vs instancias pre-atribuidas

---

## Arquivos a Modificar

| Arquivo | Tipo de Alteracao |
|---------|-------------------|
| `src/lib/house-manager.ts` | Adicionar pre-atribuicao de slots, novos metodos, logica de remocao logica |
| `src/components/rac-editor/SideSelector.tsx` | Novo modo 'choose-instance' com botoes simples |
| `src/components/rac-editor/RACEditor.tsx` | Novo fluxo pos-selecao de tipo, mudanca em requestAddView e handleDelete |
| `src/components/rac-editor/Toolbar.tsx` | Ajustar logica de isAtLimit para novo modelo |

---

## Resultado Esperado

1. Fluxo mais intuitivo: usuario so escolhe o posicionamento uma vez (vista frontal)
2. Todas as vistas ficam automaticamente associadas aos lados corretos
3. Re-insercao de vistas preserva o posicionamento original
4. O modelo 3D e a sincronizacao de pilotis continuam funcionando normalmente pois os dados de sideAssignments sao mantidos

