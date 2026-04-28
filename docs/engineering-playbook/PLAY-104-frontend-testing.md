---
title: Estratégia de Testes Frontend
id: PLAY-104
doc_type: playbook
doc_set: engineering-playbook
family: frontend
precedence: 104
status: active
lang: pt-BR
---

# Estratégia de Testes Frontend

## Objetivo

Definir regras para escrita de testes automatizados com foco em qualidade e prevenção de regressão.

## Filosofia de teste

Teste comportamento, não implementação. Os testes devem simular como o usuário interage com a aplicação e verificar o
resultado visível, em vez de acoplar a suíte a detalhes internos frágeis.

## Pirâmide de testes adaptada

- Base: testes unitários e smoke tests com Vitest para lógica de negócio pura e trechos críticos de domínio ou lib.
- Meio: testes de integração com React Testing Library, foco principal da suíte frontend.
- Topo: testes E2E com Playwright para fluxos mais críticos do produto.

## O que verificar em testes de integração

1. Se o componente renderiza corretamente com as props fornecidas.
2. Se exibe estados de loading, erro, vazio e sucesso quando aplicável.
3. Se a interação do usuário chama as funções corretas e atualiza a UI como esperado.
4. Se as mensagens de erro aparecem quando deveriam.

## Seletores da Testing Library

Use esta ordem de preferência:

1. `getByRole`
2. `getByLabelText`
3. `getByPlaceholderText`
4. `getByText`
5. `getByDisplayValue`

`data-testid` é atributo de escape e não deve ser primeira opção.

## Mocking de dependências

Mocks devem isolar o componente sob teste de dependências externas, como API, browser APIs ou partes do sistema
alheias ao foco do teste. Use `vi.mock` quando necessário.

## Padrões de E2E com Playwright

- Foque happy paths dos fluxos mais críticos.
- Prefira seletores de acessibilidade.
- Use Page Objects ou helpers quando isso reduzir duplicação de interação e seletor.

Exemplo recomendado:

```ts
export async function login(page, user, password) {
  await page.getByLabel("Email").fill(user);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", {name: "Entrar"}).click();
}

test("should allow user to log in", async ({page}) => {
  await login(page, "test@example.com", "password");
  await expect(page.getByText("Bem-vindo")).toBeVisible();
});
```

## Smoke tests co-localizados

Para lógica crítica em domain ou lib, crie arquivos `*.smoke.test.ts` co-localizados. Eles servem como verificação
rápida de integridade da regra principal e não exigem aparato pesado de mocking.
