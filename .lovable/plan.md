

# Plano: Novo Fluxo de Criacao e Gerenciamento de Vistas

## Status: ✅ IMPLEMENTADO

## Resumo

O fluxo foi simplificado: ao selecionar o tipo de casa, o usuario posiciona apenas a vista frontal (tipo6) ou quadrado aberto (tipo3). Todas as outras vistas sao automaticamente atribuidas aos lados restantes. Ao adicionar vistas pelo menu, o usuario apenas escolhe qual vista pre-atribuida quer mostrar no canvas.

## Alteracoes Realizadas

### 1. HouseManager (`src/lib/house-manager.ts`)
- Adicionado `preAssignedSlots` ao `HouseState`
- Novo método `autoAssignAllSides()` para calcular e atribuir todos os lados automaticamente
- Novo método `getPreAssignedSlots()` para obter slots disponiveis por tipo de vista
- Novo método `hasPreAssignedSlots()` para verificar se slots existem
- `setHouseType(null)` agora limpa `preAssignedSlots`

### 2. SideSelector (`src/components/rac-editor/SideSelector.tsx`)
- Novo modo `choose-instance` com botoes simples para escolher instancia pre-atribuida
- Exportado tipo `InstanceSlot` para uso externo
- Props `mode` e `instanceSlots` adicionadas

### 3. RACEditor (`src/components/rac-editor/RACEditor.tsx`)
- `handleHouseTypeSelected` agora abre SideSelector para posicionamento inicial
- `handleSideSelected` detecta posicionamento inicial e chama `autoAssignAllSides`
- `requestAddView` usa slots pre-atribuidos: adicao direta para instancia unica, choose-instance para multiplas
- `handleSideSelectorClose` reseta tipo de casa se usuario cancelar posicionamento inicial

### 4. Toolbar - Sem alteracoes necessarias (logica existente de isAtLimit ja funciona corretamente)
