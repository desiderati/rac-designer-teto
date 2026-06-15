# Agents Examples

Use this file when the user asks `Agents Examples`.

Do not spawn subagents just to show these examples. Return concise examples for each installed
custom agent.

## `agents-examples`

```text
@Agents Examples
```

Use este atalho apenas para mostrar exemplos locais de agentes. Não execute os exemplos e não acione
subagentes.

## `agents-usage`

```text
@Agents Usage
```

Use este atalho apenas para explicar a política local de orquestração de agentes. Não acione
subagentes.

## `agents-shortcuts`

```text
@Agents Shortcuts
```

Use este atalho apenas para listar os atalhos compactos `!` aceitos pelo contrato local. Não execute
os atalhos e não acione subagentes.

## `council-of-agents`

```text
@Council of Agents pressure test this decision before I commit to the plan.
Load `.agents/prompts/council-of-agents.prompt.md` and run the full five-advisor council when the question has real stakes.
Accepted Council triggers are `council this`, `pressure test this`, `stress test this`, `war room this`,
`premortem this`, `debate this`, `council of agents`, `fellowship of agents`, `@Council of Agents`,
and `@Fellowship of Agents`.
Do not delegate to `council-of-agents`; the parent acts as Chairman.
```

```text
@Fellowship of Agents debate this: I'm torn between these two approaches. Give me the council verdict and the one thing to do first.
```

## `league-of-agents`

```text
@League of Agents investigue esta mudança e use os agentes adequados apenas se isso agregar valor.
Carregue `.agents/prompts/league-of-agents.prompt.md` e mantenha a delegação condicional.
Não delegue para `league-of-agents`; use somente especialistas quando houver ganho real.
```

## `code-reviewer`

```text
Use o subagente `code-reviewer` para revisar as alterações atuais.
Pode gerar relatório em `.agents/code-reviews/`, mas não corrija os achados.
Priorize bugs, regressões, falta de testes e drift de contrato.
```

## `ui-designer`

```text
Use o subagente `ui-designer` para definir a direção visual desta interface.
Use `$frontend-design`, atualize `DESIGN.md` somente se houver decisão durável e não implemente código.
Retorne decisões de design system: cores, tipografia, espaçamento, padrões reutilizáveis,
critérios de aceite, perguntas abertas e riscos.
```

## `ui-reviewer`

```text
Use o subagente `ui-reviewer` para revisar esta interface.
Use `$frontend-design` e, se necessário, `$frontend-development`.
Pode gerar relatório em `.agents/code-reviews/`, mas não corrija os achados.
Priorize tipo de interface, hierarquia, consistência visual, acessibilidade, responsividade e drift de design.
Se a correção exigir Impeccable craft, polish, audit ou extract, recomende `ui-impeccable-specialist` quando disponível.
```

## `ui-impeccable-specialist` (opcional)

Disponível quando `.codex/agents/ui-impeccable-specialist.toml` foi instalado pelo
`$impeccable-installer`.

```text
Use o subagente `ui-impeccable-specialist` para executar Impeccable polish/audit nesta tela.
Use `$impeccable`, declare `IMPECCABLE_PREFLIGHT` antes de editar e respeite PRODUCT.md/DESIGN.md.
Edite apenas o escopo delegado; se surgir padrão reutilizável, recomende atualização do `DESIGN.md` com `ui-designer`.
```

## `code-explorer`

```text
Use o subagente `code-explorer` para mapear esta área antes do design.
Use `$documentation` quando disponível, mas não edite `REPOSITORY-OVERVIEW.md`.
Retorne entrypoints, fluxo de execução, camadas, dependências, padrões e riscos.
Se houver Work Item ativo, pode registrar em `.agents/work-items/YYYY-MM/<work-item>.assets/code-exploration.md`.
```

## `documentation-reviewer`

```text
Use o subagente `documentation-reviewer` para revisar o README em modo read-only.
Use `$documentation` quando disponível.
Não edite arquivos. Reporte achados documentais com evidência.
```

## `documentation-curator`

```text
Use o subagente `documentation-curator` para corrigir apenas a documentação aprovada.
Use `$documentation` quando disponível.
Não altere código, testes, configuração ou metadata sem autorização explícita.
```

## `support-analyst`

```text
Use o subagente `support-analyst` para investigar este bug.
Use `.agents/prompts/bug-analysis.prompt.md` e, se fizer sentido, `$incident-analysis`.
Quero hipóteses ranqueadas, evidências, causa provável e menor correção recomendada.
```

## `solutions-architect`

```text
Use o subagente `solutions-architect` para avaliar esta mudança.
Leia `.agents/prompts/solution-design.prompt.md` e compare 2 ou 3 abordagens.
Não implemente nada. Produza apenas o contrato de solução e os riscos.
```

## `product-owner`

```text
Use o subagente `product-owner` com `$prd-generation` para transformar esta ideia em um PRD.
Escreva o artefato em `docs/product-requirements/`.
Não tome decisões técnicas; se houver trade-off de arquitetura, marque como pergunta aberta.
```

## `software-developer`

```text
Use o subagente `software-developer` para implementar somente o plano aprovado em `docs/implementation-plans/`.
Não altere arquitetura, escopo de produto ou arquivos fora da área delegada.
Inclua testes quando viável e reporte validação executada.
```

## `quality-analyst`

```text
Use o subagente `quality-analyst` para criar a estratégia de testes desta feature.
Use `.agents/prompts/test-driven.prompt.md`.
Gere matriz de cobertura, casos principais, lacunas e comandos de validação.
```

## `security-advisor`

```text
Use o subagente `security-advisor` para revisar esta mudança sensível.
Use `$security-scan` para triagem ampla e `$security-review` para o fluxo contextual.
Não corrija código nem rotacione segredos. Gere achados sanitizados em `.agents/security-analysis/`,
`.agents/security-scans/` ou `.agents/security-reviews/`, conforme o tipo de saída.
Se algo precisar virar documento durável, promova versão sanitizada para `docs/security/SEC-00N-{slug}.md`.
```

## Team-Mode Examples

```text
league of agents: use subagentes para esta feature.
1. `product-owner`: refinar requisitos e critérios de aceite.
2. `code-explorer`: mapear o fluxo existente se a área ainda não estiver clara.
3. `ui-designer`: consolidar direção visual e `DESIGN.md` quando houver frente de UI.
4. `solutions-architect`: desenhar a solução técnica a partir dos critérios aprovados.
5. `quality-analyst`: derivar os testes esperados.
6. `software-developer`: implementar apenas o plano aprovado.
7. `security-advisor`: revisar superfícies sensíveis, se houver.
8. `code-reviewer`: revisar o resultado final sem corrigir nada.
9. `ui-impeccable-specialist` opcional: executar craft/polish Impeccable se instalado e aprovado.

Consolide tudo ao final antes de me responder.
```

```text
league of agents: investigue este problema e use os agentes adequados automaticamente.
Use apenas os subagentes que realmente agregarem valor e consolide o resultado.
```
