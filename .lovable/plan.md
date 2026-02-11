

## Corrigir texto se distanciando ao redimensionar linha/seta

### Problema
O `triggerLayout()` na linha 1313 recalcula os limites do grupo a cada evento de scaling, o que desloca o texto progressivamente. O handler original da seta em `canvas-utils.ts` (linha 905-918) NAO usa `triggerLayout()` - ele simplesmente define a largura manualmente com `this.set({ width: nw, scaleX: 1, scaleY: 1 })`, e funciona perfeitamente.

### Solucao
Substituir `this.triggerLayout()` por `this.set({ width: nw, scaleX: 1, scaleY: 1 })`, seguindo exatamente o padrao que ja funciona na seta simples.

### Detalhes tecnicos

**Arquivo**: `src/components/rac-editor/RACEditor.tsx`

**Linhas 1312-1313** - Trocar:

```typescript
this.set({ scaleX: 1, scaleY: 1 });
this.triggerLayout();
```

Por:

```typescript
this.set({ width: nw, scaleX: 1, scaleY: 1 });
```

Isso elimina o recalculo de bounds que causa o deslocamento progressivo do texto, mantendo o mesmo comportamento que ja funciona corretamente na seta simples sem texto.

