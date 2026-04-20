# Code Scaffolds

Este diretório reúne scaffolds aprovados com utilidade operacional real para o projeto.

Eles existem como ponto de partida, não como autorização para gerar código por reflexo. Antes de usar qualquer scaffold,
confirme que o padrão realmente se aplica ao domínio e à arquitetura vigentes.

## Scaffolds disponíveis

- `aggregate.ts.hbs`
    - Esqueleto de agregado de domínio com fronteira explícita entre domínio e infraestrutura.
- `persistence-port.ts.hbs`
    - Contrato de persistência para o agregado no domínio.
- `persistence-adapter.ts.hbs`
    - Adaptador in-memory alinhado ao port de persistência.
- `use-case.ts.hbs`
    - Esqueleto de caso de uso coordenando agregado e port.
- `smoke-test.ts.hbs`
    - Smoke test co-localizado para validação rápida de lógica crítica.

## Regras de uso

1. Adapte o scaffold ao caso concreto antes de consolidar o código.
2. Não use estes arquivos para contornar análise arquitetural ou design de domínio.
3. Se um scaffold deixar de refletir o padrão real do repositório, atualize-o ou remova-o.
