---
title: Code Scaffolds
doc_type: index
doc_role: index
doc_set: code-scaffolds
status: active
lang: pt-BR
---

# Code Scaffolds

Este diretório reúne scaffolds alinhados aos padrões atualmente observáveis em `src/domain/house/` e
`src/infra/persistence/`.

Eles existem como ponto de partida, não como autorização para gerar código por reflexo. Antes de
usar qualquer scaffold, confirme que o padrão realmente se aplica ao domínio e à arquitetura
vigentes.

## Organização

- [domain/](domain/)
    - Scaffolds para agregado e caso de uso puro.

- [persistence/](persistence/)
    - Scaffolds para contrato e adapter de persistência.

- [testing/](testing/)
    - Scaffolds de teste mínimo reutilizáveis.

Não existem subpastas `frontend/` ou `backend/` neste momento porque nenhum scaffold atual pertence
claramente a essas famílias. Crie essas pastas apenas quando houver template operacional real para
elas.

## Scaffolds disponíveis

- [domain/aggregate.ts.hbs](domain/aggregate.ts.hbs)
    - Esqueleto de agregado em classe, com `fromState()` e `toState()`.

- [domain/use-case.ts.hbs](domain/use-case.ts.hbs)
    - Esqueleto de caso de uso como função pura com parâmetros explícitos e resultado estruturado.

- [persistence/persistence-port.ts.hbs](persistence/persistence-port.ts.hbs)
    - Contrato síncrono de persistência para o agregado no domínio.

- [persistence/persistence-adapter.ts.hbs](persistence/persistence-adapter.ts.hbs)
    - Adaptador in-memory em classe, alinhado ao port de persistência atual.

- [testing/smoke-test.ts.hbs](testing/smoke-test.ts.hbs)
    - Smoke test co-localizado no estilo da suíte atual.

## Regras de uso

1. Adapte o scaffold ao caso concreto antes de consolidar o código.
2. Não use estes arquivos para contornar análise arquitetural ou design de domínio.
3. Não trate o scaffold como licença para introduzir camada nova que o repositório ainda não usa.
4. Se um scaffold deixar de refletir o padrão real do repositório, atualize-o ou remova-o.
