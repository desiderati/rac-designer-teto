# Checklist de Regressão (Rodada 2026-02-24)

## Contexto desta rodada

Mega refatoração com impacto estrutural alto:

- Migração de camadas para novos namespaces (`src/domain`, `src/infra`, `src/shared/types`, `src/components/lib`).
- Substituição/remoção de módulos legados em `src/lib/*` (canvas, domain e manager antigos).
- Reescrita do `RacEditor` e parte relevante de toolbar/modais/hooks.
- Reescrita do fluxo 3D (`House3DViewer` e `House3DScene`) com novos imports e contratos de tipo.

> Objetivo deste checklist: validar regressões funcionais e de integração causadas por mudanças de path, contratos e
> wiring entre editor 2D, domínio e visualização 3D.

---

## Lotes de validação manual (M)

### Lote 1 — Smoke crítico (editor abre e ciclo básico)

- [ ] M1: Abrir o editor sem erro fatal no console.
- [x] M2: Criar casa `tipo6`.
- [x] M3: Criar casa `tipo3`.
- [x] M4: Abrir `Piloti Editor` sem tela branca/erro.
- [ ] M5: Selecionar, mover e deletar objeto comum no canvas.

### Lote 2 — Vistas e regras de tipo de casa

- [x] M6: Adicionar vista superior.
- [x] M7: Adicionar/remover frontal/traseira/laterais respeitando limite por tipo.
- [x] M8: Validar seleção de lado e bloqueio de lado já ocupado.
- [x] M9: Validar reabertura de slots após remoção de vista.

### Lote 3 — Ferramentas de desenho/elementos

- [ ] M10: Criar parede, porta, escada, árvore, água e fossa.
- [ ] M11: Criar linha, seta, distância e texto livre.
- [ ] M12: Ativar/desativar modo desenho (lápis) sem travar seleção.
- [ ] M13: Validar edição inline/modais de objetos lineares e parede.

### Lote 4 — Contraventamento e pilotis

- [ ] M14: Entrar no modo contraventamento.
- [ ] M15: Selecionar piloti origem/destino e concluir criação.
- [ ] M16: Editar altura/nível/master de piloti e refletir visualmente.
- [ ] M17: Remover contraventamento e validar limpeza de estado.

### Lote 5 — 3D e integração com 2D

- [x] M18: Abrir visualizador 3D sem erro de import/path.
- [ ] M19: Renderizar corretamente para `tipo6` e `tipo3`.
- [ ] M20: Validar mapeamento de aberturas (porta/janela) no 3D.
- [x] M21: Inserir snapshot 3D no canvas 2D.
- [x] M22: Alterar cor de parede no 3D e confirmar atualização visual.

### Lote 6 — Persistência/import-export

- [ ] M23: Exportar JSON.
- [ ] M24: Importar JSON e restaurar casa/vistas/pilotis/contraventamentos.
- [ ] M25: Validar undo/redo após import.
- [ ] M26: Validar persistência de configurações/tutorial.

---

## Regressões de arquitetura (foco da mega refatoração)

### 1) Migração de paths e aliases

- [ ] A1: Não há imports residuais para módulos removidos em `src/lib/*`.
- [ ] A2: Imports novos resolvem corretamente para:
    - [ ] `src/domain/*`
    - [ ] `src/infra/*`
    - [ ] `src/shared/types/*`
    - [ ] `src/components/lib/*`
- [ ] A3: Sem erro de resolução envolvendo `.ts` explícito em paths com alias.

### 2) Contratos de tipo compartilhados

- [ ] A4: `HouseType`, `HouseElement`, `HousePiloti` estão consistentes entre editor, manager e 3D.
- [ ] A5: `CanvasRuntimeObject` cobre campos usados em edição, seleção e contraventamento.
- [ ] A6: Sem regressões de narrowing/casts em hooks de editor linear/parede.

### 3) Rewiring do RacEditor

- [ ] A7: `RacEditor.tsx` novo mantém os mesmos comportamentos de menu/submenu.
- [x] A8: Ações de toolbar disparam comandos corretos (sem no-op acidental).
- [ ] A9: Modais (settings, confirmações, tutorial, 3D) abrem/fecham corretamente.

### 4) Domain/Application/Infra

- [x] A10: Use-cases migrados para `src/domain/use-cases/*` continuam com comportamento anterior.
- [x] A11: Application services em `src/domain/application/*` seguem contratos esperados.
- [x] A12: `house-manager` novo (`src/components/lib/house-manager.ts`) mantém API pública consumida pelo editor.
- [ ] A13: Settings/storage migrados para `src/infra/*` funcionam em leitura/escrita e fallback.

---

## Fluxos funcionais detalhados

### Fluxo base de criação

- [ ] F1: Iniciar casa e criar vista top.
- [ ] F2: Adicionar elementos no centro visível do canvas.
- [ ] F3: Seleção/multi-seleção e agrupamento/desagrupamento.

### Fluxo de edição de objetos

- [ ] F4: Editar cor/texto de linha, seta e distância.
- [ ] F5: Editar cor/texto de parede.
- [ ] F6: Confirmar que edição não perde draft ao digitar.

### Fluxo de piloti

- [ ] F7: Alterar `height` e refletir no desenho.
- [ ] F8: Alterar `nivel` e refletir labels/solo.
- [x] F9: Regra de master único permanece válida.

### Fluxo de contraventamento

- [ ] F10: Seleção de piloti elegível respeita regras.
- [ ] F11: Criação em top view sincroniza com elevações.
- [ ] F12: Exclusão limpa highlights e estado interno.

### Fluxo de canvas interação

- [x] F13: Zoom por controle/gesto.
- [x] F14: Pan por mouse/touch.
- [x] F15: Minimap sincroniza viewport.
- [x] F16: Copiar/colar e undo/redo sem inconsistência de estado.

---

## Validação automática obrigatória

## 1) Tipagem estrita

- [x] `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false`

## 2) Lint geral

- [ ] `npx eslint .`

## 3) Testes unit/smoke

- [x] `npm run test -- --run`

## 4) Build de produção

- [x] `npm run build`

## 5) E2E principal

- [x] `npm run test:e2e -- --workers=1`

## 6) Pacote de regressão completo

- [x] `npm run test:regression`

---

## Foco de risco alto para esta commit

> Priorizar estes pontos primeiro, pois concentram chance de quebra após renome/migração massiva.

- [ ] R1: Quebra por path antigo (`@/lib/...`) ainda referenciado em arquivos novos.
- [ ] R2: Divergência de contrato entre `houseManager.getHouse()` e `House3DViewer`.
- [ ] R3: Campos opcionais de runtime fabric ausentes no tipo novo de canvas.
- [ ] R4: Ações do `ToolbarMainMenu` sem handler funcional após troca de wiring.
- [ ] R5: Fluxo de editor inline (linear/wall) sem sincronização com seleção ativa.
- [ ] R6: Snapshot 3D não inserido por quebra em `insert3DSnapshotOnCanvas`.
- [ ] R7: Import/export JSON inconsistente após migração de tipos compartilhados.

---

## Critério de aceite da rodada

Considerar a rodada **estável** apenas quando:

- [ ] Todos os itens M1–M26 essenciais estiverem validados.
- [ ] `tsc`, `eslint`, `test`, `build` e `e2e` estiverem verdes.
- [ ] Não houver erro no console durante os fluxos críticos (criação de casa, edição de piloti, contraventamento, 3D,
  import/export).
- [ ] Não houver dependência residual de arquivos removidos da estrutura antiga.
