---
title: Regras do Canvas 2D
id: BUS-001
doc_type: business-rule
doc_role: business-rule
doc_set: business-rules
order: 1
status: active
lang: pt-BR
---

# Regras do Canvas 2D

## Objetivo

Explicar, de forma simples, como o espaço de desenho funciona no dia a dia para quem cria e edita
projetos.

## O que é o Canvas

O canvas é a área principal onde a casa é montada, editada e revisada.

Nele, a pessoa consegue:

1. Inserir elementos da casa.
2. Selecionar e editar objetos.
3. Navegar com zoom e deslocamento.
4. Usar minimapa para localizar rapidamente a área visível.
5. Executar ações rápidas por teclado.

## Regras de navegação

1. Zoom
    - Pode ser feito por controle de zoom, roda do mouse e gesto de pinça no celular/tablet.
    - Existe limite mínimo e máximo para evitar perda de controle da visualização.
    - No celular/tablet, o menu de zoom exibe as opções por ícones para preservar espaço útil.

2. Deslocamento (pan)
    - Pode ser feito por arraste e também pelo minimapa.
    - O sistema mantém a visualização dentro da área válida do desenho.
    - No desktop, o modo de panning permite deslocar o canvas com o botão principal do mouse.
    - No desktop, o cursor do modo de panning deve usar mão aberta em repouso e mão fechada durante o arraste.

3. Minimap
    - Mostra a posição atual da janela visível no desenho completo.
    - Permite reposicionar a visualização com interação direta.

## Regras de seleção e edição

1. Seleção
    - Ao selecionar um objeto, o editor mostra feedback visual e informações relevantes.
    - Ao limpar seleção, os destaques temporários são removidos.

2. Edição contextual
    - Piloti abre edição de piloti.
    - Parede, linha, seta e distância abrem seus editores correspondentes.
    - Imagens enviadas pelo usuário são inseridas como objetos selecionáveis e redimensionáveis no canvas.
    - Imagens selecionadas podem ser enviadas para o fundo absoluto ou trazidas para a frente absoluta da pilha visual.
    - No desktop, o menu de camada de imagem é aberto por clique direito sobre a imagem.
    - No mobile, o mesmo menu é aberto ao pressionar e manter pressionada a imagem.
    - Quando aplicável, o sistema já abre o editor correto com os dados atuais.

3. Edição de objetos lineares
    - Linha e seta mantêm comportamento de redimensionamento no próprio eixo principal.
    - Ajustes de texto e cor não devem deformar ou “quebrar” o objeto.

## Regras de modos de uso

1. Modo desenho
    - Quando está ativo, prioriza desenhar em vez de selecionar/editar.

2. Modo contraventamento
    - Enquanto ativo, o clique em piloti segue a lógica do contraventamento (origem/destino).

3. Edição aberta
    - Atalhos que podem causar conflito são bloqueados quando há editor aberto.

## Regras de atalhos

1. Copiar e colar
    - Funciona para seleção ativa.

2. Desfazer
    - Reverte a última mudança registrada no histórico.

3. Excluir
    - Remove seleção ativa, respeitando bloqueios de segurança do projeto.

4. Atalhos de ferramenta
    - Ativam modos de trabalho (ex.: desenho, exibição de zoom) sem precisar abrir menus.
    - Os atalhos `S`, `P` e `F` para seleção, panning e enquadramento são exclusivos do desktop.

## Regras de histórico e segurança

1. Histórico
    - Mudanças importantes devem ser registradas para permitir desfazer.
    - Inserção de imagem enviada pelo usuário deve ser registrada no histórico.
    - Alterações de camada de imagem devem preservar seleção, registrar histórico e re-renderizar o canvas.

2. Exclusão da planta
    - A planta só pode ser removida quando não existir nenhuma outra vista da casa.
    - Se houver outras vistas, a ação é bloqueada com aviso.

3. Consistência visual
    - Após operações como importar, desfazer, colar e remover, o canvas deve manter seleção e estado visual coerentes.

## Regras visuais

1. Área de trabalho
    - O fundo externo do canvas usa base cinza bem clara com grade branca para reforçar a leitura espacial sem competir
      com o desenho.
    - A grade da área de trabalho deve encostar nos limites da página, sem margem cinza ao redor.
    - A superfície editável do desenho deve ter quinas arredondadas e recortar seu conteúdo dentro desse limite.

2. Identificação de pilotis na planta
    - A planta deve exibir por padrão o código de todos os 12 pilotis.
    - A exibição desses códigos pode ser ativada ou desativada na modal de configurações do editor.
    - Os pilotis das linhas `A*` e `B*` exibem o código abaixo do círculo.
    - Os pilotis da linha `C*` exibem o código acima do círculo.
    - A identificação não deve ser selecionável nem interferir na edição de altura, nível, mestre ou contraventamento.

## Regras de experiência no mobile

1. Toques
    - Um toque e arraste: deslocamento.
    - Dois toques: zoom por gesto.
    - A barra lateral pode ser recolhida por gesto horizontal para liberar área de desenho.
    - Fora do modo de contraventamento, piloti abre edição por pressionar e manter pressionado; toque simples não deve
      abrir edição de piloti.
    - No modo de contraventamento, a seleção de piloti continua imediata para preservar o fluxo origem/destino.

2. Feedback
    - Durante zoom por gesto, o sistema informa o nível de zoom para facilitar o controle.

## Regras de ajuda ao usuário

1. Dicas contextuais
    - O editor pode mostrar dicas quando certos elementos são usados pela primeira vez.

2. Repetição controlada
    - Dicas não devem aparecer indefinidamente para não atrapalhar o fluxo.
