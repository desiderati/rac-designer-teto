---
title: "Instabilidade da suíte Vitest sob carga"
doc_role: bug-analysis
status: inconclusive
created: 2026-10-17
updated: 2026-10-17
tags: [bug-analysis, testes, desempenho]
---

# Investigação da suíte sob carga

## 1. Identificação

- Origem: pedido do usuário após retrospectiva dos timeouts de 28/09 e 02/10.
- Ambiente: local-only, macOS arm64, Node 22.23.3, Vitest 3.2.7, jsdom 26.1.0, nwsapi 2.2.28; 18 CPUs lógicas, 48 GiB RAM.
- Status analítico: inconclusivo para a causa dos timeouts de 02/10; falha não reproduzida nesta rodada.
- Estado da correção: não aplicada; runner, dependências e testes inalterados.
- Evidência: partial quanto à fronteira histórica (Windows); experimento local concluído.

## 2. Contexto e sintoma observado

Em 28/09, o registro canônico atribuiu uma execução de Gauge de aproximadamente 96 s à recursão entre nwsapi 2.2.27 e jsdom, inclusive com um worker. A correção registrada fixou nwsapi 2.2.28. A versão efetivamente resolvida hoje pelo jsdom é 2.2.28.

Em 02/10, o log completo registra 11 timeouts (5 s ou 15 s) em seis arquivos, dentro de uma suíte de 837 testes/178 arquivos que durou 271,59 s. A execução subsequente dos seis arquivos com um worker aprovou 86 testes em 51,26 s. Como **escopo e concorrência mudaram juntos**, esse resultado não prova sozinho que reduzir workers seja a correção.

## 3. Contrato de falha observável

- Fronteira: saída/asserções do Vitest cliente, especialmente timeouts durante a suíte completa.
- Experimento: mesmo código e limites de teste, primeiro sem carga sintética, depois com oito processos Node CPU-bound, repetição dessa condição e controle final sem carga.
- Critério de reprodução: timeout/falha do Vitest com relatório correlato; uma execução apenas mais lenta não conta como reprodução.
- Controle: suíte sem carga aprovada no mesmo ambiente. Uma eventual correção exigiria falha reproduzível e controle preservado.

## 4. Escopo afetado

Somente diagnóstico da suíte cliente. E2E, banco, serviços remotos, build e browser não acionados. Preservados os diffs paralelos de `.agents/prompts/changelog.prompt.md` e `e2e/helpers/construction-site-storage.helpers.ts`.

## 5. Camadas e fronteiras

| Camada | Evidência | Situação |
| --- | --- | --- |
| Entrada | Node chama o Vitest instalado, com `vite.config.ts` | Observada |
| Configuração | Sem override de workers ou timeouts; reporter JSON em todos os ensaios | Observada |
| DOM | jsdom 26.1.0 e nwsapi 2.2.28 resolvidos no runtime | Observada |
| Recursos | CPU/RSS dos processos próprios, load médio, memória e swap amostrados a cada ~5 s | Observada |
| Ambiente histórico | Windows; hardware e pressão contemporânea não disponíveis | Não reproduzida |

## 6. Fluxo esperado vs. real

Todas as execuções concluíram com exit 0 e 1.100/1.100 testes aprovados em 204 arquivos. A carga aumentou a duração; sua retirada voltou ao patamar do controle. Nenhum timeout, parada de proteção ou crescimento de swap observado.

## 7. Hipóteses causais

| Hipótese | Evidência | Resultado |
| --- | --- | --- |
| Concorrência e contenção de CPU causam os timeouts atuais | Carga aumenta duração, mas dois ensaios carregados passam integralmente | Não confirmada |
| Recorrência do defeito de seletor de 28/09 | Versão corrigida presente; suíte inteira aprovada | Sem evidência de recorrência |
| Diferença de Windows, hardware, I/O ou carga externa explica 02/10 | Ambiente histórico distinto; sem telemetria comparável | Inconclusiva |
| Esperas de UI ficam próximas do limite sob carga | Dez nomes de testes históricos ainda correspondem literalmente; máximo observado sob carga 1.210,52 ms, abaixo de seus limites | Não observada nestas condições |

## 8. Evidências

| Execução | Carga adicional | Duração | Resultado | Pico CPU agregado¹ | Pico RSS agregado¹ | Memória livre mínima² | Crescimento de swap |
| --- | --- | --- | --- | --- | --- | --- | --- |
| baseline | 0 | 17,36 s | 1.100/1.100 | 948,9% | 2.885,0 MiB | 44% | 0 MiB |
| load-8 | 8 processos | 23,97 s | 1.100/1.100 | 1.365,1% | 3.759,0 MiB | 43% | 0 MiB |
| load-8-repeat | 8 processos | 20,66 s | 1.100/1.100 | 1.254,2% | 3.376,2 MiB | 43% | 0 MiB |
| recovery | 0 | 16,45 s | 1.100/1.100 | 935,1% | 3.067,1 MiB | 43% | 0 MiB |

¹ Soma amostrada dos processos do experimento, incluindo geradores de carga; 100% equivale aproximadamente a um núcleo. RSS somado pode contar memória compartilhada mais de uma vez. Picos entre amostras podem não ser capturados.
² Indicador de `memory_pressure -Q`, não o valor simples de RAM livre retornado por Node.

Os seis arquivos históricos continuam na suíte e somam hoje 98 testes: `ConstructionSiteManagementPanel`, `ui-ux-revision`, `FamilyName`, `HamburgerMenu`, `house-document-roundtrip` e `tree.strategy`. Dez dos onze nomes de timeout foram encontrados literalmente. O teste restante passou a mencionar “mapa nativo”; não foi tratado como caso histórico idêntico.

- Quatro fingerprints antes/depois idênticos, digest agregado `7514f8aec750e7d97f01cdd876acb0e395ad8186b9db9dda77ae0ab3e6f831bf` (fontes cliente TS/TSX, configuração, manifestos e dois arquivos paralelos).
- Processos próprios de carga remanescentes após os ensaios: zero.
- Relatórios JSON persistidos somente com resumos sanitizados; relatório bruto transitório eliminado.

## 9. Classe da ocorrência

Timeout histórico de suíte; não há defeito atual demonstrado no runner. Desaceleração sob CPU concorrente foi observada e não equivale a instabilidade.

## 10. Correção aplicada ou recomendada

Nenhuma alteração de runner, workers, limites ou dependências. Não há base experimental nesta rodada para recomendar uma alteração permanente. Aumentar timeout ou reduzir workers agora poderia apenas mascarar outra causa.

## 11. Controles e limites

- Código constante em todos os ensaios; limite externo de 240 s; carga limitada a oito processos, sem alocação deliberada de memória.
- Proteções: parar processos próprios se memória disponível cair abaixo de 10% ou swap crescer mais de 2 GiB; não acionadas.
- Não houve teste de saturação de memória, I/O, cache frio, hardware antigo ou Windows. Quatro ensaios não estimam a probabilidade de uma falha rara.
- Instrumentação usa reporter JSON e captura de saída; não reproduz a apresentação/volume de I/O do reporter antigo. Não foi alterada a configuração versionada do runner.
- Identidade das fontes é comprovada nos caminhos monitorados; isso não congela processos externos nem o sistema operacional.

## 12. Validação executada

4.400 execuções de testes, todas aprovadas, em quatro execuções completas. Comando base: `node node_modules/vitest/vitest.mjs run --config vite.config.ts --reporter=json --outputFile=<arquivo temporário>`, via RTK. O coletor chama exatamente essa entrada e controla somente a carga sintética, telemetria e limite externo.

## 13. Status final

Investigação local concluída; instabilidade não reproduzida. Causa histórica sob carga permanece inconclusiva. Nova ocorrência exigiria preservar teste/stack, concorrência, versão, hardware e telemetria no mesmo ambiente antes de propor correção. Nenhuma execução ou acompanhamento futuro foi agendado.

## 14. Dúvidas de negócio

Não aplicável; nenhum comportamento do produto foi alterado.

## 15. Artefatos relacionados

- Histórico: `.agents/changelogs/2026-09/20260928.changelog.md` e `.agents/work-items/2026-10/20261002-toast-unification.work-item.assets/review-all-tests.log` / `review-timeout-recheck.log`.
- Continuidade: `.agents/work-items/2026-10/20261017-vitest-carga.work-item.md`.
- Evidências locais (gitignored): `.agents/work-items/2026-10/20261017-vitest-carga.work-item.assets/`, com `probe.py`, quatro resultados, fingerprints, `summary.json`, `historical-files.json` e `historical-comparison.json`.
- Sem commit ou push nesta tarefa.
