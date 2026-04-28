---
title: Regras da Toolbar
id: BUS-002
doc_type: business-rule
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
    - Reúne ações de projeto e utilidades gerais.
    - O menu hamburger reúne apenas ações de projeto em JSON; exportação em PDF pertence ao botão "Exportar" e ao menu do usuário no mobile.

4. Menu do usuário no mobile
    - Em telas móveis, ações de visualização 3D e exportação de RAC em PDF ficam no menu aberto pelo avatar do usuário.
    - No desktop, essas ações permanecem como botões diretos na barra superior.

## Regras por grupo de comando

1. Casa
    - Inserção de vistas respeita tipo de casa e limites permitidos.
    - Se necessário, pede escolha de lado/instância antes de inserir.

2. Elementos
    - Inserção cria objeto no canvas com comportamento padrão esperado.

3. Linhas e medidas
    - Inserção de linha, seta e distância deve manter consistência de edição posterior.

4. Ações gerais
    - Importar, exportar, PDF, abrir 3D, configurações, reinício e dicas.
    - No mobile, PDF e 3D podem ser acionados pelo menu do usuário para reduzir a densidade da barra superior.

5. Zoom
    - No desktop, o botão de zoom pode combinar ícone e percentual.
    - No mobile, o botão de zoom deve exibir o percentual visível no lugar da lupa.

## Regras de segurança

1. Ações destrutivas com maior impacto contextual, como reiniciar o canvas/tutorial ou desagrupar, devem pedir confirmação.
2. Exclusão simples da seleção atua diretamente, mas deve respeitar bloqueios de segurança do projeto.
3. Ações bloqueadas por regra devem informar motivo de forma explícita.
4. Importação deve reconstruir estado da casa sem deixar dados inconsistentes.

## Regras de feedback

1. Botões no limite devem indicar indisponibilidade.
2. Ações importantes devem mostrar confirmação de sucesso/erro.
3. Dicas contextuais devem aparecer sem interromper o fluxo principal.

## Regras de consistência com o editor

1. Toolbar e canvas devem permanecer sincronizados no estado das ferramentas.
2. Mudanças de configuração devem refletir imediatamente na experiência.
3. Fluxos de seleção de tipo/lado devem manter continuidade até completar ou cancelar.
