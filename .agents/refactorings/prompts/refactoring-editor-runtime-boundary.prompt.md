---
doc_role: refactoring-prompt
resource_slug: editor-runtime-boundary
resource_kind: feature-slice
heuristics_considered: []
heuristics_applied: []
heuristics_rejected: []
---

> Human review recommended before structural execution.

## Heuristics Considered

- heuristic files read: none; this repository has no `.agents/refactorings/heuristics/*.heuristics.md` files for this front.
- heuristics applied: none.
- heuristics rejected: none.

```xml
<system>
  <role>
    Refatorar o editor RAC preservando comportamento externo, reduzindo acoplamento com Fabric.js e
    consolidando fronteiras locais de ports/adapters, store, bootstrap e domínio.
  </role>

  <objective>
    Remover gradualmente Fabric.js de UI, hooks de alto nível e coordenação de estado do editor RAC.
    A fronteira aceita para runtime visual deve ficar em canvas/factories/adapters, enquanto contratos
    públicos usam tipos serializáveis e ports explícitos. A conclusão desta frente exige código
    compilável, testes passando e inventário claro das dependências ainda não migradas.
  </objective>

  <context>
    O editor RAC é uma aplicação React/TypeScript com Fabric.js como runtime de canvas. Historicamente,
    `RacEditor.tsx`, `house-manager.ts` e vários hooks acessam diretamente objetos Fabric, dificultando
    testes e tornando o canvas fonte implícita de verdade. A refatoração está sendo executada em fatias
    verticais pequenas para preservar comportamento e evitar reescrita ampla.
  </context>

  <runtime_constraints>
    - TypeScript e React com Vite/Vitest.
    - Fabric.js permanece necessário no runtime visual durante a migração.
    - O sistema deve permanecer funcional a cada ciclo; não há autorização para big bang.
    - Sem push, merge, deploy ou mutação remota nesta frente.
  </runtime_constraints>

  <run_posture>
    - risk profile: medium.
    - execution mode: direct.
    - justificativa: a frente toca contratos, wiring e estado, mas possui suíte Vitest, typecheck,
      build e lint disponíveis; as mudanças devem ser pequenas e reversíveis.
    - Phase 0 - Baseline and Safety: ativa; usar testes existentes, smoke tests novos quando a
      fronteira mudar e `rg` para verificar vazamento arquitetural.
  </run_posture>

  <workflow>
    Executar ciclos pequenos:
    1. escolher a menor fronteira migrável;
    2. criar ou mover contrato antes de trocar consumidores;
    3. manter adapters legados quando necessário;
    4. validar com typecheck, testes focados, build/lint quando proporcional e `git diff --check`;
    5. registrar pendências antes de avançar.
  </workflow>

  <decision_principles>
    - Preferir simplicidade sobre elegância arquitetural excessiva.
    - Preferir tipos explícitos e serializáveis nas fronteiras públicas.
    - Preservar contrato externo e comportamento observável.
    - Não transformar `infra` em depósito nominal; só mover Fabric para adapter quando houver port real.
    - Preferir coesão por fatia de editor a granularidade extrema.
    - Não refatorar código funcional fora do escopo só porque poderia ficar mais bonito.
  </decision_principles>

  <stopping_criteria>
    Parar quando a fatia selecionada estiver validada, quando o próximo passo exigir decisão de produto
    não registrada, quando a mesma falha se repetir sem progresso ou quando a próxima ação ampliar o
    blast radius além da frente acordada.
  </stopping_criteria>
</system>
```
