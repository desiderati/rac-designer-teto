# Refactoring Agents - Regras Operacionais

Este documento descreve as regras operacionais dos Agentes 1 (Análise Dinâmica) e 2 (Execução Autônoma) do sistema de
refatoração automática.

---

## 1. Agent 1: Intelligent Dynamic Analysis

### 1.1 Responsabilidade

Agent 1 é responsável por:

1. **Análise Dinâmica Semanalmente** - Executar às 06:00 GMT-3
2. **Detecção de Issues** - Identificar problemas reais no código
3. **Identificação de Opportunities** - Encontrar melhorias valiosas
4. **Reconhecimento de Progresso** - Detectar fases já completadas
5. **Geração de Plano Adaptativo** - Criar plano único baseado no estado atual
6. **Criação de Checklist Adaptativo** - Gerar testes de regressão relevantes

### 1.2 Dimensões de Análise

Agent 1 analisa o código em **6 dimensões**:

#### 1.2.1 File Structure

- Total de arquivos TypeScript/TSX
- Total de linhas de código
- Número de arquivos de teste
- Percentual de cobertura de testes

#### 1.2.2 Clean Architecture

- **Ports & Adapters Pattern** - Existe abstração de dependências?
- **CQRS Pattern** - Há separação de leitura/escrita?
- **Strategy Pattern** - Há padrões de estratégia?
- **Normalization Functions** - Quantas funções de normalização existem?
- **Duplicate Patterns** - Há código duplicado?
- **Magic Numbers** - Há valores hardcoded?

#### 1.2.3 Hooks SRP (Single Responsibility Principle)

- **Multiple useEffect** - Mais de 2 useEffect calls?
- **Multiple useState** - Mais de 3 useState calls?
- **Multiple useCallback** - Mais de 2 useCallback calls?
- **Large Hooks** - Hooks com mais de 150 linhas?

#### 1.2.4 Components

- Total de componentes React
- Estrutura de componentes

#### 1.2.5 Tests

- Testes passando vs falhando
- Cobertura de testes

#### 1.2.6 Code Patterns

- TypeScript usage
- Constants files
- Strategy patterns
- Code duplication

### 1.3 Detecção de Issues

Agent 1 detecta **3 níveis de severidade**:

#### Critical Issues 🚨

- Testes falhando (bloqueia refatoração)
- Funcionalidade quebrada
- Erros de tipo

**Ação:** Fase 1 do plano deve ser "Fix Critical Issues"

#### High Priority Issues ⚠️

- Cobertura de testes < 50%
- Padrões inconsistentes
- Arquivos grandes
- Duplicação de código

**Ação:** Fase 2 do plano deve ser "Address High Priority Issues"

#### Medium Priority Issues

- SRP violations em hooks
- Clean Architecture gaps
- Números mágicos

**Ação:** Incluir em oportunidades

### 1.4 Detecção de Opportunities

Agent 1 identifica **oportunidades valiosas** com prioridade:

#### High Priority Opportunities

- Implementar design patterns faltando (Ports/Adapters, CQRS, Strategies)
- Refatorar hooks para SRP
- Centralizar constantes

#### Medium Priority Opportunities

- Melhorar cobertura de testes
- Documentação

### 1.5 Reconhecimento de Progresso

Agent 1 detecta **fases já completadas**:

- ✅ Ports & Adapters Pattern implementado
- ✅ CQRS Pattern implementado
- ✅ Strategy Pattern implementado
- ✅ Constant Centralization completado
- ✅ Test Infrastructure em lugar

**Ação:** Não incluir fases completadas no plano

### 1.6 Geração de Plano Dinâmico

O plano gerado é **ÚNICO cada dia** e segue esta lógica:

```
Se houver Critical Issues:
  → Phase 1: Fix Critical Issues

Se houver High Priority Issues:
  → Phase 2: Address High Priority Issues

Para cada High Priority Opportunity:
  → Phase N: Implement Opportunity

Finalmente:
  → Phase N+1: Documentation & Polish
```

**Características do Plano:**

- Não é um template estático
- Adapta-se ao estado atual do código
- Muda diariamente se código muda
- Pula fases já completadas
- Prioriza issues críticas

### 1.7 Geração de Checklist Adaptativo

O checklist de regressão é **DINÂMICO** baseado em:

- Estrutura atual do código
- Mudanças recentes
- Issues detectadas
- Gaps de cobertura

**Testes Sempre Inclusos:**

1. Unit Tests - Core Functionality
2. Component Tests
3. Type Safety (TypeScript)
4. Code Quality (Linting)

**Testes Condicionais:**

- Se cobertura < 70%: Adicionar Coverage Analysis

**Testes Manuais (Informativo):**

- Listados mas não executados automaticamente

### 1.8 Saída do Agent 1

Agent 1 cria dois arquivos:

```
.agents/refactoring/YYYY-MM-DD/
├── refactoring-plan.md
│   ├── Current State Analysis
│   ├── Previously Completed Phases
│   ├── Critical Issues
│   ├── High Priority Issues
│   ├── Recommended Refactoring Phases
│   ├── Future Opportunities
│   ├── Recent Commits
│   └── Approval Checklist
│
└── regression-checklist.md
    ├── Overview
    ├── Automated Tests
    │   ├── Unit Tests
    │   ├── Component Tests
    │   ├── Type Safety
    │   ├── Code Quality
    │   └── Coverage (condicional)
    ├── Manual Tests (Informativo)
    └── Execution Rules
```

### 1.9 Notificação

Agent 1 notifica via App Manus:

- Plano está pronto para revisão
- Resumo de análise
- Issues detectadas
- Opportunities encontradas

---

## 2. Agent 2: Autonomous Execution

### 2.1 Responsabilidade

Agent 2 é responsável por:

1. **Execução Autônoma** - Executar plano sem intervenção
2. **Testes de Regressão** - Validar cada fase
3. **Auto-Correção** - Tentar corrigir falhas automaticamente
4. **Rollback Seguro** - Voltar se não conseguir corrigir
5. **Notificação Final** - Reportar resultado

### 2.2 Trigger

Agent 2 inicia **APENAS APÓS** aprovação manual do plano do Agent 1:

```bash
.agents/approve-refactoring.sh YYYY-MM-DD
```

### 2.3 Workflow de Execução

Para **cada fase** do plano:

```
1. Criar Checkpoint (Regression Plan)
   └─ Salvar estado atual para rollback

2. Executar Mudanças
   └─ Aplicar refatoração da fase

3. Rodar Testes de Regressão
   └─ Executar checklist adaptativo

4. Validar Resultado
   ├─ Se SUCESSO: Próxima fase
   └─ Se FALHA: Tentar corrigir (até 3x)

5. Auto-Correção (até 3 tentativas)
   ├─ Tentativa 1: Analisar erro, corrigir
   ├─ Tentativa 2: Abordagem diferente
   ├─ Tentativa 3: Última tentativa
   └─ Se 3 falhas: PARAR e NOTIFICAR
```

### 2.4 Checkpoints e Rollback

**Antes de cada fase:**

- Criar checkpoint com `webdev_save_checkpoint`
- Salvar estado para rollback

**Se fase falhar após 3 tentativas:**

- Usar `webdev_rollback_checkpoint` para voltar ao estado anterior
- Notificar usuário com detalhes do erro

### 2.5 Testes de Regressão

Agent 2 executa **todos os testes** do checklist:

**Testes Automatizados:**

1. Unit Tests - `pnpm test -- src/components/`
2. Component Tests - `pnpm test -- src/components/`
3. Type Safety - `pnpm tsc --noEmit`
4. Code Quality - `pnpm lint`
5. Coverage (condicional) - `pnpm test -- --coverage`

**Para cada teste:**

- Executar comando
- Validar resultado esperado
- Se falhar: Tentar corrigir (até 3x)
- Se 3 falhas: PARAR

### 2.6 Auto-Correção

Quando um teste falha:

**Tentativa 1:**

- Analisar erro
- Identificar causa
- Aplicar correção óbvia
- Reexecutar teste

**Tentativa 2:**

- Se Tentativa 1 falhou
- Abordagem diferente
- Análise mais profunda
- Reexecutar teste

**Tentativa 3:**

- Se Tentativa 2 falhou
- Última tentativa
- Abordagem alternativa
- Reexecutar teste

**Após 3 Falhas:**

- PARAR execução
- Rollback para checkpoint anterior
- NOTIFICAR usuário com:
    - Qual fase falhou
    - Qual teste falhou
    - Erros detalhados
    - Sugestões de correção

### 2.7 Saída do Agent 2

Agent 2 cria arquivo de execução:

```
.agents/refactoring/YYYY-MM-DD/regression-run.md
├── Execution Summary
│   ├── Start Time
│   ├── End Time
│   ├── Total Phases
│   ├── Completed Phases
│   └── Status (SUCCESS / FAILED)
│
├── Phase Execution Details
│   ├── Phase 1: [Name]
│   │   ├── Status
│   │   ├── Changes Made
│   │   ├── Tests Run
│   │   ├── Test Results
│   │   └── Auto-Corrections Applied
│   │
│   ├── Phase 2: [Name]
│   │   └─ ...
│   │
│   └── Phase N: [Name]
│       └─ ...
│
├── Regression Test Results
│   ├── Unit Tests: PASS/FAIL
│   ├── Component Tests: PASS/FAIL
│   ├── Type Safety: PASS/FAIL
│   ├── Code Quality: PASS/FAIL
│   └── Coverage: PASS/FAIL
│
├── Auto-Corrections Applied
│   ├── Phase X, Attempt 1: [Correction]
│   ├── Phase Y, Attempt 2: [Correction]
│   └─ ...
│
├── Rollback History (se houver)
│   ├── Rolled back from Phase X
│   ├── Reason: [Error Details]
│   └─ Checkpoint restored
│
└── Recommendations
    ├── If SUCCESS: Next steps
    └─ If FAILED: Manual fixes needed
```

### 2.8 Notificação

Agent 2 notifica **APENAS**:

1. **Ao Sucesso:** Resumo completo
    - Fases executadas
    - Testes passando
    - Mudanças realizadas
    - Próximos passos

2. **Ao Falhar (após 3 tentativas):** Erro detalhado
    - Qual fase falhou
    - Qual teste falhou
    - Erros específicos
    - Sugestões de correção
    - Checkpoint para rollback

### 2.9 Regras de Execução

- ✅ Executar **TODAS as fases** do plano
- ✅ Executar testes após **CADA fase**
- ✅ Tentar corrigir falhas **até 3 vezes**
- ✅ Criar checkpoints **antes de cada fase**
- ✅ Rollback automático **se 3 falhas**
- ✅ Notificar **apenas ao final** ou **em erro crítico**
- ✅ Manter histórico completo em `regression-run.md`

---

## 3. Workflow Completo

```
06:00 - Agent 1 Executa
├─ Analisa código ATUAL
├─ Detecta issues e opportunities
├─ Gera plano DINÂMICO
├─ Cria checklist ADAPTATIVO
└─ Notifica para aprovação

Você Revisa (Manual)
├─ Lê refactoring-plan.md
├─ Revisa regression-checklist.md
└─ Aprova com: .agents/refactoring/approve-refactoring.sh YYYY-MM-DD

Agent 2 Executa (Após aprovação)
├─ Para cada fase:
│  ├─ Cria checkpoint
│  ├─ Executa mudanças
│  ├─ Roda testes
│  ├─ Tenta corrigir (até 3x)
│  └─ Se sucesso: Próxima fase
├─ Gera regression-run.md
└─ Notifica resultado

Você Valida (Manual)
├─ Revisa regression-run.md
├─ Testa código gerado
└─ Merge ou iterate
```

---

## 4. Estrutura de Diretórios

```
.agents/refactoring/
├── 2026-02-24/
│   ├── refactoring-plan.md          ← Agent 1 gera
│   └── regression-checklist.md      ← Agent 1 gera
│
├── 2026-02-25/
│   ├── refactoring-plan.md
│   └── regression-checklist.md
│
└── 2026-02-26/
    ├── refactoring-plan.md          ← Agent 1 gera
    ├── regression-checklist.md      ← Agent 1 gera
    └── regression-run.md            ← Agent 2 gera
```

---

## 5. Regras de Conformidade

### 5.1 Respeitando Regras Existentes

Agent 1 e Agent 2 **DEVEM RESPEITAR** todas as regras definidas em `./rules/*`:

### 5.2 Validação de Conformidade

Testes de regressão **DEVEM VALIDAR** que:

- ✅ Nenhuma regra foi violada
- ✅ Comportamento esperado mantido
- ✅ Contratos de API respeitados
- ✅ Padrões de código mantidos

---

## 6. Aprovação Manual

### 6.1 Aprovando o Plano

Após revisar `refactoring-plan.md` e `regression-checklist.md`:

```bash
# Aprovar plano do dia
.agents/refactoring/agents/approve-refactoring.sh 2026-02-26

# Isso cria arquivo de aprovação:
# .agents/refactoring/2026-02-26/APPROVED
```

### 6.2 Rejeitando o Plano

Se o plano não faz sentido:

1. Não execute `approve-refactoring.sh`
2. Agent 2 não será disparado
3. Agent 1 gerará novo plano amanhã (06:00)

### 6.3 Ajustando o Plano

Se quer ajustar antes de aprovar:

1. Edite `refactoring-plan.md`
2. Edite `regression-checklist.md`
3. Execute `approve-refactoring.sh`
4. Agent 2 usará versão ajustada

---

## 7. Monitoramento

### 7.1 Logs

Todos os logs estão em:

```
.agents/logs/
├── devserver.log
├── browserConsole.log
├── networkRequests.log
└── sessionReplay.log
```

### 7.2 Histórico

Histórico completo em:

```
.agents/refactoring/
├── 2026-02-24/
├── 2026-02-25/
├── 2026-02-26/
└── ...
```

### 7.3 Notificações

Receba notificações via:

- App Manus (automático)
- Email (configurável)

---

## 8. Troubleshooting

### Problema: Agent 1 não roda

**Causa:** Sem novos commits
**Solução:** Faça um commit e Agent 1 rodará na próxima execução

### Problema: Agent 2 falha em uma fase

**Causa:** Teste falhando após 3 tentativas
**Solução:**

1. Revise `regression-run.md` para detalhes do erro
2. Corrija manualmente
3. Faça commit
4. Agent 1 gerará novo plano amanhã

### Problema: Rollback necessário

**Causa:** Agent 2 falhou e fez rollback
**Solução:**

1. Revise `regression-run.md` para causa do erro
2. Corrija o problema
3. Faça commit
4. Próxima execução do Agent 1 incluirá a correção

---

**Last Updated:** 2026-02-26
**Maintained By:** Felipe Desiderati
**Automated By:** Agent 1 (Analysis) & Agent 2 (Execution)
