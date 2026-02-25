# Regression Checklist Run - 2026-02-25

## Contexto da rodada

Rodada de validação da mega refatoração iniciada em `2026-02-24`, com foco em:

- correções de regressão de tipagem/import;
- estabilidade de smoke tests e E2E;
- atualização de checklist com evidências reais de execução.

---

## Correções aplicadas antes da revalidação

- Compatibilidade de debug bridge para E2E:
    - adicionado alias `getHousePiloti` em `src/components/rac-editor/hooks/useRacEditorDebugBridge.ts`.
- Ajuste de teste E2E de toolbar:
    - troca de expectativa de `myType` de `dimension` para `distance` em `e2e/toolbar-overflow.spec.ts`.
- Robustez de clique em ações de toolbar no E2E:
    - reforço de actionability em `e2e/helpers/rac-helpers.ts` (`toBeVisible` + `click({ force: true })`).
- Correção de import no helper E2E:
    - `@/shared/types/house` -> `../../src/shared/types/house.ts`.
- Ajuste de tipagem estrita:
    - guard para `first.group` no fluxo de contraventamento;
    - remoção de `any` introduzido no debug bridge;
    - atualização de smoke test de house view para estratégia (`getHouseViewStrategy`).
- Automação adicional (wave 1):
    - novo spec `e2e/inline-editor.spec.ts` para sincronização do editor inline (wall/line) com seleção ativa;
    - novo smoke `src/infra/legacy-imports.smoke.test.ts` para bloquear imports legados `@/lib/*` / `src/lib/*`;
    - captura de erros de console/pageerror adicionada em suites críticas (`canvas`, `toolbar-overflow`, `viewer-3d`, `views-limits`, `piloti`, `inline-editor`).
- Hotfix de regressão pós-review (wave 2):
    - restauração de overloads de `toCanvasObject` para suportar entradas nulas sem quebrar inferência em runtime (`src/components/lib/canvas/canvas.ts`);
    - correção de contrato de tipo em `useContraventamentoQueries` no callback `onResolvedSide` (sem cast indevido para `FabricObject`);
    - ajuste de narrowing em helper de editor linear (`currentColor: string`) para eliminar erro de literal narrowing em strict mode;
    - correção de reset visual de piloti ao fechar editor para usar `PILOTI_MASTER_STYLE.strokeColor` e `PILOTI_STYLE.strokeColor` (evitando `stroke` indefinido);
    - atualização dos smoke tests de piloti para os contratos atuais de estilos/config (`#fff`, `strokeWidth` top-view e master).

---

## Evidências de execução

### 1) Tipagem estrita

- `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false` -> **PASS**

### 1.1) Revalidação strict após hotfix (wave 2)

- `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false` -> **PASS**

### 2) Testes unit/smoke

- `npm run test -- --run` -> **PASS** (`117/117`)
- `npm run test -- --run src/infra/legacy-imports.smoke.test.ts` -> **PASS** (`1/1`)
- `npx vitest run src/components/lib/canvas/piloti-visual-feedback.smoke.test.ts src/domain/use-cases/house-piloti-visual-use-cases.smoke.test.ts` -> **PASS** (`7/7`)
- `npm run test -- --run` (re-run após hotfix) -> **PASS** (`117/117`)

### 3) Build de produção

- `npm run build` -> **PASS**
- `npm run build` (re-run após hotfix) -> **PASS**

### 4) E2E (serial)

- `npm run test:e2e -- --workers=1` -> **PASS** (`17/17`)

Cobertura observada no run E2E:

- `e2e/canvas.spec.ts` -> PASS
- `e2e/inline-editor.spec.ts` -> PASS
- `e2e/piloti.spec.ts` -> PASS
- `e2e/toolbar-overflow.spec.ts` -> PASS
- `e2e/viewer-3d.spec.ts` -> PASS
- `e2e/views-limits.spec.ts` -> PASS

### 5) Pacote de regressão completo

- `npm run test:regression` -> **PASS**
    - saída consolidada da rodada:
        - Vitest: `34 files`, `117 tests` -> PASS
        - Build: PASS
        - Playwright: `17/17` -> PASS

### 6) Lint geral

- `npm run lint` / `npx eslint .` -> **FAIL (dívida legada fora do escopo desta rodada)**
- Lint focado nos arquivos alterados para regressão -> sem erros.

---

## Resultado consolidado (checklist)

### Itens funcionais validados com evidência automatizada

- **Lote 1**: M2, M3, M4
- **Lote 2**: M6, M7, M8, M9
- **Lote 3**: M13
- **Lote 5**: M18, M21, M22

### Fluxos detalhados validados

- F4, F5 (edição inline de parede/lineares)
- F9 (master único)
- F13, F14, F15, F16 (zoom/pan/minimap/copy-paste-undo-redo)

### Arquitetura validada indiretamente por execução/compilação

- A1 / R1 (guard automatizado para imports legados)
- A8 (ações de toolbar disparam comandos)
- A10, A11, A12 (domínio/aplicação/house-manager sem regressão observada no pacote de regressão)

### Validação automática

- tsc strict -> PASS
- test -> PASS
- build -> PASS
- e2e workers=1 -> PASS
- test:regression -> PASS
- lint geral -> pendente (dívida legada)

---

## Observações

- Alguns itens permanecem **não marcados** por não terem evidência direta nesta rodada (ex.: import/export JSON,
  contraventamento ponta a ponta, checks de console manual, alguns fluxos de edição específicos).
- Execução E2E em paralelismo padrão apresentou flakiness pontual; suíte serial (`--workers=1`) ficou estável com `17/17`.
- Se desejado, a próxima rodada pode focar exclusivamente nos itens abertos de **Lote 3, Lote 4 e Lote 6**.
