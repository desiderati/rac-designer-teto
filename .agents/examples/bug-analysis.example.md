# Worked Examples for `bug-analysis.prompt.md`

> Installed by `agents-bootstrap` as `.agents/examples/bug-analysis.example.md`.
> Load only when you need concrete calibration for depth, structure, anti-patterns, or output shape.
> Do not load this file by default during normal prompt execution.

  <examples>
    <example id="1">
      <label>Contexto ideal — problema bem delimitado</label>
      <section>1. Resumo de Contexto</section>
      <quality>ideal</quality>
      <content>
        O serviço `order-processor` é um worker assíncrono responsável por consumir eventos
        da fila `orders.created` e persistir os pedidos no banco PostgreSQL antes de publicar
        um evento `orders.confirmed` para o serviço downstream `billing`.

        O problema foi reportado em produção após o deploy da versão 2.4.1, que introduziu
        suporte a pedidos com múltiplos itens. Antes desse deploy, o fluxo funcionava
        corretamente para pedidos com item único.

        O ambiente afetado é produção. Staging não reproduz o problema porque usa um fixture
        com apenas um item por pedido. O banco de dados é PostgreSQL 15, gerenciado via
        Cloud SQL. O serviço roda em Cloud Run com concorrência configurada em 10.

        Não há evidência de rollback disponível imediato — a migração de schema introduzida
        na 2.4.1 já foi aplicada em produção.
      </content>
      <why>
        This summary is ideal because:
          - it identifies the service, its responsibility, and the data flow around it
          - it anchors the problem to a concrete event (2.4.1 deploy) with a specific change
          - it explains why staging does not reproduce the issue (fixture difference)
          - it records relevant operational constraints (migration applied, no immediate rollback)
          - it contains no undeclared assumptions or hypotheses embedded as facts
      </why>
    </example>

    <example id="2">
      <label>Hipótese refutada — diagnóstico que descarta a causa aparente</label>
      <section>3. Hipóteses Ranqueadas</section>
      <quality>ideal</quality>
      <content>
        ### Hipótese 1 (descartada): Timeout na conexão com o banco de dados

        **Probabilidade inicial:** alta — o stacktrace mencionava `ConnectionTimeoutException`
        e a latência do Cloud SQL havia aumentado no período do incidente.

        **Evidências a favor:**
        - stacktrace com `ConnectionTimeoutException` às 14:32 UTC
        - dashboard do Cloud SQL mostrando p99 de latência em 1.2s (normal: 80ms)

        **Evidências contra:**
        - os logs do connection pool mostram que todas as conexões foram adquiridas com sucesso
        - a exceção ocorre APÓS a query retornar, não durante a tentativa de conexão
        - o timeout configurado no pool é 30s — a latência de 1.2s não o atingiria

        **Conclusão:** a exceção é um efeito colateral, não a causa raiz. O nome da exceção
        é enganoso: ela é lançada pelo middleware de serialização quando o response body
        excede o buffer configurado, e o framework a encapsula como `ConnectionTimeoutException`
        por herança de classe incorreta no error handler.

        **O que revelou:** a causa raiz é o tamanho do payload de resposta para pedidos com
        múltiplos itens, não a latência do banco.

        ---

        ### Hipótese 2 (confirmada): Buffer overflow no middleware de serialização

        **Probabilidade:** alta — consistente com o deploy 2.4.1 que introduziu múltiplos itens.

        **Evidências a favor:**
        - pedidos com 1 item retornam payload de ~2KB (dentro do buffer de 8KB)
        - pedidos com 5+ itens retornam payload de ~12KB (excede o buffer)
        - o erro só ocorre em produção porque staging não testa múltiplos itens
        - a exceção desaparece quando o buffer é aumentado para 64KB em teste local

        **Validação realizada:**
        - reproduzido localmente com payload de 5 itens
        - confirmado que o buffer default do middleware é 8KB
        - confirmado que a exceção é mascarada como ConnectionTimeoutException pelo error handler
      </content>
      <why>
        This example is ideal because:
          - it shows a hypothesis that looked strong but was refuted by evidence
          - the refutation is grounded in specific facts, not opinion
          - it traces the misleading exception name to its actual origin (class inheritance in error handler)
          - the confirmed hypothesis connects directly to the triggering change (2.4.1 deploy)
          - it demonstrates that ranking by probability means being willing to discard the obvious answer
          - it preserves the diagnostic path, which is valuable for future similar incidents
      </why>
    </example>

    <example id="3">
      <label>Output completo — todas as 7 seções integradas</label>
      <section>1-7 (output integral)</section>
      <quality>ideal</quality>
      <content>
        # 1. Resumo de Contexto

        O endpoint `GET /assets/{id}/history` do serviço `eam-api` retorna 504 Gateway Timeout
        para ativos com mais de 500 registros de manutenção. O problema foi reportado pelo
        coordenador de manutenção ao consultar o histórico do ativo `COMP-0042`, que tem 847
        registros acumulados em 6 anos de operação.

        O serviço roda em Cloud Run (timeout: 60s). O banco é PostgreSQL 14 via Cloud SQL.
        A query usa `ORDER BY created_at DESC` sem paginação — retorna todos os registros de
        uma vez. O problema não aparecia antes porque nenhum ativo havia ultrapassado ~400
        registros até o mês passado.

        # 2. Fluxo Esperado vs. Fluxo Real

        **Esperado:** requisição → query ao banco → serialização → resposta JSON em <2s
        **Real:** requisição → query ao banco (~3s para 847 registros) → serialização do
        payload de ~4MB (~45s) → timeout do Cloud Run (60s) antes de completar a resposta

        **Ponto de divergência:** a serialização do payload, não a query. A query em si executa
        em tempo aceitável. O gargalo está no volume de dados sendo serializado e transmitido.

        # 3. Hipóteses Ranqueadas

        ### Hipótese 1 (confirmada): Ausência de paginação no endpoint

        **Probabilidade:** alta
        **Evidências a favor:**
        - o controller chama `historyRepository.findByAssetId(id)` sem LIMIT
        - o payload para COMP-0042 tem 4.2MB
        - ativos com <200 registros respondem em <1s; ativos com >500 registros causam timeout

        **Evidências contra:** nenhuma

        **Validação:** confirmado — adicionando `LIMIT 50` à query, o endpoint responde em
        180ms para COMP-0042

        ### Hipótese 2 (descartada): Lentidão no Cloud SQL

        **Probabilidade:** baixa
        **Evidências contra:**
        - `EXPLAIN ANALYZE` mostra a query executando em 3.1s para 847 registros
        - o dashboard do Cloud SQL não mostra degradação no período
        - o timeout ocorre na serialização, não na query

        # 4. Plano de Validação

        1. Confirmar que a query sem LIMIT é a causa raiz → executar com LIMIT 50 e medir
        2. Verificar se o endpoint tem contrato de paginação documentado → inspecionar openapi.yaml
        3. Verificar se consumers dependem de receber todos os registros → inspecionar frontend
           e integrações conhecidas

        # 5. Correção Recomendada

        Implementar paginação cursor-based no endpoint `GET /assets/{id}/history`:
        - parâmetros: `?cursor={last_id}&limit=50`
        - default: `limit=50`, `cursor=null` (primeira página)
        - resposta inclui `next_cursor` para a próxima página

        Cursor-based em vez de offset-based porque a tabela tem inserções frequentes e
        offset causaria inconsistência em páginas durante uso simultâneo.

        # 6. Riscos e Impactos

        - **Risco:** consumers existentes que consomem a resposta completa vão quebrar
        - **Mitigação:** manter compatibilidade temporária com `?limit=0` retornando todos
          os registros (deprecated, com header `X-Deprecated: full-response`), remover após
          migração dos consumers
        - **Risco:** o frontend pode não suportar paginação ainda
        - **Mitigação:** verificar com a equipe de frontend antes de implementar

        # 7. Como Confirmar a Resolução

        - endpoint responde em <500ms para COMP-0042 com `limit=50`
        - `next_cursor` permite navegar todas as 847 entradas em páginas consecutivas
        - nenhum consumer reporta erro após o deploy (monitorar por 48h)
        - alerta de 504 no Cloud Monitoring não dispara para o endpoint nas 48h seguintes
      </content>
      <why>
        This example demonstrates the complete output format because:
          - all 7 sections are present in the correct order with the correct PT headers
          - each section serves its specific purpose without bleeding into others
          - the Context (section 1) describes the problem without hypothesizing
          - the Flow comparison (section 2) pinpoints the exact divergence
          - the Hypotheses (section 3) include one confirmed and one discarded, both with evidence
          - the Validation Plan (section 4) comes before the fix — diagnosis before prescription
          - the Recommended Fix (section 5) includes rationale for the approach (cursor vs offset)
          - Risks (section 6) cover both technical and organizational impacts with mitigations
          - Confirmation criteria (section 7) are measurable and time-bounded
          - a developer reading this output can act on every section without follow-up questions
      </why>
    </example>
  </examples>
