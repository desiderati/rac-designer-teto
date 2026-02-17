

## Simplificar modais e usar Sheet no mobile

Remover icone e botao de fechar dos cabecalhos dos tres modais (Configuracoes, Reiniciar Canvas, Desagrupar Casa), e no mobile usar Sheet inferior igual ao "Escolha o Tipo de Casa". Tambem remover o X do SheetContent para que nenhum modal mobile tenha o botao de fechar no canto.

### Mudancas

#### 1. SheetContent - Remover X padrao (sheet.tsx)

Remover o `SheetPrimitive.Close` com o icone X que aparece automaticamente em todo SheetContent. O fechamento no mobile sera feito pelo overlay (clique fora) ou pelos botoes de acao.

#### 2. SettingsModal.tsx - Dialog/Sheet com cabecalho simples

- Desktop: `Dialog` com `DialogHeader` + `DialogTitle` centralizado (sem icone, sem X), igual ao TwoCardSelector
- Mobile: `Sheet` bottom com `SheetHeader` + `SheetTitle` centralizado
- Manter o cartao branco e os botoes Cancelar/Confirmar
- Usar `useIsMobile()` para alternar entre Dialog e Sheet

#### 3. RACEditor.tsx - Reiniciar Canvas e Desagrupar Casa

Mesmo padrao: Dialog no desktop, Sheet no mobile. Cabecalho apenas com titulo centralizado (sem icone, sem X). Corpo em cartao branco. Botoes de acao no rodape.

### Detalhes tecnicos

**Arquivos modificados:**
- `src/components/ui/sheet.tsx` - Remover o bloco `SheetPrimitive.Close` do SheetContent
- `src/components/rac-editor/SettingsModal.tsx` - Redesign com Dialog/Sheet, cabecalho simplificado
- `src/components/rac-editor/RACEditor.tsx` - Redesign dos dois dialogos de confirmacao com Dialog/Sheet

**Padrao de referencia (TwoCardSelector):**
- Desktop: `Dialog` > `DialogContent hideCloseButton` > `DialogHeader` > `DialogTitle`
- Mobile: `Sheet` > `SheetContent side="bottom"` > `SheetHeader` > `SheetTitle`
- Titulo centralizado `text-2xl`
- Sem icone, sem botao X

