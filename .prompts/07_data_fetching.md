# DATA FETCHING

<ruleset name="Data Fetching">

<description>
Este documento define regras para integração remota.
Ele não descreve o centro arquitetural do projeto.
Atualmente, o centro do sistema continua sendo o estado do editor, o domínio da casa e a projeção desse estado no canvas.
</description>

<rule name="Quando Estas Regras se Aplicam">
  <description>As regras abaixo só se aplicam quando houver comunicação real com APIs externas, persistência remota, sincronização ou leitura de dados do servidor.</description>
  <spec>Não usar este documento para guiar fluxos puramente locais do editor.</spec>
  <spec>Canvas, piloti e estado da casa não devem ser modelados como fetch apenas porque React Query existe no projeto.</spec>
</rule>

<rule name="Uso de TanStack Query">
  <description>Quando houver query ou mutation remota real, prefira usar TanStack Query para lidar com cache, retries, invalidação e estados de loading/error.</description>
  <spec>Usar `useQuery` para leitura remota.</spec>
  <spec>Usar `useMutation` para escrita remota.</spec>
  <spec>Não introduzir TanStack Query em fluxos que são puramente locais.</spec>
</rule>

<rule name="Query Keys">
  <description>As chaves de query devem refletir domínio e identidade dos dados, usando arrays previsíveis.</description>
  <example type="DO">
    ```ts
    useQuery({ queryKey: ["houses", houseId], ... });
    useQuery({ queryKey: ["houses", "list", { page, limit }], ... });
    ```
  </example>
</rule>

<rule name="Localização da Lógica de Fetch">
  <description>A lógica de integração remota deve ficar próxima da feature ou da infraestrutura correspondente. Não criar `src/services/` genérico automaticamente.</description>
  <spec>Preferir organização por feature ou por adapter concreto.</spec>
  <spec>Se a integração for específica do domínio casa/editor, mantê-la próxima da feature ou da infra correspondente.</spec>
  <spec>Evitar uma pasta `services` genérica na raiz como lixeira arquitetural.</spec>
</rule>

<rule name="Mutation e Efeitos Colaterais">
  <description>Operações remotas de escrita devem usar `useMutation`, com side effects explícitos e previsíveis.</description>
  <spec>Usar `onSuccess`, `onError` e `onSettled` para sincronização de UI, invalidação e feedback.</spec>
  <spec>Preferir invalidação de queries a manipulação manual do cache, salvo quando houver justificativa clara.</spec>
</rule>

<rule name="Loading e Error">
  <description>Use o estado do TanStack Query para renderizar loading e erro quando houver integração remota. Não duplique esses estados sem necessidade.</description>
  <example type="DO">
    ```ts
    const { data, isLoading, isError, error } = useQuery(...);

    if (isLoading) return <Spinner />;
    if (isError) return <ErrorMessage message={error.message} />;

    return <DisplayData data={data} />;
    ```
  </example>
</rule>

<rule name="Separação entre Estado Local e Estado Remoto">
  <description>Estado remoto e estado do editor são coisas diferentes e não devem ser confundidos.</description>
  <spec>TanStack Query gerencia dados remotos.</spec>
  <spec>`HouseStateStore` gerencia o estado da casa dentro da feature editor.</spec>
  <spec>O canvas continua sendo projeção do estado, não fonte de verdade.</spec>
</rule>

<rule name="Regra para Agentes">
  <description>O agente não deve usar a existência deste arquivo como justificativa para transformar tudo em fetch/API layer. Só aplicar estas regras quando o escopo realmente envolver integração remota.</description>
  <spec>Não criar `services/` genérico por reflexo.</spec>
  <spec>Não modelar fluxo local do editor como query remota.</spec>
  <spec>Não colocar regra de domínio dentro de API wrappers.</spec>
</rule>

</ruleset>
