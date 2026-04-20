# Regras do Canvas 2D

## Objetivo

Explicar, de forma simples, como o espaço de desenho funciona no dia a dia para quem cria e edita projetos.

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

2. Deslocamento (pan)
    - Pode ser feito por arraste e também pelo minimapa.
    - O sistema mantém a visualização dentro da área válida do desenho.

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

## Regras de histórico e segurança

1. Histórico
    - Mudanças importantes devem ser registradas para permitir desfazer.

2. Exclusão da planta
    - A planta só pode ser removida quando não existir nenhuma outra vista da casa.
    - Se houver outras vistas, a ação é bloqueada com aviso.

3. Consistência visual
    - Após operações como importar, desfazer, colar e remover, o canvas deve manter seleção e estado visual coerentes.

## Regras de experiência no mobile

1. Toques
    - Um toque e arraste: deslocamento.
    - Dois toques: zoom por gesto.

2. Feedback
    - Durante zoom por gesto, o sistema informa o nível de zoom para facilitar o controle.

## Regras de ajuda ao usuário

1. Dicas contextuais
    - O editor pode mostrar dicas quando certos elementos são usados pela primeira vez.

2. Repetição controlada
    - Dicas não devem aparecer indefinidamente para não atrapalhar o fluxo.
