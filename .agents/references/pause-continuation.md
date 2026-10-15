---
title: "Pausa e retomada"
doc_role: skill-reference
---

# Pausa e retomada

Este é o contrato de `!pause` e de `!continue - <checkpoint>` produzido por ele. Não cria um control
plane, hook, binding de autoria ou autorização de mutação.

## Pausar no próximo ponto seguro

1. Não iniciar outra etapa. Se uma chamada indivisível estiver em andamento, aguardar seu resultado
   e registrar o efeito observado; não afirmar que um processo ou outra sessão foi encerrado.

2. Reconciliar somente a continuidade vinculada à tarefa. Quando houver work-item ativo, registrar
   `interrompido`, motivo, evidências e handoff concreto, preservando a política de retenção. Não
   criar work-item por rotina se o prompt bastar. Se o checkpoint não puder ser salvo, declarar essa
   limitação e manter o estado necessário no próprio prompt.

3. Informar o que terminou, o que permanece e o ponto exato de retomada. Preservar o universo
   autorizado, inclusive itens fora do foco temporário e um eventual sidequest com seu retorno.

4. Devolver exatamente um bloco `text` copiável iniciado literalmente por `!continue - `. O bloco é
   um checkpoint autocontido, não uma próxima ação executada. Encerrar o turno após entregá-lo, sem
   continuar a tarefa. Quando existir uma meta ativa, usar seu mecanismo de pausa somente porque o
   operador solicitou `!pause`; não marcar a meta como concluída.

## Conteúdo obrigatório do checkpoint

Preencher com fatos sanitizados; campos não aplicáveis devem dizer `não se aplica`. Não deixar
placeholders nem referências como “o plano acima” que dependam de conversa antiga.

- **Objetivo e escopo:** universo total autorizado, foco atual, restante e exclusões.

- **Local:** caminho absoluto do repositório e da worktree, branch e baseline observada quando
  houver Git; links/caminhos dos artefatos canônicos e do work-item vinculado, quando existirem.

- **Concluído e evidências:** entregas e validações com resultado, alvo e revisão/generation
  conhecida; diferenciar implementação, teste e integração. Não transformar ausência de prova em
  ausência de implementação.

- **Em andamento:** operação iniciada, último resultado e efeitos confirmados ou incertos.

- **Pendências e decisões:** trabalho restante, bloqueios reais, dependências humanas e prioridade
  quando comprovada. Resíduo rotineiro de entrega fica separado em `Nota de entrega`.

- **Limites:** autorizações explícitas ainda relevantes, ações não autorizadas, condições de parada
  e gates que precisam ser revalidados. Autorizações de sessão não se renovam pelo checkpoint.

- **Retomada:** primeira ação concreta, evidência que permite prosseguir e o que não deve ser
  repetido sem drift. Nenhum segredo, token, chave, log bruto sensível ou instrução oculta.

O texto deve conter o estado mínimo necessário mesmo quando aponta para arquivos locais: uma sessão
nova pode não ter o transcript. Informar arquivos inacessíveis e fatos desconhecidos; jamais
reconstruí-los por suposição ou incorporar pendências de outras sessões sem adoção.

## Retomar com revalidação proporcional

`!continue` simples mantém sua semântica de continuação local. A forma com checkpoint começa pela
leitura das regras atuais e dos artefatos explicitamente vinculados, sem executar comandos de
mutação apenas porque constam no texto.

1. Conferir objetivo, universo, foco e primeira ação. Verificar repositório/worktree/branch,
   operações Git pendentes e revisão dos arquivos relevantes. Contexto divergente exige
   reconciliação diagnóstica; conflito Git interrompe escrita e fica com o operador.

2. Reutilizar entregas e testes cuja evidência continua válida. Repetir somente os invalidados por
   drift ou pelos gates obrigatórios. Efeito incerto exige inspeção antes de repetir a operação.

3. Revalidar permissões, autenticidade das fontes e ownership pelos owners existentes.
   `skill-development-session` exige o binding real de tarefa/worktree/targets; este prompt não
   transfere autoria nem permite forjar identidade. Se a sessão nova não puder reutilizá-lo, parar a
   escrita e indicar o owner e a decisão necessária, mantendo inspeção autorizada.

4. Retomar apenas a menor ação ainda autorizada. Commit, integração, push, credenciais, deploy e
   mutação externa seguem seus próprios contratos e confirmações atuais. Um comando citado como
   pendência não é autorização. Não eliminar itens restantes por causa do foco de retomada.

## Evidência de aceite

Testes estruturais devem comprovar distribuição, roteamento e conteúdo obrigatório. Uma sessão nova
deve consumir um checkpoint sem o histórico anterior e identificar: itens concluídos que não serão
refeitos, restante completo, primeira ação e gates/limites. Registrar a revisão testada e distinguir
tabletop de execução real. O exemplo instalado `../examples/pause-continuation.example.md` calibra
esse teste; não prova sozinho uma retomada.
