---
title: Gerenciamento de Monitores por Construção TETO
id: PRD-002
doc_type: prd
doc_set: product-requirements
status: implemented
version: "1.0.0"
owners: [ ]
lang: pt-BR
---

# Gerenciamento de Monitores por Construção TETO

> Este é o artefato humano primário da iniciativa. Não há JSON derivado nem sidecar de assets nesta versão do PRD.

## 1. Visão Geral

- problema:
  O RAC Designer TETO já organiza Construções TETO, casas e famílias, mas ainda não possui uma coleção própria de
  monitores. Com isso, a equipe responsável por uma construção não fica registrada de forma explícita, persistente e
  consultável dentro do produto.
- objetivo da iniciativa:
  Permitir cadastrar, listar, editar, inativar e reativar monitores vinculados a uma Construção TETO específica, com
  nome e telefone obrigatórios, foto e e-mail opcionais, e preservação histórica por inativação lógica.
- decisão de escopo:
  Monitores pertencem à Construção TETO, não à casa nem à família. Cada Construção TETO mantém seu próprio grupo de
  monitores, sem compartilhamento automático com outras construções.

## 2. Metas

- Registrar a equipe de monitores de cada Construção TETO.
- Permitir criar e editar monitores sem gerar duplicidade acidental de registros.
- Exibir, por padrão, os monitores ativos da Construção TETO em foco.
- Permitir consultar monitores inativos por filtro de status.
- Permitir reativar monitores inativados.
- Preservar registros de monitores por inativação lógica, sem exclusão física.
- Oferecer acesso pela listagem de Construções TETO, por botão de ação no item da construção.
- Preparar o modelo para exportações, relatórios ou impressão futuros, sem entregar esses fluxos nesta iniciativa.

## 3. Histórias De Usuário

### US-001: Listar monitores da Construção TETO

**Descrição:** Como monitor voluntário, quero visualizar os monitores da Construção TETO em foco para entender quem
compõe a equipe daquela construção.

**Critérios de aceitação:**

- [x] A listagem exibe apenas monitores pertencentes à Construção TETO em foco.
- [x] Monitores ativos aparecem por padrão.
- [x] A UI deixa claro a qual Construção TETO o grupo de monitores pertence.
- [x] Trocar de Construção TETO altera a lista de monitores exibida.
- [x] O comportamento é verificado em navegador com Playwright ou automação equivalente.

### US-002: Cadastrar monitor

**Descrição:** Como monitor voluntário, quero cadastrar um monitor com dados de contato mínimos para registrar a equipe
responsável pela Construção TETO.

**Critérios de aceitação:**

- [x] O cadastro exige nome do monitor.
- [x] O cadastro exige telefone do monitor.
- [x] Foto e e-mail são opcionais.
- [x] Telefone e e-mail seguem validações consistentes com os formulários atuais de gestão.
- [x] O novo monitor aparece na listagem ativa da Construção TETO em foco após salvar.
- [x] O comportamento é verificado em navegador com Playwright ou automação equivalente.

### US-003: Editar monitor existente

**Descrição:** Como monitor voluntário, quero atualizar os dados de um monitor já cadastrado para manter contatos e foto
corretos sem recriar o registro.

**Critérios de aceitação:**

- [x] A edição preserva a identidade do monitor existente.
- [x] Alterar nome, telefone, foto ou e-mail atualiza o registro sem criar duplicidade.
- [x] A UI bloqueia telefone ou e-mail inválidos quando preenchidos.
- [x] As alterações persistem ao trocar de tela e retornar à Construção TETO.
- [x] O comportamento é verificado em navegador com Playwright ou automação equivalente.

### US-004: Inativar e reativar monitor

**Descrição:** Como monitor voluntário, quero inativar monitores que não atuam mais naquela Construção TETO e
reativá-los
quando necessário, sem apagar histórico.

**Critérios de aceitação:**

- [x] Inativar um monitor muda seu status para inativo sem excluir o registro.
- [x] Monitores inativos deixam de aparecer na listagem ativa padrão.
- [x] O filtro de status permite consultar monitores inativos.
- [x] Um monitor inativo pode ser reativado e voltar à listagem ativa padrão.
- [x] A ação de inativação usa confirmação compatível com ações similares de arquivamento no gerenciamento.
- [x] O comportamento é verificado em navegador com Playwright ou automação equivalente.

### US-005: Acessar monitores pela navegação existente

**Descrição:** Como monitor voluntário, quero acessar Monitores a partir do fluxo de Construções TETO para continuar no
contexto operacional correto.

**Critérios de aceitação:**

- [x] O menu oferece acesso a `Construções TETO`, sem tratar monitores como subopção global.
- [x] A listagem de Construções TETO expõe a gestão de monitores por botão de ação no item da construção.
- [x] A navegação não mistura monitores de construções diferentes.
- [x] O Canvas e as ferramentas de desenho não precisam ser alterados além do acesso de navegação necessário.
- [x] O caminho `Construções TETO` seguido do botão `Gerenciar monitores da construção` é verificado em navegador com
  Playwright ou automação equivalente.

## 4. Requisitos Funcionais

- `FR-1:` O sistema deve manter uma coleção de monitores pertencente a cada Construção TETO.
- `FR-2:` Monitores não devem ser compartilhados automaticamente entre Construções TETO.
- `FR-3:` O sistema deve permitir listar, cadastrar, editar, inativar e reativar monitores.
- `FR-4:` Nome do monitor deve ser obrigatório.
- `FR-5:` Telefone do monitor deve ser obrigatório.
- `FR-6:` Foto do monitor deve ser opcional.
- `FR-7:` E-mail do monitor deve ser opcional.
- `FR-8:` Telefone e e-mail devem usar validação consistente com os formulários atuais de gestão.
- `FR-9:` A listagem deve exibir, por padrão, somente monitores ativos da Construção TETO em foco.
- `FR-10:` A listagem deve permitir filtro por status para consultar monitores ativos e inativos.
- `FR-11:` A inativação deve preservar o registro e seu vínculo histórico com a Construção TETO.
- `FR-12:` O sistema não deve impor limite fixo de monitores por Construção TETO.
- `FR-13:` A UI deve deixar claro a qual Construção TETO o grupo de monitores pertence.
- `FR-14:` O caminho de navegação deve partir de `Construções TETO` e abrir monitores pelo botão de ação da construção
  selecionada na listagem.
- `FR-15:` A gestão de monitores deve ser feita em componente dedicado, ainda que acessado pela tela de gestão de
  Construção TETO.
- `FR-16:` O modelo deve ficar apto a uso futuro em exportações, relatórios ou impressão, sem entregar esses fluxos na
  RD-008.

## 5. Não Objetivos

- Implementar compartilhamento global de monitores entre Construções TETO.
- Associar monitores diretamente a casas ou famílias nesta iniciativa.
- Definir função, papel, responsabilidade ou período de atuação do monitor.
- Implementar exportação, relatório ou impressão de monitores.
- Alterar o conteúdo do PDF/RAC impresso.
- Implementar autenticação, permissões ou perfis de usuário.
- Criar backend remoto ou sincronização entre dispositivos.
- Alterar o fluxo central de desenho do Canvas além da navegação necessária.

## 6. Considerações De Design

- A experiência deve permanecer dentro da área de gestão de Construções TETO.
- A listagem de monitores deve seguir padrões já usados nas listagens de Construções TETO e casas, incluindo filtro por
  status e ações claras por registro.
- O cadastro e a edição devem usar formulário direto, com nome e telefone em posição prioritária.
- Foto de monitor deve seguir o padrão de upload local já usado em Construção TETO e família.
- A inativação deve usar linguagem compatível com arquivamento lógico, deixando claro que o registro não será apagado.
- Em telas menores, a gestão de monitores deve continuar utilizável sem exigir interação com o Canvas.

## 7. Conceitos De Dados

| Conceito           | Papel no domínio                                                                                             |
|--------------------|--------------------------------------------------------------------------------------------------------------|
| `ConstructionSite` | Raiz da Construção TETO, agora também responsável por agrupar monitores próprios.                            |
| `Monitor`          | Pessoa cadastrada como monitor de uma Construção TETO específica, com nome, telefone, foto, e-mail e status. |
| `MonitorStatus`    | Estado lógico do monitor dentro da Construção TETO, inicialmente ativo ou inativo.                           |

## 8. Métricas De Sucesso

- Usuário consegue cadastrar um monitor válido com nome e telefone, sem preencher foto ou e-mail.
- Cadastro sem nome ou sem telefone é bloqueado com mensagem compreensível.
- Telefone e e-mail inválidos são bloqueados de forma consistente com os demais formulários de gestão.
- Trocar de Construção TETO altera corretamente a lista de monitores exibida.
- Editar monitor existente não cria registro duplicado.
- Inativar monitor remove o registro da listagem ativa padrão sem apagar o vínculo histórico.
- Filtrar por status permite encontrar e reativar monitor inativo.
- O caminho `Construções TETO` seguido do botão de gerenciar monitores da construção é verificável em navegador.

## 9. Questões Em Aberto

- Monitores devem ganhar função, papel ou período de atuação em uma iniciativa futura?
- Em futuras exportações ou relatórios, os monitores devem aparecer por Construção TETO inteira ou por casa vinculada?
- Será necessário importar monitores a partir das colunas históricas `monitor-1...monitor-6` e respectivos telefones?
- Haverá deduplicação manual ou assistida quando o mesmo monitor for cadastrado em Construções TETO diferentes?

## 10. Referências E Artefatos Auxiliares

- Roadmap:
    - [RD-008 - Gerenciamento de monitores](../../ROADMAP.md)
- Documentação relacionada:
    - [PRD-001-evolucao-multicasa.prd.md](./PRD-001-evolucao-multicasa.prd.md)
    - [BUS-002-toolbar.md](../business-rules/BUS-002-toolbar.md)
- Código atual relacionado:
    - [construction-site.ts](../../src/shared/types/construction-site.ts)
    - [ConstructionSiteManagementPanel.tsx](../../src/components/construction-site/ui/ConstructionSiteManagementPanel.tsx)
    - [construction-site-form-validation.ts](../../src/components/construction-site/lib/construction-site-form-validation.ts)
    - [HamburgerMenu.tsx](../../src/components/rac-editor/@menus/ui/HamburgerMenu.tsx)
