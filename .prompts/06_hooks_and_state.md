# HOOKS AND STATE MANAGEMENT

<ruleset name="Hooks and State Management">

<description>
Regras para a criação de hooks customizados e gerenciamento de estado na aplicação.
</description>

<rule name="Quando Criar um Hook Customizado">
  <description>Extraia lógica para um hook customizado (`use...`) quando você tiver lógica de estado que é usada por múltiplos componentes. Isso centraliza a lógica e a torna reutilizável e testável.</description>
  <example type="DO">
    ```ts
    // useCounter.ts
    import { useState } from 'react';

    export function useCounter(initialValue = 0) {
      const [count, setCount] = useState(initialValue);
      const increment = () => setCount(c => c + 1);
      const decrement = () => setCount(c => c - 1);
      return { count, increment, decrement };
    }
    ```
  </example>
</rule>

<rule name="Hooks Devem Ser Puros e Previsíveis">
  <description>Um hook deve sempre retornar a mesma coisa para as mesmas entradas e não deve ter efeitos colaterais "escondidos". Efeitos colaterais devem ser contidos exclusivamente dentro de `useEffect`, `useLayoutEffect` ou em funções de evento retornadas pelo hook.</description>
</rule>

<rule name="Retorno de Hooks">
  <description>Prefira retornar um objeto de um hook customizado em vez de um array. Objetos são mais explícitos e menos propensos a erros de desestruturação. Arrays são aceitáveis apenas quando a ordem é óbvia e estável, como no `useState` do React.</description>
  <example type="DO">
    ```ts
    const { count, increment } = useCounter();
    ```
  </example>
  <example type="DO_NOT">
    ```ts
    const [count, increment] = useCounter(); // Menos explícito
    ```
  </example>
</rule>

<rule name="Hierarquia de Estado">
  <description>Siga esta hierarquia para decidir onde colocar o estado, do mais simples ao mais complexo.</description>
  <spec>**1. Estado Local (`useState`, `useReducer`):** Para estado que vive e morre com um único componente (ex: estado de um input, se um modal está aberto). É a sua primeira opção sempre.</spec>
  <spec>**2. Estado Elevado (Lifting State Up):** Se múltiplos componentes irmãos precisam do mesmo estado, eleve-o para o pai comum mais próximo e passe-o via props.</spec>
  <spec>**3. Estado de Contexto (`useContext`):** Para estado que precisa ser compartilhado por múltiplos componentes em diferentes níveis da árvore, mas que não muda com frequência (ex: tema da aplicação, informação do usuário autenticado).</spec>
  <spec>**4. Estado Global (Store):** O projeto `rac-designer-teto` não utiliza uma biblioteca de estado global. A decisão de adicionar uma (Zustand, Redux) deve ser tratada como uma refatoração arquitetural significativa e aprovada previamente.</spec>
</rule>

</ruleset>
