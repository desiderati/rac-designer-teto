# Worked Examples for `readme.prompt.md`

> Use this file only when you need calibration for tone, structure, anti-patterns, or output shape.
> In the standalone skill, this file lives under `scaffold/dot-agents/examples/readme.example.md`.
> When installed by `agents-bootstrap`, it is copied to `.agents/examples/readme.example.md`.

  <examples>
    <example id="1">
      <label>Atualização necessária — comando de deploy mudou</label>
      <scenario>
        O serviço `eam-api` passou a ser deployado via Cloud Run jobs em vez de Cloud Run services.
        O fluxo de deploy mudou: antes era `gcloud run deploy`, agora é `gcloud run jobs deploy`
        seguido de `gcloud run jobs execute`. O README ainda descreve o fluxo antigo com o comando
        de service. O restante do README (setup, variáveis de ambiente, estrutura do projeto)
        permanece correto.
      </scenario>
      <decision>atualizar seção existente do README</decision>
      <before>
        ## Deploy

        Para fazer deploy do serviço em produção:

        ```bash
        gcloud run deploy eam-api \
          --image gcr.io/sat-project/eam-api:latest \
          --region us-central1 \
          --platform managed
        ```

        O serviço ficará disponível na URL fornecida pelo Cloud Run após o deploy.
      </before>
      <after>
        ## Deploy

        O `eam-api` é executado como Cloud Run job. Para fazer deploy e executar:

        ```bash
        gcloud run jobs deploy eam-api \
          --image gcr.io/sat-project/eam-api:latest \
          --region us-central1

        gcloud run jobs execute eam-api --region us-central1
        ```

        Jobs não expõem URL pública. O resultado da execução pode ser acompanhado
        nos logs do Cloud Logging.
      </after>
      <why>
        This update is ideal because:
          - it replaces only the section affected by the real technical change
          - it removes the outdated instruction without preserving ambiguity
          - it adds relevant operational context (jobs do not expose a URL)
          - it does not modify any other README section
          - it does not add speculative or decorative content
      </why>
    </example>

    <example id="2">
      <label>Nenhuma atualização necessária — mudança interna sem impacto na documentação</label>
      <scenario>
        O serviço `eam-api` teve uma refatoração interna: a classe `OrderRepository` foi
        dividida em `OrderReadRepository` e `OrderWriteRepository` para separar queries de
        leitura e escrita. A interface pública do serviço (endpoints, variáveis de ambiente,
        comandos de setup e deploy) permanece idêntica. O README descreve setup, deploy e
        variáveis de ambiente — não menciona classes internas de repository.
      </scenario>
      <decision>nenhuma atualização necessária</decision>
      <content>
        ## 1. Resumo da Mudança Técnica

        Refatoração interna: `OrderRepository` foi dividido em `OrderReadRepository` e
        `OrderWriteRepository` para separar responsabilidades de leitura e escrita no
        acesso a dados.

        ## 2. Avaliação de Impacto no README

        O README existe e descreve: setup do projeto, variáveis de ambiente, comandos de
        build e deploy, e estrutura geral do projeto. Nenhuma dessas seções menciona ou
        depende de classes internas de repository. A interface pública do serviço não mudou.

        ## 3. Decisão

        Nenhuma atualização necessária.

        A mudança é exclusivamente interna: não altera comandos, configuração, variáveis
        de ambiente, endpoints ou qualquer comportamento visível externamente. O README
        permanece correto como está.

        ## 4. Mudanças Propostas

        Nenhuma.

        ## 5. Notas de Validação

        Se no futuro a separação read/write exigir configuração adicional (ex: connection
        strings separadas para réplica de leitura), o README deverá ser revisado nesse momento.

        Destino alternativo: se houver necessidade de documentar a motivação da refatoração, o local adequado
        é o changelog ou uma nota na knowledge base — não o README.
      </content>
      <why>
        This example demonstrates the correct "no update needed" decision because:
          - it explicitly assesses why the README is not affected (no public surface changed)
          - it does not force an update just because code was modified
          - it provides a forward-looking note about when the README would need updating
          - it suggests the appropriate alternative destination for internal documentation
          - it respects the principle that README documents external-facing behavior, not internal structure
      </why>
    </example>
  </examples>
