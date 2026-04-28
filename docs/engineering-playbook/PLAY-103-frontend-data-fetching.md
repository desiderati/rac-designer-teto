---
title: Data Fetching no Frontend
id: PLAY-103
doc_type: playbook
doc_set: engineering-playbook
family: frontend
precedence: 103
status: active
lang: pt-BR
---

# Data Fetching no Frontend

## Objetivo

Definir regras para integração remota. Este documento não descreve o centro arquitetural do projeto. Hoje o centro do
sistema continua sendo o estado do editor, o domínio da casa e a projeção desse estado no canvas.

## Quando estas regras se aplicam

- Só use estas regras quando houver comunicação real com APIs externas, persistência remota, sincronização ou leitura
  de dados do servidor.
- Não use este documento para guiar fluxos puramente locais do editor.
- Canvas, piloti e estado da casa não devem ser modelados como fetch apenas porque React Query existe no projeto.
- Estado atual: `QueryClientProvider` está registrado na aplicação, mas não há `useQuery` ou `useMutation` ativo em
  `src`.

## Uso de TanStack Query

- Prefira TanStack Query quando houver query ou mutation remota real.
- Use `useQuery` para leitura remota.
- Use `useMutation` para escrita remota.
- Não introduza TanStack Query em fluxos puramente locais.

## Query keys

As chaves de query, quando uma integração remota real for introduzida, devem refletir domínio e identidade dos dados
com arrays previsíveis.

Exemplo recomendado:

```ts
useQuery({ queryKey: ["houses", houseId], ... });
useQuery({ queryKey: ["houses", "list", { page, limit }], ... });
```

## Localização da lógica de fetch

- A integração remota deve ficar próxima da feature ou da infraestrutura correspondente.
- Prefira organização por feature ou por adapter concreto.
- Se a integração for específica do domínio casa ou editor, mantenha-a próxima da feature ou da infra correspondente.
- Evite transformar uma pasta genérica de services na nova lixeira arquitetural da aplicação.

## Mutations e efeitos colaterais

- Operações remotas de escrita devem usar `useMutation`.
- Use `onSuccess`, `onError` e `onSettled` para sincronizar UI, feedback e invalidação.
- Prefira invalidação de queries a manipulação manual de cache, salvo quando houver justificativa clara.

## Loading e erro

- Use o estado do próprio TanStack Query para renderizar loading e erro quando houver integração remota.
- Não duplique esses estados sem necessidade.

Exemplo recomendado:

```tsx
const { data, isLoading, isError, error } = useQuery(...);

if (isLoading) return <Spinner />;
if (isError) return <ErrorMessage message={error.message} />;

return <DisplayData data={data} />;
```

Esse exemplo é um template para integração remota futura. Ele não descreve o fluxo atual do editor RAC.

## Separação entre estado local e estado remoto

- TanStack Query gerencia dados remotos.
- `houseManager` e a bridge reativa em `src/components/rac-editor/lib/house-store.ts` coordenam hoje o estado
  compartilhado da casa.
- O canvas continua sendo projeção do estado, não fonte de verdade.

## Regra para agentes

- Não use a existência deste arquivo como justificativa para transformar tudo em fetch ou API layer.
- Não crie services genéricos por reflexo.
- Não modele fluxo local do editor como query remota.
- Não coloque regra de domínio dentro de wrappers de API.
