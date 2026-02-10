
# Correcao: Vista Frontal Invertida no Modelo 3D

## Problema

A Vista Frontal 2D mostra o piloti mestre (marrom) no lado direito, mas no modelo 3D, ao olhar a face frontal, os elementos (portas/janelas) e o piloti mestre aparecem invertidos horizontalmente. Isso ocorre porque o eixo X no espaco 3D nao corresponde a direcao esperada quando visto da camera padrao.

## Causa Raiz

No `House3DScene.tsx`, a face frontal (Z = +hd) posiciona elementos usando `xOffset - hw + elementWidth/2`, que mapeia coordenadas 2D diretamente para X no 3D. Porem, ao observar essa face de frente (camera em Z positivo olhando para Z negativo), o eixo X aparece espelhado -- o que esta a esquerda no 2D aparece a direita no 3D.

## Solucao

**Arquivo:** `src/components/rac-editor/House3DScene.tsx`

Inverter o eixo X dos elementos na face frontal para que correspondam a orientacao visual 2D:

- **Face `front`**: Negar o calculo X, mudando de `xOffset - hw + elementWidth/2` para `hw - xOffset - elementWidth/2`
- **Face `back`**: Ajustar de forma correspondente (remover a negacao atual, pois a inversao frontal ja corrige a simetria)

Isso faz com que a porta e as janelas aparecam no mesmo lado que o piloti mestre, exatamente como na Vista Frontal 2D.

## Detalhes Tecnicos

Alteracao no `switch (element.face)` dentro do componente `HouseElement3D`:

```
case 'front':
  // Inverter X para corresponder a vista 2D
  position = [hw - xOffset - elementWidth / 2, yPos, hd + depth / 2];
  break;
case 'back':
  // Ajustar back para manter simetria com front corrigido
  position = [xOffset - hw + elementWidth / 2, yPos, -hd - depth / 2];
  rotation = [0, Math.PI, 0];
  break;
```

Apenas um arquivo sera modificado: `src/components/rac-editor/House3DScene.tsx` (linhas 114-129).
