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

A apresentação dos dois menus laterais, os estados visuais, a adaptação de viewport e os componentes
compartilhados estão definidos em [UI-005 — Menus laterais do
Canvas](../ui-definitions/UI-005-menus-laterais-canvas.md). As regras abaixo determinam os comandos
e seus efeitos, independentemente da apresentação.

1. Menu principal
    - Acesso aos comandos de casa, elementos, objetos geométricos, linhas, lápis, texto, upload e exclusão.
    - A janela existente de Configurações globais oferece `Mostrar rótulos nos menus (desktop)`,
      marcado por padrão, inclusive ao carregar preferências salvas antes desta opção existir.
      Uma escolha explícita já salva, inclusive desligada, é preservada.
      A alteração só é aplicada e persistida por `Confirmar`; `Cancelar` descarta o rascunho.
    - Essa preferência controla a apresentação desktop dos menus de ferramentas e seus submenus,
      incluindo solo/obstáculos. Não altera os menus mobile nem os rótulos dos pilotis.
    - Trocar a apresentação dos menus conserva comandos, seleção, limites de inserção e bloqueios
      existentes, inclusive quando a casa está somente para leitura.

2. Submenus
    - Iniciam fechados e abrem por acionamento do item correspondente, sem abertura automática por hover.
    - No radial, entrar em um item com filhos mostra somente o próximo nível. Acionar o centro
      retorna um nível; na raiz, alterna a abertura do menu. Escape retorna um nível ou recolhe a
      raiz. Acionar fora fecha e reinicia o caminho de navegação.
    - Uma ação final do radial executa o comando e fecha o menu, salvo seletores que precisam
      permanecer abertos, como solo e obstáculos. A navegação não cria comandos ou variantes adicionais.
    - No menu da direita, agrupar os controles hidráulicos, subterrâneos, elevados e de servidões
      vizinhas em `Obstáculos`. As quatro seleções são independentes e não fecham o submenu.
      O grupo fica marcado quando qualquer controle estiver ativo e desmarca ao desligar o último.
    - No radial direito, a raiz contém `Tipo de solo` e `Obstáculos`. O centro do submenu
      Obstáculos e o centro da raiz refletem obstáculos ativos, inclusive com o menu recolhido.
    - `Tipo de solo` oferece cinco perfis, com seleção única. No radial, selecionar mantém o submenu
      aberto e destaca somente o perfil atual; `Não informado` limpa o valor definido.
    - No desktop, o seletor de solo conserva o ícone do perfil atual e `Obstáculos` conserva o cone
      como ícone fixo. A marcação do grupo não troca esse ícone.

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
    - Categorias e variantes mantêm a mesma taxonomia nas apresentações desktop e mobile.
      Rótulos, ícones e ancoragem seguem a UI-005 e a preferência global de rótulos desktop.
    - No desktop, abrir Elementos mostra apenas as categorias, sem seleção inicial. Cada submenu
      ou conjunto de variantes abre ao clicar no item correspondente; novo clique o recolhe.
      No radial, categorias e variantes seguem a navegação por níveis descrita acima.
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
    - No mobile, Panning é o modo inicial. Em paisagem, manter um dedo sobre um item por 500 ms
      seleciona e destaca esse item antes do arraste, sem trocar a ferramenta escolhida. O arraste
      dessa sequência ou de um toque posterior sobre o mesmo item selecionado move somente o item,
      respeitando os bloqueios de casas construídas. Um gesto em outra área volta a navegar em Pan.
    - Mover o dedo antes de completar a espera cancela a seleção e mantém o pan. Acrescentar um
      segundo dedo cancela a espera e dá prioridade à pinça; o dedo restante não inicia outro arraste.
    - Ao escolher Seleção em mobile paisagem, um toque seleciona o item e um arraste na área vazia
      permite seleção múltipla por retângulo. Um dedo não desloca a viewport nesse modo; pinça
      continua disponível. Panning volta a deslocar a viewport quando escolhido explicitamente.

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
