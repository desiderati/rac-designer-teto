# Worked Examples for `repository-overview.prompt.md`

> Use this file only when you need calibration for tone, structure, anti-patterns, or output shape.
> In the standalone skill, this file lives under `scaffold/examples/repository-overview.example.md`.
> When installed by `agents-bootstrap`, it is copied to `.agents/examples/repository-overview.example.md`.

  <examples>
    <example type="multi-section-reference">
      <description>Expected tone, depth, and structure across multiple sections</description>

      <section name="4. Que problema ou necessidade operacional ele resolve">
        Equipes de manutenção que gerenciam grandes frotas de equipamentos frequentemente perdem o
        controle de ordens de serviço pendentes, inspeções futuras e histórico de ativos. A informação
        vive em planilhas, threads de e-mail e conhecimento informal. Quando uma auditoria chega ou um
        ativo crítico falha, a reconstrução da linha do tempo é lenta, incompleta e estressante.

        Este repositório oferece um lugar único e estruturado para registrar, acompanhar e consultar
        atividades de manutenção — reduzindo a dependência de registros informais e dando à equipe um
        histórico compartilhado e pesquisável do que foi feito, quando e em qual ativo.
      </section>

      <section name="5. Quem ele atende">
        - **Técnicos de campo:** registram serviços executados e consultam histórico de equipamentos
          antes de uma intervenção
        - **Coordenadores de manutenção:** acompanham ordens de serviço em aberto, priorizam
          pendências e distribuem tarefas
        - **Gestores operacionais:** monitoram indicadores de execução (ordens concluídas vs.
          pendentes, tempo médio de resolução) para decisões de alocação de recursos
        - **Auditores internos ou externos:** acessam o histórico de manutenção de um ativo
          específico sem depender de relatos informais

        O sistema não atende diretamente fornecedores externos, equipe financeira ou áreas
        de compliance — embora os dados registrados possam alimentar esses processos no futuro.
      </section>

      <section name="7. Como funciona em termos práticos">
        O fluxo principal é simples:

        1. Um ativo é cadastrado no sistema com suas informações básicas (identificador, localização,
           tipo de equipamento)
        2. Ordens de serviço são criadas vinculadas ao ativo — podem ser corretivas (algo quebrou)
           ou preventivas (inspeção programada)
        3. Técnicos registram a execução: o que foi feito, peças utilizadas, tempo gasto
        4. A ordem é fechada e o histórico do ativo é atualizado automaticamente
        5. Coordenadores e gestores consultam dashboards e relatórios para acompanhar pendências
           e indicadores

        Não há automação de agendamento inteligente ou predição de falhas. O sistema é um registro
        operacional estruturado — não uma plataforma de manutenção preditiva.
      </section>

      <section name="12. Limitações do escopo atual">
        - O sistema não integra com ERPs ou sistemas financeiros — dados de custo e compras
          não são rastreados
        - Não há módulo de manutenção preditiva ou análise de tendências baseada em sensores
        - O histórico de manutenção é baseado em registros manuais; não há captura automática
          de dados de telemetria ou IoT
        - Relatórios são limitados a consultas pré-definidas — não há ferramenta de BI integrada
        - O controle de acesso é básico: perfis de técnico, coordenador e gestor, sem
          granularidade por tipo de ativo ou localização
      </section>

      <why>
        This multi-section example demonstrates:
          - section 4 explains a real operational pain in plain language, then states what the
            repository does about it — without inflating scope or adding technical jargon
          - section 5 identifies who benefits AND explicitly states who is NOT served, preventing
            scope inflation
          - section 7 describes the practical flow in numbered steps that a non-technical reader
            can follow, and ends with an honest "this is what it is NOT" statement
          - section 12 lists concrete limitations without defensive language — each limitation
            is a factual boundary, not an apology
          - across all sections, the tone is mature, precise, and non-marketing — every claim
            is grounded in what the repository actually contains and enables
      </why>
    </example>
  </examples>
