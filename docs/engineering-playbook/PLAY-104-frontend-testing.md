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

### Persistência com seleção múltipla

No Fabric, os objetos de uma `ActiveSelection` mantêm coordenadas relativas à seleção temporária. Um
serializador próprio deve exportar a transformação absoluta de cada objeto selecionado, mantendo os
filhos de grupos no sistema local do grupo. Salvar apenas `left` e `top` da seleção pode deslocar o
desenho ao reabrir; alterar o zoom ou reenquadrar a página não recupera a transformação perdida.

A exportação deve preservar a seleção e a geometria do editor em uso. O adapter documental aplica a
matriz completa a um objeto temporário, sem desfazer a seleção nem modificar os objetos vivos.
Preserve também a leitura segura de referências de imagens: esse caminho não deve depender de
serialização nativa da imagem ou de acesso aos seus pixels.

A [regressão de seleção e
reabertura](../../client/src/components/rac-editor/@canvas/ui/adapters/canvas-selection-roundtrip.smoke.test.ts)
usa `Canvas` e `ActiveSelection` reais. Cobre ausência de seleção, seleção múltipla, rotação com
escala desigual, espelhamento, inclinação, objeto fora da seleção e coordenadas internas dos
pilotis. Compara as matrizes absolutas após três ciclos de salvar e reabrir, com uma viewport
transformada, e confere que exportações repetidas preservam a seleção e o desenho de origem. Outro
controle impede a chamada de `toObject` em uma imagem selecionada.

Ao alterar a [serialização
documental](../../client/src/components/rac-editor/@canvas/ui/adapters/fabric-canvas-document-port.ts),
mantenha esses controles. A prova local do round trip não comprova sincronização remota nem
recuperação de posições de documentos anteriormente gravados com a transformação incorreta.

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

### Gestos e enquadramento em celular horizontal

Use uma casa com objetos realmente presentes no Canvas e no documento persistido. A câmera enquadrar
uma página vazia não comprova que o desenho foi preservado. Em tela baixa, confira os limites do
contêiner, a posição e o tamanho da página após zoom alto e Fit to View.

Cubra arraste com um dedo em largura acima de 767 px, translação com dois dedos e pinça combinada.
Aguarde o estado observável da câmera antes de calcular a próxima expectativa. Compare o documento
antes e depois da navegação para comprovar que os objetos não foram deslocados. Inclua a
persistência de zoom abaixo de 25% e controles de desktop, wheel e minimapa.

[canvas-mobile-navigation.spec.ts](../../e2e/canvas-mobile-navigation.spec.ts) usa eventos touch
nativos via CDP em Chromium emulado e verifica a página centralizada dentro da área disponível. A
fixture desse arquivo cria a casa em desktop e depois gira para paisagem: ela complementa o cenário
de primeira abertura mobile acima, sem substituí-lo. Os controles unitários estão em
[useCanvasViewport.smoke.test.ts](../../client/src/components/rac-editor/@canvas/hooks/useCanvasViewport.smoke.test.ts)
e nas [interações de
ponteiro](../../client/src/components/rac-editor/@canvas/ui/adapters/hooks/useCanvasPointerInteractions.smoke.test.ts).

### Editores, teclado virtual e rotação

Abra o item por toque e confira separadamente: ausência de foco automático no mobile, intenção de
digitar, acesso ao campo, Confirmar, Cancelar e preservação do rascunho ao girar. Uma captura do
painel não substitui o toque efetivo no campo e nas ações. Preserve também um controle de foco
desktop.

Teste altura baixa e uma viewport visual menor sem redimensionar a janela. Simule os eventos de
resize e scroll de VisualViewport, incluindo offset vertical. Isso exercita o contrato do hook, mas
não o teclado Android real. Em altura extrema, confira que a área reservada às ações não impede
alcançar o campo.

[optional-text-mobile.spec.ts](../../e2e/optional-text-mobile.spec.ts) cobre 680 × 180 px, 120 px de
altura e VisualViewport simulada. Confirmar é verificado também após recarga e navegação de retorno
ao Canvas; Cancelar descarta o rascunho. No cenário de rotação, respeite o aviso de orientação
existente e confira o texto após retornar à paisagem, sem interpretar um diálogo oculto pelo aviso
como perda de dados. O comportamento está definido na
[UI-006](../ui-definitions/UI-006-editores-flutuantes-e-teclado-mobile.md).

### Upload, validação e persistência da casa

Use resposta sintética com o mesmo formato da rota privada retornada pelo servidor. Confira a cadeia
completa: upload, aceitação pelo resolver, chamada de salvar, retorno à listagem e foto preservada
após recarga. Cubra também rota legada, referências inválidas, erro com seção recolhida, salvamento
sem foto e rejeição assíncrona com preenchimento preservado.

[house-save-regression.spec.ts](../../e2e/house-save-regression.spec.ts) cobre criação e edição em
390 e 1280 px com leitura do armazenamento e recarga. A [regressão do
formulário](../../client/src/components/construction-site/ui/HouseConfigurationScreen.regression.test.tsx)
confere os erros e a recuperação após falha; os [testes de
foto](../../client/src/shared/lib/photo-data-url.smoke.test.ts) exercitam o contrato compartilhado.
Fixtures não devem incorporar fotos pessoais dos relatos.

### Aceite no Android real e limites da evidência

Registre separadamente: testes locais, presença do código no site e aceite no aparelho. O
procedimento para conferir a versão servida está no [diagnóstico de publicação
Manus](../OPS-001-diagnostico-publicacao-manus.md).

No aparelho real, atualize a página e registre navegador, orientação e versão observada. Acesse a
casa pelos controles mobile; no Canvas, use paisagem conforme a proteção de orientação vigente. Com
uma casa de teste, aumente bastante o zoom, arraste e enquadre a página inteira. Depois abra um item
com texto opcional, toque no campo, digite, alcance Confirmar, reabra e confira o texto. Confira
Cancelar separadamente e gire o aparelho, retornando à paisagem para conferir o rascunho. Use dados
de teste para não alterar o desenho operacional de uma família.

Emulação de toque e VisualViewport simulada não fecham esse aceite. Identifique explicitamente
quando o aparelho ou teclado real ainda não foi validado.

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
