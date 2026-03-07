# NAMING CONVENTIONS

<ruleset name="Naming Conventions">

<description>
Estas são as convenções de nomenclatura oficiais do projeto. A consistência no nome de arquivos, variáveis, funções e componentes é crucial para a legibilidade e manutenibilidade do código.
</description>

<rule name="Arquivos de Componentes React">
  <description>Arquivos de componentes React devem usar PascalCase e a extensão `.tsx`.</description>
  <example type="DO">`MyComponent.tsx`, `UserProfileCard.tsx`</example>
  <example type="DO_NOT">`my-component.tsx`, `user_profile_card.js`</example>
</rule>

<rule name="Arquivos de Hooks React">
  <description>Arquivos de hooks customizados devem usar camelCase com o prefixo `use` e a extensão `.ts`.</description>
  <example type="DO">`useUserData.ts`, `useFormValidation.ts`</example>
  <example type="DO_NOT">`UserDataHook.ts`, `use-form-validation.ts`</example>
</rule>

<rule name="Outros Arquivos TypeScript">
  <description>Arquivos de lógica, tipos, serviços e utilitários devem usar kebab-case.</description>
  <example type="DO">`api-client.ts`, `string-utils.ts`, `user.types.ts`</example>
  <example type="DO_NOT">`apiClient.ts`, `StringUtils.ts`</example>
</rule>

<rule name="Variáveis e Funções">
  <description>Variáveis e funções devem usar camelCase.</description>
  <example type="DO">`const userData = ...`, `function calculateTotal() { ... }`</example>
  <example type="DO_NOT">`const UserData = ...`, `function Calculate_Total() { ... }`</example>
</rule>

<rule name="Nomes de Booleanos">
  <description>Variáveis booleanas devem ter prefixos como `is`, `has`, `should`, `can` para deixar claro seu propósito.</description>
  <example type="DO">`const isOpen = true;`, `const hasPermission = false;`</example>
  <example type="DO_NOT">`const open = true;`, `const permission = false;`</example>
</rule>

<rule name="Nomes de Handlers de Eventos">
  <description>Funções que são handlers de eventos devem ter o prefixo `handle` seguido do nome do evento.</description>
  <example type="DO">`function handleClick() { ... }`, `const handleInputChange = (e) => { ... }`</example>
  <example type="DO_NOT">`function clickHandler() { ... }`, `const onInputChange = (e) => { ... }`</example>
</rule>

<rule name="Nomes de Props de Callback">
  <description>Props que são funções de callback devem ter o prefixo `on` seguido do evento que a dispara.</description>
  <example type="DO">`<Button onClick={...}></Button>`, `<Form onSave={...}></Form>`</example>
  <example type="DO_NOT">`<Button clickHandler={...}></Button>`, `<Form save={...}></Form>`</example>
</rule>

<rule name="Constantes">
  <description>Constantes que são usadas em múltiplos lugares e não mudam devem usar `UPPER_SNAKE_CASE`.</description>
  <example type="DO">`const MAX_RETRIES = 3;`, `const API_BASE_URL = '...'`</example>
  <example type="DO_NOT">`const maxRetries = 3;`</example>
</rule>

<rule name="Tipos e Interfaces">
  <description>Tipos e interfaces devem usar PascalCase. Se for um tipo para as props de um componente, deve ter o sufixo `Props`.</description>
  <example type="DO">`type User = { ... }`, `interface Product { ... }`, `type UserProfileProps = { ... }`</example>
  <example type="DO_NOT">`type user = { ... }`, `interface product_interface { ... }`</example>
</rule>

<rule name="Nomenclatura Específica de Clean Architecture">
  <description>Convenções de nomenclatura para os artefatos da Clean Architecture.</description>
  <spec>Agregado: `{model}-aggregate.ts` (ex: `house.aggregate.ts`)</spec>
  <spec>Porta: `{model}-{concern}-port.ts` (ex: `house-persistence.port.ts`)</spec>
  <spec>Adapter: `{location}-{model}-{concern}-adapter.ts` (ex: `in-memory-house-persistence-adapter.ts`)</spec>
  <spec>Caso de Uso: `{action}.use-case.ts` (ex: `house-state.use-case.ts`)</spec>
  <spec>Estratégia: `{element}.strategy.ts` (ex: `door.strategy.ts`)</spec>
</rule>

</ruleset>
