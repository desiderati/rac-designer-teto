

## Corrigir espacamento abaixo do titulo no modal "Posicionar Vista"

### Problema
Mesmo problema do modal "Escolha o Tipo de Casa": o espaco acima do titulo (padding-top do DialogContent = 24px) e maior que o espaco abaixo dele (gap entre header e conteudo = 16px).

### Solucao
Adicionar `pt-2` (8px) ao container do conteudo (`content`) dentro do `SideSelector`, igualando o espacamento visual abaixo do titulo ao de cima: 16px (gap) + 8px (pt-2) = 24px.

### Detalhes tecnicos

**Arquivo**: `src/components/rac-editor/SideSelector.tsx`

Na div que envolve o conteudo do modal (linha ~331), o `{content}` e renderizado logo apos o `DialogHeader`. O content em si e uma div que comeca com os botoes de posicionamento. Precisa envolver ou adicionar `pt-2` ao bloco de conteudo.

Duas opcoes de implementacao (ambas equivalentes):

**Opcao escolhida**: Adicionar uma div wrapper com `pt-2` ao redor de `{content}` tanto na versao desktop (Dialog) quanto na versao mobile (Sheet):

Desktop (linha ~331):
```
{content}
```
Para:
```
<div className="pt-2">{content}</div>
```

Mobile (linha ~346):
```
{content}
```
Para:
```
<div className="pt-2">{content}</div>
```

Isso garante consistencia com a correcao ja aplicada no `HouseTypeSelector`.

