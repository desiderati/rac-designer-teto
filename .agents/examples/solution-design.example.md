# Worked Examples for `solution-design.prompt.md`

> Installed by `agents-bootstrap` as `.agents/examples/solution-design.example.md`.
> Load only when you need concrete calibration for depth, structure, anti-patterns, or output shape.
> Do not load this file by default during normal prompt execution.

  <examples>
    <example id="1">
      <label>Design com duas alternativas — recomendação fundamentada</label>
      <quality>ideal</quality>
      <content>
        ## 1. Problema

        O serviço `asset-sync` precisa sincronizar dados de ativos entre o EAM local e uma
        API externa (SAP PM) que tem rate limit de 100 requests/minuto e latência média de
        800ms. Atualmente a sincronização é manual via script executado por um operador.
        A necessidade é automatizar com frequência diária, garantindo idempotência e
        rastreabilidade de falhas.

        A frota atual é de ~2.000 ativos. Projeção para 12 meses: ~5.000 ativos.

        ## 2. Critérios de Avaliação

        | Critério                      | Por que importa                                                         | Peso       |
        |-------------------------------|-------------------------------------------------------------------------|------------|
        | Respeito ao rate limit        | API externa rejeita requests excedentes com 429; reprocessamento manual | crítico    |
        | Idempotência                  | Sincronização repetida não deve duplicar ou corromper dados             | crítico    |
        | Rastreabilidade de falhas     | Operações devem saber quais ativos falharam e por quê                   | importante |
        | Simplicidade operacional      | Equipe pequena; solução não deve exigir infra adicional pesada          | importante |
        | Escalabilidade para 5k ativos | Deve funcionar sem redesign em 12 meses                                 | desejável  |

        ## 3. Alternativas Avaliadas

        ### Alternativa A: Worker síncrono com throttling e retry

        - **Descrição:** Cloud Run job executado via Cloud Scheduler (1x/dia). O worker itera
          sobre os ativos, chama a API do SAP PM com throttle de 80 req/min (margem de 20%),
          e persiste o resultado no banco. Retry com backoff para falhas individuais.
          Ativos com falha persistente são marcados como `sync_failed` no banco.

        - **Avaliação por critério:**
          - Rate limit: satisfeito — throttle de 80 req/min garante margem
          - Idempotência: satisfeito — upsert por ID do ativo no banco
          - Rastreabilidade: satisfeito — status `sync_failed` com timestamp e mensagem de erro
          - Simplicidade: forte — usa Cloud Run job + Scheduler, sem fila ou worker adicional
          - Escalabilidade: parcial — 5.000 ativos a 80 req/min = ~62 min de execução;
            viável mas próximo do limite de timeout de Cloud Run jobs (60 min default)

        - **Pontos fortes:** menor complexidade operacional; equipe já conhece Cloud Run;
          sem dependência de fila ou broker
        - **Pontos fracos:** execução sequencial; tempo de sincronização cresce linearmente;
          próximo do timeout para 5k ativos
        - **Condições desqualificantes:** se a frota ultrapassar ~4.800 ativos sem aumento
          de rate limit, o job excede o timeout default
        - **Reversibilidade:** alta — migrar para fila depois é possível sem mudar o modelo
          de dados (o upsert e o status de falha continuam válidos)

        ### Alternativa B: Fila assíncrona com worker paralelo

        - **Descrição:** Cloud Scheduler publica mensagem de trigger. Um producer lê a lista
          de ativos e publica um evento por ativo em fila Pub/Sub. Workers consomem a fila
          com concorrência controlada (máx. 3 instâncias para respeitar rate limit).
          Dead-letter queue para falhas persistentes.

        - **Avaliação por critério:**
          - Rate limit: satisfeito — concorrência de workers controlada; requer cálculo
            cuidadoso de max_instances × throughput ≤ 100 req/min
          - Idempotência: satisfeito — upsert por ID do ativo, message deduplication no Pub/Sub
          - Rastreabilidade: forte — dead-letter queue + logs por mensagem
          - Simplicidade: fraca — adiciona Pub/Sub, dead-letter topic, subscription config,
            e tuning de concorrência; equipe não tem experiência com Pub/Sub em produção
          - Escalabilidade: forte — tempo de execução proporcional ao rate limit, não ao
            número de ativos; 5k ou 50k ativos executam no mesmo tempo

        - **Pontos fortes:** paralelismo controlado; escala sem redesign; melhor observabilidade
          via DLQ
        - **Pontos fracos:** complexidade operacional significativa; debugging de mensagens
          individuais é mais difícil; equipe precisa aprender Pub/Sub
        - **Condições desqualificantes:** se a equipe não puder investir em aprender e operar
          Pub/Sub nos próximos 3 meses
        - **Reversibilidade:** média — migrar de volta para worker síncrono exige remover
          infra de fila e reescrever o fluxo de trigger

        ## 4. Recomendação

        **Alternativa A: Worker síncrono com throttling e retry.**

        A frota atual (2.000 ativos) executa em ~25 minutos — dentro de limites confortáveis.
        A projeção de 5.000 ativos cria pressão mas não atinge o limite dentro dos próximos
        12 meses se o rate limit da API não diminuir. A equipe já opera Cloud Run jobs e
        não tem experiência com Pub/Sub.

        A alternativa B é tecnicamente superior em escalabilidade, mas introduz complexidade
        operacional que a equipe não consegue absorver agora. O modelo de dados (upsert +
        status de falha) foi desenhado para ser independente do mecanismo de execução — migrar
        para fila no futuro é viável sem retrabalho de schema.

        **Trade-offs aceitos:**
        - tempo de sincronização cresce linearmente com a frota
        - se a frota crescer além de ~4.800 ativos, será necessário migrar para a alternativa B
          ou negociar aumento de rate limit com o fornecedor da API

        ## 5. Premissas e Dependências

        ### Premissas
        - rate limit da API SAP PM se mantém em 100 req/min nos próximos 12 meses
        - latência média da API não degrada significativamente (p99 atual: 1.2s)
        - Cloud Run job timeout pode ser aumentado para 90 min se necessário (limite máximo: 24h)

        ### Dependências
        - credenciais de acesso à API SAP PM já provisionadas e validadas
        - Cloud Scheduler já configurado para outros jobs no projeto

        ### Informação ausente
        - SLA formal da API SAP PM para latência e disponibilidade — impacta a escolha de
          timeout e retry

        ## 6. Condições de Invalidação

        Este design deve ser revisitado se:
        - a frota ultrapassar 4.500 ativos (zona de risco para timeout)
        - o rate limit da API for reduzido
        - a equipe adquirir proficiência em Pub/Sub e a complexidade operacional deixar de
          ser um fator
        - a frequência de sincronização precisar ser maior que 1x/dia (worker síncrono não
          suporta frequências altas com frotas grandes)

        ## 7. Contrato para o Plano de Implementação

        - **Abordagem:** worker síncrono (Cloud Run job + Cloud Scheduler) com throttling
          de 80 req/min, upsert por ID, retry com backoff, status `sync_failed` para falhas
        - **Restrições arquiteturais:** não usar fila; manter modelo de dados agnóstico ao
          mecanismo de execução (permitir migração futura para fila sem mudança de schema)
        - **Pontos de integração:** API SAP PM (REST, autenticação via service account),
          PostgreSQL via Cloud SQL para persistência
        - **Fora do escopo:** dead-letter queue, Pub/Sub, concorrência de workers, dashboard
          de monitoramento (tratados quando a migração para fila for necessária)
      </content>
      <why>
        This example is ideal because:
          - it restates the problem with concrete numbers (2k assets, 100 req/min, 800ms latency)
            instead of vague descriptions
          - evaluation criteria are specific to this problem, not generic quality attributes
          - each alternative is evaluated against the same criteria with specific evidence
          - the recommendation is grounded in team capability (Pub/Sub inexperience) and timeline
            (12-month projection), not abstract preference
          - trade-offs are explicit: the recommended approach has a known ceiling (~4.8k assets)
          - invalidation conditions define exactly when the decision should be revisited
          - the contract for implementation-planning is concise and actionable — it tells the
            planner what to build, what constraints to respect, and what is explicitly excluded
          - the data model is designed for reversibility (agnostic to execution mechanism),
            which is a deliberate architectural choice, not an accident
      </why>
    </example>
  </examples>
