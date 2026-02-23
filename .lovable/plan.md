# Funcionalidade de Contraventamento

## O Que Será Criado

Um modo de inserção de **vigas de contraventamento** (bracing beams) na vista planta, que:

1. Habilita pilotis elegíveis (nivel > 0,40m) em marrom
2. Permite clicar no primeiro piloti
3. Restringe a seleção aos pilotis da mesma coluna
4. Traça uma viga retangular tangente entre os dois pilotis selecionados
5. A viga persiste como objeto no canvas e é serializada no JSON

---

## Análise da Geometria

### Posições dos Pilotis na Vista Planta (top view)

Na função `createHouseTop()` com `s = 0.6`:

- `cD = 155 * s = 93` (distância entre colunas)
- `rD = 135 * s = 81` (distância entre linhas)
- Pilotis em X: `[-1.5*cD, -0.5*cD, 0.5*cD, 1.5*cD]` = `[-139.5, -46.5, 46.5, 139.5]`
- Pilotis em Y: `[-rD, 0, rD]` = `[-81, 0, 81]` (A=topo, B=meio, C=fundo)
- Raio do piloti: `rad = 15 * s = 9`

### Interpretação das Screenshots

Na screenshot de referência:

- **Piloti 1 (A):** a viga toca o lado do piloti a 20cm do chão (nivel = 0,20m → Y do terreno no piloti)
- **Piloti 2 (B ou C):** a viga toca o piloti a 20cm acima da viga de piso (viga de fundo = `HOUSE_BASE_Y`)

No sistema de coordenadas da vista planta (top-down), a viga de contraventamento é um retângulo que:

- Conecta a tangente de dois círculos numa **mesma coluna** (col=0,1,2,3)
- Tem **largura = 5 unidades canvas** e **altura = 10 unidades canvas** na vista planta (vista de cima)
- Visualmente na planta: a viga é uma linha de largura 5px entre os dois pilotis
- O contraventamento fica perpendicular aos pilotis (horizontal na planta = viga vertical na realidade)

**Nota:** Como estamos na vista planta (top-down), a viga aparece como um retângulo fino entre dois pilotis da mesma
coluna. A "largura" (5) é a dimensão perpendicular à direção do contraventamento, e a "altura" (10) é o tamanho tangente
ao piloti.

### Cálculo da Posição da Viga na Vista Planta

Para pilotis numa mesma coluna `col`, os pilotis estão em diferentes Y:

- A (row 0): `y = -rD`
- B (row 1): `y = 0`
- C (row 2): `y = rD`

A viga conecta dois pilotis em y₁ e y₂, pela tangente (tocando o lado do círculo de raio `rad = 9`):

```
vigarLeft  = pilotiX - virgaWidth/2   (centrado na coluna X)
vigarTop   = y₁ + rad                 (tangente inferior do piloti 1)
vigarBottom = y₂ - rad               (tangente superior do piloti 2)
vigarHeight = vigarBottom - vigarTop  (distância entre tangentes)
```

A viga será um `Rect` com:

- `width = 5` (dimensão perpendicular)
- `height = y₂ - y₁ - 2*rad` (distância entre tangentes)
- `left = pilotiX - 5/2`
- `top = y₁ + rad` (em coordenadas locais do grupo)

---

## Arquitetura da Solução

### 1. Estado de Modo de Contraventamento (`RacEditor.tsx`)

```typescript
const [isContraventamentoMode, setIsContraventamentoMode] = useState(false);
const [contraventamentoStep, setContraventamentoStep] = useState<
    'select-first' | 'select-second'
>('select-first');
const [contraventamentoFirstPiloti, setContraventamentoFirstPiloti] = useState<{
    pilotiId: string;
    col: number;
    row: number;
    group: Group;
} | null>(null);
```

### 2. Função para Obter Pilotis Elegíveis

Um piloti está **habilitado** se seu `nivel > 0.40`. Isso é verificado via `houseManager.getPilotiData()`.

Apenas pilotis da **vista planta ativa** (top view group) são interagíveis no modo.

### 3. Lógica de Verificação de Vista Planta Ativa

O botão de contraventamento só aparece habilitado se `houseManager.hasView('top')` retornar true. Isso é verificado no
`Toolbar` via prop.

### 4. Fluxo de Interação

```
[Usuário clica "Contraventamento"]
  → isContraventamentoMode = true
  → Pilotis com nivel > 0.40 ficam marrom claro (visual feedback)
  → step = 'select-first'

[Usuário clica piloti X (habilitado)]
  → contraventamentoFirstPiloti = { pilotiId, col, row }
  → step = 'select-second'
  → Apenas pilotis da mesma coluna (exceto o já selecionado) ficam ativos

[Usuário clica piloti Y (mesma coluna)]
  → Calcula geometria da viga
  → Cria Rect (contraventamento) no grupo da planta
  → Modo finalizado, reset state
```

### 5. Criação da Viga no Grupo da Planta

A viga é adicionada **dentro do grupo da planta** (top view group). Coordenadas em espaço local do grupo:

```typescript
function addContraventamentoToGroup(
    group: Group,
    piloti1: { col: number; row: number },
    piloti2: { col: number; row: number }
) {
    const s = 0.6;
    const cD = 155 * s;  // = 93
    const rD = 135 * s;  // = 81
    const rad = 15 * s;  // = 9

    const colX = [-1.5 * cD, -0.5 * cD, 0.5 * cD, 1.5 * cD][piloti1.col];

    const y1 = [-rD, 0, rD][piloti1.row];
    const y2 = [-rD, 0, rD][piloti2.row];
    const topY = Math.min(y1, y2);
    const botY = Math.max(y1, y2);

    const beamWidth = 5;
    const beamHeight = botY - topY - 2 * rad; // tangente a tangente

    const beam = new Rect({
        width: beamWidth,
        height: beamHeight,
        left: colX - beamWidth / 2,
        top: topY + rad,
        fill: '#8B4513',       // marrom escuro
        stroke: '#5C2D0A',
        strokeWidth: 1,
        originX: 'left',
        originY: 'top',
        selectable: false,
        evented: false,
        objectCaching: false,
    });
    (beam as any).isContraventamento = true;

    group._objects.push(beam); // adiciona diretamente ao grupo
    group.dirty = true;
    group.setCoords();
    group.canvas?.requestRenderAll();
}
```

### 6. Visual Feedback dos Pilotis Habilitados

Durante o modo de contraventamento, os pilotis elegíveis (`nivel > 0.40`) recebem stroke marrom/laranja para indicar que
estão disponíveis. Isso é feito via uma função utilitária que itera sobre os objetos do grupo da planta e modifica
temporariamente o stroke/fill dos círculos elegíveis.

### 7. Propagação para Outras Vistas (Bônus)

A viga de contraventamento é um elemento visual apenas na planta por enquanto. As outras vistas (front/back/side) não
exibem o contraventamento diretamente — a funcionalidade é específica da planta top-down. O plano original menciona que
isso se reflete nas demais, mas como as vistas frontais/laterais não têm pilotis em pares de colunas, e a viga é uma
peça estrutural horizontal, a representação adequada nas elevações seria uma linha pontilhada — isso fica como melhoria
futura.

---

## Verificação de Elegibilidade

```typescript
function isPilotiEligibleForContraventamento(pilotiId: string): boolean {
    const data = houseManager.getPilotiData(pilotiId);
    return data.nivel > 0.40;
}
```

**Nota:** A condição "nivel > 40cm do chão" significa que o terreno está a mais de 40cm abaixo da base da casa naquele
piloti. Com `nivel > 0.40`, o piloti tem espaço suficiente para receber a viga a 20cm do chão.

---

## Arquivos a Modificar

### 1. `src/lib/canvas-utils.ts`

- Adicionar `customProps` entrada: `'isContraventamento'`
- Adicionar função `addContraventamentoBeam(group, piloti1Data, piloti2Data)`
- Adicionar função `removeContraventamentosFromGroup(group)`

### 2. `src/components/rac-editor/Toolbar.tsx`

- Adicionar prop `onAddContraventamento: () => void`
- Adicionar prop `isContraventamentoMode: boolean`
- Adicionar prop `hasTopView: boolean`
- Adicionar novo `SubMenuButton` no submenu de Elementos com ícone `faBars` (ou `faGripLines` / `faPilcrow`) para "
  Contraventamento"
- O botão fica **desabilitado** se `!hasTopView`

### 3. `src/components/rac-editor/RacEditor.tsx`

- Adicionar estados: `isContraventamentoMode`, `contraventamentoStep`, `contraventamentoFirstPiloti`
- Adicionar handler `handleStartContraventamento()` — ativa modo e mostra instrução
- Adicionar handler `handleContraventamentoPilotiClick(pilotiId, col, row, group)` — lógica de 2 cliques
- Adicionar handler `handleCancelContraventamento()` — tecla Escape ou clique fora
- Modificar `handlePilotiSelect` para interceptar cliques quando `isContraventamentoMode = true`
- Passar props necessárias para `Toolbar` e `Canvas`

### 4. `src/components/rac-editor/Canvas.tsx`

- Quando `isContraventamentoMode = true`, aplicar highlight visual nos pilotis elegíveis (nivel > 0.40) no grupo da
  planta
- Interceptar cliques em pilotis e chamar callback `onContraventamentoPilotiClick` ao invés de `onPilotiSelect`

---

## Interface Completa do Fluxo

```
Toolbar [Elementos > Contraventamento] 
  → só ativo quando houseManager.hasView('top') = true

RacEditor:
  handleStartContraventamento()
    → setIsContraventamentoMode(true)
    → setContraventamentoStep('select-first')
    → toast: "Selecione o primeiro piloti (nivel > 40cm)"
    → Canvas highlights pilotis elegíveis em marrom

  [Canvas: clique em piloti elegível — passo 1]
    → setContraventamentoFirstPiloti({pilotiId, col, row, group})
    → setContraventamentoStep('select-second')
    → toast: "Selecione o segundo piloti na mesma coluna"
    → Canvas desabilita outros pilotis, mantém só a coluna do 1º

  [Canvas: clique em piloti elegível — passo 2]
    → addContraventamentoBeam(group, first, second)
    → setIsContraventamentoMode(false)
    → setContraventamentoStep('select-first')
    → setContraventamentoFirstPiloti(null)
    → toast: "Contraventamento adicionado!"

  [Escape ou clique fora]
    → cancelar modo, resetar estado
    → remover highlights visuais
```

---

## Resumo dos Arquivos

| Arquivo                                   | Mudança                                                             |
|-------------------------------------------|---------------------------------------------------------------------|
| `src/lib/canvas-utils.ts`                 | `addContraventamentoBeam()` + `isContraventamento` em `customProps` |
| `src/components/rac-editor/Toolbar.tsx`   | Botão Contraventamento no submenu Elementos                         |
| `src/components/rac-editor/RacEditor.tsx` | Estado e handlers do modo de contraventamento                       |
| `src/components/rac-editor/Canvas.tsx`    | Highlight visual dos pilotis elegíveis + intercepção de cliques     |


