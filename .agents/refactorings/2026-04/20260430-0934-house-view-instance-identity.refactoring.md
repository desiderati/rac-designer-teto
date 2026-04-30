# Refatoração - Identidade lógica das vistas da casa

## Contexto

Esta etapa refinou a fronteira criada no ciclo anterior. A separação inicial já havia removido `CanvasGroup` do estado
canônico, mas ainda usava `HouseState<string>` e nomes transitórios como `viewRefId`. Isso deixava a arquitetura correta
em comportamento, porém imprecisa em semântica.

## Decisões

- `HouseId` identifica a casa.
- `HouseViewInstanceId` identifica uma instância visual de uma vista da casa.
- `HouseState` e `HouseAggregate` são tipos canônicos, sem parâmetro genérico.
- `HouseViewInstance` contém apenas dados lógicos: `instanceId` e `side`.
- `HouseRuntimeViewInstance<TGroup>` contém o grupo concreto e só aparece na projeção de runtime.
- O registry de runtime do canvas resolve `HouseViewInstanceId -> CanvasGroup`.

## Evidências

- `rtk npm exec -- tsc --noEmit --project tsconfig.app.json`: passou.
- `rtk npm exec -- vitest run src/domain/house src/components/rac-editor/lib/house-manager.smoke.test.ts src/components/rac-editor/lib/house-manager-terrain.smoke.test.ts src/infra/house src/infra/persistence`: passou, 12 arquivos e 53 testes.
- `rtk npm run test`: passou, 85 arquivos e 220 testes.
- `rtk npm run build`: passou.
- `rtk npm run lint`: passou.
- `rtk git diff --check`: passou.
- `rtk rg` não encontrou `HouseState<`, `HouseAggregate<`, `HouseViews<`, `HouseViewInstance<`, `viewRefId` nem `rebuildViewsFromMappedSources` em `src`.

## Pendências

- Avaliar renomear `HouseStatePort`, pois hoje ele entrega snapshot de runtime para a UI, não apenas estado lógico.
- Transformar `HouseViewWritePort` para comandos/DTOs de runtime quando a fronteira de canvas estiver pronta para deixar de aceitar `CanvasGroup`.
