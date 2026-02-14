

## Ajustes visuais no PilotiEditor (editor no canvas)

### Problema
O painel flutuante do PilotiEditor no canvas usa fundo branco (`bg-white`) tanto no painel externo quanto no cartao interno, sem contraste. O modal de insercao (NivelDefinitionModal) usa o fundo azul claro do tema (`bg-background`, que e `hsl(209, 40%, 96%)`) com o cartao branco dentro, criando contraste visual.

### Alteracoes

**1. Fundo do painel flutuante (PilotiEditor.tsx, linha 440)**
- Trocar `bg-white` por `bg-background` no container externo do desktop
- Isso cria o mesmo contraste azul-claro/branco do modal de insercao

**2. Padding do painel (PilotiEditor.tsx, linha 440)**
- Trocar `p-4` por `p-6` para igualar ao padding do DialogContent

**3. Espacamento acima de "Nivel do Piloti" (PilotiEditor.tsx, linha 335)**
- Remover `pt-2` da div `space-y-4 pt-2`, ficando apenas `space-y-4`

**4. Espacamento abaixo de "Tamanho dos Pilotis" (PilotiEditor.tsx, linha 383)**
- Trocar `space-y-2` por `space-y-4` para duplicar o gap entre o titulo e a grade de botoes

### Arquivos modificados
- `src/components/rac-editor/PilotiEditor.tsx` (4 alteracoes pontuais)

