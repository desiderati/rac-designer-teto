---
title: BACK-001 - Refatoração do RAC Editor
doc_type: refactoring-backlog
doc_role: refactoring-backlog
doc_set: refactoring-backlog
status: active
lang: pt-BR
---

# BACK-001 - Refatoração do RAC Editor

## Estado

Ativo.

## Objetivo

Registrar os cortes finais e condicionais de refatoração do RAC Editor sem abrir uma frente
indefinida de reescrita arquitetural.

Este backlog existe para preservar clareza sobre o que ficou conscientemente adiado após a
estabilização da fronteira entre domínio, editor, canvas e runtime visual.

## Critérios de ativação

Um item só deve ser executado quando houver pelo menos um destes sinais:

1. bug ou regressão relacionada;
2. teste difícil ou frágil por acoplamento;
3. feature bloqueada por responsabilidade mal localizada;
4. duplicação semântica com risco real de divergência;
5. violação de fronteira já documentada em ADR, Playbook ou teste de guarda.

## Fora de escopo

1. ProjectDocument e multicasa.
2. Reescrita ampla do editor.
3. Refatoração estética sem ganho verificável.
4. Extração de abstrações sem consumidor real ou critério de parada.

## Critérios gerais de parada

Esta frente deve ser considerada encerrada quando:

1. todos os itens ativos forem implementados, descartados ou promovidos para ADR/Playbook;
2. os testes de guarda arquitetural continuarem protegendo as fronteiras já decididas;
3. não houver acoplamento relevante impedindo teste, manutenção ou evolução imediata do RAC Editor.

## Itens

### 1. Reduzir `CanvasHandle` por consumidor

Status: adiado.

Motivo: `CanvasHandle` ainda concentra várias capacidades do canvas em um contrato amplo. O
acoplamento é visível, mas não bloqueia o estado atual da aplicação.

Ativar quando:

1. um consumidor precisar mockar capacidades que não usa;
2. testes ficarem frágeis por dependerem de um handle amplo;
3. uma nova feature exigir isolar comandos, documento, snapshot ou runtime visual.

Critério de parada:

1. consumidores relevantes dependerem apenas do subconjunto de capacidades que realmente usam;
2. a divisão não introduzir indireção sem ganho prático.

### 2. Revisar seleção dos modais

Status: adiado.

Motivo: modais ainda consomem seleções operacionais do canvas para obter posição de tela, valores
visuais e contexto de edição. Isso é aceitável enquanto permanecer como detalhe de interação, mas
pode virar vazamento se a seleção visual começar a representar regra de editor ou domínio.

Ativar quando:

1. regras de edição começarem a depender de tipos de seleção do canvas;
2. testes de modal exigirem conhecimento excessivo do runtime visual;
3. houver duplicação entre seleção lógica do editor e seleção operacional do canvas.

Critério de parada:

1. modais dependerem de modelos de editor quando a informação for lógica;

2. seleção operacional do canvas permanecer restrita a coordenadas, alvo visual e contexto de
   interação.

### 3. Classificar hotspots internos de `@canvas/lib`

Status: adiado.

Arquivos candidatos:

1. `src/components/rac-editor/@canvas/lib/terrain.ts`;
2. `src/components/rac-editor/@canvas/lib/piloti.ts`;
3. `src/components/rac-editor/@canvas/lib/contraventamento.ts`;
4. `src/components/rac-editor/@canvas/lib/house-auto-stairs.ts`.

Motivo: esses arquivos ainda concentram lógica relevante, mas nem todo cálculo dentro de `@canvas` é
vazamento de domínio. Geometria visual, ordenação de objetos e projeção Fabric pertencem ao canvas.

Ativar quando:

1. uma regra pura de casa, vistas, pilotis, terreno ou limites aparecer misturada com geometria
   visual;

2. a mesma regra existir em dois pontos com contratos equivalentes;

3. uma alteração nesses arquivos exigir testes difíceis demais para uma regra pura.

Critério de parada:

1. regra pura ir para `src/domain/house`;
2. geometria e projeção visual permanecerem em `@canvas`;
3. a extração ser coberta por teste de caracterização quando houver risco de comportamento.

### 4. Reduzir `EditorHouseController` por responsabilidade real

Status: adiado.

Motivo: `editor-house-controller.ts` ainda coordena estado, sessão, persistência, runtime visual,
comandos e efeitos. Ele não deve ser removido por estética; deve ficar menor apenas quando uma
responsabilidade clara puder migrar para um serviço, port ou use case com valor de teste e
manutenção.

Ativar quando:

1. uma feature tocar simultaneamente sessão, estado lógico e runtime visual;
2. testes do controller exigirem muitos mocks sem relação com o comportamento testado;
3. surgir responsabilidade extraível com contrato estável.

Critério de parada:

1. o controller permanecer como orquestrador fino;
2. regras puras não ficarem escondidas no controller;
3. efeitos de runtime visual continuarem atrás dos ports apropriados.

### 5. Reavaliar necessidade de novas guardas arquiteturais

Status: adiado.

Motivo: as guardas atuais já protegem pontos centrais da fronteira entre domínio, editor e canvas.
Novas guardas só devem ser adicionadas quando houver risco concreto de regressão arquitetural.

Ativar quando:

1. um caminho canônico proibido reaparecer, como reconstrução lógica a partir do canvas;
2. Fabric ou tipos visuais voltarem a atravessar uma fronteira lógica;
3. uma regra pura de domínio for adicionada em `@canvas` sem justificativa visual.

Critério de parada:

1. a guarda testar uma regra arquitetural objetiva;
2. o teste não cristalizar detalhe transitório de implementação;
3. a mensagem de falha orientar a correção esperada.
