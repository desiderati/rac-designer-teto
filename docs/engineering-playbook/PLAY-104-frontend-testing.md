---
title: Estratégia de Testes Frontend
id: PLAY-104
doc_type: playbook
doc_role: engineering-playbook
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

Teste comportamento, não implementação. Os testes devem simular como o usuário interage com a
aplicação e verificar o resultado visível, em vez de acoplar a suíte a detalhes internos frágeis.

## Pirâmide de testes adaptada

- Base: testes unitários e smoke tests com Vitest para lógica de negócio pura e trechos críticos de
  domínio ou lib.

- Meio: testes de integração com React Testing Library, foco principal da suíte frontend.

- Topo: testes E2E com Playwright para fluxos mais críticos do produto.

## Checagem de tipos e execução dos E2E

A checagem TypeScript principal usa [tsconfig.json](../../tsconfig.json): inclui cliente, servidor e
contratos compartilhados, mas exclui `e2e/`. Seu sucesso, portanto, não comprova que os testes
Playwright estão tipados corretamente.

A checagem dedicada usa [tsconfig.e2e.json](../../tsconfig.e2e.json), que herda as opções da
aplicação e inclui `e2e/**/*.ts` e `playwright.config.ts`. A biblioteca `ES2022` disponibiliza as
declarações usadas pelos testes, como `Object.hasOwn`, sem mudar o `target: ES2020` herdado. Ambas
as checagens usam `noEmit`; não executam cenários, asserções ou interações no navegador.

Ao alterar testes, helpers ou configuração Playwright, execute a checagem dedicada e os cenários
afetados. Quando a alteração também tocar código da aplicação, confira os dois escopos de tipos.
Registre separadamente o resultado estático e o resultado dos testes no navegador: um não substitui
o outro. Corrija os contratos de tipos sem enfraquecer asserções para obter aprovação.

Para mudanças de maior alcance, use a regressão completa. Os comandos, a ordem das etapas e o perfil
do servidor E2E estão no [README do projeto](../../README.md); os scripts efetivos estão em
[package.json](../../package.json). Consulte esses pontos em vez de manter uma segunda lista de
comandos neste guia.

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

Mocks devem isolar o componente sob teste de dependências externas, como API, browser APIs ou partes
do sistema alheias ao foco do teste. Use `vi.mock` quando necessário.

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

### Primeira abertura diretamente no mobile

Configure o viewport mobile antes do primeiro carregamento da aplicação. Abrir em desktop e reduzir
a tela depois verifica a adaptação de uma aplicação já inicializada, mas não comprova a primeira
abertura diretamente no mobile.

Quando o cenário exigir dados persistidos, prepare o IndexedDB na mesma origem sem montar React nem
inicializar o Canvas desktop. O helper `setupMobileFirstRacEditorPage`, em
[construction-site.helpers.ts](../../e2e/helpers/construction-site.helpers.ts), usa uma página HTML
mínima para essa preparação antes de navegar para a aplicação.

O cenário “Primeira abertura diretamente no mobile”, em
[construction-management-mobile.spec.ts](../../e2e/construction-management-mobile.spec.ts), começa
em 360 × 844 px: verifica a listagem antes do Canvas, acessa a casa pelos controles mobile e só
então gira para 740 × 420 px, conferindo o Canvas e os dois menus radiais inicialmente fechados.

### Scrollbars nativas e acesso aos itens

O Chromium iniciado pelo Playwright recebe `--hide-scrollbars` por padrão. Em regressões de
scrollbar ou overflow, remova esse argumento para não mascarar barras que podem consumir espaço e
recortar os controles:

```ts
test.use({launchOptions: {ignoreDefaultArgs: ['--hide-scrollbars']}});
```

Use como referência [menu-scrollbar.spec.ts](../../e2e/menu-scrollbar.spec.ts), que reproduz barras
nativas de 16 px e restringe a largura disponível de submenus desktop. Além da ausência visual das
barras, confira a altura útil, os limites dos botões e o acesso ao último item por foco de teclado e
rolagem horizontal. Ocultar a barra visual deve preservar o acesso aos itens fora da área visível.

## Smoke tests co-localizados

Para lógica crítica em domain ou lib, crie arquivos `*.smoke.test.ts` co-localizados. Eles servem
como verificação rápida de integridade da regra principal e não exigem aparato pesado de mocking.

## Guarda arquitetural

- Use `npm run test:architecture` quando a mudança tocar fronteiras do editor, ports, bootstrap,
  canvas, domínio ou infra.

- A guarda atual vive em `client/src/test/rac-editor-boundary.smoke.test.ts`.

- Ela protege o núcleo lógico contra vazamentos de Fabric, `@canvas`, `CanvasGroup`, `CanvasObject`,
  `CanvasInteractionPort` e imports concretos de `client/src/infra` no código produtivo do editor.
