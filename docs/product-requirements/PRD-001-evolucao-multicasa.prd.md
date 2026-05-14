---
title: Evolução Multicasa do RAC Designer TETO
id: PRD-001
doc_type: prd
doc_set: product-requirements
status: implemented
version: "1.0.0"
owners: [ ]
lang: pt-BR
---

# Evolução Multicasa do RAC Designer TETO

> Este é o artefato humano primário da iniciativa. O JSON derivado adjacente existe para consumo estruturado e o
> sidecar `PRD-001-evolucao-multicasa.prd.assets/` concentra evidências, diagramas, exportações brutas e material
> auxiliar.

## 1. Visão Geral

- problema:
  O editor operava sobre uma única casa e não distinguia a gestão operacional da Construção TETO do estado de desenho
  da casa.
- objetivo da iniciativa:
  Evoluir o RAC Designer TETO para um editor local-first com Construções TETO, múltiplas casas por construção,
  associação explícita entre casa e família e persistência durável do último estado do canvas por casa.
- decisão de nomenclatura:
  O código interno usa `ConstructionSite*`; a UI usa “Construção TETO”.

## 2. Metas

- Permitir criar, arquivar, desarquivar, listar e trocar Construções TETO.
- Registrar Código da CC, Data da Construção, Comunidade e foto opcional por Construção TETO.
- Permitir criar, arquivar, desarquivar, listar e editar casas dentro da Construção TETO ativa.
- Identificar cada casa pelo nome da família associada, sem nome próprio de casa.
- Persistir o último documento de desenho da casa no banco local.
- Abrir o RAC Editor somente quando houver Construção TETO ativa com pelo menos uma casa ativa.
- Restaurar no boot a casa não arquivada com maior `updatedAt`, considerando todas as Construções TETO.

## 3. Histórias De Usuário

### US-001: Criar e trocar Construções TETO

**Descrição:** Como monitor voluntário, quero criar e abrir Construções TETO para organizar minhas atividades por Código
da CC e comunidade.

**Critérios de aceitação:**

- [x] O sistema permite criar Construção TETO com Código da CC, Data da Construção e Comunidade.
- [x] O sistema lista e troca Construções TETO existentes.
- [x] O sistema permite arquivar e desarquivar Construção TETO de forma lógica e com confirmação.
- [x] Ao abrir uma Construção TETO, o sistema carrega suas casas e dados associados.

### US-002: Gerenciar casas da construção

**Descrição:** Como monitor voluntário, quero criar, arquivar e desarquivar casas dentro de uma Construção TETO para
administrar múltiplas unidades habitacionais.

**Critérios de aceitação:**

- [x] O sistema permite criar casa vinculada à Construção TETO ativa.
- [x] O sistema identifica a casa pelo nome da família designada.
- [x] O sistema permite arquivar e desarquivar casas com confirmação apropriada.
- [x] O sistema restaura o desenho correto ao alternar entre casas da mesma Construção TETO.

### US-003: Vincular famílias às casas

**Descrição:** Como monitor voluntário, quero associar uma família a cada casa para manter a relação entre beneficiários
e Construção TETO de forma durável.

**Critérios de aceitação:**

- [x] Cada casa está associada a uma única família.
- [x] A seção inicial do detalhe da casa contém os dados da família.
- [x] Alterar o nome da família altera o rótulo da casa no FAB e nas listagens.
- [x] A associação entre casa e família permanece consistente após recarregar a aplicação.

### US-004: Registrar informações de local

**Descrição:** Como monitor voluntário, quero registrar condições do local da casa para orientar o desenho e a montagem.

**Critérios de aceitação:**

- [x] O sistema oferece interface dedicada para informações de local por casa.
- [x] Os dados de solo e obstáculos permanecem persistidos separadamente do desenho.
- [x] Desnível não faz parte desta etapa.

### US-005: Alternar entre gerenciamento e RAC Editor

**Descrição:** Como monitor voluntário, quero alternar entre gestão de Construções TETO e Canvas sem perder o estado da
casa ativa.

**Critérios de aceitação:**

- [x] Sem Construção TETO com casa ativa, a aplicação abre diretamente no gerenciamento.
- [x] A seta contextual do gerenciamento só retorna ao Canvas quando houver uma casa ativa válida.
- [x] No Canvas, o FAB hamburger exibe “Construções TETO” primeiro e agrupa casas por código da construção.
- [x] O menu do usuário não contém “Construções TETO”.

## 4. Requisitos Funcionais

- `FR-1:` O sistema deve persistir Construções TETO em IndexedDB.
- `FR-2:` Construção TETO deve possuir Código da CC, Data da Construção, Comunidade, foto opcional, status e metadados
  técnicos.
- `FR-3:` O sistema deve permitir criar, arquivar, desarquivar, listar e trocar Construções TETO.
- `FR-4:` O sistema deve permitir criar, arquivar, desarquivar, listar e editar casas dentro da Construção TETO ativa.
- `FR-5:` Casa deve pertencer a uma única Construção TETO e estar associada a uma única família.
- `FR-6:` O rótulo da casa na UI deve ser derivado do nome da família associada.
- `FR-7:` O sistema deve persistir e restaurar o `HouseDrawingDocument` da casa ativa.
- `FR-8:` O RAC Editor não deve montar quando não houver Construção TETO ativa com casa ativa.
- `FR-9:` O boot deve restaurar a casa não arquivada com maior `updatedAt`, considerando todas as construções.
- `FR-10:` Importação e exportação JSON não devem fazer parte da navegação principal.

## 5. Não Objetivos

- Implementar autenticação e autorização nesta fase.
- Entregar colaboração em tempo real nesta fase.
- Implementar backend remoto nesta fase.
- Reintroduzir importação/exportação JSON como fluxo principal de navegação.
- Tratar objetos Fabric brutos como contrato durável de persistência.

## 6. Considerações De Design

- O Canvas continua sendo a experiência principal quando há casa válida para edição.
- O gerenciamento é um módulo separado de `src/components/rac-editor`, localizado em `src/components/construction-site`.
- No modo de gerenciamento, canvas, toolbar e submenus ficam ocultos.
- No modo de gerenciamento, a seta contextual do cabeçalho substitui o retorno flutuante.
- A tela de gerenciamento prioriza CRUD de Construções TETO e casas, não composição visual de desenho.

## 7. Conceitos De Dados

| Conceito               | Papel no domínio                                                                                             |
|------------------------|--------------------------------------------------------------------------------------------------------------|
| `ConstructionSite`     | Raiz da Construção TETO, com Código da CC, Data da Construção, Comunidade, foto opcional e coleção de casas. |
| `Community`            | Comunidade associada à Construção TETO.                                                                      |
| `Family`               | Família beneficiária vinculada a uma única casa nesta etapa.                                                 |
| `House`                | Unidade editável pertencente à Construção TETO e associada a uma família.                                    |
| `SiteAssessment`       | Informações de local da casa, sem desnível nesta etapa.                                                      |
| `HouseDrawingDocument` | Documento serializável do estado lógico e visual da casa ativa.                                              |

## 8. Métricas De Sucesso

- Usuários conseguem criar Construção TETO, criar casas e retornar ao Canvas sem perda de estado.
- Alternância entre casas da mesma Construção TETO restaura o desenho correto.
- Recarregar a aplicação abre a última casa editada quando houver casa ativa válida.
- Boot sem dados ou com construção sem casa abre gerenciamento com Back desabilitado.

## 9. Questões Em Aberto

- Como será feita a sincronização futura entre dispositivos?
- Haverá versionamento histórico por casa ou apenas a última versão consolidada?
- Qual formato será usado para exportações futuras consolidadas, como planilha ou relatório?

## 10. Referências E Artefatos Auxiliares

- Código atual relacionado:
    - [construction-site-session.ts](../../src/components/rac-editor/lib/construction-site-session.ts)
    - [ConstructionSiteManagementPanel.tsx](../../src/components/construction-site/ui/ConstructionSiteManagementPanel.tsx)
    - [ConstructionSiteManagementPort.ts](../../src/components/construction-site/ports/ConstructionSiteManagementPort.ts)
    - [house-drawing-document.ts](../../src/shared/types/house-drawing-document.ts)
- Evidências e material auxiliar:
    - [Plano técnico derivado](./PRD-001-evolucao-multicasa.prd.assets/derived/multi_house_persistence_plan.md)
    - [Diagrama de arquitetura](./PRD-001-evolucao-multicasa.prd.assets/diagrams/multi_house_persistence_architecture.mmd)
