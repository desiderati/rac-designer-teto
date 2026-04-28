# Worked Examples for `implementation-planning.prompt.md`

> Installed by `agents-bootstrap` as `.agents/examples/implementation-planning.example.md`.
> Load only when you need concrete calibration for depth, structure, anti-patterns, or output shape.
> Do not load this file by default during normal prompt execution.

  <examples>
    <example id="1">
      <label>Plano ideal — escopo cirúrgico com contexto operacional</label>
      <sections>1. Resumo de Contexto, 2. Objetivo, 3. Escopo</sections>
      <quality>ideal</quality>
      <content>
        ## 1. Resumo de Contexto

        O serviço `notification-dispatcher` envia e-mails transacionais via SendGrid após eventos
        de pagamento confirmado. Atualmente não há retry automático: falhas de entrega são
        descartadas silenciosamente e não há fila de dead-letter.

        O problema foi identificado em revisão preventiva após um incidente de degradação do
        SendGrid que causou perda de ~200 notificações sem registro de falha. O serviço roda
        como Cloud Run job acionado por Pub/Sub. O banco é PostgreSQL 14 via Cloud SQL.
        Não há fila intermediária hoje — o job consome o evento e chama a API diretamente.

        ## 2. Objetivo

        Adicionar retry com backoff exponencial e dead-letter queue para garantir que falhas
        de entrega sejam rastreáveis e reprocessáveis sem perda de eventos.

        ## 3. Escopo

        ### Incluso
        - implementar retry com backoff exponencial (máximo 3 tentativas) no `notification-dispatcher`
        - criar tópico Pub/Sub de dead-letter para eventos que esgotarem as tentativas
        - registrar falhas no banco com status `failed` e timestamp da última tentativa
        - adicionar alerta no Cloud Monitoring para dead-letter com mensagens acumuladas

        ### Fora do escopo
        - reprocessamento manual de eventos na dead-letter (tratado em tarefa separada)
        - mudança no contrato do evento Pub/Sub de entrada
        - alteração no template ou conteúdo dos e-mails
        - migração para outro provedor de e-mail
      </content>
      <why>
        This example is ideal because:
          - the Context Summary anchors the problem in a real incident with measurable impact
          - it describes the current architecture without inventing absent details
          - the Goal is specific and verifiable — not "improve resilience", but retry + DLQ + traceability
          - the In scope is surgical: only what is needed to resolve the reported problem
          - the Out of scope is explicit about what was consciously excluded,
            preventing the agent from expanding scope on its own initiative
      </why>
    </example>

    <example id="2">
      <label>Plano revisado após self-challenge — escopo reduzido</label>
      <sections>7. Plano de Execução Proposto (antes e depois da revisão)</sections>
      <quality>ideal — demonstrates the revision loop</quality>
      <initial_plan>
        ## 7. Plano de Execução Proposto (versão inicial)

        1. Criar migration para adicionar coluna `retry_count` na tabela `notifications`
        2. Criar migration para adicionar tabela `dead_letter_events`
        3. Implementar classe `RetryPolicy` com backoff exponencial
        4. Implementar classe `DeadLetterPublisher` para publicar no tópico DLQ
        5. Refatorar `NotificationDispatcher` para usar `RetryPolicy`
        6. Criar tópico Pub/Sub `notifications-dlq` via Terraform
        7. Criar alerta no Cloud Monitoring via Terraform
        8. Criar worker separado `DlqProcessor` para consumir dead-letter
        9. Implementar dashboard de monitoramento da DLQ
        10. Adicionar testes unitários para `RetryPolicy` e `DeadLetterPublisher`
        11. Adicionar teste de integração end-to-end
      </initial_plan>
      <self_challenge>
        Ao revisar o plano, três problemas foram identificados:

        - **Escopo expandido:** os passos 8 e 9 (DlqProcessor e dashboard) estão fora do
          escopo definido na seção 3 — reprocessamento de DLQ foi explicitamente excluído
        - **Passo desnecessário:** o passo 2 (tabela `dead_letter_events`) duplica a
          funcionalidade do tópico Pub/Sub DLQ — os eventos ficam no Pub/Sub, não no banco
        - **Ordem subótima:** a infra (Terraform) deveria vir antes do código que depende dela
      </self_challenge>
      <revised_plan>
        ## 7. Plano de Execução Proposto (versão revisada)

        1. **Criar infraestrutura Pub/Sub**
           - Objetivo: provisionar tópico `notifications-dlq` e subscription
           - Resultado: tópico disponível para receber eventos dead-letter
           - Arquivos: `infra/pubsub.tf`
           - Nota: aplicar via Terraform em staging primeiro; produção requer confirmação

        2. **Criar migration para coluna `retry_count`**
           - Objetivo: rastrear tentativas por notificação
           - Resultado: coluna `retry_count INTEGER DEFAULT 0` na tabela `notifications`
           - Arquivos: `migrations/20260412_add_retry_count.sql`

        3. **Implementar `RetryPolicy` com backoff exponencial**
           - Objetivo: encapsular lógica de retry com max 3 tentativas
           - Resultado: classe testável e reutilizável
           - Arquivos: `src/services/RetryPolicy.ts`, `tests/services/RetryPolicy.test.ts`

        4. **Integrar retry e dead-letter no `NotificationDispatcher`**
           - Objetivo: usar `RetryPolicy`; publicar no DLQ após esgotamento; registrar
             `status: failed` no banco
           - Resultado: falhas rastreáveis e eventos preservados no DLQ
           - Arquivos: `src/workers/NotificationDispatcher.ts`
           - Nota: a publicação no DLQ deve ser idempotente (usar message ID do evento original)

        5. **Criar alerta no Cloud Monitoring**
           - Objetivo: alertar quando DLQ acumular > 10 mensagens em 5 minutos
           - Resultado: alerta configurado com notification channel existente
           - Arquivos: `infra/monitoring.tf`

        6. **Validação integrada**
           - Objetivo: confirmar que o fluxo completo funciona em staging
           - Resultado: retry executado, falha registrada no banco, evento no DLQ, alerta disparado
           - Nota: simular falha do SendGrid via mock no staging
      </revised_plan>
      <why>
        This example demonstrates the self-challenge loop in action:
          - the initial plan had 11 steps with scope creep and redundancy
          - the revision identified three specific problems and fixed each one
          - the revised plan has 6 focused steps within the defined scope
          - infrastructure comes before code that depends on it (correct sequencing)
          - each step has a clear objective, expected outcome, and files
          - the plan acknowledges production gates ("requer confirmação")
          - a staff engineer would recognize this as a disciplined, executable plan
      </why>
    </example>
  </examples>
