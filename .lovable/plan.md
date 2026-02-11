

# Correcao: Navegacao automatica ao clicar na altura (Desktop)

## Problema

O popover desktop do PilotiEditor tem dois conjuntos de botoes de altura:
1. O componente `HeightControls` (usado no mobile/drawer) -- contem a logica de auto-navegacao
2. Botoes inline duplicados no popover desktop (linhas 457-471) -- fazem apenas `setTempHeight(h)`, sem auto-navegacao

## Solucao

Substituir os botoes inline do popover desktop pelo componente `HeightControls` (com `compact`), que ja possui toda a logica de auto-navegacao implementada.

## Detalhe tecnico

No arquivo `src/components/rac-editor/PilotiEditor.tsx`, substituir o bloco de botoes inline (linhas 457-472) por `<HeightControls compact />`, exatamente como ja e feito no drawer mobile.

