---
title: Sobre a Casa na Edição da Casa
id: PRD-003
doc_type: prd
doc_role: product-requirements
doc_set: product-requirements
status: implemented
version: "1.0.0"
owners: [ ]
lang: pt-BR
---

# Sobre a Casa na Edição da Casa

> Este é o artefato humano primário da iniciativa. Não há JSON derivado nem sidecar de assets nesta
> versão do PRD.

## 1. Visão Geral

- problema: A tela de edição/configuração da casa mistura dados cadastrais da família com
  informações próprias da casa, especialmente o campo `Notas`, que aparece hoje em `Detalhes da
  Família` apesar de já existir referência a notas no registro persistido da casa. Essa ambiguidade
  dificulta distinguir o que descreve a família e o que descreve a unidade habitacional.

- objetivo da iniciativa: Criar a seção `Sobre a Casa` imediatamente após `Detalhes da Família`,
  concentrando nela dados opcionais próprios da casa: `Tamanho da Casa`, `Líderes` e `Notas`.

- decisão de escopo: `Sobre a Casa` pertence ao formulário de edição/configuração da casa. Os campos
  desta seção são opcionais e não devem bloquear o salvamento quando vazios.

- distinção funcional: `Tamanho da Casa` é metadado cadastral da casa nesta iniciativa; ele não
  substitui nem altera o tipo estrutural usado pelo desenho, pelas vistas, pelo canvas ou pelo 3D.

- premissa operacional: `Notas`, ao aparecer em `Sobre a Casa`, deve representar observações da
  casa, não notas cadastrais herdadas da família por posicionamento anterior da UI.

## 2. Metas

- Separar visual e semanticamente dados da família e dados da casa.

- Exibir `Sobre a Casa` logo após `Detalhes da Família` no fluxo de edição/configuração da casa.

- Permitir registrar `Tamanho da Casa` como informação opcional, com estado vazio e opções `Grande`
  e `Pequena`.

- Manter `Tamanho da Casa` desacoplado do tipo estrutural da casa nesta iniciativa.

- Permitir registrar `Líderes` como informação opcional da casa.

- Mover `Notas` de `Detalhes da Família` para `Sobre a Casa`.

- Preservar dados existentes ao salvar a configuração da casa sem exigir preenchimento dos novos
  campos.

- Reduzir ambiguidade de persistência e leitura das notas associadas à casa.

## 3. Histórias De Usuário

### US-001: Visualizar a seção Sobre a Casa

**Descrição:** Como monitor voluntário, quero encontrar uma seção `Sobre a Casa` logo após `Detalhes
da Família` para entender onde registrar informações próprias da unidade habitacional.

**Critérios de aceitação:**

- [x] A tela de edição/configuração da casa exibe `Sobre a Casa` imediatamente após `Detalhes da
  Família`.

- [x] A seção `Sobre a Casa` contém os campos `Tamanho da Casa`, `Líderes` e `Notas`.

- [x] `Detalhes da Família` continua contendo apenas informações cadastrais da família.

- [x] A UI deixa clara a separação entre dados da família e dados da casa.

- [x] O comportamento é verificado em navegador com Playwright ou automação equivalente.

### US-002: Informar tamanho da casa

**Descrição:** Como monitor voluntário, quero informar opcionalmente o tamanho da casa para
registrar se a unidade é grande, pequena ou ainda não classificada.

**Critérios de aceitação:**

- [x] `Tamanho da Casa` aceita estado vazio, sem seleção obrigatória.

- [x] `Tamanho da Casa` oferece as opções `Grande` e `Pequena`.

- [x] Salvar a casa com `Tamanho da Casa` vazio não exibe erro de validação.

- [x] A escolha de `Grande` ou `Pequena` é preservada ao salvar, sair da tela e retornar à edição da
  mesma casa.

- [x] O comportamento é verificado em navegador com Playwright ou automação equivalente.

### US-003: Registrar líderes da casa

**Descrição:** Como monitor voluntário, quero registrar opcionalmente os líderes relacionados à casa
para manter essa informação junto à unidade habitacional sem misturá-la aos dados da família.

**Critérios de aceitação:**

- [x] `Líderes` aparece em `Sobre a Casa`.

- [x] `Líderes` não é obrigatório.

- [x] Salvar a casa com `Líderes` vazio não exibe erro de validação.

- [x] Quando preenchido, o valor de `Líderes` é preservado ao salvar, sair da tela e retornar à
  edição da mesma casa.

- [x] O campo não obriga associação com monitores cadastrados nesta iniciativa.

- [x] O comportamento é verificado em navegador com Playwright ou automação equivalente.

### US-004: Mover notas para Sobre a Casa

**Descrição:** Como monitor voluntário, quero registrar notas na seção `Sobre a Casa` para que as
observações sejam entendidas como informações da casa, não como dados cadastrais da família.

**Critérios de aceitação:**

- [x] `Notas` deixa de aparecer em `Detalhes da Família`.

- [x] `Notas` aparece em `Sobre a Casa`.

- [x] `Notas` não é obrigatório.

- [x] Salvar a casa com `Notas` vazio não exibe erro de validação.

- [x] Notas existentes continuam disponíveis após a mudança de seção quando pertencem ao registro da
  casa.

- [x] O comportamento é verificado em navegador com Playwright ou automação equivalente.

### US-005: Salvar configuração sem preencher dados opcionais

**Descrição:** Como monitor voluntário, quero salvar a configuração da casa sem preencher os campos
opcionais de `Sobre a Casa` para continuar editando apenas os dados que tenho no momento.

**Critérios de aceitação:**

- [x] O formulário permite salvar com `Tamanho da Casa`, `Líderes` e `Notas` vazios.

- [x] O salvamento preserva dados já existentes de família, casa e local.

- [x] Reabrir a casa após salvar não cria valores padrão indevidos nos campos opcionais.

- [x] Alterações nos campos de `Sobre a Casa` não sobrescrevem indevidamente campos de `Detalhes da
  Família`.

- [x] O comportamento é verificado em navegador com Playwright ou automação equivalente.

## 4. Requisitos Funcionais

- `FR-1:` O sistema deve exibir a seção `Sobre a Casa` na tela de edição/configuração da casa.

- `FR-2:` `Sobre a Casa` deve aparecer imediatamente após `Detalhes da Família`.

- `FR-3:` `Sobre a Casa` deve conter o campo `Tamanho da Casa`.

- `FR-4:` `Tamanho da Casa` deve ser opcional.

- `FR-5:` `Tamanho da Casa` deve permitir estado vazio ou sem seleção.

- `FR-6:` `Tamanho da Casa` deve oferecer as opções `Grande` e `Pequena`.

- `FR-7:` `Tamanho da Casa` não deve alterar o tipo estrutural da casa usado pelo desenho, pelas
  vistas, pelo canvas ou pelo 3D.

- `FR-8:` `Sobre a Casa` deve conter o campo `Líderes`.

- `FR-9:` `Líderes` deve ser opcional.

- `FR-10:` Nesta iniciativa, `Líderes` deve funcionar como informação da casa sem exigir vínculo com
  monitores cadastrados.

- `FR-11:` `Notas` deve ser movido de `Detalhes da Família` para `Sobre a Casa`.

- `FR-12:` `Notas` deve ser opcional.

- `FR-13:` Após a mudança de seção, `Notas` deve representar observações da casa.

- `FR-14:` Salvar a configuração deve preservar dados existentes e gravar os campos de `Sobre a
  Casa` quando preenchidos.

- `FR-15:` Salvar a configuração não deve exigir preenchimento de `Tamanho da Casa`, `Líderes` ou
  `Notas`.

- `FR-16:` A interface deve evitar linguagem ou agrupamento visual que sugira que os campos de
  `Sobre a Casa` pertencem à família.

- `FR-17:` A presença, opcionalidade, posição e persistência dos campos devem ser cobertas por
  testes de formulário ou smoke tests equivalentes.

## 5. Não Objetivos

- Criar um cadastro separado de líderes.

- Associar `Líderes` automaticamente aos monitores da Construção TETO.

- Definir papéis, funções, permissões ou período de atuação dos líderes.

- Substituir, recalcular ou reinterpretar o tipo estrutural da casa usado pelo desenho.

- Alterar o cadastro de famílias além da remoção visual de `Notas` da seção `Detalhes da Família`.

- Alterar o fluxo principal do Canvas ou ferramentas de desenho.

- Alterar exportação PDF, relatórios ou impressão da RAC.

- Implementar importação ou migração complexa de dados históricos fora do necessário para preservar
  notas existentes.

- Criar backend remoto, autenticação, autorização ou sincronização entre dispositivos.

## 6. Considerações De Design

- A seção `Sobre a Casa` deve seguir o padrão visual das seções existentes da tela de configuração
  da casa.

- A ordem das seções deve reforçar a leitura: primeiro dados da família, depois dados da casa.

- `Tamanho da Casa` deve deixar evidente que a ausência de valor é aceitável.

- `Líderes` deve aceitar preenchimento simples e não deve sugerir, nesta entrega, uma seleção
  obrigatória de entidades cadastradas em outro módulo.

- `Notas` deve manter tratamento compatível com o comportamento atual de campo livre, apenas
  reposicionado e ressignificado como dado da casa.

- Em telas menores, a nova seção deve permanecer legível e editável sem prejudicar o fluxo de salvar
  a configuração.

## 7. Conceitos De Dados

| Conceito               | Papel no domínio                                                                                          |
|------------------------|-----------------------------------------------------------------------------------------------------------|
| `Family`               | Família beneficiária vinculada à casa; seus dados cadastrais permanecem em `Detalhes da Família`.         |
| `House`                | Unidade habitacional editável; passa a concentrar informações próprias em `Sobre a Casa`.                 |
| `HouseSize`            | Classificação opcional da casa, inicialmente vazia, `Grande` ou `Pequena`.                                |
| `HouseLeaders`         | Informação opcional sobre líderes relacionados à casa, sem vínculo obrigatório com monitores nesta etapa. |
| `HouseNotes`           | Observações opcionais da casa, exibidas em `Sobre a Casa`.                                                |
| `PersistedHouseRecord` | Registro persistido da casa, já citado no roadmap como contendo `notes`.                                  |

## 8. Métricas De Sucesso

- Usuário encontra `Sobre a Casa` logo após `Detalhes da Família` sem procurar em outra área do
  produto.

- Usuário salva a configuração da casa sem preencher os novos campos opcionais.

- Usuário consegue preencher `Grande` ou `Pequena` e reencontrar a escolha ao retornar à edição da
  casa.

- Usuário consegue preencher `Líderes` e reencontrar a informação ao retornar à edição da casa.

- Notas existentes de casa continuam acessíveis depois de movidas para a nova seção.

- A UI não apresenta `Notas` como dado da família.

- Testes automatizados ou verificação em navegador cobrem posição da seção, opcionalidade e
  persistência dos campos.

## 9. Questões Em Aberto

- `Líderes` deve permanecer como texto livre em iniciativas futuras ou evoluir para seleção de
  monitores cadastrados?

- `Tamanho da Casa` precisa ter impacto futuro em desenho, materiais, exportação ou relatórios, ou é
  apenas informação cadastral da casa?

- O estado vazio de `Tamanho da Casa` deve ser persistido explicitamente como valor próprio ou
  tratado como ausência de seleção?

- Existem notas históricas associadas à família que precisam continuar visíveis em outro local
  depois da mudança?

- Exportações futuras da RAC devem incluir `Tamanho da Casa`, `Líderes` e `Notas`?

## 10. Referências E Artefatos Auxiliares

- Roadmap:
    - [RD-009 - Seção "Sobre a Casa" na edição da casa](../../ROADMAP.md)

- Documentação relacionada:
    - [PRD-001-evolucao-multicasa.prd.md](./PRD-001-evolucao-multicasa.prd.md)
    - [PRD-002-gerenciamento-de-monitores.prd.md](./PRD-002-gerenciamento-de-monitores.prd.md)

- Código atual relacionado:
    - [HouseConfigurationScreen.tsx](../../src/components/construction-site/ui/HouseConfigurationScreen.tsx)
    - [view-model.ts](../../src/components/construction-site/ui/lib/view-model.ts)
    - [construction-site-form-validation.ts](../../src/components/construction-site/lib/construction-site-form-validation.ts)
    - [construction-site.ts](../../src/shared/types/construction-site.ts)
