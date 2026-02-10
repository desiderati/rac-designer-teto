
# Configuracoes - Modal de Preferencias do Usuario

## Resumo

Adicionar um botao "Configuracoes" como ultima opcao no menu "Mais Opcoes" (overflow). Ao clicar, abre uma modal (Dialog) com duas opcoes on/off:

1. **Navegacao automatica para o proximo piloti** ao definir a altura na edicao de piloti
2. **Zoom/Minimap desabilitado por padrao** (inverte o valor inicial de `showZoomControls`)

As preferencias serao persistidas no `localStorage`.

---

## Detalhes Tecnicos

### 1. Novo arquivo: `src/lib/settings.ts`

Modulo utilitario para gerenciar configuracoes persistidas no localStorage:

- `getSettings()`: retorna objeto com valores atuais (lendo do localStorage com defaults)
- `updateSetting(key, value)`: atualiza uma configuracao e salva no localStorage
- Chaves:
  - `autoNavigatePiloti` (default: `false`)
  - `zoomDisabledByDefault` (default: `false`)

### 2. Novo arquivo: `src/components/rac-editor/SettingsModal.tsx`

Modal usando o componente `Dialog` existente:
- Titulo: "Configuracoes"
- Duas linhas, cada uma com label descritivo e um `Switch` (on/off)
- Ao alternar, salva imediatamente no localStorage via `settings.ts`

### 3. Alteracoes em `Toolbar.tsx`

- Importar icone `faGear` do FontAwesome
- Adicionar nova prop `onOpenSettings` no `ToolbarProps`
- Adicionar botao "Configuracoes" no submenu overflow, entre "Dicas" e o final (ultima posicao, apos "Dicas")

Correcao: "Dicas" deve continuar sendo o penultimo; "Configuracoes" sera o ultimo item.

### 4. Alteracoes em `RACEditor.tsx`

- Importar `SettingsModal` e `getSettings`
- Adicionar estado `isSettingsOpen` para controlar a modal
- Passar `onOpenSettings` para o Toolbar
- Inicializar `showZoomControls` com base na configuracao `zoomDisabledByDefault` do localStorage (se `true`, inicia com `showZoomControls = false`)
- Renderizar `<SettingsModal>` no JSX

### 5. Alteracoes em `PilotiEditor.tsx`

- Importar `getSettings` de `settings.ts`
- No `HeightControls`, ao clicar em um botao de altura: se `autoNavigatePiloti` estiver ativo, apos definir a altura, aplicar automaticamente e navegar para o proximo piloti (chamar `handleApply` seguido de `handleNavigate('next')` internamente)
- A logica sera: ao clicar no botao de altura, salvar a altura atual via houseManager, e se houver proximo piloti, navegar automaticamente para ele sem fechar o editor

### Fluxo da navegacao automatica no PilotiEditor

Quando a configuracao esta ativa:
1. Usuario clica em um botao de altura (ex: "1.0m")
2. A altura e aplicada imediatamente ao piloti atual via `houseManager.updatePiloti`
3. Se existir um proximo piloti, navega automaticamente para ele
4. O editor permanece aberto no proximo piloti
5. Se nao houver proximo, o editor fecha normalmente (aplica e fecha)
