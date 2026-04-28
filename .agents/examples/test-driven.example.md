# Worked Examples for `test-driven.prompt.md`

> Installed by `agents-bootstrap` as `.agents/examples/test-driven.example.md`.
> Load only when you need concrete calibration for depth, structure, anti-patterns, or output shape.
> Do not load this file by default during normal prompt execution.

  <examples>
    <example id="1">
      <label>Especificação test-first para sincronização de ativos</label>
      <quality>ideal</quality>
      <content>
        ## 1. Contexto e Escopo

        Este teste especifica o comportamento do worker `AssetSyncJob` conforme definido
        no design de solução aprovado: worker síncrono com throttling de 80 req/min,
        upsert por ID de ativo, retry com backoff, e marcação de falhas como `sync_failed`.

        **Em escopo:**
        - lógica de throttling
        - upsert idempotente
        - retry com backoff
        - marcação de falha
        - tratamento de respostas da API (200, 429, 500, timeout)

        **Fora do escopo:**
        - Cloud Scheduler trigger (infraestrutura, não comportamento)
        - schema de migração do banco (testado separadamente)
        - monitoramento e alertas

        ## 2. Convenções do Repositório

        - Framework: Jest (já utilizado em `src/__tests__/`)
        - Convenção de nomes: `describe('ComponentName')` → `it('should [behavior]')`
        - Mocks: `jest.mock()` para dependências externas
        - Fixtures: `src/__tests__/fixtures/` para dados de teste
        - Estrutura: testes espelham a estrutura de `src/` sob `src/__tests__/`

        ## 3. Especificações por Componente

        ### AssetSyncJob — Lógica de sincronização principal

        #### Nível: unit

        - **Teste:** `it('should sync all assets when API returns 200 for every request')`
        - **Categoria:** happy path
        - **Dado:** lista de 5 ativos; API mock retorna 200 com dados válidos para todos
        - **Quando:** `AssetSyncJob.execute()` é chamado
        - **Então:** 5 upserts no banco com dados correspondentes; nenhum registro com `sync_failed`
        - **Notas:** mock da API e do repositório de banco

        ---

        - **Teste:** `it('should upsert without duplication when the same asset is synced twice')`
        - **Categoria:** edge case — idempotência
        - **Dado:** ativo com ID `ASSET-001` já existe no banco com dados da versão anterior
        - **Quando:** API retorna dados atualizados para `ASSET-001`; `AssetSyncJob.execute()` roda
        - **Então:** registro no banco é atualizado (não duplicado); contagem total de registros
          permanece igual; campos atualizados refletem a versão mais recente
        - **Notas:** testar com dados diferentes entre a versão existente e a nova para confirmar
          que o upsert realmente atualiza

        ---

        - **Teste:** `it('should mark asset as sync_failed when API returns 500 after all retries')`
        - **Categoria:** error handling
        - **Dado:** ativo `ASSET-002`; API mock retorna 500 em todas as 3 tentativas
        - **Quando:** `AssetSyncJob.execute()` processa `ASSET-002`
        - **Então:** registro no banco com `status: 'sync_failed'`, `last_error: '500 Internal Server Error'`,
          `last_attempt_at: [timestamp]`; demais ativos continuam sendo processados normalmente
        - **Notas:** confirmar que a falha de um ativo não interrompe a sincronização dos demais

        ---

        - **Teste:** `it('should retry with exponential backoff when API returns 429')`
        - **Categoria:** error handling — rate limit
        - **Dado:** ativo `ASSET-003`; API mock retorna 429 na primeira tentativa, 200 na segunda
        - **Quando:** `AssetSyncJob.execute()` processa `ASSET-003`
        - **Então:** ativo sincronizado com sucesso; intervalo entre tentativas ≥ backoff mínimo
          configurado; log registra retry
        - **Notas:** usar `jest.useFakeTimers()` para verificar intervalos de backoff sem espera real

        ---

        - **Teste:** `it('should not exceed 80 requests per minute regardless of asset count')`
        - **Categoria:** edge case — throttling
        - **Dado:** lista de 100 ativos; API mock retorna 200 para todos
        - **Quando:** `AssetSyncJob.execute()` é chamado
        - **Então:** nenhum intervalo de 60 segundos contém mais de 80 chamadas à API
        - **Notas:** instrumentar o mock da API com timestamps de chamada; verificar janela deslizante

        ---

        - **Teste:** `it('should handle empty asset list without errors')`
        - **Categoria:** edge case — input vazio
        - **Dado:** lista de ativos vazia
        - **Quando:** `AssetSyncJob.execute()` é chamado
        - **Então:** nenhuma chamada à API; nenhuma operação no banco; job termina com sucesso
        - **Notas:** confirmar que o job não falha e não loga erros espúrios

        ---

        - **Teste:** `it('should handle API timeout as a retryable failure')`
        - **Categoria:** error handling — timeout
        - **Dado:** ativo `ASSET-004`; API mock não responde dentro do timeout configurado (10s)
        - **Quando:** `AssetSyncJob.execute()` processa `ASSET-004`
        - **Então:** timeout tratado como falha retryável; se todas as tentativas falharem por
          timeout, ativo marcado como `sync_failed` com `last_error: 'Request timeout'`
        - **Notas:** mock de timeout via `jest.useFakeTimers()` ou abort controller

        ### AssetRepository — Persistência idempotente

        #### Nível: integration

        - **Teste:** `it('should insert new asset when ID does not exist')`
        - **Categoria:** happy path
        - **Dado:** banco sem registro para `ASSET-NEW`
        - **Quando:** `AssetRepository.upsert(assetData)` é chamado
        - **Então:** novo registro criado com todos os campos; `created_at` e `updated_at` preenchidos
        - **Notas:** teste de integração contra banco de teste (não mock)

        ---

        - **Teste:** `it('should update existing asset without changing created_at')`
        - **Categoria:** edge case — idempotência
        - **Dado:** registro existente para `ASSET-001` com `created_at: T1`
        - **Quando:** `AssetRepository.upsert(updatedAssetData)` é chamado
        - **Então:** campos atualizados refletem novos dados; `updated_at > T1`; `created_at == T1`
        - **Notas:** confirmar que `created_at` é preservado — indicador de integridade do upsert

        ## 4. Matriz de Cobertura

        | Comportamento                   | Unit | Integration | Contract | Acceptance | Gaps                              |
        |---------------------------------|------|-------------|----------|------------|-----------------------------------|
        | Sincronização happy path        | ✓    | -           | -        | -          | -                                 |
        | Idempotência (upsert)           | ✓    | ✓           | -        | -          | -                                 |
        | Rate limit (throttling)         | ✓    | -           | -        | -          | -                                 |
        | Retry com backoff               | ✓    | -           | -        | -          | -                                 |
        | Falha persistente (sync_failed) | ✓    | -           | -        | -          | -                                 |
        | Timeout da API                  | ✓    | -           | -        | -          | -                                 |
        | Lista vazia                     | ✓    | -           | -        | -          | -                                 |
        | Persistência (insert/update)    | -    | ✓           | -        | -          | -                                 |
        | Execução completa end-to-end    | -    | -           | -        | -          | Não especificado (requer staging) |


        ## 5. Perguntas em Aberto

        - **Comportamento com dados parciais:** se a API retorna 200 mas com campos obrigatórios
          faltando, o ativo deve ser salvo com dados parciais ou marcado como `sync_failed`?
          Impacta: teste de validação de resposta da API
        - **Ordem de processamento:** os ativos devem ser sincronizados em ordem específica
          (ex: por prioridade ou data de última sincronização)? Impacta: teste de ordenação
        - **Limite de falhas:** se mais de X% dos ativos falham, o job deve abortar ou continuar?
          Impacta: teste de threshold de falha

        ## 6. Ordem de Implementação Sugerida

        1. `AssetRepository.upsert()` — testes de integração (fundação: sem persistência
           correta, nada funciona)
        2. `AssetSyncJob` — happy path unitário (confirma o fluxo básico)
        3. `AssetSyncJob` — idempotência (confirma que reprocessamento é seguro)
        4. `AssetSyncJob` — error handling (429, 500, timeout)
        5. `AssetSyncJob` — throttling (confirma respeito ao rate limit)
        6. `AssetSyncJob` — edge cases (lista vazia, dados parciais se a pergunta for respondida)
      </content>
      <why>
        This example is ideal because:
          - it derives directly from a design decision (worker síncrono com throttling),
            not from imagined requirements
          - each test follows the Given-When-Then structure with concrete values, not vague descriptions
          - categories (happy path, edge case, error handling) make the coverage intent explicit
          - the coverage matrix reveals a deliberate gap (no acceptance test) with a reason
            (requires staging), rather than pretending full coverage exists
          - open questions identify genuine ambiguities that would lead to wrong tests if assumed
          - the implementation order starts from the foundation (persistence) and builds upward,
            allowing incremental validation
          - the specs test behavior ("should mark as sync_failed"), not implementation details
            ("should call markAsFailed method three times")
          - a developer reading these specs knows exactly what to implement without seeing
            the production code
      </why>
    </example>

    <example id="2">
      <label>Especificação para código legado com estratégia adaptada</label>
      <quality>ideal</quality>
      <content>
        ## 1. Contexto e Escopo

        O serviço `report-generator` precisa de uma correção no cálculo de horas trabalhadas
        por técnico. O método `calculateWorkedHours()` na classe `ReportService` retorna
        valores incorretos quando uma ordem de serviço atravessa a meia-noite.

        **Em escopo:**
        - correção do cálculo de horas quando a OS cruza meia-noite
        - proteção contra regressão no cálculo existente para OS intra-dia

        **Fora do escopo:**
        - refatoração geral do ReportService
        - cobertura de testes para outros métodos da classe

        ## 2. Avaliação de Testabilidade

        **Tipo de código:** legado — `ReportService` existe há 4 anos, sem testes.

        **Avaliação:**
        - Entry points: o método `calculateWorkedHours(orderId)` é público mas depende
          internamente de `OrderRepository` (injetado via construtor) e `Clock.systemUTC()`
          (chamada estática, não injetável)
        - Dependências: `OrderRepository` é injetável; `Clock` é hardcoded via chamada estática
        - Infraestrutura de teste: Jest existe no projeto (usado em outros módulos), mas
          `ReportService` não tem nenhum teste
        - Comportamento documentado: não existe documentação; o comportamento atual deve ser
          descoberto lendo o código

        **Estratégia escolhida:** characterization tests + change-only testing.
        Justificativa: o comportamento atual não está documentado, e a dependência estática de
        `Clock` impede unit test puro. Vou usar characterization tests na fronteira (input/output
        do método público) para capturar o comportamento atual, depois especificar os testes
        comportamentais para a correção. Não vou tentar cobrir toda a classe.

        ## 3. Convenções do Repositório

        - Framework: Jest
        - Convenção: `describe('ComponentName')` → `it('should [behavior]')`
        - Fixtures: `src/__tests__/fixtures/`
        - Nota: `ReportService` não tem arquivo de teste — será criado como
          `src/__tests__/services/ReportService.test.ts`

        ## 4. Especificações por Componente

        ### ReportService.calculateWorkedHours — Characterization tests

        #### Nível: integration (boundary — testando via método público com repositório mockado)

        - **Teste:** `it('should return 8 hours for an order from 08:00 to 16:00 same day')`
        - **Categoria:** characterization
        - **Dado:** OS com `start: 2026-04-14T08:00Z`, `end: 2026-04-14T16:00Z`
        - **Quando:** `calculateWorkedHours(orderId)` é chamado
        - **Então:** retorna `8.0`
        - **Notas:** captura o comportamento atual para OS intra-dia; se este teste quebrar
          após a correção, significa que a correção alterou comportamento existente

        ---

        - **Teste:** `it('should return current value for an order from 22:00 to 06:00 next day — characterization')`
        - **Categoria:** characterization
        - **Dado:** OS com `start: 2026-04-14T22:00Z`, `end: 2026-04-15T06:00Z`
        - **Quando:** `calculateWorkedHours(orderId)` é chamado
        - **Então:** registrar o valor retornado atual (provavelmente incorreto: -16 ou similar)
        - **Notas:** este teste documenta o bug. O valor esperado será atualizado após a
          correção para refletir o comportamento correto (8.0 horas)

        ### ReportService.calculateWorkedHours — Behavioral tests (correção)

        #### Nível: integration

        - **Teste:** `it('should return 8 hours for an order crossing midnight (22:00 to 06:00)')`
        - **Categoria:** happy path — cenário corrigido
        - **Dado:** OS com `start: 2026-04-14T22:00Z`, `end: 2026-04-15T06:00Z`
        - **Quando:** `calculateWorkedHours(orderId)` é chamado
        - **Então:** retorna `8.0`
        - **Notas:** este é o teste que define o comportamento correto após a correção

        ---

        - **Teste:** `it('should return 24 hours for an order spanning exactly 24 hours')`
        - **Categoria:** edge case
        - **Dado:** OS com `start: 2026-04-14T00:00Z`, `end: 2026-04-15T00:00Z`
        - **Quando:** `calculateWorkedHours(orderId)` é chamado
        - **Então:** retorna `24.0`
        - **Notas:** boundary case — exatamente um dia completo

        ---

        - **Teste:** `it('should return 0 hours when start equals end')`
        - **Categoria:** edge case
        - **Dado:** OS com `start: 2026-04-14T10:00Z`, `end: 2026-04-14T10:00Z`
        - **Quando:** `calculateWorkedHours(orderId)` é chamado
        - **Então:** retorna `0.0`
        - **Notas:** degenerate case — duração zero

        ---

        - **Teste:** `it('should throw or return error when end is before start')`
        - **Categoria:** error handling
        - **Dado:** OS com `start: 2026-04-15T10:00Z`, `end: 2026-04-14T08:00Z`
        - **Quando:** `calculateWorkedHours(orderId)` é chamado
        - **Então:** lança exceção ou retorna valor de erro (depende do contrato — ver
          pergunta em aberto)
        - **Notas:** comportamento atual desconhecido; characterization test deve capturar
          o que acontece hoje antes de decidir o que deveria acontecer

        ## 5. Matriz de Cobertura

        | Comportamento                        | Unit | Integration | Contract | Acceptance | Gaps                                          |
        |--------------------------------------|------|-------------|----------|------------|-----------------------------------------------|
        | OS intra-dia (characterization)      | -    | ✓           | -        | -          | -                                             |
        | OS cross-midnight (characterization) | -    | ✓           | -        | -          | -                                             |
        | OS cross-midnight (correção)         | -    | ✓           | -        | -          | -                                             |
        | OS 24h exata                         | -    | ✓           | -        | -          | -                                             |
        | Duração zero                         | -    | ✓           | -        | -          | -                                             |
        | End antes de start                   | -    | ✓           | -        | -          | Depende de pergunta em aberto                 |
        | Outros métodos de ReportService      | -    | -           | -        | -          | Fora do escopo (legacy trade-off intencional) |

        ## 6. Perguntas em Aberto

        - **Comportamento com end < start:** o método hoje lança exceção, retorna negativo,
          ou retorna zero? A resposta define se o teste de error handling deve esperar
          exceção ou valor de erro. Verificar o código antes de especificar.
        - **Dependência de Clock:** `Clock.systemUTC()` é chamada estaticamente. Se o cálculo
          depender da hora atual (não apenas de start/end), os testes precisam de um mecanismo
          para controlar o relógio. Verificar se o método usa `Clock` para algo além de logging.

        ## 7. Ordem de Implementação Sugerida

        1. Characterization test intra-dia — confirma que o comportamento atual para o caso
           simples está estável e servirá como rede de segurança
        2. Characterization test cross-midnight — documenta o bug com o valor atual
        3. Behavioral test cross-midnight — define o comportamento correto
        4. Aplicar a correção em `calculateWorkedHours()`
        5. Atualizar o characterization test cross-midnight para refletir o valor correto
        6. Adicionar edge cases (24h, duração zero, end < start)

        Characterization tests primeiro, correção depois — a rede de segurança existe antes
        da mudança.
      </content>
      <why>
        This example demonstrates the legacy code adaptation because:
          - the testability assessment is explicit: identifies hardcoded Clock dependency and
            absence of existing tests
          - the strategy choice is justified: characterization + change-only, not full coverage
          - characterization tests capture current behavior INCLUDING the bug, before any fix
          - the second characterization test documents the expected incorrect value with a note
            that it will be updated post-fix
          - behavioral tests for the fix are separate from characterization tests
          - the coverage matrix shows "Outros métodos de ReportService" as an intentional gap
            labeled "legacy trade-off" — not an oversight
          - open questions are honest about unknowns (Clock dependency, error behavior)
          - the implementation order puts characterization first: safety net before surgery
          - a developer working on legacy code sees exactly how to proceed without pretending
            the code is greenfield
      </why>
    </example>
  </examples>
