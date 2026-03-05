# Regras do Viewer 3D

## Objetivo

Garantir que a visualização 3D represente corretamente o projeto 2D e permita uso prático em revisão e apresentação.

## Papel do Viewer 3D

1. Mostrar a casa em 3D com base no estado atual do projeto.
2. Permitir navegação de câmera (girar, aproximar, afastar).
3. Permitir inserir uma imagem do 3D no canvas 2D.

## Regras de sincronização

1. O 3D deve refletir mudanças atuais do projeto.
2. Tipo de casa e orientação de lados devem ser interpretados corretamente.
3. Contraventamentos e escadas devem acompanhar dados reais das vistas do projeto.

## Regras de renderização

1. Sem tipo de casa definido
    - Viewer mostra estado vazio e orienta criação inicial.

2. Ordem visual
    - Terreno, estrutura da casa, pilotis, contraventamentos, escadas e aberturas.

3. Terreno
    - Deve respeitar níveis da casa.
    - Possui volume com espessura fixa.

4. Pilotis
    - Devem respeitar altura e diferenciação visual de mestre.
    - No modo de ocultar abaixo do terreno, recorte deve preservar leitura visual.

5. Escadas 3D
    - Devem seguir métricas derivadas do projeto.
    - Quantidade e posicionamento de degraus devem ser coerentes com dados recebidos.

## Regras de interação no modal

1. Reset de câmera deve retornar para enquadramento padrão.
2. Tela cheia deve funcionar sem perder controles principais.
3. Troca de cor de parede deve ser imediata.
4. Opção de ocultar elementos abaixo do terreno deve ser clara e reversível.

## Regras de snapshot para 2D

1. Captura do 3D deve gerar imagem válida.
2. Inserção no canvas 2D deve ocorrer sem quebrar o estado do projeto.
3. Em falha, usuário deve receber mensagem clara.

## Regras de consistência geral

1. O 3D é visualização do projeto, não uma versão alternativa das regras.
2. Ao reabrir o viewer, o estado deve permanecer coerente com o projeto atual.
