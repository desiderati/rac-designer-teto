---
title: Roadmap do RAC Designer TETO
doc_type: roadmap
status: active
lang: pt-BR
last_updated: 2026-06-16
---

# Roadmap do RAC Designer TETO

## Objetivo

Este arquivo registra frentes de evolução levantadas em 2026-05-12 para o editor RAC. Ele funciona como backlog
curado de produto e implementação: ajuda a ordenar trabalho, explicitar critérios de aceite e apontar os módulos
prováveis de impacto, mas não substitui PRDs canônicos quando uma frente precisar de especificação formal.

## Referências atuais

- `docs/business-rules/BUS-002-toolbar.md`: regras da toolbar, exportação PDF e navegação de Construções TETO.
- `docs/business-rules/BUS-003-vistas-por-tipo.md`: limites e nomes das vistas por tipo de casa.
- `docs/business-rules/BUS-004-piloti-nivel.md`: regras de nível, altura e consistência visual dos pilotis.
- `docs/business-rules/BUS-006-contraventamento.md`: regras de criação, remoção e elegibilidade de contraventamentos.
- `docs/business-rules/BUS-008-indicador-risco-terreno-pdf.md`: regra do indicador de risco do terreno no PDF.
- `docs/product-requirements/PRD-001-evolucao-multicasa.prd.md`: gestão de Construções TETO, casas e famílias.
- `src/components/rac-editor/hooks/useRacEditorPdfExportAction.ts`: exportação PDF atual.
- `src/components/rac-editor/@modals/ui/editors/PilotisSetupModal.tsx`: modal inicial de seleção de pilotis.
- `src/components/rac-editor/@modals/hooks/usePilotiEditor.ts`: edição atual de altura, nível e contraventamento do piloti.
- `src/components/rac-editor/@modals/ui/SettingsModal.tsx`: preferências globais do editor RAC.
- `src/domain/house/use-cases/house-piloti.use-case.ts`: regras puras de interpolação de níveis e recomendação de alturas.
- `src/domain/house/use-cases/house-contraventamento.use-case.ts`: regras puras de elegibilidade de contraventamento.
- `src/components/rac-editor/lib/terrain-volume.ts`: cálculo atual de volumes de rachão e brita.
- `index.html`: loader inicial exibido antes da montagem do React.
- `src/components/rac-editor/ui/RacEditor.tsx`: loader interno enquanto o storage local do editor é preparado.
- `src/shared/types/construction-site.ts`: modelo persistido atual de Construções TETO, com coleção própria de monitores.
- `src/components/construction-site/ui/HouseConfigurationScreen.tsx`: tela atual de edição/configuração da casa.

## Itens

### RD-001 - Exportação PDF com nome e destino definidos pelo usuário

**Status:** parcialmente implementado.

**Necessidade:** ao exportar para PDF, permitir que o usuário defina o nome do arquivo e, idealmente, o diretório de
destino antes do download.

**Estado atual:** a exportação usa `jsPDF`, gera relatório estruturado e salva com nome derivado da Construção TETO e
da família ativa, no formato `RAC-{construcao}-{familia}.pdf`. O usuário ainda não consegue definir manualmente o nome
nem escolher o diretório de destino.

**Direção proposta:**

1. Permitir configurar o nome do arquivo antes da exportação.
2. Avaliar suporte do navegador para uma janela nativa de escolha de arquivo/diretório.
3. Definir fallback quando a janela nativa não estiver disponível: nome configurável e download pelo fluxo padrão do
   navegador.
4. Preservar a exportação atual em desktop e mobile, conforme as regras da toolbar.

**Critérios de aceite:**

- O usuário consegue informar o nome do PDF antes do download.
- Quando o navegador suportar escolha nativa de destino, o fluxo usa essa capacidade.
- Quando não houver suporte, o download ainda funciona com o nome escolhido.
- A ação continua acessível pelo botão de exportação e pelo menu mobile existente.

**Pontos prováveis de impacto:**

- `src/components/rac-editor/hooks/useRacEditorPdfExportAction.ts`
- `src/components/rac-editor/@menus/ui/TopBar.tsx`
- `src/components/rac-editor/@menus/ui/UserMenu.tsx`

### RD-002 - Remover nome da família da modal inicial de nova casa

**Status:** concluído em 2026-05-13.

**Necessidade:** ao inserir uma nova casa para uma família, a primeira modal do editor deve pedir apenas os pilotis
daquela casa. O nome da família já pertence ao módulo de gestão de casas.

**Estado anterior:** `FamilySetupModal` ainda continha o campo `Nome da Família` e só permitia confirmar quando havia nome
preenchido e seis alturas de piloti selecionadas.

**Resultado implementado:**

1. `PilotisSetupModal` substituiu `FamilySetupModal` e não exibe mais campo de nome da família.
2. A confirmação depende apenas da seleção válida de seis alturas de piloti.
3. O setup inicial aplica somente `selectedPilotiHeights`, preservando o nome da família já associado à casa ativa.
4. Nomes internos do fluxo foram migrados de `FamilySetup*` para `PilotisSetup*`.
5. O contador de pilotis selecionados aparece entre parênteses junto ao título da modal, e a grade mobile segue o mesmo
   formato compacto do editor de piloti aberto pelo canvas.

**Critérios de aceite atendidos:**

- A modal inicial não exibe campo de nome da família.
- O fluxo continua abrindo a seleção de tipo da casa depois da confirmação dos pilotis.
- O rótulo da casa continua vindo da família associada no módulo de gestão.
- O card branco da modal não repete o título/contador de pilotis.
- A grade mobile usa botões quadrados compactos alinhados ao editor de piloti do canvas.
- Testes cobrem a confirmação sem digitação de nome.

**Pontos impactados:**

- `src/components/rac-editor/@modals/ui/ConfirmDialogModal.tsx`
- `src/components/rac-editor/@modals/ui/editors/PilotisSetupModal.tsx`
- `src/components/rac-editor/hooks/useRacEditorFamilyActions.ts`
- `src/components/rac-editor/hooks/buildRacEditorLayoutProps.ts`
- `src/bootstrap/editor-house-port-adapters.ts`
- `src/components/rac-editor/ports/HouseWritePort.ts`
- `e2e/helpers/rac-editor.helpers.ts`

### RD-003 - Labels nas vistas elevadas e no lado correspondente da planta

**Status:** concluído em 2026-06-16.

**Necessidade:** cada vista elevada deve exibir uma label com seu nome. A planta deve exibir a mesma label no lado
correspondente.

**Estado anterior:** o sistema já resolvia nomes de vista em `getViewLabelForHouseType`, mas a renderização do grupo da
casa ainda não materializava labels permanentes para cada vista e para o lado correspondente na planta.

**Resultado implementado:**

1. As vistas elevadas exibem etiqueta inferior no formato `{Nome} #{número}`.
2. A planta exibe marcadores triangulares pareados ao lado correspondente de cada vista elevada.
3. A numeração segue a ordem de inserção das vistas no canvas.
4. Os marcadores são não selecionáveis, serializáveis e atualizados por efeito visual da casa.
5. A regra foi consolidada em `docs/business-rules/BUS-003-vistas-por-tipo.md`.

**Critérios de aceite atendidos:**

- Toda vista elevada visível exibe uma label legível com o nome da vista.
- A planta exibe a mesma label no lado correspondente.
- Labels não interferem em seleção, edição de pilotis, porta, escada ou contraventamento.
- Labels são preservadas em undo/redo, persistência e restauração.

**Pontos impactados:**

- `src/components/rac-editor/lib/house-view.ts`
- `src/components/rac-editor/@canvas/lib/factory/house/house-top.strategy.ts`
- `src/components/rac-editor/@canvas/lib/factory/house/house-front-back.strategy.ts`
- `src/components/rac-editor/@canvas/lib/factory/house/house-side.strategy.ts`
- `src/components/rac-editor/@canvas/lib/factory/house/house-view-reference-marker.ts`
- `src/components/rac-editor/@canvas/lib/house-visual-effects.ts`
- `src/components/rac-editor/lib/editor-house-controller.ts`

### RD-004 - Labels de identificação dos pilotis na planta

**Necessidade:** a vista de planta deve identificar os pilotis por código. Pilotis `A*` e `B*` ficam abaixo do círculo;
pilotis `C*` ficam acima.

**Estado atual:** a planta mostra a altura do piloti no centro do círculo e labels de nível apenas nos pilotis de
canto. A função `getPilotiName` já resolve códigos como `A1`, `B2` e `C4` a partir do ID interno.

**Direção proposta:**

1. Criar labels permanentes de identificação para todos os pilotis da planta.
2. Posicionar `A*` e `B*` abaixo do círculo.
3. Posicionar `C*` acima do círculo.
4. Resolver colisões com altura, nível, destaque de piloti mestre e feedback de seleção.

**Critérios de aceite:**

- Todos os 12 pilotis da planta exibem seu código.
- Labels seguem a regra de posição por linha (`A/B` abaixo, `C` acima).
- Labels permanecem legíveis quando o piloti está selecionado, mestre ou destacado.
- Alterações de altura/nível não deslocam incorretamente a identificação.

**Pontos prováveis de impacto:**

- `src/components/rac-editor/@canvas/lib/factory/house/house-top.strategy.ts`
- `src/components/rac-editor/@canvas/lib/piloti.ts`
- `src/shared/types/piloti.ts`
- `src/shared/config.ts`

### RD-005 - Inserir componente visual de gauge pela toolbar

**Status:** parcialmente desbloqueado; ainda não implementado no canvas.

**Necessidade:** criar uma opção no menu da toolbar para inserir um componente visual do tipo gauge. O gauge indicará a
dificuldade do terreno. Para o PDF, a regra de risco já foi definida em
`docs/business-rules/BUS-008-indicador-risco-terreno-pdf.md`; ainda falta decidir se o gauge inserível no canvas deve
reutilizar essa mesma regra ou representar outro indicador visual.

**Estado atual:** a toolbar já possui menus para elementos, linhas, texto livre e ações gerais. Objetos de canvas são
criados por estratégias em `@canvas/lib/factory/elements`. O PDF já renderiza um gauge de risco do terreno, mas não há
tipo `gauge` serializável nem ação de inserção pela toolbar do canvas.

**Direção proposta:**

1. Criar um novo tipo de objeto visual `gauge` no mecanismo de estratégias do canvas.
2. Adicionar ação correspondente na toolbar, preferencialmente no menu de elementos ou em um grupo visual dedicado.
3. Tornar o gauge serializável e restaurável com o documento da casa.
4. Separar a camada visual da regra de cálculo.
5. Se a regra do canvas for a mesma do PDF, conectar o gauge aos dados de casa/terreno definidos em `BUS-008`.

**Critérios de aceite:**

- O usuário consegue inserir um gauge no canvas pela toolbar.
- O gauge é movível, selecionável, exportável em PDF e persistido junto com o desenho.
- O componente tem estado visual coerente enquanto os dados necessários são carregados ou ficam indisponíveis.
- A fórmula de dificuldade fica isolada em função testável quando a semântica do gauge do canvas for confirmada.

**Pontos prováveis de impacto:**

- `src/components/rac-editor/@menus/lib/menu-config.ts`
- `src/components/rac-editor/@menus/lib/menu-types.ts`
- `src/components/rac-editor/@menus/hooks/useRacEditorMenuActions.ts`
- `src/components/rac-editor/@canvas/hooks/useCanvasTools.ts`
- `src/components/rac-editor/@canvas/lib/factory/elements/`

**Pendência funcional:** confirmar se o gauge inserível no canvas usa a mesma semântica do indicador de risco do PDF
ou se representa um indicador visual independente.

### RD-006 - Corrigir cálculo de pedras por casa

**Status:** desbloqueado; definição funcional confirmada.

**Necessidade:** corrigir o cálculo de pedras para uma casa e identificar com precisão como esse cálculo é feito
atualmente.

**Estado atual identificado:**

- O modal de terreno chama `calculateTotalVolumes`.
- `calculateTotalVolumes` retorna `rachaoM3` e `britaM3`.
- `calculateRachaoVolume` calcula um cilindro externo por piloti, usando:
  - diâmetro externo = largura real do piloti para cálculo (`20 cm`) + duas laterais de brita (`8 cm` cada);
  - altura de rachão conforme tipo de solo (`20 cm` a `60 cm`);
  - fator de vazio de rachão `1.40`;
  - contagem de pilotis do registro, com fallback para `12`.
- `calculateBritaVolume` soma, para cada piloti, o volume do cilindro externo menos o cilindro do piloti, usando:
  - nível do piloti convertido de metros para centímetros;
  - fator de vazio de brita `1.20`.
- A UI apresenta `Qtd. de Rachão Aprox.`, `Qtd. de Brita Aprox.` e `Total`.

**Definição funcional:** "pedras" corresponde à soma de `rachão + brita`. O item não depende mais de definição
conceitual; a implementação deve validar se o `Total` atual já representa essa soma em todos os fluxos e ajustar
fórmula, nomenclatura ou exportações onde houver divergência.

**Direção proposta:**

1. Comparar a definição `pedras = rachão + brita` com `terrain-volume.ts` e com todos os pontos de exibição.
2. Corrigir fórmula, constantes, arredondamento e nomenclatura de UI quando houver divergência.
3. Garantir que PDF, UI e eventuais relatórios usem a mesma semântica de pedras.
4. Adicionar testes unitários com exemplos reais de casas.
5. Atualizar regra de negócio consolidando a definição funcional.

**Critérios de aceite:**

- A fórmula de pedras está documentada e coberta por testes.
- Exemplos reais produzem os valores esperados.
- UI e PDF usam a mesma regra.
- Nomes exibidos ao usuário não misturam "pedras", "rachão" e "brita" sem distinção operacional.

**Pontos prováveis de impacto:**

- `src/components/rac-editor/lib/terrain-volume.ts`
- `src/components/rac-editor/lib/terrain-volume.smoke.test.ts`
- `src/components/rac-editor/@modals/ui/editors/terrain/TerrainEditor.tsx`
- `src/shared/config.ts`
- `docs/business-rules/`

### RD-007 - Unificar e qualificar os loaders da aplicação

**Status:** concluído em 2026-06-16.

**Necessidade:** melhorar a experiência de carregamento inicial e do carregamento interno do editor. Hoje existem dois
loaders: um fallback estático em `index.html`, antes da montagem do React, e outro em `RacEditor` durante a preparação
do storage local e dos ports do editor.

**Estado anterior:**

- `index.html` exibe um spinner simples com o texto `Carregando o Editor de RAC...`.
- `RacEditor.tsx` exibe apenas um spinner visual enquanto `useIndexedDbConstructionSiteSessionStorage` está em
  `loading`; o texto `Carregando o Canvas...` existe como `aria-label`, mas não aparece visualmente.

**Resultado implementado:**

1. `index.html` usa fallback autocontido com marca `RAC/TETO`, mensagem de preparação e barra de progresso animada.
2. O fallback continua tratando erro de assets e timeout de montagem do React.
3. O progresso é perceptivo/animado, sem prometer percentual real de bytes carregados.
4. `RacEditor` exibe o texto visível `Carregando o Canvas...` junto ao spinner interno.
5. Smoke tests cobrem o fallback do `index.html` e o estado visual de carregamento do editor.

**Critérios de aceite atendidos:**

- O carregamento inicial da aplicação mostra um indicador de progresso antes da montagem do React.
- O progresso não trava visualmente em estados intermediários quando o bundle demora.
- Se o React não montar dentro do limite atual de timeout, a tela de erro de asset continua funcionando.
- O loader interno do editor exibe o texto `Carregando o Canvas...` de forma visível e acessível.
- Os dois loaders têm linguagem visual compatível, mas continuam separados por responsabilidade.

**Pontos prováveis de impacto:**

- `index.html`
- `src/components/rac-editor/ui/RacEditor.tsx`
- `src/bootstrap/app-loading-fallback.smoke.test.ts`
- `src/components/rac-editor/ui/RacEditor.smoke.test.tsx`

**Observação técnica:** um percentual exato de carregamento no `index.html` só é confiável se o carregamento dos assets
for instrumentado. Sem isso, o caminho mais pragmático é uma barra progressiva por etapas ou estimada, encerrada quando
o React monta e remove o fallback.

### RD-008 - Gerenciamento de monitores

**PRD canônico:** `docs/product-requirements/PRD-002-gerenciamento-de-monitores.prd.md`.

**Status:** concluído.

**Necessidade:** permitir cadastrar, editar e listar monitores por Construção TETO. Cada construção terá seu próprio
grupo de monitores, e cada monitor deve ter nome e telefone obrigatórios, com foto e e-mail opcionais.

**Estado antes da implementação:**

- O modelo persistido atual possui Construções TETO, comunidades, famílias e casas, mas ainda não possui uma coleção
  própria de monitores.
- Os dados históricos/importados do PRD-001 já trazem colunas de monitores e telefones (`monitor-1...monitor-6`), o que
  indica uma necessidade real de modelar esses participantes como entidades reutilizáveis.

**Direção proposta:**

1. Modelar monitores como registros pertencentes a uma Construção TETO.
2. Cada Construção TETO deve manter seu grupo próprio de monitores, sem compartilhar automaticamente monitores com outras
   construções.
3. Criar um componente específico para gestão de monitores, responsável por listagem, cadastro e edição.
4. Reutilizar a listagem de Construções TETO como superfície de navegação para a gestão de monitores.
5. No item de cada Construção TETO, posicionar o botão de monitores ao lado do botão de casas e antes da ação de
   arquivar ou desarquivar.
6. Permitir criar, editar, listar, inativar e reativar monitores sem perder histórico.
7. Exibir monitores ativos por padrão e oferecer filtro de status para consultar inativos.
8. Não impor limite fixo de monitores por Construção TETO.
9. Reutilizar validações já existentes para telefone, e-mail e imagem quando aplicável.
10. Preparar o modelo para futuras exportações, relatórios ou impressão da RAC com equipe responsável.

**Critérios de aceite:**

- O usuário consegue cadastrar monitor com nome e telefone obrigatórios e dados opcionais de foto e e-mail.
- O cadastro de monitores ocorre dentro do contexto de uma Construção TETO específica.
- A listagem exibe apenas monitores da Construção TETO em foco.
- Telefone e e-mail são validados de forma consistente com os formulários atuais de gestão.
- Monitores cadastrados podem ser editados sem recriar registros duplicados.
- Arquivamento/inativação preserva registros associados à Construção TETO.
- O filtro de status permite consultar e reativar monitores inativos.
- A listagem de Construções TETO oferece botão de ação para gerenciar monitores da construção selecionada.
- A tela de gestão de construção permite listar, cadastrar e editar monitores por meio de um componente dedicado.
- A UI deixa claro a qual Construção TETO o grupo de monitores pertence.

**Pontos prováveis de impacto:**

- `src/shared/types/construction-site.ts`
- `src/components/construction-site/ui/ConstructionSiteManagementPanel.tsx`
- `src/components/construction-site/lib/construction-site-form-validation.ts`
- `src/components/rac-editor/@menus/ui/HamburgerMenu.tsx`
- `src/components/rac-editor/@menus/lib/menu-types.ts`
- `src/components/rac-editor/@menus/hooks/useRacEditorMenuActions.ts`
- `src/components/rac-editor/lib/construction-site-session.ts`
- `src/infra/persistence/indexed-db-construction-site-repository.adapter.ts`
- `docs/product-requirements/`

**Decisão funcional:** monitores pertencem à Construção TETO. A edição ocorre em componente próprio, acessado pela ação
do item da construção na listagem de Construções TETO. Nesta frente, nome e telefone são
obrigatórios, foto e e-mail são opcionais, não há limite fixo de monitores e exportações/relatórios ficam fora do escopo
de entrega.

**Status de implementação:** implementada no produto com coleção persistida `monitors` por Construção TETO, CRUD lógico,
filtro de status e navegação pela ação de monitores no item da Construção TETO.

### RD-009 - Seção "Sobre a Casa" na edição da casa

**Status:** concluído em 2026-05-15.

**Necessidade:** adicionar uma nova seção de edição da casa logo após `Detalhes da Família`, chamada `Sobre a Casa`.
Essa seção concentra informações próprias da casa, sem misturá-las aos dados cadastrais da família.

**Estado atual identificado:**

- A tela de configuração da casa possui a seção `Detalhes da Família`.
- O campo `Notas` aparece hoje nessa primeira seção.
- O modelo persistido já possui `PersistedHouseRecord.notes`, mas a tela atual também trabalha com notas associadas à
  família; a implementação deve evitar ambiguidade semântica ao mover o campo.

**Direção proposta:**

1. Criar a seção `Sobre a Casa` imediatamente após `Detalhes da Família`.
2. Adicionar o campo `Tamanho da Casa` como campo opcional.
3. Oferecer estado vazio sem rótulo visível e as opções de tamanho `Grande` e `Pequena`.
4. Adicionar o campo `Líderes` como campo opcional.
5. Mover o campo `Notas` da seção `Detalhes da Família` para `Sobre a Casa`.
6. Revisar a persistência de `Notas` para garantir que, ao ficar em `Sobre a Casa`, o dado represente a casa e não a
   família por herança acidental da UI anterior.
7. Atualizar testes de formulário para validar a presença da nova seção, a opcionalidade dos campos e a nova posição de
   `Notas`.

**Critérios de aceite:**

- `Sobre a Casa` aparece logo após `Detalhes da Família`.
- `Tamanho da Casa` aceita estado vazio e as opções `Grande` e `Pequena`.
- `Tamanho da Casa`, `Líderes` e `Notas` não são obrigatórios.
- `Notas` deixa de aparecer em `Detalhes da Família` e passa a aparecer em `Sobre a Casa`.
- Salvar a configuração preserva os dados existentes e grava os novos campos sem exigir preenchimento.
- A UI deixa clara a separação entre dados da família e dados da casa.

**Pontos prováveis de impacto:**

- `src/components/construction-site/ui/HouseConfigurationScreen.tsx`
- `src/components/construction-site/ui/lib/view-model.ts`
- `src/components/construction-site/lib/construction-site-form-validation.ts`
- `src/components/construction-site/ui/ConstructionSiteManagementPanel.smoke.test.tsx`
- `src/shared/types/construction-site.ts`
- `docs/product-requirements/`

**Decisão funcional:** a seção `Sobre a Casa` pertence ao formulário de edição/configuração da casa, não ao formulário
da família. Os novos campos são opcionais.

**Status de implementação:** implementada no produto com seção própria, persistência em `PersistedHouseRecord`,
compatibilidade para notas legadas de família e cobertura por testes de UI, persistência e E2E.

### RD-010 - Modo manual de alturas ao alterar níveis

**Status:** proposto.

**Necessidade:** permitir uma preferência global do editor para desativar a recomendação automática de novas alturas de
pilotis quando níveis forem alterados.

**Estado atual:** ao alterar o nível pelo editor de piloti, a aplicação mantém o nível escolhido e recalcula a altura do
piloti com a menor altura disponível que satisfaça a proporção estrutural `altura >= nível * 3`. Alterações de nível nos
cantos também podem recalcular níveis intermediários e alturas recomendadas dos 12 pilotis.

**Direção proposta:**

1. Criar uma preferência global no editor para alternar entre modo automático e modo manual de alturas.
2. Manter o modo automático como comportamento atual: alterações de nível podem recalcular alturas recomendadas.
3. No modo manual, alterações de nível não devem sugerir nem aplicar novas alturas para o piloti editado ou para pilotis
   afetados por interpolação.
4. No modo manual, níveis continuam obrigatoriamente limitados ao mínimo `0,20 m` e ao máximo permitido pela altura atual
   de cada piloti (`altura / 2`).
5. A preferência deve ser persistida junto às configurações globais do editor, não no modelo da casa.
6. O usuário deve perceber claramente qual modo está ativo antes de editar níveis.

**Critérios de aceite:**

- O usuário consegue alternar entre modo automático e modo manual nas configurações globais do editor.
- No modo automático, o fluxo de recomendação de alturas permanece compatível com o comportamento atual.
- No modo manual, alterar nível não altera alturas de pilotis automaticamente.
- No modo manual, níveis inválidos são bloqueados ou ajustados para o intervalo permitido por cada altura atual.
- Persistência, restauração, desfazer/refazer, visual 2D, visual 3D, escadas e contraventamentos continuam coerentes com
  os níveis efetivamente aplicados.

**Pontos prováveis de impacto:**

- `src/shared/types/settings.ts`
- `src/shared/config.ts`
- `src/components/rac-editor/store/editor-settings.ts`
- `src/components/rac-editor/@modals/ui/SettingsModal.tsx`
- `src/components/rac-editor/@modals/hooks/usePilotiEditor.ts`
- `src/components/rac-editor/@modals/ui/editors/NivelSlider.tsx`
- `src/domain/house/use-cases/house-piloti.use-case.ts`
- `src/components/rac-editor/@canvas/lib/house-visual-runtime.ts`
- `docs/business-rules/BUS-004-piloti-nivel.md`

### RD-011 - Contraventamento horizontal manual

**Status:** proposto.

**Necessidade:** criar contraventamento horizontal usando as mesmas bases funcionais já definidas para o
contraventamento vertical, mas com inserção exclusivamente manual.

**Estado atual:** o contraventamento existente é controlado por coluna, possui lados esquerdo/direito, usa elegibilidade
por nível e proporção estrutural, e pode ser recalculado automaticamente quando uma coluna exige contraventamento.

**Direção proposta:**

1. Adicionar suporte a contraventamento horizontal como orientação distinta do contraventamento vertical atual.
2. Permitir que o contraventamento horizontal envolva os quatro pilotis de uma mesma linha/faixa da planta quando a linha
   atender às regras de elegibilidade.
3. Reutilizar as mesmas regras de nível, altura e proporção estrutural usadas para decidir se o contraventamento vertical
   é permitido.
4. Garantir que contraventamento horizontal nunca seja criado por rotina automática.
5. Tratar criação e remoção do contraventamento horizontal como ação manual explícita.
6. Preservar persistência, histórico, restauração, projeção visual e sincronização com o 3D.

**Critérios de aceite:**

- O usuário consegue criar e remover contraventamento horizontal manualmente.
- A criação só é habilitada quando a linha/faixa respeita as regras de elegibilidade de contraventamento.
- Nenhum fluxo automático cria contraventamento horizontal.
- Contraventamentos verticais automáticos continuam funcionando sem criar, remover ou sobrescrever horizontais manuais.
- Contraventamentos horizontais são persistidos, restaurados e refletidos nas vistas e no 3D.

**Pontos prováveis de impacto:**

- `docs/business-rules/BUS-006-contraventamento.md`
- `src/shared/types/contraventamento.ts`
- `src/domain/house/use-cases/house-contraventamento.use-case.ts`
- `src/components/rac-editor/@modals/ui/editors/piloti/PilotiEditor.tsx`
- `src/components/rac-editor/@canvas/hooks/useCanvasContraventamentoCommands.ts`
- `src/components/rac-editor/@canvas/lib/contraventamento.ts`
- `src/components/rac-editor/@canvas/lib/contraventamento-geometry.ts`
- `src/components/rac-editor/@canvas/lib/house-auto-contraventamento.ts`
- `src/components/rac-editor/@viewer-3d/lib/parsers/contraventamento-parser.ts`

### RD-012 - Digitação de nível na modal de pilotis desktop

**Status:** proposto.

**Necessidade:** no modo desktop, permitir que o nível do piloti também seja editado por digitação na modal de edição de
pilotis, mantendo as mesmas regras usadas pelos controles atuais.

**Estado atual:** o nível é exibido em formato `N,NN m` e pode ser alterado por botões de incremento/decremento e slider.
A edição por digitação ainda não existe na modal de piloti.

**Direção proposta:**

1. Adicionar campo digitável de nível apenas na experiência desktop da modal de piloti.
2. Aceitar somente números digitados pelo operador.
3. Aplicar máscara visual `N,NN`, usando vírgula decimal e duas casas.
4. Reutilizar as mesmas regras de mínimo, máximo global e máximo por altura atual do piloti.
5. Integrar a digitação ao mesmo fluxo de commit usado pelo slider e pelos botões de nível.
6. Manter a experiência mobile inalterada, salvo se uma etapa futura decidir o contrário.

**Critérios de aceite:**

- Em desktop, o usuário consegue editar o nível digitando apenas números.
- A UI formata o valor digitado como `N,NN`.
- Valores abaixo do mínimo ou acima do máximo permitido são impedidos ou normalizados de forma previsível.
- O valor confirmado dispara os mesmos efeitos de nível já aplicados pelos controles existentes.
- O campo não quebra navegação entre pilotis, confirmação/cancelamento da modal nem acessibilidade básica por teclado.

**Pontos prováveis de impacto:**

- `src/components/rac-editor/@modals/ui/editors/piloti/PilotiEditor.tsx`
- `src/components/rac-editor/@modals/hooks/usePilotiEditor.ts`
- `src/components/rac-editor/@modals/ui/editors/NivelSlider.tsx`
- `src/shared/types/piloti.ts`
- `docs/business-rules/BUS-004-piloti-nivel.md`

## Ordem sugerida de execução

1. **RD-006**: validar e implementar a definição confirmada de pedras como `rachão + brita`.
2. **RD-010**: definir e implementar a preferência global de modo manual/automático para alturas ao alterar níveis.
3. **RD-012**: adicionar digitação de nível no desktop depois que a semântica de modo manual estiver consolidada.
4. **RD-011**: implementar contraventamento horizontal manual com base nas regras já consolidadas de elegibilidade.
5. **RD-004**: implementar labels de identificação dos pilotis na planta.
6. **RD-001**: melhorar exportação PDF com nome configurável e fallback de download.
7. **RD-005**: inserir gauge visual; decidir se o canvas reutiliza a regra de risco já definida em `BUS-008`.
8. **RD-002**: concluído em 2026-05-13.
9. **RD-003**: concluído em 2026-06-16.
10. **RD-007**: concluído em 2026-06-16.
11. **RD-008**: concluído.
12. **RD-009**: concluído em 2026-05-15.

## Perguntas em aberto

1. O gauge inserível no canvas deve reutilizar a regra de risco definida em `BUS-008` ou representar outro indicador
   visual?
2. O destino configurável do PDF deve mirar apenas navegadores Chromium ou precisa de fallback equivalente para todos
   os navegadores suportados?
3. Monitores da Construção TETO devem registrar função ou período de atuação em iniciativa futura?
4. Monitores devem aparecer em exportações, relatórios ou impressão da RAC em iniciativa futura? Em caso positivo, em
   qual seção?
