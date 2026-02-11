

# Ajustes no Modal de Configuracoes

## Mudancas

### 1. `src/components/rac-editor/SettingsModal.tsx`
- Remover `DialogDescription` ("Preferencias do editor")
- Centralizar o titulo "Configuracoes" (`text-center`)
- Usar `hideCloseButton` no `DialogContent` para remover o botao X
- Alterar texto da opcao de piloti para: "Navegar automaticamente para o proximo piloti ao definir a altura do piloti selecionado"
- Alterar texto da opcao de zoom para: "Habilitar funcionalidade de Zoom/Minimap por padrao"
- Inverter a chave de settings: renomear `zoomDisabledByDefault` para `zoomEnabledByDefault`

### 2. `src/lib/settings.ts`
- Renomear `zoomDisabledByDefault` para `zoomEnabledByDefault` (default: `false`, desmarcada por padrao)
- Alterar `autoNavigatePiloti` default para `true` (marcada por padrao)

### 3. `src/components/rac-editor/RACEditor.tsx`
- Ajustar a inicializacao de `showZoomControls`: agora usa `getSettings().zoomEnabledByDefault` diretamente (sem inversao)
- Ao alterar configuracoes (callback `onSettingsChange`), atualizar `showZoomControls` de acordo

### 4. Logica invertida
- Antes: `zoomDisabledByDefault = false` significava zoom visivel; `true` significava oculto
- Agora: `zoomEnabledByDefault = false` (desmarcada) significa zoom oculto; `true` (marcada) significa zoom visivel
- Na inicializacao: `showZoomControls = getSettings().zoomEnabledByDefault`

