---
title: "Bug Analysis - A-011 edição fora do menu com nome longo"
doc_role: bug-analysis
status: partial
created: 2026-10-01
updated: 2026-10-01
tags: [bug-analysis, ui-ux, overflow]
aliases: [Posicionamento da edição de casa no menu]
---

# A-011 — posicionamento da edição de casa no menu

## 1. Identificação

- Tipo: análise técnica de defeito, relatado pelo operador com screenshots.
- Ambiente: aplicação local, Chrome e browser do Codex segundo o operador; alvo local-only.
- Status analítico: causa provável; correção aplicada; evidência final partial.

## 2. Contexto e Sintoma Observado

O lápis de edição aparece fora da borda direita do menu na captura com nome longo.
Na captura de controle, com nome curto, aparece dentro do menu. O operador atribuiu a
diferença aos browsers, mas as capturas usam nomes e escalas diferentes; elas não isolam
uma diferença de engine ou provam defeito exclusivo do Codex.

## 3. Contrato de Falha Observável

- Cenário: abrir o menu, expandir a construção e observar a casa com nome longo.
- Fronteira: posição do botão dentro do popover, no browser do Codex.
- Reprodução mínima: usar o mesmo nome longo nos dois browsers, no mesmo zoom e escala.
- Controle: nome curto, seleção da casa e edição vinculadas aos mesmos IDs.
- Resolução: lápis inteiro dentro do menu; nome truncado sem deslocá-lo; seleção e edição corretas.

## 4. Escopo Afetado

A-011, `HamburgerMenu.tsx` e seu smoke test. O universo autorizado continua A-001 a A-025.
Sem mudança de regras de negócio, armazenamento, pacotes emitidos ou aprovação humana.

## 5. Mapa de Camadas e Fronteiras

| Fronteira | Responsabilidade | Evidência | Status |
| --- | --- | --- | --- |
| Screenshot do operador | Posição do lápis | Recortes antes da alteração | observado |
| Layout do menu | Distribuir nome e ação na linha | Fonte local e módulo entregue pelo Vite | observado |
| Ações do componente | Selecionar e editar a casa exata | Smoke tests | observado |
| Geometria após correção | Confirmar botão dentro do popover | Nova captura ainda ausente | não verificado |
| Diferença entre browsers | Isolar engine, zoom e dados | Condições não equivalentes | não verificado |

## 6. Fluxo Esperado vs. Fluxo Real

Esperado: nome ocupa o espaço restante e trunca; botão de edição mantém sua largura.
Observado na captura longa: nome e ação ultrapassam a borda do popover.
Na fonte, o botão do nome usava `w-full`, sem `min-w-0` no item flex, ao lado da ação
de largura fixa e `shrink-0`. Truncar apenas o span interno não limita o item flex externo.

## 7. Hipóteses Causais

| Hipótese | A favor | Contra / limite | Validação restante | Status |
| --- | --- | --- | --- | --- |
| Largura mínima automática do item do nome impede encolhimento | Fonte e overflow na captura longa; controle curto cabe | Estilos computados no IAB não inspecionados | Mesmo nome longo após correção | provável |
| Diferença de zoom ou escala contribui | Menus aparecem em escalas diferentes | Não explica sozinho a falta de limite explícito no item | Comparação com mesmo zoom e dados | inconclusiva |
| Defeito exclusivo do browser do Codex | Relato do operador | Dados e escala das capturas diferem | Comparação controlada | inconclusiva |

## 8. Evidências e Pontos Envolvidos

Capturas reais fornecidas pelo operador, preservadas por cópia idêntica e SHA-256:

| ID | Estado | Imagem | SHA-256 |
| --- | --- | --- | --- |
| A-011 | Antes; recorte do botão | [Recorte](../../work-items/2026-09/20260930-ui-ux-25.work-item.assets/A-011-20261001-antes-recorte.png) | D3273C1163E5CB132D33DF50FEAF0C12894CD066AB688F6CFBB029D9AF9291B6 |
| A-011 | Antes; controle com nome curto | [Nome curto](../../work-items/2026-09/20260930-ui-ux-25.work-item.assets/A-011-20261001-antes-nome-curto.png) | EF46A083F8732444C06266BBFD7E51E289D5D51A25118F8C74D432F31FD7BDF2 |
| A-011 | Antes; nome longo e lápis fora | [Nome longo](../../work-items/2026-09/20260930-ui-ux-25.work-item.assets/A-011-20261001-antes-nome-longo.png) | 5C90DFCDE849AB3FCDCBB77BC594DE6C4615AA6276C9289EECD872B7FD9BEDE7 |

São recortes, com viewport completo e zoom não informados. Não são evidência pós-correção
nem aprovação humana do item. Nenhuma imagem original foi sobrescrita ou editada.

## 9. Classe do Defeito ou Regressão

Overflow em item flex dentro de área dimensionada; causa provável apoiada em fonte e captura.
Regra aplicável: `docs/ui-definitions/UI-001-texto-overflow-e-areas-impressas.md`.

## 10. Correção Aplicada ou Recomendada

Adicionar `min-w-0 flex-1` somente aos itens aninhados de casa. O nome pode ocupar e encolher
no espaço restante; o span já usa reticências. A ação continua com largura fixa e seu title
preserva o nome completo. Demais itens e callbacks permanecem com seus contratos.

## 11. Edge Cases e Cenários de Controle

Nome curto, longo com espaços e contínuo sem espaços; casa ativa/inativa; construção
expandida; transição documental; seleção e edição da mesma casa; cadastro bloqueado.
Usar nomes diferentes entre browsers pode mascarar a causa do deslocamento.

## 12. Validação Executada

- `rtk npm run test -- client/src/components/rac-editor/@menus/ui/HamburgerMenu.smoke.test.tsx`: 6/6 aprovados.
- Novo caso com nome contínuo longo verifica seleção, edição, IDs e title completo; não mede geometria.
- ESLint dos dois arquivos alterados: exit 0, sem saída de erros ou advertências.
- GET do módulo no Vite: HTTP 200, contém o novo layout e não contém overlay de erro.
- Nenhuma nova tentativa de controlar o IAB ou rota alternativa após a recusa anterior de vínculo de sessão.

## 13. Status de Evidência

Partial: alteração e contratos do componente verificados; posicionamento após correção ainda
sem validação na fronteira original. Captura pós-correção bloqueada nesta execução pelo limite
anterior de acesso oficial à aba, registrado no work-item. O operador pode confirmar manualmente
com o nome longo após recarregar. Não declarar A-011 ou o conjunto integral aceito.

## 14. Dúvidas Residuais de Regra de Negócio

Nenhuma para esta correção. Resta a verificação visual, inclusive em escala equivalente.

## 15. Artefatos Relacionados

- Work-item: `../../work-items/2026-09/20260930-ui-ux-25.work-item.md`.
- Matriz: `../../work-items/2026-09/20260930-ui-ux-25.work-item.assets/acceptance-matrix.md`.
- Changelog: `../../changelogs/2026-10/20261001.changelog.md`.
- Sem commit, push, incidente operacional ou mutação remota nesta correção.
