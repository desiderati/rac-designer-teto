---
title: "Worked Examples for Knowledge Base Curation"
doc_role: skill-example
---

# Worked Examples for `knowledge-base.prompt.md`

> Use this file only to calibrate the promoted note and the no-promotion decision. The cases are
> illustrative; verify repository facts before writing a real document.

<examples>
  <example>
    <classification>technical-decision</classification>
    <quality>current-state guide</quality>
    <source_case>
      A changelog reports that synchronous delivery inside a database transaction caused rollback
      when an external notification service timed out. Current code and a versioned design record
      confirm that the service now publishes an event after commit and a worker handles delivery.
      The source also records an abandoned prototype and the commands used during migration.
    </source_case>
    <generated_note>
      # Entrega de notificações após a transação principal

      ## Finalidade e contexto
      Este contrato se aplica a notificações disparadas por operações que persistem dados de negócio.

      ## Contrato vigente
      A operação principal confirma seus dados antes de publicar o evento de notificação. Um worker
      processa a entrega de forma independente. A falha do serviço externo não reverte a operação
      principal.

      ## Limites e exceções
      A publicação do evento precisa de uma estratégia verificável para evitar perda entre o commit e
      a entrega ao worker. A política de retry e o tratamento de falha devem seguir a configuração
      vigente do worker.

      ## Justificativa para decisões futuras
      A separação evita que a indisponibilidade do provedor externo propague rollback à operação de
      negócio. Uma mudança que reúna as etapas deve reavaliar esse risco.

      ## Validação reutilizável
      Testar falha do provedor após o commit e verificar que os dados de negócio persistem e que a
      falha de entrega fica observável para o worker.

      ## Referências
      - Código atual do publicador e do worker, com links relativos quando disponíveis e rastreados.

      - Registro de desenho versionado e acessível aos leitores desta nota.
    </generated_note>
    <why>
      The current code and design support the applicable contract. The abandoned prototype and
      migration commands remain in the operational source. The historical rationale stays because
      it explains a future compatibility and risk decision.
    </why>
  </example>

  <example>
    <classification>no-durable-relevance</classification>
    <quality>correct rejection</quality>
    <source_case>
      A single staging job exceeded its configured timeout. The operator increased one value and
      recorded the validation in the daily changelog. No reusable sizing rule, exception, or
      decision was established.
    </source_case>
    <triage_decision>
      Do not create a guide from this event. The changelog is the proper historical record. Promote
      a sizing contract only if current code, configuration, and recurring evidence support one.
    </triage_decision>
  </example>
</examples>

## Cenários de finalidade documental

Estes cenários ilustram decisões editoriais. A forma final depende da evidência e da audiência do
repositório; nenhum cenário cria um classificador ou campo de metadados obrigatório.

### Estado vigente

Um guia de integração descreve o comando atual, seus parâmetros, pré-condições e sinais de validação
confirmados no código. A sequência de tentativas usada para descobrir o comando permanece no
work-item. Uma referência obsoleta é removida do guia sem uma seção sobre a exclusão.

### Changelog próprio

`CHANGELOG.md`, inclusive o da própria skill, registra versões, datas e alterações na ordem de
publicação. Sua função é histórica; não se converte em guia de estado vigente nem perde datas por
conter história.

### Seção histórica

Um documento misto contém uma seção de contrato vigente e uma seção `Histórico de mudanças`, com
entradas datadas. A primeira orienta o uso atual; a segunda permite acompanhar a evolução. Cada
seção é avaliada conforme sua finalidade.

### História útil e irrelevante

É útil conservar que um timeout curto motivou a adoção de retry quando esse motivo orienta futuras
revisões do limite. A lista de comandos executados na investigação e uma hipótese descartada sem
efeito na regra atual permanecem no registro operacional.

### Compatibilidade

Uma API mantém um alias antigo porque clientes ainda o usam. O guia vigente descreve o alias e sua
condição de suporte, mesmo que a origem do alias seja histórica. O changelog registra quando ele foi
introduzido; o guia informa como funciona agora.

### Vigência incerta

Um changelog afirma que o alias foi removido, mas o código atual e a documentação de implantação
divergem. A nota não declara remoção nem suporte como fato vigente. Registra o limite verificável e
suspende a promoção da regra até reconciliar as fontes primárias.

### Evidência efêmera ou inacessível

Uma captura local ou um work-item privado ajuda a investigar o comportamento, mas não serve de link
canônico para leitores da nota. Se a conclusão depender deles, produzir uma síntese mínima durável e
autorizada, sustentada por evidência acessível; se isso não for possível, declarar o limite ou adiar
a promoção. A proveniência operacional permanece no work-item ou changelog.
