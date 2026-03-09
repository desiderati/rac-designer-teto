# Changelog — 2026-03-08

## fix(modals): corrige bugs no editor de nível de piloti de canto

### Bug 1 — Slider de nível bloqueado durante o drag

**Problema:** Ao arrastar o slider de nível acima do limite máximo permitido para a altura atual
do piloti (ex.: nível 1.50m com altura 3.0m → tentativa de arrastar para 1.51m), o slider era
bloqueado imediatamente. Somente após soltar o drag o recálculo ocorria e o novo máximo era
liberado.

**Causa:** `handleNivelChange` chamava `clampNivelByHeight(value, tempHeight)`, bloqueando o
valor durante o drag. Além disso, o `useEffect` escutava `[tempHeight, tempNivel]`, criando um
ciclo de feedback que reinseria o clamp a cada mudança de nível.

**Correção (`usePilotiEditor.ts`):**

- `handleNivelChange`: removido o clamp — o slider agora é livre do mínimo ao máximo global.
- `useEffect` de clamp: dependências alteradas para `[tempHeight]` com atualização funcional
  (`setTempNivel(prev => ...)`), disparando apenas quando a altura muda (botão de altura),
  nunca durante o drag.
- `handleNivelCommit`: ao soltar o drag, a altura é **sempre recalculada** via
  `getRecommendedHeight(nivel)` — a "regra de ouro" do editor de nível.

### Bug 2 — Altura não persiste ao clicar no botão de altura menor

**Problema:** Ao clicar em um botão de altura menor (ex.: 3.5m → 3.0m) com nível no máximo
(1.75m), o nível era ajustado corretamente para 1.5m, mas a altura voltava para 3.5m após o
clique. Somente no segundo clique a altura 3.0m era aplicada.

**Causa:** `recalculateRecommendedPilotiData(DEFAULT_HOUSE_PILOTI)` (com `recalculateHeight=true`
padrão) sobrescrevia a altura explicitamente escolhida com a "altura recomendada" calculada via
`getRecommendedHeight(nivel)`. Para `nivel=1.5`, `getRecommendedHeight` retornava 3.5m (máximo),
revertendo a escolha manual do usuário.

**Correção (`house-manager.ts`):**

- `updatePiloti`: alterado para `recalculateRecommendedPilotiData(DEFAULT_HOUSE_PILOTI, false)`
  — `recalculateHeight=false` preserva as alturas de todos os pilotis. Como `applyPilotiPatch`
  já foi chamado antes (aplicando a altura escolhida), a recalculação interpola apenas os níveis
  dos pilotis intermediários sem sobrescrever nenhuma altura.

---

## fix(stairs): corrige falhas pré-existentes nos testes de escada automática

**Problema:** Dois testes em `house-auto-stairs.smoke.test.ts` falhavam com `stairsStepCount`
esperado `3` mas retornando `2`.

**Causa:** `buildStairMetricsFromGroundNiveis` só aplicava `AUTO_STAIR_HEIGHT_EXTRA_MTS` (0.3m)
quando a diferença entre os cantos do terreno superava esse valor (`cornerDiff > 0.3m`). Em
terreno plano (`nivel=0.2` nos dois cantos), `heightExtraMts = 0`, resultando em
`stairHeight = 0.5m` → `round(0.5/0.3) = 2 degraus`.

**Correção (`house-auto-stairs.ts`):**

- `buildStairMetricsFromGroundNiveis`: `AUTO_STAIR_HEIGHT_EXTRA_MTS` é **sempre** aplicado,
  independente do declive do terreno. Este extra representa o quanto a escada deve ultrapassar
  a linha do terreno para garantir a transição segura entre o solo e a estrutura da casa.
- Com a correção: `stairHeight = 0.2 + 0.3 + 0.1 + 0.2 = 0.8m` → `round(2.67) = 3 degraus` ✓

**Testes:** 165 passando, 0 falhas.

---

## Arquivos modificados

| Arquivo                                              | Alteração                       |
|------------------------------------------------------|---------------------------------|
| `src/components/rac-editor/hooks/usePilotiEditor.ts` | Bugs 1 e 2 do editor de nível   |
| `src/components/rac-editor/lib/house-manager.ts`     | Bug 2 — preservar altura manual |
| `src/components/rac-editor/lib/house-auto-stairs.ts` | Falhas pré-existentes de escada |
