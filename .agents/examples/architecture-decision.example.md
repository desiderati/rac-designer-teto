# Worked Examples for Architecture Decision Prompt

> Installed by `agents-bootstrap` as `.agents/examples/architecture-decision.example.md`.
> Load only when you need calibration for ADR eligibility, update-vs-create,
> or concise output shape. Do not load this file by default.

<examples>
  <example id="1">
    <label>Modo prévio — criar ADR proposto antes da implementação</label>
    <quality>ideal</quality>
    <content>
      # Decisão Arquitetural

      ## 1. Classificação

      - modo: `prévio`
      - veredito: `criar ADR proposto`
      - justificativa:
        - a decisão escolhe entre worker síncrono e fila assíncrona para integração diária com API externa
        - a reversão exige migração operacional e mudança de observabilidade
        - futuros mantenedores precisarão entender por que a arquitetura inicial evitou fila

      ## 2. Evidências Consultadas

      - documentos:
        - `README.md`
        - `.agents/prompts/solution-design.prompt.md`
        - saída do design de solução da frente `asset-sync`
      - ADRs existentes relacionados:
        - nenhum
      - lacunas ou incertezas:
        - SLA formal da API externa ainda não foi fornecido

      ## 3. Decisão e Alternativas

      - decisão:
        - registrar ADR proposto para usar worker síncrono com throttling e modelo de dados reversível
      - alternativas consideradas:
        - worker síncrono com throttling e retry
        - fila assíncrona com workers paralelos
      - por que as alternativas foram rejeitadas:
        - fila assíncrona foi rejeitada no MVP por custo operacional e baixa maturidade da equipe com Pub/Sub
      - custo de reversão:
        - médio; o modelo de dados permite migração futura, mas a operação e observabilidade mudariam

      ## 4. Artefato ADR

      - caminho:
        - docs/architecture-decisions/ADR-003-asset-sync-worker-sincrono.md
      - número:
        - `ADR-003`
      - status:
        - `proposed`
      - resumo do conteúdo:
        - contexto com rate limit, volume atual e projeção
        - decisão por worker síncrono no MVP
        - alternativa assíncrona documentada como evolução futura

      ## 5. Validação e Próximos Passos

      - validações executadas ou recomendadas:
        - validar claims de path no ADR após escrita
      - links que devem ser atualizados:
        - `OBSIDIAN.md`, se o repositório usar índice navegável
      - condições de revisão futura:
        - frota ultrapassar o limite operacional projetado
        - equipe passar a operar Pub/Sub com segurança
    </content>
    <why>
      This example is ideal because it records a reversible but material architecture
      choice before implementation, keeps status as `proposed`, and avoids pretending
      the ADR is already accepted.
    </why>
  </example>

  <example id="2">
    <label>Modo promocional — consolidar decisão saída de refactoring</label>
    <quality>ideal</quality>
    <content>
      # Decisão Arquitetural

      ## 1. Classificação

      - modo: `promocional`
      - veredito: `criar ADR aceito`
      - justificativa:
        - a rodada de refactoring consolidou uma regra de governança que já passou a orientar `agents-bootstrap`,
          `agents-housekeeping` e `refactoring`
        - a decisão altera onde a memória operacional vive e quando uma decisão é promovida para documentação canônica
        - futuros mantenedores precisarão entender por que `.agents/refactorings/` não é mais acervo versionado

      ## 2. Evidências Consultadas

      - documentos:
        - `AGENTS.md`
        - `OBSIDIAN.md`
        - `docs/SKILL-003-file-retention.md`
        - `refactoring/SKILL.md`
        - `agents-housekeeping/SKILL.md`
      - ADRs existentes relacionados:
        - `docs/architecture-decisions/ADR-001-skill-script-boundary-decomposition.md`
      - lacunas ou incertezas:
        - nenhuma material para o registro da decisão já aplicada

      ## 3. Decisão e Alternativas

      - decisão:
        - registrar `.agents/refactorings/` como workspace local e promover apenas decisões arquiteturais para ADR
      - alternativas consideradas:
        - manter `.agents/refactorings/` como acervo versionado
        - criar uma pasta paralela no singular apenas para prompts
        - transformar toda frente de refactoring em ADR
      - por que as alternativas foram rejeitadas:
        - todas misturavam memória operacional transitória com conhecimento canônico ou aumentavam a topologia sem ganho
      - custo de reversão:
        - médio; envolve bootstrap, housekeeping, prompt de refactoring e documentação canônica

      ## 4. Artefato ADR

      - caminho:
        - `docs/architecture-decisions/ADR-002-local-refactorings-workspace-and-adr-promotion.md`
      - número:
        - `ADR-002`
      - status:
        - `accepted`
      - resumo do conteúdo:
        - separação entre memória operacional local e documentação canônica
        - regra de recomendação de ADR no fechamento de refactoring
        - consequências e condições de revisão

      ## 5. Validação e Próximos Passos

      - validações executadas ou recomendadas:
        - validar path claims do ADR e de `OBSIDIAN.md`
      - links que devem ser atualizados:
        - `OBSIDIAN.md`
      - condições de revisão futura:
        - volume de refactorings locais exigir curadoria mais forte
    </content>
    <why>
      This example is ideal because it promotes only the durable architectural
      decision from a larger refactoring session and avoids one ADR per refactoring
      file.
    </why>
  </example>
</examples>
