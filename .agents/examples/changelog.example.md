# Worked Examples for `changelog.prompt.md`

> Installed by `agents-bootstrap` as `.agents/examples/changelog.example.md`.
> In standalone `changelog` skill mode, this file lives at `scaffold/examples/changelog.example.md`.
> Load only when you need concrete calibration for depth, structure, anti-patterns, or output shape.
> Do not load this file by default during normal prompt execution.

  <examples>
    <example id="1">
      <label>Anti-padrão: entradas fragmentadas por tentativa</label>
      <quality>bad</quality>
      <content>
        ---

        ## [10:15] Investigação de erro 500 no endpoint /orders

        ### Tipo
        - investigação

        ### O que foi feito
        Verificado que o erro ocorre ao enviar `discount: null`. Primeira hipótese: validação
        ausente no controller.

        ---

        ## [10:32] Continuação da investigação do erro 500

        ### Tipo
        - investigação

        ### O que foi feito
        Hipótese do controller descartada — a validação existe. Nova hipótese: o problema
        está no `OrderService.applyDiscount()`.

        ---

        ## [10:48] Mais investigação do erro 500

        ### Tipo
        - investigação

        ### O que foi feito
        Confirmado: `applyDiscount()` não trata `null`. Aplicada guard clause.

        ---

        ## [10:55] Validação da correção

        ### Tipo
        - correção

        ### O que foi feito
        Teste manual confirmou que o endpoint retorna 200 com `discount: null`.
      </content>
      <why>
        This is a bad changelog because:
          - four entries for a single investigation sequence that took 40 minutes
          - each entry has minimal context and reads as a conversation log, not an operational record
          - hypotheses are scattered across entries instead of consolidated
          - a future reader must reconstruct the full picture by reading all four entries in sequence
          - the final resolution is disconnected from the initial problem statement
      </why>
    </example>

    <example id="2">
      <label>Padrão ideal: entrada consolidada após conclusão</label>
      <quality>ideal</quality>
      <content>
        ---

        ## [10:55] Correção de NullPointerException no endpoint POST /orders

        ### Tipo
        - correção

        ### Branch
        - `fix/orders-null-discount`

        ### Contexto
        O endpoint `POST /orders` retornava 500 quando o campo `discount` era enviado como
        `null`. O erro foi reportado em produção via alerta no Cloud Monitoring. O stacktrace
        apontava para `OrderService.applyDiscount()`.

        ### O que foi feito
        1. Inspecionado o controller — validação de input existe e permite `discount: null`
           (campo opcional por contrato)
        2. Inspecionado `OrderService.applyDiscount()` — o método chama `discount.multiply()`
           sem null-check
        3. Aplicada guard clause: se `discount` é `null`, o método retorna o valor original
           sem aplicar desconto

        ### Hipóteses consideradas
        - Validação ausente no controller → descartada — a validação existe e `null` é
          valor válido pelo contrato da API
        - Null-check ausente em `applyDiscount()` → confirmada — o método assume que
          `discount` nunca é `null`

        ### Decisão tomada
        Guard clause em `applyDiscount()` em vez de rejeitar `null` no controller, porque
        o contrato da API define `discount` como opcional e outros consumers já enviam `null`.

        ### Evidências
        - stacktrace: `NullPointerException at OrderService.applyDiscount(OrderService.java:47)`
        - contrato da API em `openapi.yaml`: `discount` é `nullable: true`

        ### Validação
        - teste unitário adicionado: `applyDiscount_withNullDiscount_returnsOriginalValue()`
        - chamada manual ao endpoint com `discount: null` retorna 200
        - chamada com `discount: 0.1` continua funcionando

        ### Riscos ou pendências
        - verificar se há outros métodos em `OrderService` que assumem `discount` não-null
        - considerar adicionar teste de contrato para campos nullable da API

        ### Arquivos afetados
        - `src/main/java/com/app/service/OrderService.java`
        - `src/test/java/com/app/service/OrderServiceTest.java`
      </content>
      <why>
        This is an ideal changelog entry because:
          - a single entry consolidates the full investigation sequence (40 minutes, two hypotheses)
          - the context explains the problem, its origin, and the affected component
          - hypotheses are listed with their outcomes in a single section, not scattered
          - the decision includes rationale (why guard clause instead of rejecting null)
          - evidence is specific and traceable (stacktrace line, API contract reference)
          - validation covers both the fix and regression (null works, non-null still works)
          - pending items are forward-looking and actionable
          - a future execution can resume from this entry without needing any additional context
      </why>
    </example>
  </examples>
