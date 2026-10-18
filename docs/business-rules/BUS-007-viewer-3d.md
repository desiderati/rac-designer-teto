---
title: Regras do Viewer 3D
id: BUS-007
doc_type: business-rule
doc_role: business-rule
doc_set: business-rules
order: 7
status: active
lang: pt-BR
---

# Regras do Viewer 3D

## Objetivo

Garantir que a visualização 3D represente corretamente o projeto 2D e permita uso prático em revisão
e apresentação.

## Papel do Viewer 3D

1. Mostrar a casa em 3D com base no estado atual do projeto.
2. Permitir navegação de câmera (girar, aproximar, afastar).
3. Permitir inserir uma imagem do 3D no canvas 2D.

## Regras de sincronização

1. O 3D deve refletir mudanças atuais do projeto.
2. Tipo de casa e orientação de lados devem ser interpretados corretamente.
3. Contraventamentos e escadas devem acompanhar dados reais das vistas do projeto.

## Orientação durante o ciclo do desenho

1. Nos tipos 3 e 6, a orientação das faces no 3D deve respeitar os lados definidos na configuração
   da casa, inclusive quando somente a planta estiver no canvas.

2. Inserir, remover ou reinserir elevações não pode inverter as faces da porta e das janelas.
   Remover a elevação que contém a porta mantém a orientação definida para a casa e a escada na face
   da porta.

3. Salvar e reabrir deve preservar essa orientação e os dados dos pilotis. A posição ou
   transformação de uma vista no canvas não redefine o lado semântico da casa no 3D.

4. A verificação deve conferir porta, janelas e escada em relação à planta e aos pilotis, além da
   câmera. Um enquadramento plausível, sozinho, não comprova que as faces estão corretas.

A estabilidade da porta e dos marcadores na planta segue [BUS-003 — Vistas por tipo de
casa](BUS-003-vistas-por-tipo.md).

## Regras de renderização

1. Sem tipo de casa definido
    - Viewer mostra estado vazio e orienta criação inicial.

2. Sem vista de casa inserida
    - Viewer mostra estado vazio mesmo quando o tipo de casa já foi escolhido, pois ainda não existe casa representada
      no canvas.

3. Ordem visual
    - Terreno, estrutura da casa, pilotis, contraventamentos, escadas e aberturas.

4. Terreno
    - Deve respeitar níveis da casa.
    - Possui volume com espessura fixa.

5. Pilotis
    - Devem respeitar altura e diferenciação visual de mestre.
    - No modo de ocultar abaixo do terreno, recorte deve preservar leitura visual.

6. Escadas 3D
    - Devem seguir métricas derivadas do projeto.
    - Quantidade e posicionamento de degraus devem ser coerentes com dados recebidos.
    - Devem aparecer mesmo quando apenas a planta foi inserida. Sem escada projetada por uma elevação,
      derivar posição da porta, altura e degraus dos dados da casa e dos níveis dos pilotis.
    - A configuração de exibição da escada na planta 2D não oculta a escada da cena 3D.

7. Contraventamentos 3D
    - Devem respeitar orientação vertical ou horizontal.
    - Devem respeitar o lado escolhido na planta: esquerdo, direito, superior ou inferior.
    - Devem usar os níveis dos pilotis de origem e destino para definir altura inicial e final.

## Regras de interação no modal

1. Primeira abertura da casa no viewer deve iniciar com a câmera voltada para a face onde está a
   porta.

2. A iluminação principal do viewer deve ser orientada para a face onde está a porta.

3. Ao fechar e reabrir o viewer da mesma casa, a última pose da câmera deve ser restaurada,
   incluindo rotação, pan e zoom.

4. Reset de câmera deve retornar para o enquadramento padrão voltado para a porta e descartar a pose
   salva da casa.

5. Tela cheia deve funcionar sem perder controles principais.

6. Troca de cor de parede deve ser imediata.

7. Opção de ocultar elementos abaixo do terreno deve ser clara e reversível.

8. Ao fechar o viewer, a cor de parede escolhida e a preferência de ocultar elementos abaixo do
   terreno devem ser persistidas por casa.

9. Ao reabrir o viewer da mesma casa, a cor e a preferência de ocultação devem ser restauradas.

10. Cor e pose de câmera (posição, alvo, campo de visão e zoom) são persistidas no documento da própria casa,
    incluindo exportação/importação e sincronização. Preferências locais legadas são somente fallback por casa.

## Regras de snapshot para 2D

1. Captura do 3D deve gerar imagem válida.

2. Inserção no canvas 2D deve ocorrer sem quebrar o estado do projeto.

   A imagem inserida deve preservar a cor de parede escolhida no viewer, usando a captura local da cena.

3. O PDF deve usar a última pose salva do viewer 3D da casa ativa para capturar a imagem 3D.

4. Se não houver pose salva, o PDF deve usar o enquadramento inicial voltado para a porta.

5. A iluminação do snapshot do PDF deve seguir a mesma orientação por porta usada no viewer.

6. O snapshot do PDF deve ocultar a parte dos elementos 3D que fica abaixo do terreno.

7. O snapshot do PDF deve usar a última cor de parede persistida pelo viewer da casa ativa.

8. A preferência visual de mostrar elementos abaixo do terreno não altera a regra normativa do PDF:
   o PDF continua ocultando a área abaixo do terreno.

9. Em falha, usuário deve receber mensagem clara.

## Regras de consistência geral

1. O 3D é visualização do projeto, não uma versão alternativa das regras.
2. Ao reabrir o viewer, o estado deve permanecer coerente com o projeto atual.

## Referências de regressão

- [Matriz do ciclo e
  orientação](../../client/src/components/rac-editor/@canvas/ui/adapters/house-orientation-lifecycle.smoke.test.ts):
  geometria, lados e reabertura do documento para os tipos 3 e 6.

- [E2E do ciclo e viewer 3D](../../e2e/house-lifecycle-3d.spec.ts): inserção, remoção, persistência
  local e conferência do viewer pela interface.

- [PLAY-104 — Estratégia de testes](../engineering-playbook/PLAY-104-frontend-testing.md): divisão
  da cobertura e limites da evidência automatizada.
