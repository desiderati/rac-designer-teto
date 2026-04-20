# TESTING STRATEGY

<ruleset name="Testing Strategy">

<description>
Regras para a escrita de testes automatizados. O objetivo é ter uma suíte de testes robusta que garanta a qualidade e previna regressões com confiança.
</description>

<rule name="Filosofia de Teste">
  <description>"Teste o comportamento, não a implementação". Os testes devem simular como um usuário interage com a aplicação e verificar o resultado visível, em vez de testar detalhes internos de um componente. Isso torna os testes mais resistentes a refatorações.</description>
</rule>

<rule name="Pirâmide de Testes Adaptada">
  <description>Seguimos uma pirâmide de testes adaptada para o frontend moderno, com foco em testes de integração.</description>
  <spec>**Base (Larga): Testes Unitários e Smoke Tests (com Vitest).** Para lógica de negócio pura e complexa (ex: `domain/`, `lib/`). Rápidos e precisos.</spec>
  <spec>**Meio (Muito Larga): Testes de Integração (com React Testing Library).** O foco principal. Testa múltiplos componentes juntos, simulando interações do usuário em um ambiente de DOM simulado (JSDOM).</spec>
  <spec>**Topo (Fina): Testes End-to-End (E2E com Playwright).** Para os fluxos mais críticos da aplicação (ex: criação de uma casa, interação com o canvas, modais). Roda em um navegador real.</spec>
</rule>

<rule name="O que testar em um Teste de Integração">
  <description>O teste deve responder a estas perguntas:</description>
  <spec>1. O componente renderiza corretamente com as props fornecidas?</spec>
  <spec>2. Ele exibe os diferentes estados (loading, error, empty, success)?</spec>
  <spec>3. A interação do usuário (cliques, digitação) chama as funções corretas e atualiza a UI como esperado?</spec>
  <spec>4. As mensagens de erro são exibidas quando deveriam?</spec>
</rule>

<rule name="Seletores da Testing Library">
  <description>Use a ordem de prioridade recomendada pela Testing Library para selecionar elementos. Isso torna os testes mais acessíveis e resilientes.</description>
  <spec>**1. `getByRole`:** A melhor opção. Simula como usuários de tecnologias assistivas navegam.</spec>
  <spec>**2. `getByLabelText`:** Para campos de formulário.</spec>
  <spec>**3. `getByPlaceholderText`:** Para inputs sem label visível.</spec>
  <spec>**4. `getByText`:** Para encontrar elementos não-interativos pelo seu texto.</spec>
  <spec>**5. `getByDisplayValue`:** Para encontrar um input pelo seu valor atual.</spec>
  <spec>**NUNCA `getByTestId` como primeira opção.** `data-testid` é um atributo de escape e só deve ser usado quando nenhum outro seletor semântico funciona.</spec>
</rule>

<rule name="Mocking de Dependências">
  <description>Mocks devem ser usados para isolar o componente sob teste de dependências externas, como chamadas de API, módulos do navegador ou outras partes do sistema. Use `vi.mock` do Vitest.</description>
</rule>

<rule name="Padrões de Testes E2E com Playwright">
  <description>Regras para escrever testes E2E com Playwright.</description>
  <spec>Os testes devem ser focados nos "happy paths" dos fluxos mais críticos do usuário.</spec>
  <spec>Use seletores de acessibilidade (`getByRole`, `getByLabel`) sempre que possível.</spec>
  <spec>Crie Page Object Models (POMs) ou funções helper para encapsular a lógica de interação com páginas complexas e evitar duplicação de seletores.</spec>
  <example type="DO">
    ```ts
    // helpers/login-page.ts
    export async function login(page, user, password) {
      await page.getByLabel("Email").fill(user);
      await page.getByLabel("Password").fill(password);
      await page.getByRole("button", { name: "Entrar" }).click();
    }

    // tests/login.spec.ts
    test("should allow user to log in", async ({ page }) => {
      await login(page, "test@example.com", "password");
      await expect(page.getByText("Bem-vindo")).toBeVisible();
    });
    ```
  </example>
</rule>

<rule name="Smoke Tests Co-localizados">
  <description>Para lógica de negócio crítica no `domain/` ou `lib/`, crie um arquivo de smoke test (`*.smoke.test.ts`) co-localizado. Este teste não precisa de mocks complexos e serve como uma verificação rápida de que a lógica principal não quebrou.</description>
</rule>

</ruleset>
