---
title: Evolução Multicasa do RAC Designer TETO
id: PRD-001
doc_type: prd
doc_set: product-requirements
status: review
version: "0.1.0"
owners: []
lang: pt-BR
---

# Evolução Multicasa do RAC Designer TETO

> Este é o artefato humano primário da iniciativa. O JSON derivado adjacente existe para consumo estruturado e o
> sidecar `PRD-001-evolucao-multicasa.prd.assets/` concentra evidências, diagramas, exportações brutas e material
> auxiliar.

## 1. Visão geral

- problema:
  O editor atual opera sobre uma única casa, com persistência centrada em `localStorage` e sem um modelo durável de
  projeto, famílias e múltiplas casas.
- objetivo da iniciativa:
  Evoluir o RAC Designer TETO para um editor de projetos multi-casas, com persistência durável, associações explícitas
  entre famílias e casas e capacidade de importação, exportação e gestão de projeto.
- contexto relevante:
  A aplicação já possui editor 2D/3D funcional, usa React 18, Vite, Tailwind CSS e Fabric.js, e já dispõe de sinais
  fortes de domínio extraídos da planilha de referência da operação.

## 2. Metas

- Permitir gestão de múltiplos projetos e múltiplas casas dentro de cada projeto.
- Tornar duráveis as associações entre projeto, casa, família, avaliação de local, layout de piloti e desenho.
- Remover a dependência de `localStorage` como mecanismo principal de persistência.
- Permitir exportação e reimportação de documentos versionados de projeto.
- Preservar a experiência de edição atual enquanto o estado deixa de ser centrado no canvas.

## 3. Histórias de usuário

### US-001: Criar e abrir projetos

**Descrição:** Como monitor voluntário, quero criar e abrir projetos de construção para organizar minhas atividades por
campanha ou comunidade.

**Critérios de aceitação:**

- [ ] O sistema permite criar um projeto com identificação externa, nome e comunidade associada.
- [ ] O sistema exibe a lista de projetos existentes com filtros básicos.
- [ ] Ao abrir um projeto, o sistema carrega as casas e dados associados sem exigir reconstrução manual.

### US-002: Gerenciar casas dentro do projeto

**Descrição:** Como monitor voluntário, quero criar, renomear, duplicar e excluir casas dentro de um projeto para
administrar múltiplas unidades habitacionais com agilidade.

**Critérios de aceitação:**

- [ ] O sistema permite criar uma nova casa vinculada ao projeto ativo.
- [ ] O sistema permite renomear, duplicar e excluir casas com confirmação apropriada.
- [ ] O sistema restaura o desenho correto ao alternar entre casas do mesmo projeto.

### US-003: Vincular famílias às casas

**Descrição:** Como monitor voluntário, quero associar uma família a cada casa para manter a relação entre beneficiários
e projeto construída de forma durável.

**Critérios de aceitação:**

- [ ] O sistema permite criar e editar dados essenciais da família.
- [ ] Cada casa pode ser vinculada a uma família existente ou recém-criada.
- [ ] A associação entre casa e família permanece consistente após recarregar ou reimportar o projeto.

### US-004: Registrar avaliação do local

**Descrição:** Como monitor voluntário, quero registrar desnível, obstáculos e condições do solo para orientar o desenho
e a montagem do piloti.

**Critérios de aceitação:**

- [ ] O sistema oferece interface dedicada para avaliação do local por casa.
- [ ] Os dados de solo e obstáculos permanecem persistidos separadamente do desenho.
- [ ] Alterações na avaliação do local podem ser recuperadas após nova abertura do projeto.

### US-005: Configurar layout de piloti

**Descrição:** Como monitor voluntário, quero definir piloti mestre, alturas e pontos de piloti para manter a coerência
estrutural da casa.

**Critérios de aceitação:**

- [ ] O sistema permite definir o piloti mestre e a altura mestre por casa.
- [ ] O sistema permite editar pontos individuais de piloti sem perder coerência com o layout geral.
- [ ] O resumo de pilotis deriva dos pontos persistidos, e não de campos manuais independentes.

### US-006: Exportar e restaurar projetos

**Descrição:** Como líder voluntário, quero exportar e reimportar um projeto completo para compartilhar, arquivar e
restaurar o trabalho sem perda de informações.

**Critérios de aceitação:**

- [ ] O sistema exporta um documento versionado contendo projeto, casas, famílias, avaliações, layout de piloti e
      desenho.
- [ ] O sistema reimporta o documento exportado preservando as associações entre entidades.
- [ ] O sistema mantém caminho futuro para exportação consolidada em planilha e PDF.

## 4. Requisitos funcionais

- `FR-1:` O sistema deve permitir CRUD de projetos de construção com código externo, nome, comunidade e status.
- `FR-2:` O sistema deve permitir CRUD de casas dentro do projeto ativo, incluindo duplicação e exclusão com
  confirmação.
- `FR-3:` O sistema deve persistir o estado do desenho por casa, sem tratar o canvas como fonte canônica única de
  verdade.
- `FR-4:` O sistema deve permitir CRUD de famílias e associação explícita entre família e casa.
- `FR-5:` O sistema deve capturar e persistir a avaliação do local por casa, incluindo desnível, condições de solo e
  obstáculos.
- `FR-6:` O sistema deve capturar e persistir layout de piloti por casa, incluindo piloti mestre, altura mestre e
  pontos individuais.
- `FR-7:` O sistema deve permitir exportação e importação de um documento versionado de projeto completo.
- `FR-8:` O sistema deve preparar o domínio para relatórios e exportação consolidada em formatos de planilha e PDF.
- `FR-9:` O sistema deve suportar alternância rápida entre casas dentro do projeto, restaurando desenho e dados
  associados.

## 5. Não objetivos

- Implementar autenticação e autorização na fase inicial.
- Entregar colaboração em tempo real nesta rodada.
- Fixar uma stack definitiva de backend antes da validação da fase local-first.
- Transformar objetos Fabric em contrato durável de persistência.

## 6. Considerações de design

- A experiência atual do editor deve ser preservada; a mudança principal é a evolução do modelo de estado e da
  persistência.
- O editor não deve obrigar o usuário a entender conceitos técnicos de projeto, família ou piloti além do necessário
  para operar o fluxo.
- A interface deve manter feedback claro ao alternar entre casas, salvar dados e recuperar contexto previamente editado.
- A estrutura de dados deve permitir expansão futura para dashboard de projeto, formulários de família e relatórios sem
  exigir remodelagem total do domínio.

## 7. Restrições e considerações relevantes

- A aplicação existente já usa React 18, Vite, Tailwind CSS e Fabric.js; a evolução deve respeitar essas dependências
  existentes no curto prazo.
- O documento de desenho deve ser persistido como payload serializável da casa, e não como grupo Fabric vivo.
- A primeira fase deve privilegiar persistência local durável e preparo para sincronização futura entre dispositivos.
- A modelagem do domínio deve refletir os agrupamentos observados na planilha de referência da operação da TETO.

## 8. Conceitos de dados

| Conceito | Papel no domínio |
|----------|------------------|
| `ConstructionProject` | Raiz do projeto de construção, contendo metadados, comunidade e coleção de casas. |
| `Community` | Lookup compartilhado para a comunidade do projeto. |
| `Family` | Beneficiário vinculado a uma ou mais casas do projeto. |
| `House` | Unidade editável principal, pertencente a um projeto e vinculada a uma família. |
| `SiteAssessment` | Avaliação do local por casa, com desnível, solo e obstáculos. |
| `PilotiLayout` | Configuração geral do piloti da casa, com mestre, alturas e regras agregadas. |
| `PilotiPoint` | Ponto individual de piloti, com código, altura e nível. |
| `HouseDrawingDocument` | Documento serializável do desenho da casa, separado do runtime do canvas. |
| `Person` e atribuições | Entidades reaproveitáveis para líderes, monitores e vínculos operacionais. |

## 9. Métricas de sucesso

- Usuários conseguem criar, abrir e editar múltiplos projetos sem perda de dados entre sessões.
- Alternância entre casas do mesmo projeto ocorre com resposta inferior a 2 segundos em cenários usuais.
- Exportação e reimportação de um projeto preservam integridade das entidades e do desenho.
- Famílias, avaliações de local e layout de piloti deixam de depender de campos transitórios fora do estado persistido.

## 10. Questões em aberto

- Qual provedor de autenticação faz mais sentido quando a fase cloud-ready começar?
- Haverá necessidade de colaboração em tempo real ou apenas compartilhamento assíncrono de projetos?
- O documento de desenho precisará suportar versionamento histórico por casa ou apenas a última versão consolidada?
- Como migrar dados já existentes em `localStorage` para a nova persistência sem surpreender usuários atuais?

## 11. Referências e artefatos auxiliares

- Código atual relacionado:
  - [house-manager.facade.ts](../../src/components/rac-editor/lib/house-manager.facade.ts)
  - [house.ts](../../src/shared/types/house.ts)
  - [house-persistence.port.ts](../../src/domain/house/house-persistence.port.ts)
  - [useRacEditorJsonActions.ts](../../src/components/rac-editor/hooks/useRacEditorJsonActions.ts)
- Evidências e material auxiliar:
  - [Plano técnico derivado](./PRD-001-evolucao-multicasa.prd.assets/derived/multi_house_persistence_plan.md)
  - [Diagrama de arquitetura](./PRD-001-evolucao-multicasa.prd.assets/diagrams/multi_house_persistence_architecture.mmd)
  - [Planilha RACS exportada em JSON](./PRD-001-evolucao-multicasa.prd.assets/sources/racs_sheet_grid.json)
  - [Planilha RACS exportada em TSV](./PRD-001-evolucao-multicasa.prd.assets/sources/racs_sheet_values.tsv)
