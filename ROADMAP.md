---
title: Roadmap do RAC Designer TETO
doc_type: roadmap
status: active
lang: pt-BR
last_updated: 2026-05-15
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
- `docs/product-requirements/PRD-001-evolucao-multicasa.prd.md`: gestão de Construções TETO, casas e famílias.
- `src/components/rac-editor/hooks/useRacEditorPdfExportAction.ts`: exportação PDF atual.
- `src/components/rac-editor/@modals/ui/editors/PilotisSetupModal.tsx`: modal inicial de seleção de pilotis.
- `src/components/rac-editor/lib/terrain-volume.ts`: cálculo atual de volumes de rachão e brita.
- `index.html`: loader inicial exibido antes da montagem do React.
- `src/components/rac-editor/ui/RacEditor.tsx`: loader interno enquanto o storage local do editor é preparado.
- `src/shared/types/construction-site.ts`: modelo persistido atual de Construções TETO, ainda sem coleção própria de
  monitores.
- `src/components/construction-site/ui/HouseConfigurationScreen.tsx`: tela atual de edição/configuração da casa.

## Itens

### RD-001 - Exportação PDF com nome e destino definidos pelo usuário

**Necessidade:** ao exportar para PDF, permitir que o usuário defina o nome do arquivo e, idealmente, o diretório de
destino antes do download.

**Estado atual:** a exportação usa `jsPDF` e salva sempre como `RAC-TETO.pdf`.

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

**Necessidade:** cada vista elevada deve exibir uma label com seu nome. A planta deve exibir a mesma label no lado
correspondente.

**Estado atual:** o sistema já resolve nomes de vista em `getViewLabelForHouseType`, mas a renderização do grupo da
casa ainda não materializa labels permanentes para cada vista e para o lado correspondente na planta.

**Direção proposta:**

1. Reutilizar a nomenclatura existente de vistas por tipo de casa.
2. Adicionar label visual em cada grupo de vista elevada.
3. Adicionar label correspondente na borda da planta, respeitando o lado associado à vista.
4. Garantir atualização quando vistas forem adicionadas, removidas, reconstruídas, importadas ou restauradas.

**Critérios de aceite:**

- Toda vista elevada visível exibe uma label legível com o nome da vista.
- A planta exibe a mesma label no lado correspondente.
- Labels não interferem em seleção, edição de pilotis, porta, escada ou contraventamento.
- Labels são preservadas em undo/redo, persistência e restauração.

**Pontos prováveis de impacto:**

- `src/components/rac-editor/lib/house-view.ts`
- `src/components/rac-editor/@canvas/lib/factory/house/house-top.strategy.ts`
- `src/components/rac-editor/@canvas/lib/factory/house/house-front-back.strategy.ts`
- `src/components/rac-editor/@canvas/lib/factory/house/house-side.strategy.ts`
- `src/components/rac-editor/lib/editor-house-view-runtime.ts`

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

**Necessidade:** criar uma opção no menu da toolbar para inserir um componente visual do tipo gauge. O gauge indicará a
dificuldade do terreno, calculada com base em fatores ainda a definir.

**Estado atual:** a toolbar já possui menus para elementos, linhas, texto livre e ações gerais. Objetos de canvas são
criados por estratégias em `@canvas/lib/factory/elements`.

**Direção proposta:**

1. Criar um novo tipo de objeto visual `gauge` no mecanismo de estratégias do canvas.
2. Adicionar ação correspondente na toolbar, preferencialmente no menu de elementos ou em um grupo visual dedicado.
3. Tornar o gauge serializável e restaurável com o documento da casa.
4. Separar a camada visual da regra de cálculo, pois os fatores de dificuldade ainda não foram definidos.
5. Quando a regra existir, conectar o gauge aos dados da casa/terreno em vez de manter valor manual ou estático.

**Critérios de aceite:**

- O usuário consegue inserir um gauge no canvas pela toolbar.
- O gauge é movível, selecionável, exportável em PDF e persistido junto com o desenho.
- O componente tem estado visual coerente mesmo antes da regra final de cálculo.
- A fórmula de dificuldade fica isolada em função testável quando os fatores forem definidos.

**Pontos prováveis de impacto:**

- `src/components/rac-editor/@menus/lib/menu-config.ts`
- `src/components/rac-editor/@menus/lib/menu-types.ts`
- `src/components/rac-editor/@menus/hooks/useRacEditorMenuActions.ts`
- `src/components/rac-editor/@canvas/hooks/useCanvasTools.ts`
- `src/components/rac-editor/@canvas/lib/factory/elements/`

**Bloqueio funcional:** faltam os fatores e pesos que definem a dificuldade do terreno.

### RD-006 - Corrigir cálculo de pedras por casa

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

**Ambiguidade a resolver:** o termo "pedras" pode significar o total `rachão + brita`, apenas `rachão`, apenas `brita`,
ou uma regra operacional distinta usada fora do sistema. Essa definição precisa ser confirmada antes da correção.

**Direção proposta:**

1. Validar a regra real esperada para "pedras" com os responsáveis do processo construtivo.
2. Comparar a fórmula esperada com `terrain-volume.ts`.
3. Corrigir fórmula, constantes, arredondamento e nomenclatura de UI conforme a regra confirmada.
4. Adicionar testes unitários com exemplos reais de casas.
5. Atualizar regra de negócio quando a fórmula correta for consolidada.

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

**Necessidade:** melhorar a experiência de carregamento inicial e do carregamento interno do editor. Hoje existem dois
loaders: um fallback estático em `index.html`, antes da montagem do React, e outro em `RacEditor` durante a preparação
do storage local e dos ports do editor.

**Estado atual:**

- `index.html` exibe um spinner simples com o texto `Carregando o Editor de RAC...`.
- `RacEditor.tsx` exibe apenas um spinner visual enquanto `useIndexedDbConstructionSiteSessionStorage` está em
  `loading`; o texto `Carregando o Canvas...` existe como `aria-label`, mas não aparece visualmente.

**Direção proposta:**

1. Criar um loader inicial inspirado no Gmail no `index.html`, com marca visual simples, barra/indicador de progresso e
   texto de carregamento.
2. Usar progresso por marcos conhecidos ou progresso estimado até a montagem do React.
3. Não prometer percentual real de bytes carregados sem instrumentação adicional dos assets, chunks e cache.
4. Substituir o fallback visual atual por uma experiência mais informativa e consistente com a identidade do produto.
5. No loader interno do `RacEditor`, manter o spinner e exibir também o texto visível `Carregando o Canvas...`.

**Critérios de aceite:**

- O carregamento inicial da aplicação mostra um indicador de progresso antes da montagem do React.
- O progresso não trava visualmente em estados intermediários quando o bundle demora.
- Se o React não montar dentro do limite atual de timeout, a tela de erro de asset continua funcionando.
- O loader interno do editor exibe o texto `Carregando o Canvas...` de forma visível e acessível.
- Os dois loaders têm linguagem visual compatível, mas continuam separados por responsabilidade.

**Pontos prováveis de impacto:**

- `index.html`
- `src/components/rac-editor/ui/RacEditor.tsx`
- testes de carregamento ou smoke tests visuais, se forem adicionados para cobrir a experiência.

**Observação técnica:** um percentual exato de carregamento no `index.html` só é confiável se o carregamento dos assets
for instrumentado. Sem isso, o caminho mais pragmático é uma barra progressiva por etapas ou estimada, encerrada quando
o React monta e remove o fallback.

### RD-008 - Gerenciamento de monitores

**PRD canônico:** `docs/product-requirements/PRD-002-gerenciamento-de-monitores.prd.md`.

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

## Ordem sugerida de execução

1. **RD-006**: fechar a regra de cálculo de pedras, porque ela influencia o gauge e pode afetar materiais exportados.
2. **RD-002**: concluído em 2026-05-13.
3. **RD-003** e **RD-004**: implementar labels de vistas e pilotis na mesma frente visual do canvas.
4. **RD-001**: melhorar exportação PDF com nome configurável e fallback de download.
5. **RD-007**: qualificar os loaders, por ser uma melhoria isolada de UX com baixo acoplamento.
6. **RD-008**: modelar e implementar gestão de monitores por Construção TETO.
7. **RD-009**: concluído em 2026-05-15.
8. **RD-005**: inserir gauge visual; conectar cálculo automático apenas depois da definição dos fatores.

## Perguntas em aberto

1. Qual é a fórmula operacional correta para "pedras"?
2. "Pedras" corresponde a rachão, brita, soma de ambos ou outro insumo?
3. Quais fatores entram na dificuldade do terreno para o gauge?
4. A dificuldade do terreno deve usar dados já persistidos em `siteAssessment`, níveis dos pilotis, tipo de solo do
   editor, obstáculos, ou uma combinação desses fatores?
5. O destino configurável do PDF deve mirar apenas navegadores Chromium ou precisa de fallback equivalente para todos
   os navegadores suportados?
6. O indicador do loader inicial deve representar progresso real instrumentado ou progresso estimado por percepção de
   carregamento?
7. Monitores da Construção TETO devem registrar função ou período de atuação em iniciativa futura?
8. Monitores devem aparecer em exportações, relatórios ou impressão da RAC em iniciativa futura? Em caso positivo, em
   qual seção?
