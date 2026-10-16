---
title: Regras da Toolbar
id: BUS-002
doc_type: business-rule
doc_role: business-rule
doc_set: business-rules
order: 2
status: active
lang: pt-BR
---

# Regras da Toolbar

## Objetivo

Definir como os menus e comandos do editor devem funcionar de forma simples e previsível.

## Papel da toolbar

1. Ser o ponto principal de ações do usuário no editor.
2. Organizar comandos por contexto (casa, elementos, linhas, ações gerais).
3. Mostrar claramente estado ativo e opções disponíveis.

## Estrutura de menus

1. Menu principal
    - Acesso aos comandos de casa, elementos, linhas e mais opções.
    - A janela existente de Configurações globais oferece `Mostrar rótulos nos menus (desktop)`,
      marcado por padrão, inclusive ao carregar preferências salvas antes desta opção existir.
      Uma escolha explícita já salva, inclusive desligada, é preservada.
      A alteração só é aplicada e persistida por `Confirmar`; `Cancelar` descarta o rascunho.
    - Com a opção desligada, preservar o visual atual dos menus de ferramentas, com cápsulas,
      botões circulares e nomes por tooltip. Ligada no desktop, mostrar nomes curtos abaixo
      dos ícones na barra esquerda, nos seus submenus e nos controles de solo/obstáculos,
      usando contêineres e itens retangulares com cantos arredondados. Preservar nomes acessíveis,
      ícones, ações, estados e listas internas dos seletores de solo/obstáculos.
    - A preferência de rótulos desktop não altera os menus mobile, inclusive o radial e seus
      nomes laterais persistentes. Os rótulos dos pilotis permanecem uma configuração independente.
    - Menus laterais devem usar um único tooltip visível por item, sem tooltip nativo duplicado do navegador.
    - Hovers do menu principal e dos submenus devem ser compactos e proporcionais ao formato de cápsula dos menus.
    - Em telas móveis, quando o menu lateral está aberto, a barra de recolhimento fica à direita do menu.
    - Em telas móveis, quando o menu lateral está recolhido, a barra de abertura fica no limite esquerdo da tela.
    - As barras laterais esquerda e direita oferecem esse controle abaixo de 767 px. Abaixo de 640 px, ambas iniciam
      recolhidas; de 640 a 766 px, iniciam abertas e podem ser recolhidas. A partir de 767 px, o controle não aparece.

2. Submenus
    - Devem abrir/fechar de forma clara, sem conflito entre si.
    - Em telas móveis, os submenus laterais devem manter proporção visual com a largura do menu principal.
    - No menu radial de ferramentas do mobile horizontal, tocar em item com submenu leva seu
      ícone ao centro, no lugar do ícone principal, e distribui somente seus filhos no arco.
      Isso também se aplica às categorias e variantes de Elementos.
    - Tocar no centro retorna um nível; na raiz, recolhe o menu. Escape retorna um nível ou
      recolhe a raiz; tocar fora fecha. A ação final mantém o comportamento do comando escolhido.
    - A transição comunica o deslocamento do item ao centro e a abertura das opções ao redor,
      com duração curta. Reduzir movimento quando essa preferência estiver ativa no dispositivo.
      Preservar nomes acessíveis e alvos de toque de pelo menos 44 px.
    - Os itens dos arcos mostram nomes persistentes: à direita no menu esquerdo e à esquerda
      no menu direito, voltados para dentro da tela. Tocar no nome também aciona o item.
      O botão central conserva somente o ícone, inclusive ao navegar por submenus.
      Evitar nomes sobrepostos ou cruzando outros botões em alturas compactas; não duplicar
      rótulos com tooltips. O nome visível da Casa TETO pode omitir o complemento "(Opções)".
    - No menu da direita, agrupar os controles hidráulicos, subterrâneos, elevados e de servidões
      vizinhas no submenu `Obstáculos`, fechado inicialmente. Seu ícone fica marcado quando
      qualquer um dos quatro controles estiver ativo e desmarca ao desligar o último.
    - No radial mobile da direita, a raiz mostra apenas o seletor de solo e `Obstáculos`.
      `Tipo de solo` abre suas cinco opções no arco, levando o ícone ao centro com a mesma
      animação e navegação de `Obstáculos`. Selecionar um perfil mantém o submenu aberto,
      destaca somente o perfil atual e permite limpar o valor escolhendo `Não informado`.
      Abrir o grupo leva seu ícone ao centro e distribui os quatro controles no arco. Alternar
      um controle mantém o submenu aberto. O centro e o ícone principal direito também refletem
      a existência de obstáculos ativos, inclusive com o menu recolhido.
      O indicador de dificuldade fica oculto nesse modo e permanece nos demais layouts.
    - Nos demais layouts, `Obstáculos` abre uma lista vertical no padrão do seletor de solo:
      ícone à esquerda, nome e marca de seleção à direita. O botão principal mantém o cone
      como ícone fixo. As seleções são independentes e não fecham o submenu.
      As listas de solo e obstáculos têm a mesma largura e altura de linha; a altura total
      acompanha a quantidade de opções de cada lista.
    - Os botões principais dos radiais usam ícones de ferramentas de desenho à esquerda e de
      ajustes à direita, ambos de 16x16. Ao entrar em um submenu, seu ícone ocupa o respectivo centro.
    - Grupos com poucas opções usam um arco menor, aproximando os itens do centro e entre si.
      Adaptar o raio à quantidade de opções e à altura disponível, mantendo alvos de pelo menos
      44 px e espaço para os nomes. Compartilhar essa regra nos dois menus radiais.
    - Nos grupos de quatro ou mais itens, reduzir o alcance horizontal do arco, trazendo os
      intermediários para a esquerda no menu esquerdo e espelhando no direito. Distribuir por
      ângulos iguais no semicírculo, mantendo os extremos alinhados e folga visível entre os
      círculos, sem permitir que encostem; adaptar o raio em telas baixas.
      Os grupos de duas ou três opções conservam a distribuição já aprovada.

3. Overflow (mais opções)
    - No Canvas, o FAB hamburger exibe "Construções TETO" como primeira opção e, depois de um separador, lista
      Construções TETO não arquivadas agrupadas por código da construção.
    - O FAB hamburger não exibe `Monitores` como subopção de `Construções TETO`; monitores pertencem a uma construção
      específica e são acessados pela listagem de Construções TETO.
    - Cada construção não arquivada exibe suas casas como submenu, usando como rótulo o nome da família associada à
      casa.
    - O seletor de construções e casas conserva sua largura integral de 14,5 rem e o alinhamento com o botão de abertura,
      mesmo quando a viewport é menor que a superfície mínima de 360 px do editor.
    - Selecionar uma casa no FAB torna essa casa ativa e restaura seu último documento de desenho salvo.
    - Exportação em PDF pertence ao botão "Exportar" e ao menu do usuário no mobile.
    - A ação "Construções TETO" não fica no menu do usuário/avatar.
    - A ação "Construções TETO" abre uma área CRUD dedicada. Nessa área, canvas, toolbar, submenus e opções de desenho
      ficam temporariamente ocultos.
    - Na área CRUD, a navegação volta pelo cabeçalho; o retorno ao Canvas só fica disponível quando houver Construção
      TETO em andamento com pelo menos uma casa não arquivada.
    - A área central separa a gestão de Construções TETO da listagem de casas, da listagem de monitores e dos detalhes.
    - Construção TETO possui Código da CC, Data da Construção, Comunidade única e foto opcional, com ações de criar,
      arquivar, desarquivar, listar e trocar construção.
    - Cada item da listagem de Construções TETO expõe ações por ícone para gerenciar monitores, gerenciar casas e
      exportar RACs em ZIP daquela construção, posicionadas antes das ações de concluir e arquivar ou desarquivar.
    - Monitores pertencem somente à Construção TETO em foco, são listados como ativos por padrão e usam inativação
      lógica para preservação histórica.
    - Cada casa é identificada pela família associada; não há nome próprio de casa.

4. Menu do usuário no mobile
    - Em telas móveis, ações de visualização 3D e exportação de RAC em PDF ficam no menu aberto pelo avatar do usuário.
    - No desktop, essas ações permanecem como botões diretos na barra superior.

## Regras por grupo de comando

1. Casa
    - Inserção de vistas respeita tipo de casa e limites permitidos.
    - Se necessário, pede escolha de lado/instância antes de inserir.

2. Elementos
    - Inserção cria objeto no canvas com comportamento padrão esperado.
    - O botão Elementos permanece na barra lateral existente. Seus submenus em cápsula agrupam
      Edificações (Casa, Construção), Limites e acessos (Muro, Cerca, Entrada no Terreno, Portão),
      Vias (Rua Reta, Estrada de Chão) e Terreno e entorno (Árvore, Água / Rio, Fossa).
    - Nas cápsulas, itens usam apenas ícones de 16x16, em botões de 40x40 como a barra atual. Nomes aparecem
      em tooltips de hover/foco e permanecem acessíveis por aria-label, sem rótulos visíveis.
    - Abrir Elementos mostra apenas as categorias, sem seleção inicial. Cada submenu ou conjunto
      de variantes abre somente ao clicar no item correspondente; novo clique o recolhe.
    - Cada nível começa com o primeiro ícone alinhado ao botão que o abriu. Quando faltar espaço
      à direita, deslocar apenas o necessário para manter a cápsula dentro da tela.
    - Terreno e entorno usa ícone de paisagem (montanha e sol), distinto do elemento Árvore.
    - Limites e acessos usa ícone de contorno de terreno, mantendo o tamanho dos demais ícones.
    - Casa representa uma edificação do entorno com telhado visto de cima; não cria uma vista da
      Casa TETO. O nome inicial é Casa, editável e posicionado na metade inferior do telhado.
    - Construção oferece miniaturas com porta em cima, embaixo, à esquerda ou à direita.
      O nome inicial é Banheiro, editável e horizontal independentemente do lado escolhido.
    - Textos de Casa e Construção acompanham a escala do objeto. Nomes longos se ajustam ao corpo.
    - O contorno e as diagonais do telhado da Casa mantêm traços finos ao ampliar o objeto.
      As quinas da Casa e das quatro variantes de Construção devem se encontrar sem lacunas.
    - Entrada no Terreno oferece quatro direções de seta, com texto inicial Entrada no Terreno,
      editável e removível. O texto acompanha a escala do elemento.
      Nas verticais, a fonte inicial é um pouco maior. Na seta para baixo, o nome fica acima;
      nas demais, abaixo, com o mesmo intervalo entre texto e desenho em todas as direções.
    - Casa do entorno, Construção, Entrada no Terreno, Árvore, Água e Fossa oferecem somente
      controles nos cantos para redimensionar, preservando a rotação, inclusive após reabrir.
      Os controles laterais dos demais elementos permanecem disponíveis.
    - Na Estrada de Chão, os detalhes crescem menos que o corpo e mantêm traços finos ao ampliar.
    - Cerca usa postes e fios em planta, pode ser redimensionada e girada, e começa sem texto.
      Seu texto é opcional, editável pelo mesmo fluxo de Muro.
    - Portão insere diretamente um portão de abrir, sempre aberto e sem texto no desenho.
      Não há variante de correr nem opção de inverter sentido. A rotação do Canvas ajusta
      sua orientação. Objetos salvos anteriormente conservam o desenho e as transformações.
    - Na orientação móvel horizontal, navegar por categorias e variantes no próprio arco,
      com o item pai no centro, sem abrir cápsulas sobre os outros botões.
    - Variantes, textos, escalas e transformações devem persistir ao salvar e reabrir o documento.
    - Upload de imagem é uma ação direta do menu lateral e abre seleção/drag-and-drop antes de inserir a imagem no
      canvas.
    - Upload de imagem aceita somente PNG, JPG ou WEBP dentro do limite de tamanho definido pela aplicação.

3. Linhas e medidas
    - Inserção de linha, seta e distância deve manter consistência de edição posterior.

4. Ações gerais
    - PDF, abrir 3D, configurações, reinício e dicas permanecem como ações gerais.
    - Exportação em PDF só fica disponível quando existe ao menos uma vista de casa inserida no canvas.
    - Importação e exportação JSON não fazem parte da navegação principal.
    - O documento versionado da casa ativa é usado internamente para persistir o último estado do canvas no banco local.
    - No mobile, PDF e 3D podem ser acionados pelo menu do usuário para reduzir a densidade da barra superior.

5. Zoom
    - No desktop, o botão de zoom pode combinar ícone e percentual.
    - No mobile, o botão de zoom deve exibir o percentual visível no lugar da lupa.
    - O submenu de modos permanece ancorado ao botão de zoom, sem se deslocar para acompanhar viewports abaixo da
      largura mínima do editor.

## Regras de segurança

1. Ações destrutivas com maior impacto contextual, como reiniciar o canvas/tutorial ou desagrupar,
   devem pedir confirmação.

2. Exclusão simples da seleção atua diretamente, mas deve respeitar bloqueios de segurança do
   projeto.

3. Ações bloqueadas por regra devem informar motivo de forma explícita.

4. Arquivamento de Construção TETO ou casa exige confirmação e deve ser lógico, preservando o
   registro como inativo/arquivado.

5. Inativação ou reativação de monitor exige confirmação e não deve remover fisicamente o registro.

6. Exclusão definitiva de Construção TETO arquivada, casa arquivada ou monitor inativo é ação
   destrutiva separada das ações de arquivar/inativar e deve usar confirmação explícita de
   permanência e ausência de desfazer.

## Regras de feedback

1. Botões no limite devem indicar indisponibilidade.
2. Ações importantes devem mostrar confirmação de sucesso/erro.
3. Dicas contextuais devem aparecer sem interromper o fluxo principal.

## Regras de consistência com o editor

1. Toolbar e canvas devem permanecer sincronizados no estado das ferramentas.
2. Mudanças de configuração devem refletir imediatamente na experiência.
3. Fluxos de seleção de tipo/lado devem manter continuidade até completar ou cancelar.
