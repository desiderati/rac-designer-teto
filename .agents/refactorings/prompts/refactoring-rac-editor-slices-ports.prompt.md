---
doc_role: refactoring-prompt
resource_slug: rac-editor-slices-ports
resource_kind: feature-slice
heuristics_considered: []
heuristics_applied: []
heuristics_rejected: []
---

> Revisão humana recomendada antes da execução estrutural ampla.

## Heurísticas Consideradas

- heuristic files read: nenhum arquivo local de heurísticas estava disponível em `.agents/refactorings/heuristics`.
- heuristics applied: nenhuma heurística local aplicada.
- heuristics rejected: nenhuma heurística local rejeitada.

```xml
<system>
  <role>
    Você é responsável por continuar a refatoração arquitetural do editor RAC em ciclos pequenos,
    preservando comportamento externo e removendo ambiguidades de fronteira.
  </role>

  <objective>
    Consolidar os slices `house`, `piloti`, `viewer3d`, `modals`, `canvas` e a orquestração do
    `rac-editor` com Ports documentados e semanticamente organizados. "Pronto" significa que UI,
    hooks de alto nível, domínio e runtime visual têm contratos explícitos, sem JSDoc sem acentuação
    em português do Brasil e sem novos vazamentos de Fabric fora da borda de canvas.
  </objective>

  <context>
    O editor já foi parcialmente decomposto: `canvas` e `menus` existem como slices próprios,
    `RacEditor.tsx` está fino, e o peso remanescente está em controllers, viewer 3D, modais e na
    fachada transitória do `houseManager`. O branch atual contém alterações locais pré-existentes
    nos Ports de `house` e em adapters do `houseManager`; essas mudanças devem ser preservadas e
    incorporadas sem reversão.
  </context>

  <runtime_constraints>
    - O trabalho ocorre no branch atual, sem worktree.
    - Fabric.js deve permanecer restrito ao slice `canvas`, especialmente adapters, factories e helpers visuais.
    - O viewer 3D é projeção derivada do estado da casa, não fonte canônica de verdade.
    - Ports são contratos públicos internos e devem ser escritos em português claro, com acentuação correta.
    - A refatoração deve preservar o comportamento externo do editor.
  </runtime_constraints>

  <run_posture>
    - risk profile: `high`
    - execution mode: `direct`
    - por que: a execução foi explicitamente autorizada pelo usuário, mas toca contratos compartilhados,
      orquestração de UI, runtime visual e estado da casa.
    - Fase 0 obrigatória: `sim`
    - baseline inicial: `tsc` e testes focados de store/bootstrap/infra passaram antes das mudanças.
  </run_posture>

  <workflow>
    Execute até 8 ciclos:
    1. Reorganizar e documentar Ports de `house` e `piloti`.
    2. Criar slice `viewer3d` e mover UI/lib/hooks de visualização 3D.
    3. Decompor `House3DViewer` em modelo, ações e UI.
    4. Decompor `House3DScene` em meshes e helpers coesos.
    5. Criar slice `modals` e mover dialogs, selectors, editors e hooks de modais.
    6. Reduzir `useRacEditorController` e builders de layout por fatias.
    7. Avançar `house`/use cases e write ports sem ampliar dependência de Fabric.
    8. Consolidar JSDoc, documentação, checks arquiteturais e validação ampla.
  </workflow>

  <acceptance_criteria>
    - JSDoc novo ou ajustado usa português do Brasil com acentuação normal.
    - Ports de `house`, `piloti`, `canvas` e slices derivados têm responsabilidade documentada.
    - `PilotiEditorPort` não fica perdido em store genérica quando houver slice mais semântico.
    - `viewer3d` e `modals` deixam de depender de `ui/3d` e `ui/modals` como diretórios soltos.
    - `useRacEditorController` perde responsabilidades de montagem manual excessiva.
    - Typecheck e testes relevantes passam em cada ciclo material.
  </acceptance_criteria>
</system>
```
