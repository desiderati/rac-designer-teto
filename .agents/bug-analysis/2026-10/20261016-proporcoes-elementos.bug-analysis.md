---
title: Proporções e controles dos elementos de terreno
doc_role: bug-analysis
status: resolved
created: 2026-10-16
updated: 2026-10-16
tags: [bug-analysis, bug, regression]
---

# Análise das proporções dos elementos

## 1. Identificação

- Origem: relato humano com capturas; ambiente local isolated, Canvas Fabric.
- Análise confirmada; correção aplicada e validada localmente.
- Evidência: validated-at-original-boundary no editor local, sem publicação no Manus.

## 2. Contexto e sintomas

As entradas tinham texto pequeno nas verticais, sempre abaixo e distante nas laterais.
Casa e banheiro exibiam junções imperfeitas; ampliar engrossava o telhado e a textura da estrada.
Seis tipos permitiam resize lateral, inclusive após reabrir. O ícone da categoria também foi revisto.

## 3. Contrato observável

Texto maior nas verticais; acima na seta para baixo, abaixo nas demais, com intervalo comum.
Somente cantos para Casa do entorno, Construção, Entrada, Árvore, Água e Fossa; rotação preservada.
Traços de telhado finos, quinas contínuas e textura de estrada com crescimento mais suave.
Controle: manter resize lateral de Cerca/Estrada, nomes, transformações e documentos existentes.

## 4. Escopo

Fábricas de elementos, restauração do documento e ícone em ElementsSubmenu. Regra BUS-002.
Sem mudança de schema, migração, objetos da Casa TETO ou serviços remotos.

## 5. Fronteiras

| Fronteira | Evidência | Resultado |
|---|---|---|
| Criação e edição de nome | Testes Fabric | Fonte e posicionamento por direção |
| Resize nativo | iab, Casa/Construção/Estrada | Traços e controles conferidos |
| Persistência | Round-trip e recarga do editor | Geometria e controles restaurados |
| Menu | iab e testes do menu | Contorno de terreno em Limites e acessos |

## 6. Divergência

O comportamento dependia da configuração inicial de alguns objetos. A reabertura não restaurava
controles ocultos, e a escala integral do grupo também engrossava os detalhes.

## 7. Causas confirmadas

- Visibilidade dos controles não serializada e sem política comum no carregamento.
- Nome de Entrada sempre em y=70, sem considerar a direção.
- Paredes em dois percursos abertos encontrando-se numa quina.
- Linhas do telhado com origens/espessuras diferentes da borda e sem strokeUniform.
- Textura da estrada acompanhando integralmente a escala do grupo.
- Na validação da correção, confirmar que Line.toObject normaliza endpoints ao centro local:
  reconstruir o telhado desses endpoints deslocava os traços após reabrir.

## 8. Evidências e código

- element-proportions.smoke.test.ts reproduz controles, captions, quinas, traços e round-trip.
- shared.ts centraliza controles; site.strategy.ts normaliza geometria sem recriar IDs.
- street.strategy.ts trata textura; fabric-canvas-document-port.ts restaura regras em documentos.
- ElementsSubmenu.tsx troca somente o ícone da categoria por draw-polygon.

## 9. Classe

Defeitos de geometria, escala e restauração de comportamento; ajustes visuais solicitados.

## 10. Correção

Aplicar política de controles na criação e reabertura. Reposicionar nome pela direção e tamanho,
normalizar paredes em percurso contínuo e reconstruir linhas do telhado de segmentos canônicos.
Preservar o centro mundial do corpo ao recalcular o grupo. Usar traços não escaláveis no telhado;
compensar parcialmente a escala da textura de chão. Não substituir grupos nem nomes personalizados.

## 11. Controles e casos especiais

Cobrir quatro lados da porta, quatro direções, nomes editados, rotação, flip e três reaberturas
seguidas da Casa. Testar reabertura da estrada e novo resize sem acumular compensação.
Não aplicar a restrição de controles aos demais tipos.

## 12. Validação executada

- 122 testes em 22 arquivos: fábricas, documento, editor genérico, menus e fronteira do editor.
- TypeScript sem erros; ESLint dos seis arquivos alterados aprovado; build completo aprovado.
- iab: resize real de Casa, Construção e Estrada, quatro setas e recarga do documento salvo.
- Capturas no sidecar do work-item. Build mantém aviso de chunks grandes.
- Sem suíte E2E completa ou verificação do ambiente publicado.

## 13. Status final

Validado na fronteira original local; testes cobrem também os seis tipos e persistência.

## 14. Dúvidas residuais

Nenhuma pendência funcional identificada no escopo autorizado.

## 15. Artefatos

- Work-item: .agents/work-items/2026-10/20261016-proporcoes-elementos.work-item.md
- Evidências: .agents/work-items/2026-10/20261016-proporcoes-elementos.work-item.assets/
- Regra promovida: docs/business-rules/BUS-002-toolbar.md
- Entrega local sem commit, push ou publicação.
