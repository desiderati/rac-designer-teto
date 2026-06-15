# Worked Examples for `subagent-execution.prompt.md`

> Installed by `agents-bootstrap` as `.agents/examples/subagent-execution.example.md`.
> Load only when you need concrete calibration for depth, structure, anti-patterns, or output shape.
> Do not load this file by default during normal prompt execution.

  <examples>
    <example id="1">
      <label>Tarefa simples — manter centralizado</label>
      <task>
        Corrigir um bug no endpoint `POST /orders` que retorna 500 quando o campo `discount`
        é enviado como `null`. O erro aparece em produção e o stacktrace aponta para uma
        NullPointerException no método `applyDiscount()` do serviço `OrderService`.
      </task>
      <quality>ideal</quality>
      <content>
        ## 1. Decisão
        Manter centralizado.

        ## 2. Justificativa
        A causa raiz está isolada em um único método de um único serviço. O fluxo de análise
        é linear: reproduzir o erro → inspecionar `applyDiscount()` → corrigir o tratamento
        de null → validar. Não há frentes independentes. Usar subagentes aqui adicionaria
        overhead de coordenação sem nenhum ganho real de foco ou velocidade.

        ## 3. Estratégia de Execução
        Executar em fluxo único:
          1. Inspecionar `OrderService.applyDiscount()` e o contrato do endpoint
          2. Identificar onde `null` não é tratado
          3. Aplicar a correção mínima com guard clause ou valor padrão
          4. Validar com teste unitário e chamada manual ao endpoint

        ## 4. Riscos e Controles
        - **Risco:** o null handling pode ser necessário em outros métodos além de `applyDiscount()`
        - **Controle:** após a correção, buscar por outros usos de `discount` no mesmo serviço
      </content>
      <why>
        This example demonstrates that the simplicity of the problem is sufficient to reject
        decomposition. The flow fits in four sequential steps. Any subagent here would be
        pure noise. The output follows the Markdown structure defined in output_format exactly.
      </why>
    </example>

    <example id="2">
      <label>Tarefa complexa — usar dois subagentes</label>
      <task>
        O serviço `payment-processor` está com latência alta em produção. Os logs mostram
        lentidão tanto nas queries ao banco PostgreSQL quanto nas chamadas à API do gateway
        de pagamento. Não está claro se o gargalo é no banco, no gateway, ou nos dois.
        Ao mesmo tempo, a equipe quer saber se o README precisa ser atualizado com as
        novas variáveis de ambiente adicionadas na última semana.
      </task>
      <quality>ideal</quality>
      <content>
        ## 1. Decisão
        Usar subagentes.

        ## 2. Justificativa
        Há dois fronts genuinamente independentes: (1) diagnóstico de performance, com duas
        hipóteses fortes que podem ser investigadas em paralelo — banco vs. gateway — e
        (2) revisão de documentação, que não depende do resultado do diagnóstico. Centralizar
        tudo misturaria análise de traces com revisão de README, aumentando ruído sem ganho
        de qualidade. Dois subagentes focados produzem conclusões mais limpas e permitem
        consolidação objetiva no contexto principal.

        **Independente:** análise de performance e revisão de README não compartilham inputs nem outputs.
        **Centralizado:** a consolidação final e o registro no changelog permanecem no contexto principal.
        **Risco de fragmentação:** baixo — os domínios são disjuntos.

        ## 3. Estratégia de Execução

        ### Subagente A: Diagnóstico de performance do `payment-processor`
        - **Objetivo:** identificar o gargalo principal de latência (banco, gateway ou ambos)
        - **Escopo:** análise de logs de latência, traces das queries PostgreSQL, traces das
          chamadas ao gateway, identificação do gargalo e hipóteses ranqueadas
        - **Fora do escopo:** documentação, variáveis de ambiente, README — não deve tocar
          nesses artefatos
        - **Inputs:**
          - logs de produção do `payment-processor` dos últimos 7 dias
          - traces disponíveis no sistema de observabilidade
          - schema atual das tabelas envolvidas nas queries lentas
        - **Output esperado:** relatório com hipótese principal do gargalo, evidências que
          sustentam e descartam cada hipótese, e recomendação de investigação adicional
          se necessário
        - **Método de consolidação:** output recebido no contexto principal para integrar
          ao resumo executivo

        ### Subagente B: Revisão de impacto no README
        - **Objetivo:** determinar se o README precisa ser atualizado com as novas variáveis
          de ambiente
        - **Escopo:** inspeção do README atual, identificação de variáveis adicionadas via
          changelogs recentes, proposta de mudanças mínimas se necessário
        - **Fora do escopo:** performance, logs, traces — não deve analisar nada de runtime
        - **Inputs:**
          - `README.md` atual
          - changelogs da última semana em `.agents/changelogs/`
        - **Output esperado:** decisão clara (atualizar ou não) com proposta de mudanças
          mínimas e conteúdo exato se atualização for necessária
        - **Método de consolidação:** output recebido no contexto principal; se houver
          atualização proposta, revisar antes de aplicar

        **Consolidação geral:** receber os dois outputs no contexto principal, verificar se
        há contradição entre eles (improvável — domínios distintos), e produzir resumo
        executivo com: causa raiz provável da latência + decisão sobre o README. Registrar
        no changelog diário como bloco único consolidado.

        ## 4. Riscos e Controles
        - **Risco:** subagente A pode precisar de informação sobre variáveis de ambiente que
          o subagente B está analisando
        - **Controle:** se subagente A identificar que variáveis de config são relevantes para
          a latência, sinalizar no output para o contexto principal cruzar com o output de B
        - **Risco:** overhead de coordenação desproporcional ao ganho
        - **Controle:** apenas dois subagentes com domínios disjuntos; consolidação simples
      </content>
      <why>
        This example demonstrates the expected level of detail when using subagents:
          - explicit boundaries including what each subagent must NOT do
          - specific inputs, not generic ones
          - verifiable expected output, not vague descriptions
          - consolidation with an explicit conflict-check criterion
          - the output follows the Markdown structure defined in output_format exactly,
            using ### headers for each subagent instead of XML tags
          - decomposition is justified because the two fronts are genuinely independent
            and can produce conclusions in parallel without risk of overlap
      </why>
    </example>
  </examples>
