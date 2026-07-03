---
title: Regras de Contraventamento
id: BUS-006
doc_type: business-rule
doc_role: business-rule
doc_set: business-rules
order: 6
status: active
lang: pt-BR
---

# Regras de Contraventamento

## Objetivo

Definir como criar e remover contraventamentos de forma segura, previsível e fácil de entender.

## Conceitos principais

1. Orientação
    - O contraventamento pode ser vertical ou horizontal.
    - Vertical é a orientação existente por coluna e lado.
    - Horizontal é uma orientação manual por linha/faixa da planta.

2. Piloti de origem
    - Primeiro piloti escolhido para iniciar o contraventamento.

3. Piloti de destino
    - Segundo piloti escolhido para concluir o contraventamento.

4. Lado vertical
    - Esquerdo ou direito da coluna de pilotis.

5. Lado horizontal
    - Superior ou inferior da linha de pilotis.

6. Coluna
    - Contraventamento vertical é controlado por coluna.

7. Linha/faixa
    - Contraventamento horizontal é controlado por linha/faixa e pode ligar dois pilotis dessa linha.

## Regras de capacidade por coluna

1. Uma coluna pode ter até dois contraventamentos verticais:
    - Um no lado esquerdo.
    - Um no lado direito.

2. Não pode repetir o mesmo lado vertical na mesma coluna.

3. Se os dois lados verticais já estiverem ocupados, não é possível criar novo contraventamento
   vertical nessa coluna.

## Regras de capacidade horizontal por linha

1. Cada piloti de uma linha/faixa pode receber até dois contraventamentos horizontais:
    - Um no lado superior.
    - Um no lado inferior.

2. Um contraventamento horizontal ocupa o lado escolhido nos pilotis tocados pelo trecho entre origem e destino:
    - piloti de origem;
    - piloti de destino;
    - pilotis intermediários quando o trecho passar por eles.

3. Não pode criar contraventamento horizontal se o mesmo lado já estiver ocupado em qualquer piloti
   tocado pelo trecho.

4. Pode existir mais de um contraventamento horizontal no mesmo lado da mesma linha, desde que os
   trechos não toquem os mesmos pilotis.

5. A linha A (`A1` a `A4`) permite apenas contraventamento inferior, quando elegível.

6. A linha B (`B1` a `B4`) permite contraventamento superior e inferior, quando elegível.

7. A linha C (`C1` a `C4`) permite apenas contraventamento superior, quando elegível.

8. Contraventamentos horizontais não consomem capacidade de lado vertical da coluna.

## Onde o fluxo começa

1. Pelo editor de piloti, na seção de contraventamento.
2. Para contraventamento vertical, a pessoa escolhe lado esquerdo ou direito.
3. Para contraventamento horizontal, a pessoa escolhe lado superior ou inferior.

## Regras de habilitação dos botões

1. Se o lado vertical já estiver ocupado
    - Botão permanece habilitado para permitir remoção.

2. Se o lado vertical estiver livre
    - Só habilita quando as regras de elegibilidade da coluna forem atendidas.

3. Se a coluna estiver inelegível para novo contraventamento
    - Inserção é bloqueada.
    - Remoção de lado já existente continua permitida.

4. Se o lado horizontal permitido já estiver ocupado no piloti selecionado
    - O botão desse lado permanece habilitado para permitir remoção do contraventamento que toca esse piloti.

5. Se o lado horizontal permitido estiver livre no piloti selecionado
    - Só habilita quando a linha/faixa atender às mesmas regras de elegibilidade estrutural usadas pelo
      contraventamento vertical.

6. Lados horizontais não permitidos para a linha do piloti aparecem no editor, mas ficam
   desabilitados e não iniciam fluxo de seleção.

## Fluxo de criação vertical

1. Selecionar lado vertical no piloti de origem.
2. Entrar no modo de seleção do segundo piloti.
3. Escolher destino válido na mesma coluna.
4. Sistema cria o contraventamento vertical e sai do modo.
5. Visualizações relacionadas são sincronizadas.
6. Mudança é salva no histórico.

## Fluxo de criação horizontal

1. Selecionar lado superior ou inferior no piloti de origem.
2. Entrar no modo de seleção do segundo piloti.
3. Escolher destino válido na mesma linha.
4. Sistema cria o contraventamento horizontal entre origem e destino e sai do modo.
5. Visualizações relacionadas são sincronizadas.
6. Mudança é salva no histórico.
7. Nenhuma rotina automática pode criar contraventamento horizontal.

## Regras de seleção do destino

1. Para contraventamento vertical:
    - O destino deve estar na mesma coluna do piloti de origem.
    - O destino deve ser diferente da linha de origem.
    - Deve respeitar elegibilidade da coluna no momento da criação.

2. Para contraventamento horizontal:
    - O destino deve estar na mesma linha do piloti de origem.
    - O destino deve ser diferente da coluna de origem.
    - Deve respeitar elegibilidade da linha no momento da criação.
    - Deve respeitar os lados permitidos para a linha A, B ou C.
    - O trecho entre origem e destino não pode tocar, no mesmo lado, um piloti já ocupado por outro contraventamento
      horizontal.

## Regras de remoção

1. Clicar no lado vertical já ativo remove o contraventamento desse lado.

2. Clicar no lado horizontal já ativo remove o contraventamento desse lado que toca o piloti
   selecionado.

3. Após remoção:
    - O estado visual é atualizado.
    - As vistas são sincronizadas.
    - O histórico é atualizado.

## Regras de automação

1. Rotinas automáticas podem propor, criar, remover ou substituir contraventamentos verticais
   conforme a regra de proporção estrutural.

2. Rotinas automáticas nunca criam contraventamento horizontal.

3. Rotinas automáticas de vertical não devem remover nem sobrescrever contraventamentos horizontais
   manuais.

## Regras de cancelamento

O modo de contraventamento pode ser cancelado por:

1. Tecla `Esc`.
2. Clique fora de alvo válido.
3. Seleção inválida durante a etapa de destino.

Ao cancelar:

1. Destaques visuais são limpos.
2. Fluxo volta ao estado inicial.

## Regras de feedback visual

1. Pilotis elegíveis ficam visualmente destacados.

2. Pilotis não elegíveis ficam com aparência neutra.

3. Cursor e destaque devem deixar claro o que é clicável.

4. Nas vistas elevadas, a espessura visual do contraventamento deve permanecer consistente entre
   frontal, posterior e laterais, sem dobrar a espessura nos lados menores.

## Regras de consistência com 3D

1. Contraventamento vertical criado/removido na planta deve refletir nas vistas compatíveis e no 3D.

2. Contraventamento horizontal criado/removido na planta deve refletir nas vistas compatíveis e no
   3D.

3. A posição superior/inferior ou esquerda/direita deve respeitar tangenciamento ao piloti.

4. As alturas inicial e final do contraventamento são derivadas dos níveis dos pilotis de origem e
   destino.

5. Em importação, desfazer e reconstrução, as regras devem permanecer consistentes.
