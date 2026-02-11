
# Feedback visual ao clicar na altura do piloti

## O que muda

Ao clicar em um botao de altura com auto-navegacao ativa, o botao ficara visualmente "pressionado" (destacado) por ~300ms antes de navegar para o proximo piloti. Isso da ao usuario a confirmacao visual de que o clique foi registrado.

## Detalhe tecnico

No componente `HeightControls` dentro de `PilotiEditor.tsx`:

1. Adicionar um estado `clickedHeight` que armazena temporariamente qual altura foi clicada
2. Ao clicar num botao de altura (com auto-navegacao ativa):
   - Setar `clickedHeight` para o valor clicado (botao fica destacado imediatamente)
   - Aplicar as mudancas no piloti atual (houseManager, onHeightChange, onNavigate)
   - Apos ~300ms via `setTimeout`, navegar para o proximo piloti e limpar `clickedHeight`
3. O botao clicado usa `variant="default"` durante o delay, dando feedback visual claro
4. Quando auto-navegacao esta desativada, o comportamento permanece instantaneo (sem delay)

### Arquivo editado
- `src/components/rac-editor/PilotiEditor.tsx` - funcao `handleHeightClick` dentro de `HeightControls`
