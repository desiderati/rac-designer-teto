---
title: Rodada Pós-Release RAC
id: PRD-005
doc_type: prd
doc_set: product-requirements
status: implemented
version: "1.0.0"
owners: [ ]
lang: pt-BR
---

# Rodada Pós-Release RAC

> Este PRD consolida os 3 bugfixes e as 9 features priorizados após testes com usuários da última
> release. O documento é o contrato humano da rodada e também descreve a ordem de execução por
> ciclos fechados.

## 1. Visão Geral

- problema: A última release expôs inconsistências em atualização de pilotis, marcadores de planta,
  orientação de laterais, exportação de RACs, preferências do 3D, edição de muros, nomenclatura de
  materiais e limites de upload.

- objetivo da iniciativa: Corrigir os comportamentos observados e implementar as melhorias
  priorizadas mantendo a consistência entre Canvas, formulário de Construções TETO, visualização 3D
  e PDF RAC.

- decisão de execução: A rodada será executada em ciclos fechados, com validação e commit local ao
  fim de cada ciclo.

- decisão de escopo: Casas arquivadas não devem ser incluídas na impressão das RACs. A exportação em
  lote deve seguir a regra atual do PDF individual, que ignora casas com status `archived`.

## 2. Metas

- Corrigir atualização e persistência do nível de pilotis ao alternar modo automático e slider.

- Corrigir exibição intermitente de porta e marcador da vista elevada na planta.

- Corrigir a orientação das laterais em tipos de casa afetados.

- Adicionar objeto de Canvas para rua reta e rua de quina.

- Permitir fundo pastel no objeto `muro`.

- Exportar PDFs de RAC em lote para ZIP na Construção TETO ativa/selecionada, excluindo casas
  arquivadas.

- Preservar preferências relevantes da visualização 3D e aplicar a cor escolhida no PDF.

- Preservar texto e tracejado de muro ao redimensionar diagonalmente.

- Aceitar fotos de até 5 MB.

- Exibir checklist antes da exportação PDF padrão.

- Renomear `Solo Aluvial` para `Solo Molhado / Lama`.

- Substituir `Calhas` por `Mata-juntas` na superfície de produto e no PDF.

## 3. Histórias De Usuário

### US-001: Ajustar nível de pilotis com segurança

**Descrição:** Como monitor voluntário, quero sair do modo automático e ajustar o nível pelo slider
sem precisar fechar modal ou recarregar a página para ver e salvar o desenho correto.

**Critérios de aceitação:**

- [x] Ao desligar `[auto]` e mover o slider, o canvas é redesenhado imediatamente.
- [x] A alteração é persistida ao confirmar o modal.
- [x] Reabrir o modal ou recarregar a página não é necessário para ver o novo nível.
- [x] O comportamento é coberto por teste focado do hook/componente de nível.

### US-002: Exibir porta e marcador de vista elevada na planta

**Descrição:** Como usuário do Canvas, quero que a planta mostre a porta e a posição da vista
elevada sempre que a vista elevada correspondente existir e contiver porta.

**Critérios de aceitação:**

- [x] A porta da planta é derivada de forma determinística da vista elevada válida.

- [x] O marcador de posição da vista elevada aparece na planta quando a relação entre vistas é
  válida.

- [x] A correção cobre o cenário intermitente em que a vista elevada já está presente no Canvas.

- [x] Há teste cobrindo o caso de vista elevada com porta e planta renderizada depois.

### US-003: Corrigir laterais em casas tipo 3 e 6

**Descrição:** Como monitor voluntário, quero que os rótulos de lateral esquerda e lateral direita
correspondam à orientação real da casa, não apenas à posição visual no Canvas.

**Critérios de aceitação:**

- [x] Casa tipo 3 com porta à direita da planta rotula corretamente a vista inferior como lateral
  esquerda.

- [x] Casa tipo 3 rotula corretamente a vista superior como lateral direita.

- [x] Casa tipo 6 com vista frontal em cima da planta rotula corretamente a lateral da direita da
  planta como lateral esquerda.

- [x] A matriz de orientação tem teste unitário/smoke para os tipos afetados.

### US-004: Inserir rua no Canvas

**Descrição:** Como monitor voluntário, quero inserir uma rua reta ou uma rua de quina no Canvas
para representar o entorno imediato da casa.

**Critérios de aceitação:**

- [x] O Canvas oferece novo tipo de objeto `Rua`.

- [x] O usuário escolhe entre `Reta` e `Quina`.

- [x] O objeto é persistido no documento do Canvas.

- [x] Seleção, movimentação, redimensionamento e exportação visual funcionam como nos objetos
  genéricos equivalentes.

### US-005: Ajustar fundo pastel do muro

**Descrição:** Como monitor voluntário, quero escolher a cor do muro e ver o fundo em tom pastel
correspondente para melhorar a leitura visual do desenho.

**Critérios de aceitação:**

- [x] Ao selecionar uma das cores atuais do muro, o fundo usa a mesma família de cor em tom pastel.
- [x] A borda/tracejado continua legível sobre o fundo.
- [x] A cor persistida continua suficiente para reconstruir o objeto ao recarregar.
- [x] Exportação do Canvas preserva o visual do muro.

### US-006: Exportar RACs em ZIP

**Descrição:** Como usuário responsável pela impressão, quero exportar as RACs de todas as casas não
arquivadas de uma Construção TETO em um ZIP para reduzir trabalho repetitivo.

**Critérios de aceitação:**

- [x] O comando fica disponível no formulário/fluxo de Construções TETO.

- [x] Casas `archived` são excluídas da exportação.

- [x] Cada casa não arquivada gera um PDF próprio no ZIP.

- [x] Casas exportadas com sucesso são marcadas como `RAC Impressa`, exceto casas `Construída`, que
  permanecem `Construída`.

- [x] Falhas parciais são registradas em um arquivo de erro dentro do ZIP.

- [x] Uma falha em uma casa não impede a inclusão dos PDFs gerados com sucesso.

- [x] Se nenhuma casa não arquivada puder ser exportada, o usuário recebe erro claro.

- [x] O lote considera a Construção TETO ativa/selecionada, não todas as construções do banco local.

### US-007: Preservar preferências da visualização 3D

**Descrição:** Como usuário do 3D, quero sair da visualização preservando a cor selecionada e a
preferência de mostrar ou ocultar a área de pilotis abaixo do terreno.

**Critérios de aceitação:**

- [x] A cor escolhida no 3D é persistida.
- [x] A preferência do botão de olho é persistida.
- [x] Ao reabrir o 3D, cor e botão de olho retornam ao último valor definido.
- [x] O PDF continua ocultando a área abaixo do terreno por regra normativa.
- [x] O PDF usa a cor persistida pelo usuário.

### US-008: Redimensionar muro sem deformar texto ou tracejado

**Descrição:** Como usuário do Canvas, quero redimensionar muros na diagonal sem deformar o texto ou
alterar o padrão tracejado.

**Critérios de aceitação:**

- [x] O texto do muro mantém tamanho visual estável durante redimensionamento diagonal.
- [x] O tracejado mantém padrão visual estável durante redimensionamento diagonal.
- [x] A geometria do muro continua sendo redimensionada.
- [x] A regra é preservada ao salvar e reabrir o desenho.

### US-009: Enviar fotos de até 5 MB

**Descrição:** Como usuário de campo, quero enviar fotos de até 5 MB para não precisar reduzir
manualmente imagens comuns de celular.

**Critérios de aceitação:**

- [x] Uploads PNG, JPG e WEBP de até 5 MB são aceitos nos formulários existentes.
- [x] Arquivos acima de 5 MB continuam bloqueados.
- [x] Mensagens de erro exibem o novo limite.
- [x] Testes de validação cobrem limite aceito e limite rejeitado.

### US-010: Ver checklist antes da exportação PDF padrão

**Descrição:** Como usuário que vai imprimir uma RAC, quero ver um checklist antes da exportação
para identificar dados faltantes ou riscos antes de gerar o PDF.

**Critérios de aceitação:**

- [x] Antes do PDF padrão, o sistema apresenta checklist com itens verificados.
- [x] Itens ausentes são destacados.
- [x] O usuário consegue cancelar a exportação.
- [x] O usuário consegue continuar quando os itens são apenas alerta.
- [x] Itens bloqueantes impedem exportação quando não houver dados mínimos para PDF.

### US-011: Renomear Solo Aluvial para Solo Molhado / Lama

**Descrição:** Como usuário do formulário de local, quero ver a opção `Solo Molhado / Lama` em vez
de `Solo Aluvial`, usando terminologia mais adequada ao uso de campo.

**Critérios de aceitação:**

- [x] Todo texto visível que hoje mostra `Solo Aluvial` passa a mostrar `Solo Molhado / Lama`.
- [x] O valor interno pode continuar sendo `alluvial` se isso evitar migração desnecessária.
- [x] O PDF e qualquer resumo visível usam `Solo Molhado / Lama`.

### US-012: Trocar Calhas por Mata-juntas

**Descrição:** Como usuário do formulário e do PDF, quero registrar `Mata-juntas` no lugar de
`Calhas`, pois calhas não fazem parte da necessidade atual.

**Critérios de aceitação:**

- [x] O formulário de materiais extras exibe `Mata-juntas`.
- [x] O PDF exibe `Mata-juntas`.
- [x] Valores persistidos hoje em `gutters` são interpretados como quantidade de mata-juntas.
- [x] A UI não mantém `Calhas` como opção funcional.
- [x] Testes existentes que validam `Calhas` são atualizados para `Mata-juntas`.

## 4. Requisitos Funcionais

- `FR-1:` O fluxo de edição de nível de pilotis deve redesenhar e persistir alterações manuais após
  saída do modo automático.

- `FR-2:` A planta deve derivar porta e marcador de vista elevada de forma determinística a partir
  das vistas elevadas presentes.

- `FR-3:` Rótulos de laterais devem usar orientação relativa da casa.

- `FR-4:` O Canvas deve suportar objeto `Rua` com variações `Reta` e `Quina`.

- `FR-5:` O objeto `Muro` deve exibir fundo pastel derivado da cor escolhida.

- `FR-6:` A exportação ZIP deve gerar PDFs apenas para casas não arquivadas da Construção TETO
  ativa/selecionada.

- `FR-7:` A exportação ZIP deve atualizar para `RAC Impressa` apenas casas exportadas com sucesso
  que não estejam `Construída`.

- `FR-8:` A exportação ZIP deve incluir relatório de falhas parciais quando ocorrerem.

- `FR-9:` O 3D deve persistir cor e preferência do botão de olho por casa ou contexto equivalente de
  visualização.

- `FR-10:` O PDF deve ocultar a área abaixo do terreno e usar a cor persistida pelo usuário.

- `FR-11:` Redimensionamento diagonal de `Muro` não deve escalar texto nem alterar tracejado.

- `FR-12:` Fotos devem aceitar até 5 MB nos fluxos já existentes.

- `FR-13:` Exportação PDF padrão deve passar por checklist de dados mínimos e alertas.

- `FR-14:` O texto visível `Solo Aluvial` deve ser substituído por `Solo Molhado / Lama`.

- `FR-15:` O texto visível `Calhas` deve ser substituído por `Mata-juntas`, mantendo o campo
  persistido atual como compatibilidade interna inicial.

## 5. Não Objetivos

- Incluir casas arquivadas na impressão de RACs.
- Exportar RACs de todas as Construções TETO do banco local em uma única ação.
- Criar fluxo de impressão para casas arquivadas.
- Migrar o campo persistido `gutters` para outro nome nesta rodada.
- Reintroduzir calhas como conceito funcional paralelo a mata-juntas.
- Alterar a regra normativa do PDF que oculta a área abaixo do terreno.
- Criar backend remoto, sincronização, permissões ou mutações externas.
- Fazer push, deploy ou pull request.

## 6. Plano Executável Por Ciclos

### Ciclo 0: Documentação e contrato da rodada

- objetivo: Criar este PRD/plano executável e fixar escopo dos 12 itens.

- arquivos prováveis:
    - `docs/product-requirements/PRD-005-rodada-pos-release-rac.prd.md`
    - `.agents/work-items/2026-07/20260702-rodada-pos-release-rac.work-item.md`

- testes/validação:
    - inspeção documental.
    - revisão de critérios de aceite por subagentes.

- commit esperado:
    - `docs(rac): documentar rodada pos-release`

### Ciclo 1: Mudanças localizadas de produto

- itens cobertos:
    - Feature 6: fotos até 5 MB.
    - Feature 8: `Solo Aluvial` -> `Solo Molhado / Lama`.
    - Feature 9: `Calhas` -> `Mata-juntas`.

- arquivos prováveis:
    - `src/shared/lib/photo-data-url.ts`
    - `src/components/construction-site/ui/HouseExtraMaterialsScreen.tsx`
    - `src/components/construction-site/ui/lib/view-model.ts`
    - `src/components/rac-editor/lib/rac-pdf-report-model.ts`
    - `src/components/construction-site/ui/lib/constants.ts`
    - testes de formulário/PDF/upload relacionados.
    - `docs/business-rules/BUS-008-indicador-dificuldade-terreno.md`
    - `docs/business-rules/BUS-009-materiais-terreno.md`

- testes/validação:
    - testes de normalização/upload.
    - smoke tests de materiais extras.
    - smoke tests de modelo PDF.

- commit esperado:
    - `feat(rac): atualizar materiais solo e limite de fotos`

### Ciclo 2: Bugfixes de pilotis, planta e laterais

- itens cobertos:
    - Bugfix 1: `[auto]` + slider.
    - Bugfix 2: porta e marcador na planta.
    - Bugfix 3: laterais em tipos 3 e 6.

- arquivos prováveis:
    - `src/components/rac-editor/@modals/hooks/usePilotiEditor.ts`
    - `src/components/rac-editor/@modals/ui/NivelSlider.tsx`
    - `src/components/rac-editor/domain/house-view.ts`
    - `src/components/rac-editor/@canvas/lib/factory/house/house-top-view-door-marker.ts`
    - `src/components/rac-editor/@canvas/lib/factory/house/house-view-reference-marker.ts`
    - testes smoke dos módulos acima.
    - `docs/business-rules/BUS-003-vistas-por-tipo.md`
    - `docs/business-rules/BUS-004-piloti-nivel.md`

- testes/validação:
    - testes focados de hook/componente de pilotis.
    - testes de matriz de rótulos de vistas.
    - testes de factory de marcadores da planta.

- commit esperado:
    - `fix(rac): corrigir pilotis e marcadores de planta`

### Ciclo 3: Objetos de Canvas e muro

- itens cobertos:
    - Feature 1: objeto `Rua`.
    - Feature 2: fundo pastel do `Muro`.
    - Feature 5: redimensionamento de muro sem deformar texto/tracejado.

- arquivos prováveis:
    - tipos de objeto do canvas em `src/shared/types/house-drawing-document.ts`
    - estratégias/factories de objetos em `src/components/rac-editor/@canvas/`
    - menus de ferramentas em `src/components/rac-editor/@menus/`
    - editores genéricos em `src/components/rac-editor/@modals/`
    - testes smoke de serialização, criação, resize e export visual.
    - `docs/business-rules/BUS-001-canvas.md`

- testes/validação:
    - smoke tests para criação e persistência do objeto `Rua`.
    - testes de normalização visual do `Muro`.
    - teste de resize garantindo `fontSize` e padrão de tracejado estáveis.

- commit esperado:
    - `feat(canvas): adicionar rua e estabilizar muro`

### Ciclo 4: Preferências 3D e checklist PDF

- itens cobertos:
    - Feature 4: persistência de cor e botão de olho no 3D.
    - Feature 7: checklist antes do PDF padrão.

- arquivos prováveis:
    - `src/components/rac-editor/@viewer-3d/`
    - `src/components/rac-editor/hooks/useRacEditorPdfExportAction.ts`
    - `src/components/rac-editor/lib/rac-pdf-report-model.ts`
    - componentes de dialog/checklist em `src/components/rac-editor/`
    - testes do hook de exportação e viewer 3D.
    - `docs/business-rules/BUS-007-viewer-3d.md`
    - `docs/business-rules/BUS-010-status-casa.md`

- testes/validação:
    - smoke tests de persistência de preferência 3D.
    - testes do checklist com cancelar, continuar com alerta e bloquear sem dados mínimos.
    - teste garantindo que PDF oculta abaixo do terreno, mas usa cor persistida.

- commit esperado:
    - `feat(pdf): adicionar checklist e preferencias 3d`

### Ciclo 5: Exportação ZIP de RACs

- itens cobertos:
    - Feature 3: exportar todas as RACs não arquivadas para ZIP.

- arquivos prováveis:
    - `src/components/rac-editor/hooks/useRacEditorPdfExportAction.ts`
    - `src/components/rac-editor/lib/rac-pdf-report-model.ts`
    - novo serviço/helper de exportação ZIP em `src/components/rac-editor/lib/`
    - ports de gerenciamento de construção em `src/components/construction-site/ports/`
    - adapters em `src/bootstrap/` e sessão em `src/components/rac-editor/lib/construction-site-session.ts`
    - UI do formulário/fluxo de Construções TETO.
    - testes unitários/smoke de exportação em lote.
    - `docs/business-rules/BUS-010-status-casa.md`

- testes/validação:
    - teste excluindo casas arquivadas.
    - teste marcando como `RAC Impressa` apenas casas com PDF gerado.
    - teste incluindo relatório de erro no ZIP para falha parcial.
    - teste de UI garantindo disponibilidade do comando no fluxo de Construções TETO.

- commit esperado:
    - `feat(pdf): exportar racs em zip`

### Ciclo 6: Verificação final e consolidação

- objetivo: Confirmar que os 3 bugfixes e as 9 features foram endereçados, atualizar changelog e
  reconciliar work-item.

- arquivos prováveis:
    - `.agents/changelogs/2026-07/20260702.changelog.md`
    - `.agents/work-items/2026-07/20260702-rodada-pos-release-rac.work-item.md`

- testes/validação:
    - suítes focadas por área.
    - `npm run lint`.
    - `npm run test`.
    - `npm run build`.
    - E2E focado quando houver servidor disponível e mudança de fluxo exigir.

- commit esperado:
    - `chore(rac): consolidar validacao da rodada`

## 7. Conceitos De Dados

| Conceito               | Papel nesta rodada                                                                                     |
|------------------------|--------------------------------------------------------------------------------------------------------|
| `PersistedHouseStatus` | Define se uma casa pode entrar na exportação; `archived` fica fora da impressão de RACs.               |
| `gutters`              | Campo persistido legado que passa a representar mata-juntas na superfície de produto desta rodada.     |
| `SoilProfile.alluvial` | Valor interno que pode continuar existindo, exibido como `Solo Molhado / Lama`.                        |
| `Rua`                  | Novo objeto visual do Canvas, com variação reta ou quina.                                              |
| `Muro`                 | Objeto visual que passa a ter fundo pastel e resize sem deformar texto/tracejado.                      |
| Preferências 3D        | Cor e visibilidade abaixo do terreno persistidas para restauração da visualização e uso de cor no PDF. |
| Checklist PDF          | Validação pré-exportação com itens bloqueantes, alertas e informativos.                                |

## 8. Estratégia De Validação

- Executar testes focados por ciclo antes do commit correspondente.

- Executar `npm run lint`, `npm run test` e `npm run build` antes da consolidação final.

- Usar teste E2E quando a mudança envolver navegação ou fluxo completo de usuário.

- Para PDF/ZIP, validar o modelo gerado e os efeitos de status; evitar depender apenas de inspeção
  visual.

- Para Canvas, cobrir serialização, reconstrução e comportamento visual crítico por smoke tests.

## 9. Riscos E Mitigações

- risco: Exportação ZIP pode misturar erro de uma casa com status de outra. mitigação: atualizar
  status somente após geração bem-sucedida por casa, preservar `Construída` e registrar falhas
  separadamente.

- risco: `gutters` como nome interno pode gerar confusão futura. mitigação: documentar que é
  compatibilidade interna inicial e não expor `Calhas` na UI/PDF.

- risco: Checklist pré-PDF pode bloquear demais o fluxo. mitigação: separar itens bloqueantes de
  alertas e permitir continuar quando não houver bloqueio.

- risco: Mudanças de Canvas podem quebrar persistência de documentos existentes. mitigação: manter
  schema compatível e adicionar normalização defensiva para novos objetos.

- risco: Preferência de olho do 3D pode ser confundida com regra normativa do PDF. mitigação:
  documentar e testar que o PDF sempre oculta abaixo do terreno, mas usa a cor definida.

## 10. Referências E Artefatos Auxiliares

- Documentação relacionada:
    - [PRD-001-evolucao-multicasa.prd.md](./PRD-001-evolucao-multicasa.prd.md)
    - [PRD-003-sobre-a-casa-na-edicao-da-casa.prd.md](./PRD-003-sobre-a-casa-na-edicao-da-casa.prd.md)
    - [BUS-001-canvas.md](../business-rules/BUS-001-canvas.md)
    - [BUS-003-vistas-por-tipo.md](../business-rules/BUS-003-vistas-por-tipo.md)
    - [BUS-004-piloti-nivel.md](../business-rules/BUS-004-piloti-nivel.md)
    - [BUS-007-viewer-3d.md](../business-rules/BUS-007-viewer-3d.md)
    - [BUS-008-indicador-dificuldade-terreno.md](../business-rules/BUS-008-indicador-dificuldade-terreno.md)
    - [BUS-009-materiais-terreno.md](../business-rules/BUS-009-materiais-terreno.md)
    - [BUS-010-status-casa.md](../business-rules/BUS-010-status-casa.md)

- Código atual relacionado:
    - [construction-site-session.ts](../../src/components/rac-editor/lib/construction-site-session.ts)
    - [rac-pdf-report-model.ts](../../src/components/rac-editor/lib/rac-pdf-report-model.ts)
    - [useRacEditorPdfExportAction.ts](../../src/components/rac-editor/hooks/useRacEditorPdfExportAction.ts)
    - [HouseExtraMaterialsScreen.tsx](../../src/components/construction-site/ui/HouseExtraMaterialsScreen.tsx)
    - [photo-data-url.ts](../../src/shared/lib/photo-data-url.ts)

## 11. Execução Concluída

### Commits Da Rodada

1. `f3434ee docs(rac): documentar rodada pos-release`
2. `317912d feat(rac): atualizar solo materiais e fotos`
3. `df7a9e6 fix(rac): corrigir bugfixes pos-release`
4. `ee62d8f feat(rac): adicionar ruas e ajustar muro`
5. `add74e8 feat(rac): adicionar checklist e preferencias 3d`
6. `a428241 feat(rac): exportar racs em zip`
7. `chore(rac): consolidar validacao da rodada` (commit de consolidação deste documento)

### Cobertura Dos Itens Priorizados

| Item                                                   | Resultado  | Evidência principal                                                   |
|--------------------------------------------------------|------------|-----------------------------------------------------------------------|
| Bugfix 1: `[auto]` e slider de nível de piloti         | Endereçado | `df7a9e6`, testes de `usePilotiEditor` e `PilotiEditor`               |
| Bugfix 2: porta e marcador da vista elevada na planta  | Endereçado | `df7a9e6`, testes de marcador de porta e referência de vista          |
| Bugfix 3: laterais tipo 3 e tipo 6                     | Endereçado | `df7a9e6`, testes de `house-view` e marcadores                        |
| Feature 1: objeto `Rua` reta/quina                     | Endereçada | `ee62d8f`, testes de factory, toolbar e persistência                  |
| Feature 2: fundo pastel do `Muro`                      | Endereçada | `ee62d8f`, testes de estratégia visual do muro                        |
| Feature 3: exportação ZIP de RACs                      | Endereçada | `a428241`, `BUS-013-exportacao-racs-zip.md` e testes de ZIP/status/UI |
| Feature 4: preferências 3D e cor no PDF                | Endereçada | `add74e8`, testes de viewer e snapshot PDF                            |
| Feature 5: resize de muro sem deformar texto/tracejado | Endereçada | `ee62d8f`, testes de resize e reload Fabric                           |
| Feature 6: fotos até 5 MB                              | Endereçada | `317912d`, testes de validação de upload                              |
| Feature 7: checklist pré-PDF                           | Endereçada | `add74e8`, testes do checklist e E2E de exportação PDF                |
| Feature 8: `Solo Molhado / Lama`                       | Endereçada | `317912d`, testes de UI/PDF para `alluvial`                           |
| Feature 9: `Mata-juntas` no lugar de `Calhas`          | Endereçada | `317912d`, testes de formulário, view-model e PDF                     |

### Validação Final

- `npm run test -- --reporter=dot`
    - 142 arquivos de teste, 606 testes aprovados.

- `npm run lint`
    - aprovado.

- `npm run build`
    - aprovado; manteve apenas o aviso não bloqueante de chunk acima de 1000 kB.

- `npm run test:e2e`
    - 40 testes Chromium aprovados.

### Observações

- A exportação ZIP considera apenas casas não arquivadas da construção selecionada.

- Casas construídas entram no ZIP, mas preservam status `Construída`.

- Falha parcial de casa é registrada em `ERROS_EXPORTACAO_RACS.txt` quando há ao menos um PDF
  gerado.

- O PDF individual segue ocultando a área abaixo do terreno por regra normativa e usa a cor
  persistida no viewer 3D.

- O ZIP não gera snapshot 3D em lote; usa a imagem 2D persistida de cada casa.
