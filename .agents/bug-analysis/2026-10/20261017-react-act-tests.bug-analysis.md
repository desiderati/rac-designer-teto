---
title: "Avisos React act por sincronização incompleta dos testes"
doc_role: bug-analysis
status: confirmed
created: 2026-10-17
updated: 2026-10-17
tags: [bug-analysis, testes, react]
---

# Avisos React act nos testes

## 1. Identificação

- Origem: avisos recorrentes nas regressões locais, investigados por solicitação do usuário.
- Ambiente: Vitest, React 18.3.1, React Testing Library e jsdom no checkout macOS.
- Estado: causas confirmadas; correção validada nos testes focados e na regressão completa.

## 2. Contexto e sintoma

Os testes passavam, mas atualizações React ocorriam fora da unidade de interação aguardada pelo
teste. A reprodução atual produziu 596 avisos `not wrapped in act(...)` em três arquivos, mesmo com
1.116 testes aprovados em 206 arquivos.

## 3. Contrato de falha observável

- Fronteira: stderr da suíte de testes, com avisos de atualização fora de `act`.

- Reprodução: executar os testes de gestão de construções, revisão UI/UX e TopBar.

- Controle: preservar todas as asserções de formulário, navegação, validação e confirmação.

- Aceite: zero avisos `act`, testes aprovados e regressão completa concluída sem supressão de
  console.

## 4. Escopo afetado

Somente os testes `ConstructionSiteManagementPanel.smoke.test.tsx`, `ui-ux-revision.smoke.test.tsx`
e `TopBar.smoke.test.tsx`. Não foi necessário alterar componentes, dependências ou setup global.

## 5. Fronteiras observadas

| Fronteira                | Divergência observada                                                   |
|--------------------------|-------------------------------------------------------------------------|
| Submissão de formulários | `fireEvent.submit` seguido de `setTimeout(0)` fora de `act` assíncrono  |
| Redefinição da casa      | Espera pelo mock via `vi.waitFor`, sem aguardar o fechamento do diálogo |
| Navegação entre abas     | Chamada direta a `.focus()` que dispara atualizações React              |

## 6. Fluxo esperado e fluxo real

O teste deve aguardar a interação e suas atualizações antes das asserções ou do teardown. A espera
por um temporizador ou apenas pela chamada de um mock não delimitava todas as atualizações React.

## 7. Hipóteses causais

- Submissões fora de `act` assíncrono: confirmada pelo helper, handlers e pilhas dos avisos.

- Fechamento assíncrono do diálogo não aguardado: confirmado pelo fluxo de `ResetHouseDialog`.

- Foco DOM fora de `act`: confirmado pelo evento que atualiza o estado das abas.

- Defeito global no ambiente React: não necessário para explicar o sintoma; a correção local
  eliminou os avisos sem modificar o ambiente.

## 8. Evidências

- Baseline: 596 avisos; 1.116 testes aprovados.

- Após a correção: 97 testes focados aprovados e zero avisos `act`.

- Comparação das expressões de asserção via AST: 677 preservadas na gestão, 42 na revisão UI/UX e 33
  na TopBar; uma nova asserção de fechamento do diálogo.

- Logs e comparação retidos no sidecar local `20261017-react-act-tests.work-item.assets`.

## 9. Classe do defeito

Sincronização incompleta do harness de testes. O sucesso das asserções anteriores não demonstrava
que as atualizações pendentes haviam terminado.

## 10. Correção aplicada

- Aguardar a submissão dentro de `act` assíncrono, removendo o temporizador arbitrário.

- Aguardar os cliques com `userEvent` e verificar a chamada única e a remoção do diálogo com
  `waitFor` da React Testing Library.

- Executar o foco programático dentro de `act` assíncrono.

- Manter os avisos habilitados e todas as asserções existentes.

O uso de `act` assíncrono segue a [documentação do React](https://react.dev/reference/react/act). As
esperas por resultados observáveis seguem a [React Testing
Library](https://testing-library.com/docs/dom-testing-library/api-async/).

## 11. Cenários de controle

Os testes existentes continuam cobrindo submissões válidas e inválidas, campos obrigatórios,
persistência dos valores, foco de teclado e ausência de redefinição antes da confirmação. A nova
asserção exige que o diálogo feche após a confirmação.

## 12. Validação

- Foco: 97/97 testes aprovados, zero avisos `act`.

- ESLint dos três arquivos: aprovado.

- Whitespace dos três arquivos: aprovado.

- Primeira regressão: TypeScript, 1.116 testes do cliente, 41 testes do servidor e build aprovados;
  E2E interrompido por indisponibilidade da porta 5200, com 43 cenários aprovados, 43 falhas
  `ERR_CONNECTION_REFUSED` e 13 não executados. Nenhum aviso `act`.

- Após a falha, não havia listener na porta nem runner E2E ativo. A causa do encerramento do
  servidor não foi comprovada. Nenhum processo de outra frente foi encerrado.

- Reexecução completa aprovada, exit 0: `check`, `check:e2e`, 1.116 testes do cliente/206 arquivos,
  41 testes do servidor/11 arquivos, build e 99 E2E em 6 minutos. Zero avisos `act` no log completo.
  A árvore de processos confirmou que o servidor pertenceu ao runner desta regressão.

- Os três testes corrigidos permaneceram idênticos durante a validação. Alterações simultâneas de
  outra frente em `e2e/canvas-mobile-navigation.spec.ts` foram preservadas e não foram editadas
  aqui.

## 13. Status de evidência

`validated-at-original-boundary`: os 596 avisos desapareceram do stderr da suíte completa, sem
suprimir logs nem retirar asserções. Nenhuma falha residual na regressão final.

## 14. Dúvidas residuais

Nenhuma dúvida de regra de negócio; a alteração afeta somente o modo de aguardar nos testes.

## 15. Artefatos relacionados

Work-item local `20261017-react-act-tests.work-item.md`, com baseline, logs de execução e comparação
das asserções. Nenhum commit ou push realizado nesta correção.
