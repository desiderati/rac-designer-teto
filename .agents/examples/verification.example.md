# Worked Examples for `verification.prompt.md`

> Installed by `agents-bootstrap` as `.agents/examples/verification.example.md`.
> Load only when you need concrete calibration for depth, structure, anti-patterns, or output shape.
> Do not load this file by default during normal prompt execution.

  <examples>
    <example id="1">
      <label>Verificação partial — implementação funcional com desvio justificado</label>
      <quality>ideal</quality>
      <content>
        ## 1. Artefatos de Referência
        - objetivo/tarefa: disponível — "adicionar retry com backoff e DLQ ao notification-dispatcher"
        - decisão de design: disponível — worker síncrono com throttling, contrato em seção 7
        - plano de implementação: disponível — 6 passos, validação em staging
        - especificações de teste: disponível — 9 testes especificados, cobertura em matriz

        ## 2. Verificação por Dimensão

        ### Objetivo vs. Resultado
        - retry com backoff implementado: 3 tentativas com intervalos de 1s, 4s, 16s ✓
        - dead-letter queue criada no Pub/Sub: tópico `notifications-dlq` provisionado ✓
        - falhas registradas no banco com `status: failed` e timestamp: ✓
        - alerta no Cloud Monitoring para DLQ: **não implementado**
        - avaliação: ⚠️ parcial — alerta de monitoramento ausente

        ### Design vs. Resultado
        - abordagem: worker síncrono com throttling de 80 req/min — seguida ✓
        - restrição: modelo de dados agnóstico ao mecanismo de execução — respeitada ✓
        - fora do escopo: Pub/Sub para o worker principal — respeitado ✓
        - avaliação: ✅ conforme

        ### Plano vs. Resultado
        - passos 1-4 executados conforme planejado ✓
        - passo 5 (alerta Cloud Monitoring): **não executado**
        - passo 6 (validação integrada em staging): executado, retry confirmado, DLQ recebendo
          mensagens, falhas registradas no banco
        - desvio no passo 5 registrado no changelog da sessão: "Terraform para monitoring.tf
          requer permissão `monitoring.alertPolicies.create` que o service account de CI não tem.
          Aberto ticket INFRA-342 para solicitar permissão."
        - avaliação: ⚠️ desvio justificado — impedimento de permissão, não de design

        ### Testes vs. Resultado
        - 8 de 9 testes implementados e passando ✓
        - teste ausente: `should trigger alert when DLQ accumulates > 10 messages` — não
          implementável sem o alerta (depende do passo 5)
        - avaliação: ⚠️ gap intencional — vinculado ao mesmo impedimento do passo 5

        ## 3. Desvios Identificados

        | Desvio                           | Tipo                              | Impacto                                       | Ação                                   |
        |----------------------------------|-----------------------------------|-----------------------------------------------|----------------------------------------|
        | Alerta de DLQ não implementado   | decidido (changelog + INFRA-342)  | médio - falhas silenciosas até alerta existir | documentar no changelog como pendência |
        | Teste de alerta não implementado | decidido (dependência do passo 5) | baixo - coberto quando alerta for criado      | documentar como pendência vinculada    |

        ## 4. Regressões Prováveis
        - envio de notificações existente (sem retry): verificado — fluxo de item único
          continua funcionando, teste de regressão passando
        - transação principal do pedido: verificado — publicação na fila ocorre após commit,
          sem impacto na atomicidade
        - nenhuma regressão identificada

        ## 5. Disciplina de Implementação

        - menor mudança coesa: mantida — retry, DLQ e rastreabilidade foram alterados no mesmo fluxo funcional
        - refatoração ampla: não executada — nenhum módulo fora do dispatcher foi reestruturado
        - alteração de conteúdo autoral: não aplicável
        - mutação externa: Terraform aplicado somente após confirmação registrada na sessão de execução

        ## 6. Veredito
        **partial** — implementação satisfaz o objetivo principal (retry + DLQ + rastreabilidade).
        O alerta de monitoramento é uma pendência justificada por impedimento de permissão,
        não por falha de design ou execução. O trabalho restante está rastreado em INFRA-342.

        ## 7. Próximo Passo
        Prosseguir para `changelog.prompt.md`. Registrar:
        - o que foi implementado e validado
        - o desvio do passo 5 com referência a INFRA-342
        - o teste pendente vinculado ao alerta
      </content>
      <why>
        This example is ideal because:
          - it systematically compares each dimension (objective, design, plan, tests) with specific evidence
          - the deviation is classified as "decided" with a traceable reference (changelog + ticket)
          - the verdict is "partial" not "pass" — honest about the gap even though it is justified
          - the regression check covers the two most likely failure surfaces (existing notifications, transaction atomicity)
          - the next step is actionable: proceed to changelog with specific items to record
          - it does not penalize the absence of the alert as a "fail" because the impediment is external
            (permission, not design) and is being tracked
          - a future session can pick up INFRA-342 and complete the remaining work without re-reading
            the full implementation history
      </why>
    </example>
  </examples>
