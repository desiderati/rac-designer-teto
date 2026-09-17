---
title: "Bug Analysis - slider de nível do piloti ao sair do auto"
doc_role: bug-analysis
status: confirmed
created: 2026-07-09
updated: 2026-07-09
supersedes:
superseded_by:
tags: [ bug-analysis, bug, regression, rac-editor, pilotis, slider ]
aliases: [ slider de nível do piloti ao sair do auto ]
---

# Análise Técnica de Bug ou Regressão

## 1. Identificação

- tipo do registro: análise técnica de bug
- bug, defeito ou regressão analisada: primeiro ajuste manual do nível do piloti podia ficar só no draft do modal após sair de `[auto]`
- origem do relato: solicitação do usuário
- ambiente: editor RAC local
- status analítico: confirmado
- estado da correção: validada
- status de evidência: validated-at-original-boundary

## 2. Contexto e Sintoma Observado

- contexto funcional: edição do nível de pilotis no modal do editor RAC, alternando o modo automático de altura para modo manual.
- sintoma observado: ao desativar `[auto]` e mover o slider, em alguns casos o desenho não atualizava e a alteração não persistia até fechar e reabrir o modal.
- impacto percebido: o valor visual do modal podia divergir do modelo salvo da casa e do documento persistido.
- limitações ou incertezas iniciais: a reprodução dependia da primeira interação do slider e do evento de commit emitido pela Radix UI.

## 3. Contrato de Falha Observável

- cenário original reportado: abrir editor de piloti, sair de `[auto]`, mover o slider e esperar redraw e persistência imediatos.
- fronteira observável do relato: primeiro gesto do slider após alternar o modo.
- reprodução mínima que deve falhar antes da correção: valor controlado do slider muda, mas `onValueCommit` não atravessa para `handleNivelCommit`.
- cenário de controle que deve continuar passando: digitação direta do nível e commits normais do slider continuam atualizando o piloti.
- evidência necessária para considerar resolvido: o primeiro ajuste manual altera o runtime da casa e o documento persistido sem fechar o modal.

## 4. Escopo Afetado

- fluxos afetados: edição de nível de piloti no modal, após alternar o ajuste automático para manual.
- regras de negócio afetadas: nível do piloti e altura recomendada a partir do nível.
- módulos, componentes ou serviços envolvidos: `NivelSlider`, `usePilotiEditor`, modal de pilotis, canvas history e persistência de Construções TETO.
- contratos, schemas ou interfaces envolvidos: `HousePilotiReadPort`, `HousePilotiWritePort`, documento persistido em IndexedDB.

## 5. Mapa de Camadas e Fronteiras

| Camada ou fronteira | Responsabilidade | Evidência disponível | Status |
|---------------------|------------------|----------------------|--------|
| UI `NivelSlider` | capturar valor controlado e emitir commit persistente | `client/src/components/rac-editor/@modals/ui/editors/NivelSlider.tsx` | observado |
| Hook `usePilotiEditor` | converter nível em patch do piloti e chamar `onHeightChange` | `client/src/components/rac-editor/@modals/hooks/usePilotiEditor.ts` | observado |
| Canvas history | salvar histórico e notificar alteração documental | `useCanvasHistory.smoke.test.ts` e fluxo `onHeightChange` | observado |
| Persistência E2E | gravar nível no documento de Construções TETO | `e2e/piloti.spec.ts` | observado |

## 6. Fluxo Esperado vs. Fluxo Real

- fluxo esperado: `onValueChange` atualiza o draft visual, e o encerramento da interação confirma o valor no modelo, dispara redraw e salva o documento.
- fluxo real: o slider dependia apenas de `onValueCommit`; quando esse evento não era observado na primeira interação, o valor permanecia só no estado controlado do modal.
- ponto de divergência identificado: ausência de fallback de commit para encerramentos de interação como `keyup`, `pointerup` ou `blur`.

## 7. Hipóteses Causais

| Hipótese | Evidências a favor | Evidências contra | O que ainda falta saber | Como validar | Status |
|----------|--------------------|-------------------|-------------------------|--------------|--------|
| Falha no cálculo de altura recomendada | o fluxo passa por auto/manual | testes do hook confirmam modo manual vigente após toggle | nada | `usePilotiEditor.smoke.test.tsx` | descartada |
| Falha de persistência no documento | sintoma incluía não persistir | sem commit não há `saveHistory`; com commit E2E persiste no IndexedDB | nada | `e2e/piloti.spec.ts` | descartada como causa primária |
| Commit do slider perdido na primeira interação | `NivelSlider` só chamava `onNivelCommit` em `onValueCommit` | nenhum contra após teste de fallback | nada | novo smoke do slider e E2E | confirmada |

## 8. Evidências e Pontos Envolvidos

### Evidências observadas

- teste de unidade do slider confirma commit do valor controlado mais recente mesmo sem `onValueCommit`.
- teste E2E confirma que o primeiro `ArrowRight` após sair de `[auto]` altera `getHousePilotiByDebug` e o documento persistido no IndexedDB.
- `npm run lint`, testes focados e `npm run test:architecture` passaram.

### Pontos de código, contrato ou regra

- `client/src/components/rac-editor/@modals/ui/editors/NivelSlider.tsx`: adiciona fallback de commit.
- `client/src/components/rac-editor/@modals/hooks/usePilotiEditor.ts`: evita duplicar update quando fallback e commit nativo chegam com o mesmo valor.
- `e2e/piloti.spec.ts`: cobre a fronteira original com UI real e persistência.

## 9. Classe do Defeito ou Regressão

- classe: evento de UI não confirmado na fronteira de commit.
- por que esta classificação se aplica: a divergência acontecia entre valor controlado/draft e mutação persistente do modelo.

## 10. Correção Aplicada ou Recomendada

- menor mudança coerente: manter o último valor do slider em `ref`, confirmar esse valor em `blur`, `keyup`, `pointerup` e `onValueCommit`, e ignorar commits idênticos no hook.
- por que resolve a causa: o primeiro encerramento de interação agora atravessa para `handleNivelCommit` mesmo quando o commit nativo do Slider não é emitido.
- riscos e impactos laterais: baixo; a deduplicação no hook evita `updatePiloti` e `saveHistory` redundantes para o mesmo valor já aplicado.

## 11. Edge Cases e Cenários de Controle

- edge cases relevantes: alternar auto/manual e interagir por teclado ou mouse; commit duplicado por `pointerup` e `onValueCommit`.
- cenário que poderia mascarar a correção: fechar o modal aplicando o draft depois de o primeiro gesto ter falhado.
- cenário de controle que deve continuar passando: edição digitada do nível e commit normal do slider.
- risco de recorrência se a correção for apenas sintomática: depender novamente de um único evento de commit da biblioteca de slider.

## 12. Validação Executada

- validação de camada: `npx vitest run client/src/components/rac-editor/@modals/ui/editors/NivelSlider.smoke.test.tsx client/src/components/rac-editor/@modals/hooks/usePilotiEditor.smoke.test.tsx client/src/components/rac-editor/@modals/ui/editors/piloti/PilotiEditor.smoke.test.tsx client/src/components/rac-editor/@canvas/ui/adapters/hooks/useCanvasHistory.smoke.test.ts --reporter=dot`
- validação de integração: `npm run test:architecture`
- validação na fronteira original: `npx playwright test e2e/piloti.spec.ts`
- testes executados: 16 testes Vitest focados, 13 testes de arquitetura, 3 testes E2E de pilotis.
- validação manual ou operacional: Codex Browser carregou o app em `http://127.0.0.1:5200`, mas a ponte `__racDebug` não ficou disponível no contexto do Browser; a fronteira foi validada por Playwright E2E com helpers do repositório.
- build, lint ou smoke relevante: `npm run lint`
- critério de sucesso observado: primeiro ajuste manual do slider altera runtime e IndexedDB sem reabrir modal.
- limitações ou validações bloqueadas: sem bloqueio funcional restante no escopo.

## 13. Status de Evidência

- status final: validated-at-original-boundary
- por que este status se aplica: a correção foi validada no componente, no hook, no histórico do canvas e no E2E que reproduz a interação original com persistência.
- o que ainda ficaria necessário para elevar o status, se parcial ou bloqueado: não aplicável.

## 14. Dúvidas Residuais de Regra de Negócio

- dúvida: nenhuma identificada.
- por que ainda importa: não aplicável.

## 15. Artefatos Relacionados

- incidente correlato: não informado
- PR, commit ou diff relacionado: diff local ainda sem commit
- sidecar de anexos: não aplicável
- documentos correlatos: `.agents/changelogs/2026-07/20260709.changelog.md`
