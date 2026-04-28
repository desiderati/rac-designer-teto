# Agents Examples

Use this file when the user asks `Agents Examples`.

Do not spawn subagents just to show these examples. Return concise examples
for each installed custom agent.

## `agents-examples`

```text
@Agents Examples
```

Use este atalho apenas para mostrar exemplos locais de agentes. Não execute os
exemplos e não acione subagentes.

## `agents-usage`

```text
@Agents Usage
```

Use este atalho apenas para explicar a política local de orquestração de
agentes. Não acione subagentes.

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
Use o subagente `product-owner` com `$prd-generator` para transformar esta ideia em um PRD.
Escreva o artefato em `docs/product/`.
Não tome decisões técnicas; se houver trade-off de arquitetura, marque como pergunta aberta.
```

## `software-developer`

```text
Use o subagente `software-developer` para implementar somente o plano aprovado em `docs/solution-x.md`.
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
3. `solutions-architect`: desenhar a solução técnica a partir dos critérios aprovados.
4. `quality-analyst`: derivar os testes esperados.
5. `software-developer`: implementar apenas o plano aprovado.
6. `security-advisor`: revisar superfícies sensíveis, se houver.
7. `code-reviewer`: revisar o resultado final sem corrigir nada.

Consolide tudo ao final antes de me responder.
```

```text
liga dos agentes: investigue este problema e use os agentes adequados automaticamente.
Use apenas os subagentes que realmente agregarem valor e consolide o resultado.
```
