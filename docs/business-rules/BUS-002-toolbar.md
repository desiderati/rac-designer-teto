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
    - Menus laterais devem usar um único tooltip visível por item, sem tooltip nativo duplicado do navegador.
    - Hovers do menu principal e dos submenus devem ser compactos e proporcionais ao formato de cápsula dos menus.
    - Em telas móveis, quando o menu lateral está aberto, a barra de recolhimento fica à direita do menu.
    - Em telas móveis, quando o menu lateral está recolhido, a barra de abertura fica no limite esquerdo da tela.

2. Submenus
    - Devem abrir/fechar de forma clara, sem conflito entre si.
    - Em telas móveis, os submenus laterais devem manter proporção visual com a largura do menu principal.

3. Overflow (mais opções)
    - No Canvas, o FAB hamburger exibe "Construções TETO" como primeira opção e, depois de um separador, lista
      Construções TETO não arquivadas agrupadas por código da construção.
    - O FAB hamburger não exibe `Monitores` como subopção de `Construções TETO`; monitores pertencem a uma construção
      específica e são acessados pela listagem de Construções TETO.
    - Cada construção não arquivada exibe suas casas como submenu, usando como rótulo o nome da família associada à
      casa.
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
