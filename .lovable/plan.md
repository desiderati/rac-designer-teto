
## Plano: Ajustes visuais e lógica de nível mestre

### Alterações em ambos os arquivos (`PilotiEditor.tsx` e `NivelDefinitionModal.tsx`)

**Visuais:**

1. **Fundo branco nos botões de navegação** (< >) - adicionar `bg-white` na classe dos botões circulares
2. **Fundo branco no botão Cancelar** - adicionar `bg-white` na classe
3. **Painel desktop com fundo branco** (PilotiEditor) - trocar `bg-popover` por `bg-white` no container flutuante
4. **Cor do valor do nível = cor primária** - trocar `text-3xl font-bold` por `text-4xl font-bold text-primary` (aumento de 20% + cor da barra)
5. **Sufixo "m" permanece inalterado** (`text-lg text-muted-foreground`)
6. **Duplicar espaçamento entre valor e slider** - trocar `space-y-4` por `space-y-6` na seção de nível
7. **Aumentar espaçamento do slider** - trocar `space-y-2 px-1` por `space-y-3 px-2` no container do slider

**Lógica (NivelDefinitionModal - inserção):**

8. **Nível do mestre como piso para os demais** - Na função `handleNivelChange`, quando o piloti atual é mestre e o nível sobe, elevar todos os demais cantos que estiverem abaixo. Além disso, ajustar a validação: o nível mínimo de qualquer canto não-mestre será o nível do mestre (não apenas 0,20m). Ou seja, o clamp do nível de cantos não-mestre usa `Math.max(masterNivel, 0.20)` como mínimo.

9. **Impedir redução abaixo do mestre** - Ao navegar para outro canto que não é mestre, o botão (-) e o slider devem respeitar o nível do mestre como mínimo. Isso é feito ajustando o `clampNivel` para receber o nível mínimo do mestre quando aplicável, e desabilitando o botão (-) quando `entry.nivel <= masterNivel`.

### Detalhes técnicos

**`NivelDefinitionModal.tsx`:**
- `clampNivel` passa a aceitar um parâmetro `minNivel` opcional (default 0.20)
- Ao renderizar, se o canto atual não é mestre e existe um mestre, o min do slider e do clamp é `masterNivel`
- Botão (-) disabled quando `entry.nivel <= minNivel` (onde minNivel = masterNivel se não é mestre, senão 0.20)
- Label mínimo do slider muda para mostrar o valor mínimo atual

**`PilotiEditor.tsx`:**
- Mesmas mudanças visuais (fundo branco, cor do nível, espaçamento)
- A lógica de mestre no PilotiEditor já é aplicada ao salvar; não precisa de mudança de lógica aqui

### Arquivos modificados
1. `src/components/rac-editor/PilotiEditor.tsx` - ajustes visuais
2. `src/components/rac-editor/NivelDefinitionModal.tsx` - ajustes visuais + lógica de piso do mestre
