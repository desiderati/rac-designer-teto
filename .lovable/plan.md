
# Plano de Correções: Sistema de Tipos de Casa

## Resumo das Correções

O usuário identificou vários problemas na última implementação que precisam ser corrigidos para restaurar funcionalidades existentes e simplificar a interface.

---

## Problemas Identificados

### 1. Seleção de Lado (SideSelector)
**Problema**: A funcionalidade de seleção de lado da planta para anexar vistas pode ter sido afetada.

**Correção**: Manter a funcionalidade de `SideSelector` exatamente como antes - sempre abrir a modal para escolher o lado da planta ao adicionar vistas de elevação, independentemente do tipo de casa.

### 2. Badges de Numeração
**Problema**: Foram adicionados badges `0/2`, `1/2`, `2/2` nos botões de vistas que podem ter múltiplas instâncias.

**Correção**: Remover os badges e a lógica de exibição de contagem. Não é necessário mostrar essa informação visual.

### 3. Comportamento dos Botões Desabilitados
**Problema**: Os botões agora usam `disabled={true}` que bloqueia o clique completamente.

**Correção**: Restaurar o comportamento anterior onde:
- O botão fica cinza (visualmente desabilitado)
- O clique ainda é possível
- Ao clicar, exibe um toast de erro explicando o limite

### 4. Modal de Seleção de Tipo de Casa
**Problema**: A modal tem informações extras (descrição de pilotis, lista de vistas disponíveis).

**Correção**: Simplificar para mostrar apenas:
- Ícone da casa
- Texto "Casa Tipo 6" ou "Casa Tipo 3"

### 5. Funcionalidade de Seleção de Pilotis
**Correção**: Garantir que toda a funcionalidade de seleção e edição de pilotis continue funcionando como antes.

---

## Detalhes Técnicos

### Arquivo: `src/components/rac-editor/HouseTypeSelector.tsx`

Simplificar o componente `TypeCard`:
- Remover prop `description`
- Remover prop `views`
- Manter apenas ícone e título

### Arquivo: `src/components/rac-editor/Toolbar.tsx`

1. Remover a prop `badge` dos `SubMenuButton`
2. Remover `isDisabled` dos `SubMenuButton` - os botões devem sempre permitir clique
3. Manter o visual cinza quando no limite, mas permitir clique (o toast é exibido pelo `RACEditor`)

**Ajuste no `SubMenuButton`**:
- O botão não terá mais `disabled={true}`
- O visual "desabilitado" será controlado por uma prop `isAtLimit` que apenas muda o estilo
- O clique sempre é permitido

### Arquivo: `src/components/rac-editor/RACEditor.tsx`

1. Verificar que `requestAddView` ainda abre o `SideSelector` quando necessário
2. O toast de erro para limite atingido já existe em `requestAddView` - manter funcionando

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/rac-editor/HouseTypeSelector.tsx` | Simplificar TypeCard (remover description e views) |
| `src/components/rac-editor/Toolbar.tsx` | Remover badges, ajustar comportamento de botões |

---

## Resultado Esperado

1. ✅ Modal de tipo de casa mostra apenas ícone + nome
2. ✅ Vistas sempre passam pelo SideSelector para escolher lado
3. ✅ Botões de vista ficam cinzas quando no limite mas permitem clique
4. ✅ Ao clicar em botão no limite, toast de erro é exibido
5. ✅ Sem badges de contagem nos botões
6. ✅ Funcionalidade de pilotis inalterada
