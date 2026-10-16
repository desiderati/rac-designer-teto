---
title: Deslocamento do desenho ao salvar com seleção múltipla
doc_role: bug-analysis
status: resolved
created: 2026-10-16
updated: 2026-10-16
tags: [bug-analysis, regression, canvas, persistência]
---

# Deslocamento do desenho ao salvar com seleção múltipla

## 1. Identificação

- Origem: relato humano e captura da casa Patrícia com planta e objetos cortados no canto da página.
- Impacto relatado: regressão inviabilizando o uso; o usuário esclareceu que ocorre somente em algumas casas.
- Ambiente executado: local-only, dados sintéticos em 127.0.0.1:5207, navegador Codex iab.
- Estado: causa confirmada e correção validada no fluxo local de salvar/reabrir. Casa publicada não inspecionada ou alterada.

## 2. Contexto e sintoma

Depois de salvar e reabrir, objetos reaparecem parcialmente fora da superfície, concentrados no canto
superior esquerdo. O comportamento é condicional: a mesma cena é preservada quando salva sem seleção
múltipla. Isso é compatível com a ocorrência em apenas algumas casas; não prova que todos os documentos
já afetados tenham uma única origem sem examiná-los.

## 3. Contrato de falha observável

- Reprodução: inserir planta e cerca; selecionar ambas, mover juntas, aguardar o autosave e recarregar.
- Fronteira: Canvas visível após persistência e reabertura, incluindo retorno das configurações da casa.
- Controle: salvar sem seleção, com objeto único e com um objeto fora da seleção deve manter a cena.
- Critério: posições, formas, transformações e vínculos da planta permanecem iguais após ciclos de salvamento.
- A seleção ativa não pode ser desfeita nem ter sua geometria alterada pelo autosave.

## 4. Escopo afetado

O adapter Fabric documental, o contrato serializável de geometria e seus testes. Sem mudança em menus,
zoom, enquadramento, regras de pilotis ou persistência remota. BUS-001 exige consistência visual.

## 5. Mapa de camadas e fronteiras

| Fronteira | Evidência | Estado |
| --- | --- | --- |
| Seleção/movimento | Seleção de planta e cerca pelo ponteiro no iab | Observado |
| Serialização | Exportação própria lê left/top relativos à ActiveSelection | Observado |
| Persistência/reabertura | Recarregar a origem restaura objetos no canto antes da correção | Observado |
| Configuração da casa | Editar notas, salvar e retornar preserva a cena corrigida | Observado |
| Casa Patrícia publicada | Apenas captura fornecida pelo usuário | Não verificado |

## 6. Fluxo esperado e divergência

Fabric mantém objetos de uma ActiveSelection em coordenadas relativas ao centro da seleção.
Seu Canvas nativo realiza a transformação da seleção ao serializar; isso está implementado em
node_modules/fabric/src/canvas/SelectableCanvas.ts, _toObject/_realizeGroupTransformOnObject.
O adapter próprio evita a serialização nativa de grupos/imagens para proteger exportações de imagens
sem CORS, mas não realizava essa transformação. Salvava coordenadas locais como posições do Canvas.
Na reabertura, a seleção temporária já não existe e os objetos são restaurados próximos de (0,0).

## 7. Hipóteses causais

| Hipótese | Evidência e limite | Resultado |
| --- | --- | --- |
| Transformação da seleção ignorada | Teste falha só com seleção; reprodução visual idêntica; implementação diverge do Fabric | Confirmada |
| Zoom/pan move os objetos | Reprodução ocorre também a 100%; teste separa viewport a 50% das matrizes dos objetos | Descartada no caso reproduzido |
| Reidratação de imagens ou grupo incompatível | Planta e cerca sem imagem reproduzem integralmente; objetos não são omitidos | Descartada no caso reproduzido |
| Outros documentos legados corrompidos | Documento real da Patrícia não foi obtido | Não investigada |

## 8. Evidências e pontos envolvidos

- Teste anterior à correção: 1 controle aprovado e 2 cenários reprovados. Centro X da planta esperado
  em 350 foi restaurado em -366,375; uma seleção rotacionada também perdeu a transformação.
- Capturas 01/02 documentam a reprodução real antes do ajuste; 03/04 mostram salvamento e reabertura
  depois do ajuste; 05 mostra retorno após Salvar Configurações.
- Novo canvas-selection-roundtrip.smoke.test.ts usa Canvas/ActiveSelection reais, com planta, estrada,
  entrada, cerca, texto e retângulo não selecionado; três ciclos de reabertura por cenário.
- Análises anteriores de proporções e reenquadramento não cobriam a transformação de uma seleção
  múltipla na exportação documental. Reenquadrar a viewport não recupera uma posição já serializada errada.

## 9. Classe do defeito

Conversão incorreta entre sistemas de coordenadas na fronteira de serialização do Canvas.

## 10. Correção aplicada

Projetar a matriz absoluta de cada objeto selecionado em um FabricObject temporário e exportar essa
transformação. Preservar filhos dos grupos no sistema local e manter a seleção viva intacta.
Aceitar skewX/skewY opcionais na geometria para preservar inclinação e composições de rotação/escala.
Manter a leitura segura de imagens sem chamar toObject/toDataURL de imagens do editor.

## 11. Casos de borda e controles

Cobertos: ausência de seleção, seleção múltipla, rotação com escala desigual, espelhamento, inclinação,
objeto não selecionado, coordenadas internas dos pilotis, exportação repetida sem efeitos no editor,
imagens que não permitem serialização nativa e documentos sem os novos campos opcionais.

## 12. Validação executada

- 137 testes em 15 arquivos aprovados: adapter, round trips, proporções de elementos, sessão,
  histórico, contrato documental e guarda arquitetural.
- TypeScript global e ESLint dos quatro arquivos de código/teste alterados aprovados.
- Build completo de frontend/backend aprovado; permanece o aviso de chunks grandes.
- iab 1280×720: reprodução anterior a 100%; cenário corrigido a 53%, após movimentação em seleção
  múltipla, autosave, recarga e edição/salvamento de notas pelo formulário da casa.
- A suíte E2E geral e seus ajustes paralelos não foram executados ou alterados por esta frente.

## 13. Status de evidência

validated-at-original-boundary para a reprodução local de seleção → salvar → reabrir.
Publicação, dados reais da Patrícia e aceite humano permanecem não verificados. Sem push,
deploy ou mutação remota. A correção evita novos deslocamentos; não inventa as posições antigas de
documentos já gravados incorretamente, pois a transformação perdida não está presente no documento.

## 14. Dúvidas residuais

Sem dúvida funcional no cenário reproduzido. A recuperação e validação de documentos reais já
afetados dependem de obter o documento e, quando necessário, uma versão anterior confiável.

## 15. Artefatos relacionados

- Sidecar local: ../../work-items/2026-10/20261016-canvas-save-selection.work-item.assets/RESULTADO.md.
- Teste permanente: client/src/components/rac-editor/@canvas/ui/adapters/canvas-selection-roundtrip.smoke.test.ts.
- Registro factual: changelog de 2026-10-16.
