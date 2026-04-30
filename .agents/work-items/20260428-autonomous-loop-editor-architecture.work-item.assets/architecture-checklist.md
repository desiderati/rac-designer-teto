# Checklist Arquitetural do Editor RAC

## Fronteiras Rígidas

- `src/domain/**` não importa React, Fabric, UI, browser APIs ou adapters concretos.
- Commands e store não importam Fabric nem componentes React.
- UI e hooks de alto nível não recebem `CanvasGroup`, `CanvasObject`, `FabricCanvas` ou `FabricObject`.
- Contratos públicos de seleção, comando e estado são serializáveis.
- Regras de negócio continuam em domínio ou use-cases puros de domínio.
- Fabric não é fonte de verdade; canvas é projeção e mecanismo de interação.

## Fronteiras Transitórias

- `src/components/rac-editor/lib/canvas/**` pode continuar importando Fabric enquanto adapters/factories são estabilizados.
- `houseManager` pode funcionar como façade durante a transição, mas não deve receber novas responsabilidades.
- `CanvasHandle.canvas` pode permanecer temporariamente como escape hatch, mas cada loop deve reduzir consumidores externos.
- Rebuild/import podem ler runtime Fabric durante a transição, desde que converjam para estado serializável.

## Sinais de Vazamento

- Novo import de `fabric` fora da fronteira aprovada.
- Novo tipo público com `CanvasGroup` ou `FabricCanvas`.
- UI chamando `houseManager` para comportamento que já tem selector/store.
- Store ou command chamando `requestRenderAll`, `renderAll`, `loadFromJSON` ou `toJSON`.
- Domain recebendo objetos de runtime visual.

## JSDoc Obrigatório

- Ports.
- Commands.
- Stores.
- Adapters.
- Mappers entre runtime canvas e estado serializável.
- Regras não óbvias de piloti, vistas, terreno, contraventamento, histórico e rebuild.

## JSDoc Evitado

- Funções triviais.
- Comentários que apenas repetem o nome da função.
- Narrativa histórica que pertence ao changelog ou work-item.

## Checks

```bash
rg -n "fabric" src/components/rac-editor src/domain src/shared -g "!*.test.*" -g "!*.smoke.*"
rg -n "CanvasGroup|CanvasObject|FabricCanvas|FabricObject" src/components/rac-editor/ui src/components/rac-editor/hooks
rg -n "houseManager" src/components/rac-editor/ui src/components/rac-editor/hooks
npm run test
npm run build
npm run lint
git diff --check
```
