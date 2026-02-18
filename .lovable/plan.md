
# Plano de Melhorias — Code Review

## Análise do Estado Atual

Após explorar o código, confirmei o seguinte:

**P0.1 — Âncora do popover (JÁ RESOLVIDO):**
O código em `Canvas.tsx` (linha 583) já usa `piloti.getCenterPoint()`, que é a solução recomendada pelo reviewer. A memória de arquitetura também registra isso. Esse item está correto — nenhuma ação necessária.

**P0.2 — Sincronização cross-view (JÁ IMPLEMENTADA):**
O `house-manager.ts` (linha 554–594) já itera sobre `Object.values(this.house.views)` e chama `updatePilotiHeight` e `updatePilotiMaster` para cada grupo de cada vista. Esse item também está resolvido.

**P1 — Reset de destaque não simétrico para retângulos:**
Em `Canvas.tsx`, linhas 114–144, o reset ao fechar o editor trata corretamente tanto `isPilotiCircle` quanto `isPilotiRect`. Porém, em `updateHint` (linha 476–494), o reset também trata ambos. Esse fluxo está simétrico.

**P1 — Página 404 com `<a href="/">` (REAL — SIMPLES DE CORRIGIR):**
Confirmado: `NotFound.tsx` usa `<a href="/">` causando reload completo em vez de navegação SPA.

**P1 — `require` no `tailwind.config.ts`:**
Confirmado: linha 134 usa `plugins: [require("tailwindcss-animate")]`.

---

## O Que Será Implementado

Com base na análise, os únicos itens com problemas reais e soluções diretas são:

### 1. Corrigir navegação SPA na página 404
**Arquivo:** `src/pages/NotFound.tsx`
- Substituir `<a href="/">` por `<Link to="/">` do `react-router-dom`
- O import de `Link` já pode ser adicionado no topo do arquivo

### 2. Migrar `require` para import ESM no Tailwind
**Arquivo:** `tailwind.config.ts`
- Adicionar `import tailwindcssAnimate from 'tailwindcss-animate';` no topo
- Substituir `plugins: [require("tailwindcss-animate")]` por `plugins: [tailwindcssAnimate]`

---

## O Que NÃO Será Alterado (e Por Quê)

| Item do Review | Status Real | Decisão |
|---|---|---|
| P0.1 — Âncora do popover deslocada | Já usa `getCenterPoint()` corretamente | Nenhuma ação |
| P0.2 — Sincronização cross-view | HouseManager já sincroniza todas as vistas | Nenhuma ação |
| P1 — Reset highlight assimétrico | Reset trata `isPilotiCircle` e `isPilotiRect` em todos os caminhos | Nenhuma ação |
| P1/P2 — Tipagem `any` e lint | Refatoração grande com risco de regressão em editor complexo | Escopo separado futuro |
| P2 — Bundle size e code splitting | Otimização de performance sem impacto funcional | Escopo separado futuro |
| P2 — Testes automatizados | Requer infraestrutura nova (Vitest/Playwright) | Escopo separado futuro |

---

## Detalhes Técnicos

### `NotFound.tsx` — Antes vs. Depois

```text
ANTES:
import { useLocation } from "react-router-dom";
...
<a href="/">Return to Home</a>

DEPOIS:
import { useLocation, Link } from "react-router-dom";
...
<Link to="/">Return to Home</Link>
```

### `tailwind.config.ts` — Antes vs. Depois

```text
ANTES (linha 134):
plugins: [require("tailwindcss-animate")],

DEPOIS:
import tailwindcssAnimate from 'tailwindcss-animate';
...
plugins: [tailwindcssAnimate],
```

Ambas as mudanças são cirúrgicas, sem risco de regressão, e resolvem os únicos problemas confirmados do code review que não estavam já corrigidos.
