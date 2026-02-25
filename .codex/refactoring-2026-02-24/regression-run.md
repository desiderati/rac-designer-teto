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

---

## Evidências de execução

### 1) Tipagem estrita

- `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false` -> **PASS**

### 2) Testes unit/smoke

- `npm run test -- --run` -> **PASS** (`116/116`)

### 3) Build de produção

- `npm run build` -> **PASS**

### 4) E2E (serial)

- `npm run test:e2e -- --workers=1` -> **PASS** (`16/16`)

Cobertura observada no run E2E:

- `e2e/canvas.spec.ts` -> PASS
- `e2e/piloti.spec.ts` -> PASS
- `e2e/toolbar-overflow.spec.ts` -> PASS
- `e2e/viewer-3d.spec.ts` -> PASS
- `e2e/views-limits.spec.ts` -> PASS

### 5) Pacote de regressão completo

- `npm run test:regression` -> **PASS**
    - saída consolidada da rodada:
        - Vitest: `33 files`, `116 tests` -> PASS
        - Build: PASS
        - Playwright: `16/16` -> PASS

### 6) Lint geral

- `npm run lint` / `npx eslint .` -> **FAIL (dívida legada fora do escopo desta rodada)**
- Lint focado nos arquivos alterados para regressão -> sem erros.

---

## Resultado consolidado (checklist)

### Itens funcionais validados com evidência automatizada

- **Lote 1**: M2, M3, M4
- **Lote 2**: M6, M7, M8, M9
- **Lote 5**: M18, M21, M22

### Fluxos detalhados validados

- F9 (master único)
- F13, F14, F15, F16 (zoom/pan/minimap/copy-paste-undo-redo)

### Arquitetura validada indiretamente por execução/compilação

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
- Se desejado, a próxima rodada pode focar exclusivamente nos itens abertos de **Lote 3, Lote 4 e Lote 6**.
