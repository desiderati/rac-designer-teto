# Regras de Contraventamento

## Objetivo

Definir como criar e remover contraventamentos de forma segura, previsível e fácil de entender.

## Conceitos principais

1. Piloti de origem
    - Primeiro piloti escolhido para iniciar o contraventamento.

2. Piloti de destino
    - Segundo piloti escolhido para concluir o contraventamento.

3. Lado
    - Esquerdo ou direito da coluna de pilotis.

4. Coluna
    - Contraventamento sempre é controlado por coluna.

## Regras de capacidade por coluna

1. Uma coluna pode ter até dois contraventamentos:
    - Um no lado esquerdo.
    - Um no lado direito.

2. Não pode repetir o mesmo lado na mesma coluna.

3. Se os dois lados já estiverem ocupados, não é possível criar novo contraventamento nessa coluna.

## Onde o fluxo começa

1. Pelo editor de piloti, na seção de contraventamento.
2. A pessoa escolhe lado esquerdo ou direito.

## Regras de habilitação dos botões

1. Se o lado já estiver ocupado
    - Botão permanece habilitado para permitir remoção.

2. Se o lado estiver livre
    - Só habilita quando as regras de elegibilidade da coluna forem atendidas.

3. Se a coluna estiver inelegível para novo contraventamento
    - Inserção é bloqueada.
    - Remoção de lado já existente continua permitida.

## Fluxo de criação

1. Selecionar lado no piloti de origem.
2. Entrar no modo de seleção do segundo piloti.
3. Escolher destino válido na mesma coluna.
4. Sistema cria o contraventamento e sai do modo.
5. Visualizações relacionadas são sincronizadas.
6. Mudança é salva no histórico.

## Regras de seleção do destino

1. Deve estar na mesma coluna do piloti de origem.
2. Deve ser diferente da linha de origem.
3. Deve respeitar elegibilidade da coluna no momento da criação.

## Regras de remoção

1. Clicar no lado já ativo remove o contraventamento desse lado.
2. Após remoção:
    - O estado visual é atualizado.
    - As vistas são sincronizadas.
    - O histórico é atualizado.

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

## Regras de consistência com 3D

1. Contraventamento criado/removido na planta deve refletir no 3D.
2. Em importação, desfazer e reconstrução, as regras devem permanecer consistentes.
