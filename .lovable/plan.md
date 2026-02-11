

## Corrigir posicao do texto ao redimensionar linha/seta

### Problema
Ao redimensionar uma linha ou seta que possui texto (label), o texto se distancia do objeto. Isso acontece porque o handler de `scaling` reseta a escala do texto mas nao reposiciona ele de volta ao offset correto (`top: -20`) antes de chamar `triggerLayout()`.

### Solucao
No handler de `scaling` do grupo (linha ~1294), ao resetar a escala do texto, tambem forcar `top: -20` para manter o label sempre proximo ao objeto.

### Detalhes tecnicos

**Arquivo**: `src/components/rac-editor/RACEditor.tsx`

**Linha ~1297** - Dentro do handler `scaling`, onde o texto tem sua escala resetada:

De:
```typescript
child.set({ scaleX: 1, scaleY: 1 });
```

Para:
```typescript
child.set({ scaleX: 1, scaleY: 1, top: -20 });
```

Isso garante que, a cada evento de redimensionamento, o texto volta a ficar 20px acima do centro do objeto antes do `triggerLayout()` recalcular os limites do grupo.

