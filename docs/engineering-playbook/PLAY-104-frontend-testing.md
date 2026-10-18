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

## Sincronização das interações React

Aguarde as interações assíncronas de `userEvent` e a consequência observável na interface, usando
`findBy*` ou `waitFor` da Testing Library. A chamada de um mock não comprova que a interface
terminou sua atualização: em uma confirmação, confira também o fechamento do diálogo.

Quando uma atualização React for disparada diretamente fora desses helpers, como submissão com
`fireEvent.submit` ou foco programático, envolva a operação em `await act(async () => { ... })`. Não
substitua essa sincronização por `setTimeout(0)` nem suprima avisos de `act`: o teste pode passar
com atualizações ainda pendentes.

Referências existentes:

- [ConstructionSiteManagementPanel.smoke.test.tsx](../../client/src/components/construction-site/ui/ConstructionSiteManagementPanel.smoke.test.tsx):
  submissão assíncrona e espera pelo fechamento dos diálogos.

- [ui-ux-revision.smoke.test.tsx](../../client/src/components/construction-site/ui/ui-ux-revision.smoke.test.tsx):
  foco programático e navegação das abas.

- [TopBar.smoke.test.tsx](../../client/src/components/rac-editor/@menus/ui/TopBar.smoke.test.tsx):
  interação aguardada e atualização observável após redefinir a casa.

### Verificação automática de avisos `act(...)`

O [setup do Vitest](../../client/src/test/setup.ts) instala a [guarda de avisos
React](../../client/src/test/react-act-warning-guard.ts) em `console.error` e `console.warn`. Ela
encaminha os argumentos originais ao console e coleta as mensagens que correspondem às assinaturas
de avisos `act(...)`. A verificação ocorre nos hooks `afterEach` e `afterAll`, após a limpeza dos
testes, e faz a execução falhar quando encontra esses avisos.

A mensagem de falha inclui os avisos detectados. Corrija a sincronização da interação e aguarde o
resultado observável, preservando as asserções de comportamento e a saída original do console.
Mensagens de outras categorias continuam visíveis e não provocam falha por essa guarda.

Os [testes de contrato](../../client/src/test/react-act-warning-guard.smoke.test.ts) executam
fixtures em processos Vitest separados, derivados da configuração real do projeto. Eles comprovam
que avisos reais e avisos emitidos durante a limpeza produzem código de saída `1`, enquanto
atualizações aguardadas e mensagens não relacionadas produzem código `0`. Também conferem a
preservação das mensagens, dos argumentos originais e a restauração do console.

Ao alterar a guarda ou atualizar o React, revise as assinaturas reconhecidas e execute esses
contratos. As fixtures contêm avisos intencionais e permanecem fora da descoberta normal da suíte;
os testes de contrato são responsáveis por executá-las e conferir as falhas esperadas.

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

### Ciclo da casa, persistência e orientação 3D

Para os tipos 3 e 6, cubra a sequência completa: planta isolada, inserção das elevações, remoção da
fachada com porta, remoção das demais elevações e reinserção da fachada. Confira a geometria da
planta, salve e reabra o desenho e confira novamente a planta e o viewer 3D em cada etapa. As regras
funcionais estão em [BUS-003](../business-rules/BUS-003-vistas-por-tipo.md) e
[BUS-007](../business-rules/BUS-007-viewer-3d.md).

As camadas existentes se complementam:

- [house-orientation-lifecycle.smoke.test.ts](../../client/src/components/rac-editor/@canvas/ui/adapters/house-orientation-lifecycle.smoke.test.ts)
  verifica cada inserção e remoção, transformações de grupo, posição relativa da porta e dos
  marcadores, pilotis e orientação da projeção 3D. Cada estado passa por serialização e duas
  reaberturas com novas instâncias Fabric; a conferência anterior ao refresh evita mascarar falhas
  de persistência.

- [house-lifecycle-3d.spec.ts](../../e2e/house-lifecycle-3d.spec.ts) percorre os controles reais no
  navegador, move e remove elevações, aguarda o salvamento automático, recarrega a aplicação e abre
  o viewer. Cobre os lados superior/inferior no tipo 6 e esquerdo/direito no tipo 3.

O helper [house-lifecycle.helpers.ts](../../e2e/helpers/house-lifecycle.helpers.ts) aguarda o
documento efetivamente persistido no IndexedDB antes do reload e compara identificadores e
transformações após reabrir. No viewer, verifica porta, janelas, escada, pilotis e câmera na cena
WebGL já montada, sem construir uma cena alternativa. Essa inspeção usa detalhes internos de Fabric
e React Three Fiber; revise o helper quando essas dependências mudarem, preservando as ações pela
interface.

Os screenshots anexados pelo E2E são evidências para inspeção, não comparações automáticas com uma
imagem de referência. O cenário desktop com persistência local não comprova sincronização remota,
cobertura mobile ou aceite visual humano.

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
