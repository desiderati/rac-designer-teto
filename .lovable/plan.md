

# Padronizar padding interno das modais

## Objetivo

Usar o padding da modal "Posicionar Vista Lateral" (SideSelector) como referencia para todas as demais modais, exceto o editor de Pilotis.

## Modais afetadas

1. **HouseTypeSelector** (Escolha o Tipo de Casa)
2. **SettingsModal** (Configuracoes)
3. **GenericEditor** (Editar Linha Reta / Editar Seta Simples / Editar Objeto / Editar Distancia) - apenas o painel desktop
4. **AlertDialog de Reiniciar Canvas** (em RACEditor.tsx)
5. **SideSelector modo choose-instance** (Qual dos quadrados fechados...)

## Referencia: SideSelector (modo position)

- `DialogContent className="sm:max-w-sm" hideCloseButton` com padding padrao `p-6`
- Conteudo envolvido em `mx-auto w-full max-w-xs`
- Titulo centralizado

## Alteracoes por arquivo

### 1. `src/components/rac-editor/HouseTypeSelector.tsx`
- Alterar `sm:max-w-md` para `sm:max-w-sm` no DialogContent (alinhar largura maxima)

### 2. `src/components/rac-editor/SettingsModal.tsx`
- Alterar `max-w-md` para `sm:max-w-sm` no DialogContent (alinhar largura e usar breakpoint consistente)

### 3. `src/components/rac-editor/GenericEditor.tsx` (painel desktop)
- Ajustar o header draggable de `px-3 py-2` para `px-4 py-3`
- Ajustar o body de `p-3 pt-0` para `p-4 pt-0`
- Ajustar `min-w-[220px]` para `min-w-[260px]` para melhor proporcao

### 4. `src/components/rac-editor/RACEditor.tsx` (AlertDialog Reiniciar)
- Alterar `max-w-md` para `sm:max-w-sm` no AlertDialogContent

### 5. `src/components/rac-editor/SideSelector.tsx` (modo choose-instance)
- Ja usa `sm:max-w-sm`, mas falta `hideCloseButton` no DialogContent (linha 164) - adicionar para consistencia

