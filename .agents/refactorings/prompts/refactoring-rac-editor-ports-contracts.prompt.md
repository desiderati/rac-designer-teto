---
doc_role: refactoring-prompt
resource_slug: rac-editor-ports-contracts
resource_kind: feature-slice
heuristics_considered: []
heuristics_applied: []
heuristics_rejected: []
---

> Human review recommended before structural execution.

## Heuristics Considered

- heuristic files read: nenhum arquivo específico de heurística foi consumido.
- heuristics applied: nenhuma heurística local aplicável.
- heuristics rejected: nenhuma.

```xml
<system>
  <role>
    Executar refatoração estrutural dos Ports do RAC editor preservando comportamento.
  </role>

  <objective>
    Consolidar a semântica dos contratos internos do editor. O ciclo deve mover Ports
    gerais para `src/components/rac-editor/ports`, mover Ports do canvas para
    `src/components/rac-editor/canvas/ports`, remover `PilotiEditorPort`, aproximar
    pilotis da linguagem de domínio, evitar tipos agregadores ambíguos como
    `HouseEditorPort`/`HousePilotiPort` e documentar todos os métodos de Ports.
  </objective>

  <context>
    O editor RAC está em transição para ports/adapters. A separação anterior em
    `house/store`, `piloti/store` e `canvas/store` tornou o nome `store` ambíguo para
    contratos que não armazenam estado. O canvas já é um subdomínio técnico próprio,
    então seus Ports devem ficar dentro do slice `canvas`.
  </context>

  <runtime_constraints>
    - Não criar worktree.
    - Preservar comportamento externo.
    - Manter Fabric restrito ao slice `canvas`.
    - Escrever JSDoc e documentação em português do Brasil com acentuação.
  </runtime_constraints>

  <execution_plan>
    1. Mover Ports gerais do editor para `src/components/rac-editor/ports`.
    2. Mover Ports de canvas para `src/components/rac-editor/canvas/ports`.
    3. Renomear `CanvasHouseManagerPort` para um nome semântico sem herança de legado.
    4. Substituir `PilotiEditorPort` por `HousePilotiReadPort` e `HousePilotiWritePort`,
       mantendo-os no arquivo semântico `HousePilotiPort.ts` sem criar tipo agregado.
    5. Separar `HouseViewReadPort` de `HouseViewWritePort`, mantendo-os no arquivo
       semântico `HouseViewPort.ts`.
    6. Compor `HouseReadPort` com leituras de setup, lifecycle, terreno, vistas e
       pilotis; compor `HouseWritePort` apenas com comandos de setup, lifecycle,
       terreno, vistas e pilotis.
    7. Tirar inserção de snapshot 3D de `HouseLifecycleWritePort` e criar Port de canvas.
    8. Documentar todos os métodos de Ports.
    9. Validar com typecheck, testes, build, lint e buscas estruturais.
  </execution_plan>
</system>
```
