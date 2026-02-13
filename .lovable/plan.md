
# Definir Niveis dos Pilotis de Canto Apos Selecao de Vista

## Resumo

Criar um novo modal que aparece apos o usuario selecionar o lado da vista frontal (ou quadrado aberto). Neste modal, o usuario define os niveis dos 4 pilotis de canto (A1, A4, C1, C4) antes da planta e vista serem adicionadas ao canvas. O nivel padrao de 0,3 deixa de existir -- os niveis iniciais serao definidos pelo usuario neste passo.

## Fluxo do Usuario

```text
Tipo de Casa -> Posicionar Vista -> [NOVO] Definir Niveis -> Planta + Vista adicionadas
```

1. Usuario escolhe o tipo de casa (Tipo 6 ou Tipo 3)
2. Usuario posiciona a vista inicial (SideSelector)
3. **Novo modal** aparece para definir niveis de A1, A4, C1 e C4
4. Navegacao sequencial: A1 -> A4 -> C1 -> C4 (e para tras)
5. Botao "Aplicar" so fica habilitado quando todos os 4 niveis forem definidos
6. Apos aplicar, a planta e a vista sao inseridas no canvas com os niveis definidos

## Layout do Modal

- Titulo: "Definir Niveis" com navegacao < > entre A1, A4, C1, C4
- Minimap da planta (mesmo PilotiMinimap do SideSelector) com o piloti atual destacado
- Campo "Definir piloti como mestre?" (switch) + campo "Nivel do piloti (0,2 a 1,50 m)"
- Botoes "Cancelar" e "Aplicar" (aplicar desabilitado ate todos serem definidos)

## Detalhes Tecnicos

### 1. Novo componente: `NivelDefinitionModal.tsx`

- Props: `isOpen`, `onClose`, `onApply(niveis: Record<string, { nivel: number; isMaster: boolean }>)`
- Estado interno: objeto com os 4 niveis e flags de mestre, indexado por pilotiId
- Pilotis navegaveis: `CORNER_PILOTI_IDS` na ordem A1, A4, C1, C4
- Campo de nivel com validacao identica ao PilotiEditor (0,2 a 1,50 m fixo, independente de altura)
- PilotiMinimap reutilizado, com prop adicional `selectedPiloti` para destacar o piloti atual (azul)
- Desktop: Dialog (sm:max-w-sm); Mobile: Sheet (bottom)

### 2. Atualizacao do PilotiMinimap

- Nova prop opcional `selectedPiloti?: string` (nome do piloti, ex: "A1")
- Quando definida, o piloti correspondente recebe destaque azul (bg-primary border-primary)

### 3. Alteracao do fluxo em `RACEditor.tsx`

- Novo estado: `nivelDefinitionOpen: boolean` e `pendingNivelSide: HouseSide | null`
- Em `handleSideSelected`, quando for posicionamento inicial (sem pre-assigned slots):
  - Em vez de adicionar imediatamente, salvar o lado selecionado e abrir o NivelDefinitionModal
- Novo handler `handleNiveisApplied(niveis)`:
  - Atualizar os pilotis no HouseManager com os niveis definidos
  - Proceder com `addViewToCanvas` para planta e vista
  - Manter o repositionamento existente (planta acima, vista abaixo)

### 4. Remocao do nivel padrao 0,3

- Em `house-manager.ts`: alterar `DEFAULT_PILOTI` de `nivel: 0.3` para `nivel: 0.3` (manter como fallback interno, mas os valores serao sobreescritos pelo modal antes da insercao)
- Os valores de 0.3 em `canvas-utils.ts` permanecem como fallback de seguranca, mas na pratica serao substituidos pelos valores definidos pelo usuario

### 5. Indicador de progresso

- Cada piloti comeca com nivel nulo/indefinido internamente
- Ao navegar para um piloti, o campo inicia com "0,30" como sugestao
- Um piloti e considerado "definido" apos o usuario confirmar seu valor (ao navegar para o proximo ou voltar)
- Botao "Aplicar" fica habilitado quando todos os 4 pilotis tiverem sido visitados/definidos

### Arquivos a criar
- `src/components/rac-editor/NivelDefinitionModal.tsx`

### Arquivos a editar
- `src/components/rac-editor/PilotiMinimap.tsx` (prop selectedPiloti)
- `src/components/rac-editor/RACEditor.tsx` (novo estado e fluxo)
