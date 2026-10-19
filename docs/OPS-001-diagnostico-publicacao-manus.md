---
title: Diagnóstico da publicação Manus
id: OPS-001
doc_role: runbook
doc_type: operational-reference
status: active
lang: pt-BR
created: 2026-10-18
updated: 2026-10-18
tags: [manus, publicacao, runbook]
---

# Diagnóstico da publicação Manus

## Objetivo e fronteira de execução

Localizar onde uma alteração parou entre GitHub, tarefa WebDev, checkpoint e site servido. Este
roteiro é de leitura: não autoriza push, reexecução de workflow, envio de mensagem ao Manus,
alteração de arquivos no WebDev ou publicação. Uma retomada exige autorização própria para a ação e
o alvo exatos.

A fonte do fluxo é [publish-manus.yml](../.github/workflows/publish-manus.yml). Ele reage a push em
main ou disparo manual e usa a tarefa WebDev existente. O grupo de concorrência não cancela a
execução em andamento. Checkpoints enviados pelo próprio manus-connector são ignorados para evitar
outro ciclo de publicação.

## Evidências que respondem perguntas diferentes

| Camada   | O que conferir                                                      | Limite da conclusão                                                                  |
|----------|---------------------------------------------------------------------|--------------------------------------------------------------------------------------|
| GitHub   | SHA remoto e ancestralidade dos commits esperados                   | Commit local ou referência remota em cache não prova envio atual                     |
| Workflow | Run, evento, SHA, etapas, conclusão e anotações                     | Run ignorado ou adiado não equivale a publicação                                     |
| WebDev   | SHA e projeto do resultado estruturado, checkpoint e published=true | Checkpoint isolado ou mensagem de build não comprova código ativo no site            |
| Site     | Manifesto e JavaScript efetivamente recebidos da rede               | Nome da versão do aplicativo e conteúdo de cache não identificam sozinhos a correção |
| Aparelho | Fluxo completo com navegador e teclado reais                        | Emulação local não substitui aceite Android                                          |

## Procedimento de diagnóstico

1. Identificar os commits da correção e conferir se estão contidos no SHA remoto de main. Consultar
   o GitHub em leitura sem fazer fetch, pull ou sincronização apenas para atualizar essa evidência.
   Separar o estado local do estado remoto observado.

2. Localizar a execução do workflow pelo SHA e evento. Registrar início, conclusão, etapa que parou
   e código de erro sanitizado. Se estiver em andamento ou em fila, registrar esse estado; não
   disparar outra execução para investigar.

3. Conferir o resultado estruturado. O workflow exige status=success, SHA e projeto esperados,
   checkpoint preenchido e published=true. Um resultado de adiamento encerra com falha para não
   aparecer como publicação bem-sucedida.

4. No site publicado, comparar `/__manus__/version.json` com o manifesto do checkpoint esperado. Se
   o manifesto divergir, registrar a diferença e conferir separadamente o conteúdo servido.

5. Identificar o asset JavaScript referenciado pelo HTML atual e procurar os trechos específicos da
   correção. Conferir resposta de rede e origem do conteúdo, evitando cache de disco e service
   worker durante essa leitura. Se o navegador não permitir essa inspeção, declarar a limitação.
   Restaurar qualquer opção temporária de diagnóstico ao terminar.

6. Registrar separadamente a presença do código e o aceite funcional. Só declarar o cenário validado
   no Android depois do teste no aparelho.

As rotas e os nomes acima se referem ao serviço publicado e ao contrato do workflow. Não copiar
cookies, chaves, tokens, fotos ou logs completos para o registro; manter apenas SHAs, IDs, estados,
códigos de erro, hashes e trechos mínimos sanitizados.

## Estados que interrompem a publicação

| Sinal                                                       | Interpretação e parada                                                                                       |
|-------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| DEFERRED_TASK_STATE_UNKNOWN                                 | Preflight não confirmou o estado da tarefa; não enviar sincronização                                         |
| DEFERRED_TASK_NOT_IDLE                                      | Tarefa não está stopped ou tem jobs em segundo plano; liberar a sessão antes de qualquer retomada autorizada |
| DEFERRED_DIRTY_CHECKOUT, DEFERRED_GIT_OPERATION_IN_PROGRESS | Preservar trabalho e operação Git no WebDev; não descartar alterações                                        |
| DEFERRED_CHECKOUT_DIVERGED, DEFERRED_REMOTE_SHA_CHANGED     | O histórico ou o alvo não correspondem ao SHA esperado; parar e diagnosticar                                 |
| Falha de build ou pedido de intervenção humana              | Registrar a etapa e a necessidade de intervenção; não tratar como sucesso                                    |
| Run skipped por manus-connector                             | Retorno esperado do checkpoint; verificar o run humano anterior                                              |

Esses preflights reduzem a janela de concorrência, mas não constituem lock contra edição humana.
Depois de adiamento, não existe retomada agendada nesse workflow. A eventual ação manual deve ser
autorizada e revalidar o alvo; este runbook não a executa nem autoriza.

## CHECKPOINT_LARGE_MEDIA

O caso observado bloqueou o checkpoint após as correções já terem chegado ao GitHub. Três PNGs de
documentação acima de 1 MB foram retirados do snapshot WebDev depois de um backup externo relatado
pelo checkpoint. Esse resultado específico não estabelece um limite universal para todo tipo de
arquivo ou operação do Manus.

Ao reencontrar o código, identificar os arquivos apontados pelo erro, sua finalidade e se são ativos
de produto ou documentação. Qualquer tratamento deve preservar os originais e suas referências e
requer autorização antes de mover, remover, converter ou alterar exclusões. Não aplicar reset,
clean, descarte ou remoção em massa para fazer o checkpoint passar. Após um tratamento autorizado,
conferir a preservação, o diff e os ativos usados pela aplicação antes de considerar nova
publicação.

## Validação e referências

Um diagnóstico suficiente identifica o último ponto comprovado da cadeia, o bloqueio seguinte e os
limites da evidência. Não transformar success do workflow em aceite do usuário nem confundir site já
corrigido com manifesto mais recente ainda não confirmado.

- [Workflow de sincronização e publicação](../.github/workflows/publish-manus.yml).

- [Manifesto versionado](../client/public/__manus__/version.json).

- [Publicação com evidências e limites
  registrados](../.agents/production-changes/2026-10/20261017-push-main-protecao-manus.production-change.md).

- [Execução com
  CHECKPOINT_LARGE_MEDIA](https://github.com/desiderati/rac-designer-teto/actions/runs/39091355090).

- [Checkpoint que registra o tratamento dos
  PNGs](https://github.com/desiderati/rac-designer-teto/commit/172640e70e9710f42273bf3353437aa21397d024).

- [Execução posterior
  bem-sucedida](https://github.com/desiderati/rac-designer-teto/actions/runs/39108330052).
