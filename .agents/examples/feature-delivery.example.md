# Worked Examples for feature delivery with optional structured sidecars

> Installed by `agents-bootstrap` as `.agents/examples/feature-delivery.example.md`.
> Load only when you need calibration for using optional machine-readable artifacts beside a `work-item`.
> Do not load this file by default during normal prompt execution.

  <examples>
    <example id="1">
      <label>Feature delivery sem `.pipeline/` paralela</label>
      <quality>ideal</quality>
      <content>
        ## Situação

        A frente `task-management` já tem um PRD aprovado e seguirá por design, plano,
        implementação, review e verificação. Há risco real de continuidade porque a execução
        deve atravessar mais de uma sessão e produzir alguns anexos locais.

        ## Âncora de continuidade

        - work-item ativo:
          `.agents/work-items/2026-04/20260419-task-management.work-item.md`
        - sidecar local:
          `.agents/work-items/2026-04/20260419-task-management.work-item.assets/`

        ## Artefatos derivados no sidecar

        - `task-plan.json`
          - decomposição operacional da frente em passos pequenos para consumo por agentes
          - derivado do plano gerado por `implementation-planning`; não substitui o resumo humano
          - só é criado quando trouxer ganho real de execução, coordenação ou automação
        - `test-report.json`
          - consolidação local de validações automáticas e manuais executadas durante a frente
          - derivado da estratégia e da verificação; não vira nova fonte de verdade
        - `review-links.json`
          - ponte local entre o work-item e os reviews/refactorings duráveis já publicados
          - evita duplicar links e referências longas no corpo do work-item

        ## Fluxo esperado

        1. O PRD define objetivo, escopo, requisitos e critérios de aceitação.
        2. O work-item registra a frente, os fatos confirmados, os riscos e o próximo passo.
        3. `implementation-planning` produz o plano humano da frente.
        4. `task-plan.json` pode ser extraído desse plano aprovado apenas para apoiar execução assistida.
        5. A implementação ocorre normalmente no código do repositório.
        6. O `code-review` gera um artefato local com findings e, se aplicável, candidatos
           de refatoração com `slug do candidato` semântico.
        7. Se houver candidatos relevantes, o `refactoring` consome esse backlog pelo par
           `review de origem + slug do candidato` e registra a execução em seu próprio
           artefato local.
        8. O `test-report.json` e o `review-links.json` continuam apenas como apoio local
           enquanto a frente estiver aberta.
        9. Ao promover o que importa para changelog, review ou refactoring, o work-item pode
           ser colapsado ou arquivado localmente.

        ## Regra de fonte de verdade

        - o `work-item` continua sendo a âncora primária de continuidade local
        - changelog continua sendo o registro factual versionado quando aplicável
        - review e refactoring continuam com artefatos próprios, fora dos JSONs auxiliares
        - os JSONs do sidecar são auxiliares e derivados
        - `task-plan.json` não nasce por reflexo; ele só existe quando vale a pena
        - não criar `.pipeline/` como segunda espinha dorsal do workflow
      </content>
      <why>
        This example is ideal because:
          - it keeps one continuity anchor instead of introducing a parallel state machine
          - it shows when machine-readable files are useful without promoting them to
            source-of-truth status
          - it preserves the existing separation between work-item, code review, and refactoring
          - it makes the review -> refactoring bridge explicit without auto-fixing during review
      </why>
    </example>
  </examples>
