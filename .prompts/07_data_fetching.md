# DATA FETCHING

<ruleset name="Data Fetching">

<description>
Regras para buscar e atualizar dados de APIs externas.
</description>

<rule name="Uso Obrigatório de TanStack Query (React Query)">
  <description>Toda a comunicação com APIs (queries e mutations) deve ser gerenciada pelo TanStack Query. Ele cuida de caching, retries, invalidação e estados de loading/error de forma padronizada.</description>
</rule>

<rule name="Estrutura de Query Keys">
  <description>As chaves de query (`queryKey`) devem ser um array que descreve a hierarquia dos dados. Comece com o nome do domínio, seguido de identificadores ou filtros.</description>
  <example type="DO">
    ```ts
    // Lista de usuários
    useQuery({ queryKey: ["users", "list"], ... });

    // Um usuário específico
    useQuery({ queryKey: ["users", userId], ... });

    // Lista de usuários com filtro
    useQuery({ queryKey: ["users", "list", { page, limit }], ... });
    ```
  </example>
</rule>

<rule name="Encapsulamento da Lógica de Fetch">
  <description>A função de fetch (`queryFn`) não deve ser escrita inline no componente. Ela deve ser encapsulada em um arquivo de "serviço" ou "API" separado, geralmente em `src/services/` ou `src/features/{feature}/api/`.</description>
  <example type="DO">
    ```ts
    // services/user-api.ts
    export async function fetchUser(userId: string): Promise<User> {
      const res = await fetch(`/api/users/${userId}`);
      return res.json();
    }

    // components/UserProfile.tsx
    import { fetchUser } from "@/services/user-api";

    function UserProfile({ userId }) {
      const { data } = useQuery({ 
        queryKey: ["users", userId], 
        queryFn: () => fetchUser(userId) 
      });
      // ...
    }
    ```
  </example>
</rule>

<rule name="Uso de `useMutation` para Escrita de Dados">
  <description>Qualquer operação que modifica dados no servidor (POST, PUT, PATCH, DELETE) deve ser feita com `useMutation`.</description>
  <spec>Use os callbacks `onSuccess`, `onError` e `onSettled` para executar efeitos colaterais, como invalidação de queries ou exibição de toasts.</spec>
  <example type="DO">
    ```ts
    const queryClient = useQueryClient();

    const { mutate } = useMutation({ 
      mutationFn: updateUser, 
      onSuccess: (data) => {
        // Invalida a query do usuário para forçar um refetch
        queryClient.invalidateQueries({ queryKey: ["users", data.id] });
        toast.success("Usuário salvo!");
      },
      onError: (error) => {
        toast.error("Falha ao salvar: " + error.message);
      }
    });
    ```
  </example>
</rule>

<rule name="Invalidação vs. Atualização Manual do Cache">
  <description>Prefira sempre invalidar queries (`queryClient.invalidateQueries`) após uma mutação bem-sucedida. A atualização manual do cache (`queryClient.setQueryData`) é mais complexa e deve ser usada apenas para otimizações de UI (updates otimistas).</description>
</rule>

<rule name="Tratamento de Estado de Loading e Error">
  <description>Use as flags `isLoading` (ou `isPending` para mutations) e `isError` retornadas pelos hooks para renderizar a UI correspondente. Não crie seus próprios estados de loading.</description>
  <example type="DO">
    ```ts
    const { data, isLoading, isError, error } = useQuery(...);

    if (isLoading) return <Spinner />;
    if (isError) return <ErrorMessage message={error.message} />;

    return <DisplayData data={data} />;
    ```
  </example>
</rule>

</ruleset>
