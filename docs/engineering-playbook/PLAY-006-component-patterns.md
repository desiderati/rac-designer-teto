# COMPONENT PATTERNS

<ruleset name="Component Patterns">

<description>
Estas são as regras para a criação de componentes React. O objetivo é ter componentes previsíveis, reutilizáveis e fáceis de manter.
</description>

<rule name="Composição sobre Herança">
  <description>Sempre prefira composição para reutilizar lógica e UI. Use props como `children` ou props específicas para injetar outros componentes, em vez de criar hierarquias complexas de classes.</description>
  <example type="DO">
    ```tsx
    // Card.tsx
    function Card({ header, children }: CardProps) {
      return (
        <div>
          <header>{header}</header>
          <main>{children}</main>
        </div>
      );
    }

    // Usage
    <Card header={<h2>Title</h2>}>
      <p>Content</p>
    </Card>
    ```
  </example>
</rule>

<rule name="Separação de Componentes Smart vs. Dumb">
  <description>Separe a lógica (smart components / containers) da apresentação (dumb components / presentational). Componentes "dumb" recebem dados e callbacks via props e não têm estado próprio. Componentes "smart" gerenciam estado, fazem data fetching e passam os dados para os componentes "dumb".</description>
  <example type="DO">
    ```tsx
    // UserProfile.tsx (Dumb)
    function UserProfile({ user, onSave }: UserProfileProps) {
      return (
        <form>...</form>
      );
    }

    // UserProfileContainer.tsx (Smart)
    function UserProfileContainer({ userId }: { userId: string }) {
      const { data: user } = useUserQuery(userId);
      const { mutate: saveUser } = useSaveUserMutation();

      if (!user) return <Spinner />;

      return <UserProfile user={user} onSave={saveUser} />;
    }
    ```
  </example>
</rule>

<rule name="Props Destructuring com Tipos Explícitos">
  <description>Sempre desestruture as props na assinatura da função e defina os tipos explicitamente com uma interface ou tipo com o sufixo `Props`.</description>
  <example type="DO">
    ```tsx
    type ButtonProps = {
      label: string;
      onClick: () => void;
      variant?: 'primary' | 'secondary';
    }

    function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
      // ...
    }
    ```
  </example>
  <example type="DO_NOT">
    ```tsx
    function Button(props) { // Sem tipos, sem destructuring
      // ...
    }
    ```
  </example>
</rule>

<rule name="Renderização Condicional Limpa">
  <description>Use operadores ternários para condições simples e o operador `&&` para renderizar ou não um elemento. Para lógicas mais complexas, extraia para uma variável ou função.</description>
  <example type="DO">
    ```tsx
    <div>
      {isLoggedIn ? <UserProfile /> : <LoginForm />}
      {isAdmin && <AdminPanel />}
    </div>
    ```
  </example>
  <example type="DO_NOT">
    ```tsx
    // Evite ternários aninhados e complexos no JSX
    <div>
      {isLoading ? <Spinner /> : error ? <Error /> : data ? <Data /> : null}
    </div>
    ```
  </example>
</rule>

<rule name="Keys em Listas">
  <description>Sempre use uma `key` estável e única para cada item em uma lista. Não use o índice do array como `key` se a lista puder ser reordenada, adicionada ou removida.</description>
  <example type="DO">
    ```tsx
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
    ```
  </example>
  <example type="DO_NOT">
    ```tsx
    <ul>
      {users.map((user, index) => (
        <li key={index}>{user.name}</li> // Perigoso!
      ))}
    </ul>
    ```
  </example>
</rule>

<rule name="Evite Props Drilling Excessivo">
  <description>Se você está passando uma prop por mais de 2 ou 3 níveis de componentes sem que os componentes intermediários a usem, é um sinal para usar a Context API ou uma biblioteca de estado global.</description>
</rule>

</ruleset>
