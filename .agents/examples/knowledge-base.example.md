# Worked Examples for `knowledge-base.prompt.md`

> Use this file only when you need calibration for tone, structure, anti-patterns, or output shape.
> In the standalone skill, this file lives under `scaffold/examples/knowledge-base.example.md`.
> When installed by `agents-bootstrap`, it is copied to `.agents/examples/knowledge-base.example.md`.

  <examples>
    <example>
      <classification>technical-decision</classification>
      <quality>ideal</quality>
      <changelog_entry>
        ## [14:32] Migração do serviço de notificações para filas assíncronas

        ### Tipo
        - decisão técnica

        ### Contexto
        O serviço `notification-dispatcher` chamava a API do SendGrid de forma síncrona dentro
        da transação do banco. Falhas de entrega causavam rollback da transação principal.

        ### Decisão tomada
        Desacoplar o envio de notificações da transação principal via fila assíncrona (RabbitMQ).
        O job de envio passa a ser responsabilidade de um worker separado com retry próprio.

        ### Evidências
        - três incidentes nos últimos 30 dias onde timeout do SendGrid causou perda de pedidos
        - análise de traces confirmou que p99 da transação subia de 120ms para 4s quando SendGrid
          estava degradado

        ### Riscos ou pendências
        - worker ainda não tem dead-letter queue implementada
        - monitoramento de fila não configurado
      </changelog_entry>
      <generated_note>
        # Desacoplamento de notificações via fila assíncrona

        ## Tipo
        - decisão técnica

        ## Resumo executivo
        Serviços que chamam APIs externas de forma síncrona dentro de transações de banco
        criam acoplamento de falha: degradação do serviço externo propaga rollback para a
        transação principal. A solução padrão é desacoplar via fila assíncrona com worker
        e retry independentes.

        ## Contexto
        Aparece quando um serviço precisa garantir entrega de eventos externos (e-mail, SMS,
        webhook) sem comprometer a atomicidade ou latência da operação principal.

        ## Sintomas comuns
        - rollback de transações por timeout de API externa
        - p99 de latência anormalmente alto correlacionado com degradação de serviço externo
        - perda de registros em cenários de falha parcial

        ## Causa raiz mais comum
        Chamada síncrona a serviço externo dentro do escopo de transação do banco, sem
        mecanismo de retry ou fallback independente.

        ## Decisão e estratégia recomendada
        Publicar evento em fila assíncrona ao final da transação principal. Worker separado
        consome a fila com retry e dead-letter queue próprios. O serviço principal não depende
        do sucesso da entrega para confirmar a transação.

        ## Como validar
        - latência da transação principal não deve variar com degradação do serviço externo
        - falhas de entrega devem aparecer na dead-letter queue, não como erros na transação
        - traces devem mostrar publicação na fila como operação isolada do commit do banco

        ## O que evitar
        - chamar APIs externas dentro do escopo de transação do banco
        - tratar falha de entrega como falha de negócio na operação principal
        - implementar worker sem dead-letter queue e monitoramento de fila

        ## Pendências conhecidas neste caso
        - dead-letter queue do worker ainda não implementada
        - monitoramento de fila não configurado

        ## Referências de origem
        - `.agents/changelogs/2026-03/20260330.changelog.md`

        ## Tags
        #decisao-tecnica #async #fila #notificacao #acoplamento
      </generated_note>
      <why>
        This note is ideal because:
          - it does not copy the changelog: it extracts reusable learning and generalizes the pattern
          - the Executive summary describes the class of problem, not the specific incident
          - Symptoms and Root cause are written so any engineer would recognize them in future
            projects, regardless of stack
          - Known pending items preserves operational context without turning it into a general rule
          - the source reference preserves the originating changelog as provenance without linking to local
            non-versioned material
      </why>
    </example>

    <example>
      <classification>no-durable-relevance</classification>
      <quality>ideal rejection</quality>
      <changelog_entry>
        ## [09:15] Ajuste de timeout no Cloud Run job de sincronização

        ### Tipo
        - configuração

        ### Contexto
        O job `asset-sync` estava falhando por timeout em staging durante testes com carga
        de 3.000 ativos simulados. O timeout default era 300s. A execução real levava ~320s.

        ### Decisão tomada
        Aumentar o timeout de 300s para 600s no arquivo `infra/cloudrun.tf`.

        ### Evidências
        - logs do Cloud Run mostrando `terminated: timeout` após 300s
        - execução com timer local medindo 318s para 3.000 ativos

        ### Validação
        - job executou com sucesso em staging após o ajuste (completou em 322s)

        ### Arquivos afetados
        - `infra/cloudrun.tf`
      </changelog_entry>
      <triage_decision>
        **Classificação:** no-durable-relevance

        **Por que NÃO promover:**
        - o ajuste é uma configuração pontual de um valor numérico (300s → 600s), não uma
          decisão arquitetural ou padrão reutilizável
        - não há aprendizado generalizável: "se o job demora mais que o timeout, aumente o
          timeout" não é conhecimento que precisa ser preservado em nota permanente
        - o valor específico (600s) é contextual ao volume de ativos e à latência da API —
          vai mudar novamente quando a frota crescer
        - se o problema de timeout se tornar recorrente (ex: a cada crescimento de frota),
          aí sim justificaria uma nota sobre padrão de dimensionamento de timeout para
          jobs de sincronização — mas com uma ocorrência, é ruído

        **Onde o registro já vive:** no changelog diário, que é o lugar correto para
        configurações pontuais com contexto operacional. Se alguém precisar saber que o
        timeout foi alterado, o changelog tem a informação. Promover para a knowledge base
        transformaria um fato operacional em falsa sabedoria permanente.
      </triage_decision>
      <why>
        This rejection is ideal because:
          - it explicitly classifies the item as no-durable-relevance
          - the justification is specific to the item, not generic ("it's just config")
          - it explains the threshold for when a similar item WOULD justify promotion
            (recurrence, pattern of dimensioning problems)
          - it acknowledges where the information already lives (changelog) and why that
            is sufficient
          - it prevents the knowledge base from filling with configuration tweaks that
            have no reuse value
          - the key phrase "falsa sabedoria permanente" captures the anti-pattern: turning
            every operational fact into a permanent note dilutes the knowledge base
      </why>
    </example>

    <example>
      <classification>correction-pattern</classification>
      <quality>ideal</quality>
      <changelog_entry>
        ## [10:05] Consolidação do diagnóstico de duplicidade no worker

        ### Tipo
        - correção de padrão

        ### Contexto
        O work-item local `20260422-worker-duplication.work-item.md` registrou a
        investigação de uma duplicidade que parecia vir do webhook de entrada.
        Os arquivos em `20260422-worker-duplication.work-item.assets/` mostraram
        que o payload chegava único; a duplicidade aparecia no reprocessamento do
        worker após retry.

        ### Decisão tomada
        Consolidar o caso em uma nota durável separando:
        - fase executada: investigação do worker em staging
        - hipótese invalidada: duplicidade na entrada do webhook
        - desenho futuro: idempotência no consumidor

        ### Evidências
        - timeline no work-item local
        - logs e capturas no sidecar
        - changelog da correção aplicada
      </changelog_entry>
      <generated_note>
        # Idempotência no consumidor de notificações

        ## Tipo
        - correção de padrão

        ## Resumo executivo
        Quando a evidência local mostra que o payload chega único e a duplicidade
        aparece apenas na etapa posterior de consumo, o padrão a consolidar é o de
        idempotência no consumidor, não o de correção da entrada.

        ## Proveniência local e recorte
        - Artefatos de origem:
          - `20260422-worker-duplication.work-item.md`
          - `20260422-worker-duplication.work-item.assets/`
          - `.agents/changelogs/2026-04/20260422.changelog.md`
        - Fase executada:
          - investigação do worker em staging
        - Hipótese invalidada:
          - duplicidade na entrada do webhook
        - Desenho futuro ou follow-up:
          - idempotência no consumidor

        ## Contexto
        O padrão aparece quando o evento original é único, mas retries ou
        reprocessamentos produzem efeitos repetidos porque o consumidor não
        reconhece a tentativa anterior.

        ## Causa raiz
        Falta de idempotência no consumidor, geralmente combinada com retry sem
        chave de deduplicação suficiente.

        ## Estratégia recomendada
        Tratar o consumidor como idempotente, com chave estável e verificação de
        processamento anterior antes de aplicar o efeito de negócio.

        ## Como validar
        - o mesmo payload pode ser reenviado sem duplicar o efeito
        - os artefatos locais deixam claro qual hipótese foi descartada
        - a nota final preserva a distinção entre fase executada e desenho futuro

        ## Referências de origem
        - `.agents/changelogs/2026-04/20260422.changelog.md`

        ## Tags
        #correcao-de-padrao #idempotencia #proveniencia
      </generated_note>
      <why>
        This example is ideal because:
          - it shows work-item and sidecar as source evidence, not destination
          - it separates executed phase, invalidated hypothesis, and future design
          - the durable note stays reusable instead of becoming a dump of local files
          - the provenance section keeps the case auditable without confusing the
            role of the note
      </why>
    </example>
  </examples>
