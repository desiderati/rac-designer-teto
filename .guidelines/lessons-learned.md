# Lessons Learned Guideline

## Objetivo

Este documento define práticas para reduzir erros de diagnóstico, execução e comunicação durante manutenção e evolução
do sistema.

## Princípios

- Priorize evidência de runtime antes de concluir causa raiz.
- Diferencie claramente: `código existente`, `código alcançável`, `código executado`.
- Não confunda wiring com comportamento real.
- Mudanças devem ser orientadas por hipótese testável.
- Sem autorização explícita para editar, faça apenas diagnóstico.

## Fluxo de Diagnóstico

1. Identificar o ponto real de entrada (evento, callback, comando, job).
2. Mapear cadeia de chamadas até o efeito observado.
3. Verificar estados e guard clauses que bloqueiam execução.
4. Marcar ramos potencialmente inacessíveis.
5. Validar a hipótese com logs temporários, teste ou reprodução dirigida.

## Regras de Execução

- Primeiro provar, depois corrigir.
- Alterar o menor escopo possível.
- Evitar mudanças de “aposta” sem confirmação da hipótese.
- Sempre revisar `diff` antes de encerrar.
- Se a direção estiver errada, reverter imediatamente.

## Comunicação Técnica

- Explicar com cadeia curta de causa e efeito.
- Separar fato de inferência.
- Registrar precondições para um fluxo funcionar.
- Quando houver discordância, validar no código e no runtime, não por suposição.

## Checklist Antes de Codar

- Existe reprodução clara do problema?
- O entrypoint foi confirmado?
- Os estados necessários foram verificados?
- Há evidência de ramo morto/inacessível?
- O usuário autorizou a alteração?

## Checklist Antes de Entregar

- O objetivo original foi atendido?
- O `diff` contém apenas o necessário?
- Não houve alteração colateral fora do escopo?
- A validação mínima (lint/test/typecheck) foi executada ou justificada?
- Os próximos passos estão claros?

## Anti-patterns a Evitar

- Corrigir sem confirmar caminho executado.
- Tratar “não chamou” como erro de wiring sem validar estados.
- Expandir escopo para “aproveitar” edição.
- Defender hipótese sem nova evidência.
- Persistir em direção rejeitada pelo solicitante.

## Template de Pós-incidente

Use este formato ao registrar aprendizados:

```md
## Contexto

Resumo curto do que foi observado.

## Causa raiz

Descrição objetiva com evidência.

## Sinal perdido

Qual indício existia e não foi priorizado.

## Correção aplicada

O que foi alterado e por quê.

## Prevenção

Regra/processo adicionado para evitar recorrência.
```

