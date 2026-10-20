---
title: Menus laterais do Canvas
id: UI-005
doc_type: ui-definition
doc_role: ui-definition
doc_set: ui-definitions
order: 5
status: active
lang: pt-BR
---

# Menus laterais do Canvas

## Objetivo e escopo

Consolidar a apresentação dos dois menus laterais sem mudar os comandos do editor: ferramentas de
desenho à esquerda; solo, dificuldade e obstáculos à direita. O mesmo comando conserva seus
efeitos, bloqueios e persistência ao trocar de apresentação.

As regras funcionais e a taxonomia dos elementos pertencem a
[BUS-002 — Regras da Toolbar](../business-rules/BUS-002-toolbar.md). Esta definição concentra
anatomia, estados visuais, adaptação de viewport e pontos de manutenção compartilhados.
As diretrizes gerais permanecem no [DESIGN.md](../../DESIGN.md).

## Seleção da apresentação

A superfície do editor mantém largura mínima de 360 px. `useCanvasMobileViewport` considera mobile
quando a largura é de até 767 px **ou** quando há ponteiro de toque (`pointer: coarse`) com altura de
até 600 px. O radial exige também orientação horizontal, incluindo largura igual à altura.

| Condição | Apresentação dos menus |
|----------|------------------------|
| Fora da condição mobile | Barra de ferramentas esquerda e controles direitos não radiais; rótulos conforme a preferência global. |
| Mobile horizontal | Dois radiais opostos, inicialmente recolhidos, com hierarquia no próprio arco. |
| Mobile em retrato | O Canvas solicita rotação; a interação normal com os radiais ocorre após girar. |

Em viewport de desktop sem a condição de toque/altura reduzida, 767 px ainda usa o modo mobile e
768 px usa as barras desktop. Não substituir a condição composta por um breakpoint de CSS isolado.
A preferência de rótulos usa essa mesma classificação de mobile.

### Fallback não radial em telas estreitas

Os componentes ainda conservam barras com controle de abertura/recolhimento na apresentação não
radial, quando esse controle é habilitado pelo chamador. Abaixo de 640 px iniciam recolhidas; de
640 a 766 px iniciam abertas e podem ser recolhidas; a partir de 767 px o controle não aparece.
Na esquerda, o controle acompanha o lado direito da barra aberta e volta ao limite esquerdo quando
recolhida; a direita mantém seu controle junto ao painel de dificuldade.

Esses limites descrevem o fallback. O radial horizontal usa o botão central para abrir, navegar e
recolher. No Canvas mobile em retrato, o aviso de rotação preserva o bloqueio de interação.

## Identidade e anatomia compartilhadas

- Superfícies brancas ou translúcidas, borda clara, sombra discreta, ícones em cinza-ardósia e azul
  para foco, seleção e navegação. Exclusão conserva o vermelho de ação destrutiva.
- Ícones e miniaturas dos comandos mantêm escala visual de 16 × 16 px; uma nova opção não deve
  ampliar o ícone para preencher todo o botão.
- Estados desabilitados permanecem perceptíveis e inertes; limites de inserção conservam sua
  indicação. A apresentação não remove as restrições da casa ou da construção.
- Nomes acessíveis continuam completos, mesmo quando o nome visível é curto, como `Casa TETO`,
  `Entrada` ou `Estrada`. Cor e desenho do ícone não substituem o nome e o estado acessíveis.
- `Limites e acessos` usa o contorno de terreno; `Terreno e entorno` usa montanha e sol, distinto
  do ícone do elemento Árvore.

## Desktop: rótulos e submenus ancorados

A opção `Mostrar rótulos nos menus (desktop)` fica nas Configurações globais, habilitada por padrão.
Um valor desligado já salvo permanece desligado. Confirmar aplica e persiste o rascunho; Cancelar
o descarta. A configuração não altera nomes laterais do radial nem os rótulos dos pilotis.

| Superfície | Sem rótulos | Com rótulos |
|------------|-------------|-------------|
| Barra esquerda | Cápsula vertical de 48 px; botões circulares de 40 × 40 px. | Contêiner de 88 px com raio de 24 px; itens de 76 px e altura mínima de 60 px, raio de 14 px. |
| Submenus esquerdos | Cápsulas de 48 px de altura, com botões de 40 × 40 px. | Contêineres de 76 px de altura e raio de 24 px; itens de 92 px e altura mínima de 64 px, raio de 14 px. |
| Solo e Obstáculos | Botões circulares de 32 × 32 px. | Botões de 88 × 64 px, raio de 18 px, com nome abaixo do ícone. |

Os rótulos desktop usam 12 px, alinhamento central e até duas linhas nos itens esquerdos.
Tooltips de hover/foco continuam disponíveis nos controles desktop, com um único tooltip por item,
sem duplicação pelo atributo nativo `title`.

Abrir `Elementos` mostra somente suas quatro categorias, sem categoria ou variante inicialmente
selecionada. Cada nível seguinte abre por clique no pai; clicar novamente o recolhe. O primeiro
ícone de cada linha fica alinhado ao item que a abriu. Havendo pouco espaço à direita, o ajuste de
posição mantém a linha na área disponível; linhas com rótulos podem rolar horizontalmente sem
exibir scrollbars nativas. Bloquear o overflow vertical e evitar que uma barra horizontal consuma
altura e recorte os botões. Preservar o alcance das opções por teclado e gesto horizontal.

As listas de solo e obstáculos abrem à esquerda dos controles, com ícone, nome e check. Compartilham
largura de 14 rem e o mesmo padrão de linha; a altura total depende do número de opções.
O ícone de solo representa o perfil atual. O botão de Obstáculos conserva o cone, inclusive marcado.
O indicador de dificuldade permanece entre os dois controles; com rótulos, recebe o nome
`Dificuldade` e apresentação vertical.

## Mobile horizontal: navegação por níveis

Os dois botões centrais ficam nas bordas laterais, centralizados na altura da tela. A raiz esquerda
usa ferramentas de desenho; a direita, ajustes. Ambos iniciam fechados. Um menu aberto mostra
somente as opções do nível atual, voltadas para o interior da tela.

| Acionamento | Resultado |
|-------------|-----------|
| Centro na raiz | Abrir ou recolher o menu. |
| Item com filhos | Levar seu ícone ao centro e mostrar somente seus filhos no arco. |
| Centro dentro de submenu | Retornar ao nível anterior. |
| Escape | Retornar um nível; na raiz, recolher e devolver foco ao centro. |
| Fora do menu | Fechar e limpar o caminho de navegação. |
| Ação final comum | Fechar a árvore e executar o comando existente. |
| Perfil do solo ou obstáculo | Aplicar a seleção e manter o submenu aberto. |

Casa TETO, categorias, elementos e variantes usam essa navegação. Selecionar uma categoria não abre
cápsulas desktop sobre os botões do arco. Cada grupo novo deve reutilizar a árvore existente.

Os nomes dos itens ficam sempre visíveis junto aos botões: à direita no menu esquerdo e à esquerda
no direito. Tocar no nome aciona o mesmo botão. O centro mantém somente o ícone, com nome acessível
que indica a ação de voltar quando houver um nível pai. Não duplicar esses nomes com tooltips.

### Seleção de itens no mobile horizontal

A barra inferior acompanha a seleção. Por padrão, o arrasto move somente os itens selecionados.
Um item mostra `Item selecionado. Arraste pra movê-lo.`, `Editar` e `Escalar`.
Editar e o botão que alterna entre Escalar e Mover têm 80 × 44 px em todos os estados.
`Editar` fica habilitado para um objeto com editor associado: planta/pilotis, terreno da elevação,
muro e formas geométricas, linha/seta/distância, texto, desenho livre, cerca, entrada de terreno,
casa desenhada e construção desenhada. Componentes sem editor mantêm a ação desabilitada.
Vários mostram `Itens selecionados. Arraste pra movê-los.` e `Escalar`, sem edição múltipla.
Ao lado das ações, Excluir seleção aparece somente como ícone de lixeira vermelho, com alvo de toque
de 44 × 44 px e nome acessível. A ação usa o comando de exclusão existente para um ou vários itens;
sem seleção, a barra desaparece, e casas construídas continuam sem ações de modificação.

`Escalar` revela alças circulares brancas com contorno azul e alvos de toque de 44 px.
A barra passa a orientar o arrasto dos pontos e oferece `Mover` para retornar. As alças respeitam
as restrições de cada componente; rotação não integra essa ação. Ao mudar a seleção, volta a mover.
Na seleção múltipla, um eixo bloqueado em qualquer membro fica bloqueado para o conjunto.
Esse estado é transitório e não altera as flags salvas no desenho. Casas construídas não mostram
as ações de modificação. Os editores automáticos permanecem bloqueados no mobile horizontal.

A ferramenta Seleção conserva toque e seleção por área. Panning conserva a seleção por toque
prolongado; arrastar uma alça em Escalar transforma o item sem deslocar a viewport.

### Edição de pilotis da planta no mobile horizontal

O acesso explícito `Editar` abre o painel lateral de pilotis. Ele reaproveita a estética da Análise
de Campo: planta com pilotis maiores, destaque azul da seleção, mestre em tom de madeira, níveis
nos cantos, porta e contraventamentos. A planta permanece acima das abas `Nível`, `Tamanho` e
`Contraventar`; planta, abas e controles rolam juntos quando o conteúdo excede a altura do painel.
O espaço externo da planta acrescenta 8 px acima e abaixo, sem reduzir seu desenho ou os alvos de toque.
O painel dispensa título e X. Sua largura de 288 px acomoda quatro botões por linha e mantém espaço
para os alvos de toque da planta, sem reservar metade da viewport. Tem altura de 425 px, centralizada
verticalmente e encostada à lateral direita, sem margem ou borda nesse lado. Apenas os dois cantos
da esquerda têm raio de 12 px. Em telas menores, limita a altura à viewport dinâmica menos 16 px,
preservando recuos verticais de pelo menos 8 px. A rolagem pertence ao painel inteiro, sem seção rolável separada.
Tocar fora ou pressionar Escape fecha a edição; durante a escolha de destino, Escape primeiro cancela essa escolha.
As três abas têm larguras iguais e altura de 36 px. A aba ativa combina texto azul, fundo azul-claro e linha inferior
azul; as inativas mantêm texto escuro sobre a superfície branca e a mesma linha de base clara.

Selecionar um piloti na planta do painel atualiza seus controles. As regras de mestre, nível,
modo automático, alturas disponíveis e elegibilidade do contraventamento continuam sendo as do
editor existente. Ao escolher um lado de contraventamento, os destinos válidos são selecionados
diretamente nessa planta, sem transformar o gesto em panning do Canvas.
A orientação para escolher o destino e a ação Cancelar seleção ficam abaixo dos botões de
contraventamento, somente na aba Contraventar e durante a escolha de destino. Cancelar seleção tem
alvo de toque de 40 px. Trocar de aba oculta essa orientação sem cancelar a escolha em andamento.
No painel mobile, o nível usa valor de 30 px e círculos −/+ de 32 px, com área de toque ampliada
para 44 px e espaçamento vertical compacto. As demais apresentações mantêm a escala anterior.

Os botões de tamanho e contraventamento deste painel são quadrados e ocupam quatro colunas iguais
por toda a largura disponível, com recuos laterais de 12 px e espaçamento de 8 px entre botões.
Conservam os ícones próprios do produto. O editor inline da Análise de Campo mantém seus 60 × 60 px.
As edições usam os comandos e a persistência existentes; não introduzem uma cópia independente
das regras ou um novo significado de desfazer/cancelar. A seleção múltipla continua sem edição.

### Edição compacta dos demais objetos no mobile horizontal

Os editores genéricos e de terreno usam a mesma superfície lateral dos pilotis: largura de 288 px,
direita colada, cantos esquerdos de 12 px, centro vertical e recuo vertical mínimo de 8 px. Sua altura
acompanha o conteúdo, limitada a 425 px e à viewport visual disponível; a planta/pilotis conserva
altura de 425 px. Todo o painel rola, com ações no rodapé e acesso preservado quando o teclado abre,
conforme a [UI-006](UI-006-editores-flutuantes-e-teclado-mobile.md).

Dispensar cabeçalho, ícone e labels visuais redundantes. Manter nomes acessíveis; centralizar o texto
dos campos e usar recuos de 12 px e espaços de 8 px na paleta e nas ações. A paleta conserva as cores
existentes e destaca a selecionada. Confirmar aplica o rascunho; Cancelar, toque fora e Escape fecham
sem aplicar o rascunho genérico. O terreno conserva a aplicação ao alterar o slider e seus dados
reais de rachão e volumes, sem título nem label/badge superior. Fechar não desfaz valores já aplicados.
As apresentações desktop continuam usando o editor flutuante existente.

Cada tipo editável tem orientação de primeira inserção, com progresso persistido próprio. Cerca,
entrada de terreno, casa desenhada, construção desenhada e as três formas têm dicas independentes.
As orientações da entrada e da construção compartilham o tipo lógico entre suas variantes, evitando
repetição por direção. Os tours existentes de planta, elevação, texto, desenho livre e elementos
lineares descrevem também o acesso explícito Editar no mobile, sem reiniciar progresso já salvo.

### Geometria e movimento

- A área do minimapa deve manter a proporção entre largura e altura da área total do Canvas,
  com 75 px no maior lado. Limitar o retângulo da viewport aos dois eixos dessa área proporcional
  e descontar a borda na projeção do clique ou toque.
- A alça recolhida da barra superior mobile usa indicador cinza de 192 × 12 px dentro de um
  alvo de 256 × 28 px, centralizado no topo. A largura duplicada preserva as alturas anteriores.
- Durante o arraste, atualizar a posição dos itens no minimapa a cada quadro de animação,
  incluindo seleção múltipla e movimento por toque prolongado. Projetar os itens em coordenadas
  do Canvas, considerando o grupo temporário de seleção. Essa prévia não grava histórico;
  a gravação continua no término do movimento. Preservar a preferência de visibilidade do minimapa
  e sua exibição temporária no mobile durante pan ou movimento de objetos.

- Centro de 48 × 48 px e itens de 44 × 44 px; ícones de 16 × 16 px. Afastamento lateral da raiz
  de 12 px. Manter foco visível e alvos de toque de pelo menos 44 px.
- Grupos de uma, duas ou três opções conservam a distribuição compacta aprovada. Duas e três
  opções usam arco de 120 graus; o raio acompanha a quantidade e a altura disponível.
- A partir de quatro opções, distribuir em ângulos iguais por um semicírculo, com os extremos
  alinhados. Reduzir o alcance horizontal dos intermediários e espelhar a geometria no lado direito.
- Preservar pelo menos 50 px entre centros vizinhos: 44 px do botão e 6 px de folga. Os botões
  não podem encostar. O raio mínimo de separação tem precedência sobre a compactação por altura.
- Ajustar verticalmente os nomes das pontas para que não cubram os círculos vizinhos. Os nomes
  têm largura máxima de 13 rem; conferir também o espaço ocupado pelo texto em alturas compactas.
- A entrada dos itens e o deslocamento do ícone ao centro usam animação de 220 ms. Com
  `prefers-reduced-motion: reduce`, suprimir o deslocamento e usar apenas transição de opacidade
  de 100 ms na entrada das opções. A cópia animada do ícone não recebe foco nem eventos.

### Particularidades do menu direito

A raiz oferece `Tipo de solo` e `Obstáculos`. Ao entrar em qualquer grupo, seu ícone ocupa o centro.
O indicador de dificuldade fica oculto no radial e permanece na apresentação não radial.

Solo usa seleção única entre cinco opções; `Não informado` limpa o perfil. Obstáculos mantém quatro
alternâncias independentes. Cada opção selecionada mostra seu estado; o centro do submenu
Obstáculos e a raiz direita refletem a existência de qualquer obstáculo ativo, inclusive recolhidos.
Desligar o último obstáculo remove essa marcação. Seleções não fecham esses submenus.

## Responsabilidades e extensão

| Ponto de manutenção | Responsabilidade |
|---------------------|------------------|
| `CanvasToolsMenu` | Compor comandos esquerdos e adaptar sua apresentação, preservando callbacks e bloqueios. |
| `ElementsSubmenu` e `ElementsRadialItems` | Manter a mesma taxonomia e variantes nas apresentações desktop e radial. |
| `RailButton` | Uniformizar ícones, rótulos, tooltip, foco e estados dos itens desktop. |
| `MobileRadialMenu` | Escolher a apresentação esquerda e encaminhar a árvore para o radial compartilhado. |
| `HouseDifficultyControls` | Compor solo, obstáculos, marcação agregada e indicador; adaptar a apresentação direita. |
| `RadialTreeMenu` | Controlar abertura, caminho por IDs, retorno, seleção, foco e animações dos dois radiais. |
| `radial-menu-layout` e `RadialItemLabel` | Compartilhar geometria espelhada, separação e nomes dos arcos. |
| `useCanvasMobileViewport` | Centralizar a condição composta de mobile e orientação usada pelos menus. |

Uma nova opção mantém ID estável, nome acessível, estado e comando existentes. Opções com filhos
entram na árvore; `keepOpenOnSelect` é usado nos seletores que precisam continuar abertos. Não criar
uma segunda geometria ou navegação para um grupo específico. Alterar dimensões ou responsividade
exige conferir os dois lados, as duas preferências desktop e os grupos compactos.

## Critérios de validação

1. Desktop com e sem rótulos: mesmas ações e estados, preferência aplicada apenas por Confirmar,
   Cancelar descartando mudanças e escolha salva respeitada ao reabrir.
2. Elementos: categorias inicialmente fechadas, submenus ancorados ao pai, variantes equivalentes
   nos dois layouts e nenhum submenu desktop sobre o radial.
3. Radiais: início fechado, avanço pelo centro, retorno, Escape, fechamento externo, nomes
   acionáveis e comandos bloqueados sem efeito.
4. Menu direito: solo exclusivo, obstáculos independentes, marcação agregada correta, ícone fixo
   no desktop, listas de mesma largura e indicador oculto somente no radial.
5. Geometria: grupos de duas/três opções preservados e grupos maiores com folga; conferir os dois
   lados em 740 × 420 e 480 × 320, incluindo nomes, foco e limites da viewport.
6. Responsividade: desktop em 768 px e mobile em 767 px no cenário sem toque/altura reduzida;
   condição adicional de toque em telas baixas; retrato pedindo rotação; movimento reduzido.
7. Entrada inicial: em 360 × 844, abrir a lista de construções antes do Canvas; após acesso explícito
   à casa, respeitar a rotação e iniciar os menus recolhidos. Não preparar esse cenário em desktop.

Os critérios são contratos para futuras mudanças; não significam execução de testes nesta alteração
documental. A cobertura existente distribui-se entre testes de componentes, geometria e E2E.

## Fontes e cobertura existentes

- [Composição das ferramentas esquerdas](../../client/src/components/rac-editor/@menus/ui/CanvasToolsMenu.tsx),
  [submenus de Elementos](../../client/src/components/rac-editor/@menus/ui/ElementsSubmenu.tsx),
  [variantes no radial](../../client/src/components/rac-editor/@menus/ui/ElementsRadialItems.tsx) e
  [botão desktop compartilhado](../../client/src/components/rac-editor/@menus/ui/RailButton.tsx).
- [Controles direitos](../../client/src/components/rac-editor/ui/HouseDifficultyControls.tsx) e
  [árvore radial compartilhada](../../client/src/components/rac-editor/ui/RadialTreeMenu.tsx).
- [Adaptador esquerdo](../../client/src/components/rac-editor/ui/MobileRadialMenu.tsx),
  [geometria](../../client/src/components/rac-editor/ui/radial-menu-layout.ts),
  [nomes laterais](../../client/src/components/rac-editor/ui/RadialItemLabel.tsx) e
  [condição de viewport](../../client/src/components/rac-editor/lib/use-canvas-mobile-viewport.ts).
- [Configuração global](../../client/src/components/rac-editor/@modals/ui/SettingsModal.tsx) e
  [valores padrão](../../client/src/shared/config.ts).
- [Testes da geometria](../../client/src/components/rac-editor/ui/radial-menu-layout.smoke.test.ts) e
  [controles direitos](../../client/src/components/rac-editor/ui/HouseDifficultyControls.smoke.test.tsx).
- [E2E de elementos e menus](../../e2e/site-elements-menus.spec.ts),
  [barras responsivas](../../e2e/toolbar-responsive.spec.ts) e
  [primeira abertura mobile](../../e2e/construction-management-mobile.spec.ts).
