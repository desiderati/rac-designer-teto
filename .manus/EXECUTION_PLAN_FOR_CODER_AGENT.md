# 🤖 Plano de Execução para Agente Codificador

**Data:** 2026-02-27  
**Objetivo:** Implementar 3 novas funcionalidades no RAC Designer  
**Duração Estimada:** 13-19 dias  
**Prioridade:** Alta  
**Status:** Pronto para Execução

---

## 📋 Resumo Executivo

Este documento fornece um plano detalhado para o agente codificador implementar 3 funcionalidades:

1. **Escadas Automáticas** - Geração automática em planta e elevação
2. **Contraventamento Inteligente** - Posicionamento dinâmico baseado em nível
3. **Terreno Editável** - Representação gráfica e edição de solidez do solo

---

## 🎯 Fase 1: Preparação (1-2 dias)

### Objetivo

Preparar estrutura, constantes e tipos necessários para as 3 funcionalidades.

### Tarefas

#### 1.1 Criar Estrutura de Diretórios

```bash
# Criar diretórios para novos componentes
mkdir -p src/components/rac-editor/modals/editors/stair
mkdir -p src/components/rac-editor/modals/editors/terreno
mkdir -p src/lib/canvas/renderers
```

#### 1.2 Atualizar `src/lib/canvas/constants.ts`

Adicionar constantes para as 3 funcionalidades:

```typescript
// Escadas
export const STAIR_DEFAULTS = {
    width: 80,
    depth: 30,
    minHeight: 10,
    color: '#8B7355',
    material: 'wood'
};

// Contraventamento - Regras de Posicionamento
export const CONTRAVENTAMENTO_RULES = {
    20: {aboveGround: 5, belowBeam: 5},
    30: {aboveGround: 10, belowBeam: 10},
    40: {aboveGround: 20, belowBeam: 20}
};

// Terreno - Tipos e Dimensões
export const TERRENO_TYPES = {
    1: {name: 'Seco', depth: 13},
    2: {name: 'Argiloso', depth: 25},
    3: {name: 'Com água no fundo', depth: 38},
    4: {name: 'Com bastante água', depth: 50},
    5: {name: 'Submerso', depth: 63}
};

export const TERRENO_DIMENSIONS = {
    lateralBritasWidth: 10, // cm em cada lado
    pattern: 'stones' // tipo de padrão visual
};
```

#### 1.3 Criar Tipos TypeScript

Arquivo: `src/components/rac-editor/types/features.ts`

```typescript
// Escada
export interface Stair {
    id: string;
    pilotiId: string;
    leftLevel: number;
    rightLevel: number;
    height: number;
    width: number;
    depth: number;
    position: Point3D;
}

// Contraventamento (atualizar tipo existente)
export interface Contraventamento {
    id: string;
    pilotiId: string;
    level: number; // 20, 30, 40+
    aboveGround: number;
    belowBeam: number;
    position: Point3D;
}

// Terreno
export interface Terreno {
    id: string;
    pilotiId: string;
    solidityLevel: 1 | 2 | 3 | 4 | 5;
    depth: number;
    lateralBritasWidth: number;
    position: Point3D;
}
```

#### 1.4 Atualizar Testes de Regressão

Arquivo: `src/lib/canvas/factory/elements-factory.smoke.test.ts`

```typescript
describe('New Features - Smoke Tests', () => {
    describe('Stairs', () => {
        it('should create stair element', () => {
            // Teste básico
        });
    });

    describe('Contraventamento', () => {
        it('should create contraventamento with correct positioning', () => {
            // Teste básico
        });
    });

    describe('Terreno', () => {
        it('should create terreno with correct depth', () => {
            // Teste básico
        });
    });
});
```

### Critérios de Conclusão

- ✅ Diretórios criados
- ✅ Constantes adicionadas
- ✅ Tipos TypeScript definidos
- ✅ Testes de regressão baseline criados
- ✅ Nenhuma regressão em testes existentes

---

## 🎯 Fase 2: Escadas Automáticas (3-4 dias)

### Objetivo

Implementar geração automática de escadas em TopView e Elevation.

### Tarefas

#### 2.1 Implementar `createStair()` em `elements-factory.ts`

```typescript
/**
 * Create stair element
 * @param canvas - Fabric canvas
 * @param piloti - Piloti object with door
 * @returns Group containing stair representation
 */
export function createStair(canvas: Canvas, piloti: Piloti): Group {
    // Cálculos:
    // 1. Altura da escada = altura do menor contato com solo + 10cm
    // 2. Nível esquerdo = calculado automaticamente
    // 3. Nível direito = calculado automaticamente

    // Criar grupo com:
    // - Degraus (múltiplos retângulos)
    // - Corrimão esquerdo
    // - Corrimão direito
    // - Etiqueta com níveis

    // Retornar grupo
}
```

**Requisitos:**

- Calcular altura baseada em piloti
- Criar degraus com espaçamento correto
- Adicionar corrimãos
- Adicionar etiquetas de nível
- Retornar grupo Fabric.js

#### 2.2 Implementar `useStairCalculations` Hook

Arquivo: `src/components/rac-editor/hooks/useStairCalculations.ts`

```typescript
export function useStairCalculations(piloti: Piloti) {
    // Calcular:
    // - Altura total
    // - Número de degraus
    // - Altura de cada degrau
    // - Nível esquerdo
    // - Nível direito

    return {
        totalHeight,
        numberOfSteps,
        stepHeight,
        leftLevel,
        rightLevel
    };
}
```

#### 2.3 Implementar `useStairCreation` Hook

Arquivo: `src/components/rac-editor/hooks/useStairCreation.ts`

```typescript
export function useStairCreation(canvas: Canvas) {
    const createStairForPiloti = (piloti: Piloti) => {
        // 1. Validar se piloti tem porta
        // 2. Calcular dimensões
        // 3. Chamar createStair()
        // 4. Adicionar ao canvas
        // 5. Atualizar modelo
    };

    const updateStair = (stair: Stair, piloti: Piloti) => {
        // Atualizar escada quando piloti muda
    };

    const deleteStair = (stairId: string) => {
        // Deletar escada
    };

    return {createStairForPiloti, updateStair, deleteStair};
}
```

#### 2.4 Implementar `StairEditor` Modal

Arquivo: `src/components/rac-editor/modals/editors/stair/StairEditor.tsx`

```typescript
export function StairEditor({stair, piloti, onSave, onClose}: Props) {
    // Modal com:
    // - Exibição de altura total
    // - Exibição de nível esquerdo
    // - Exibição de nível direito
    // - Botão salvar
    // - Botão cancelar

    return <Modal>
...
    </Modal>;
}
```

#### 2.5 Integração com Canvas

Atualizar hooks que criam piloti:

- Quando piloti com porta é criado → criar escada automaticamente
- Quando piloti é modificado → atualizar escada
- Quando piloti é deletado → deletar escada

#### 2.6 Testes Unitários

Arquivo: `src/lib/canvas/factory/elements-factory.test.ts`

```typescript
describe('createStair', () => {
    it('should calculate height correctly', () => {
        // Teste
    });

    it('should calculate left level correctly', () => {
        // Teste
    });

    it('should calculate right level correctly', () => {
        // Teste
    });

    it('should create stair with correct dimensions', () => {
        // Teste
    });
});
```

### Critérios de Conclusão

- ✅ `createStair()` implementado e testado
- ✅ Hooks implementados e testados
- ✅ Modal de edição funcional
- ✅ Integração com canvas completa
- ✅ Escada aparece em TopView
- ✅ Escada aparece em Elevation
- ✅ Testes de regressão passam
- ✅ Sem regressions em funcionalidades existentes

---

## 🎯 Fase 3: Contraventamento Inteligente (2-3 dias)

### Objetivo

Atualizar contraventamento com novas regras de posicionamento.

### Tarefas

#### 3.1 Atualizar `createContraventamento()` em `elements-factory.ts`

```typescript
export function createContraventamento(canvas: Canvas, piloti: Piloti): Group {
    // Obter nível do piloti
    const level = piloti.level; // 20, 30, 40+

    // Obter regras de posicionamento
    const rules = getContraventamentoRules(level);

    // Calcular posição:
    // - Acima do chão: rules.aboveGround
    // - Abaixo da viga: rules.belowBeam

    // Criar contraventamento com posição correta
    // Retornar grupo
}

function getContraventamentoRules(level: number) {
    // Retornar regras baseadas em nível
    // Se level < 20: erro
    // Se level === 20: { aboveGround: 5, belowBeam: 5 }
    // Se level === 30: { aboveGround: 10, belowBeam: 10 }
    // Se level >= 40: { aboveGround: 20, belowBeam: 20 }
}
```

**Mudanças Importantes:**

- ❌ Remover restrição de nível mínimo 40cm
- ✅ Suportar níveis 20cm e 30cm
- ✅ Aplicar regras de posicionamento corretas

#### 3.2 Atualizar `useContraventamentoCalculations`

```typescript
export function useContraventamentoCalculations(piloti: Piloti) {
    // Calcular:
    // - Nível do piloti
    // - Regras de posicionamento
    // - Posição acima do chão
    // - Posição abaixo da viga

    return {
        level,
        rules,
        aboveGround,
        belowBeam
    };
}
```

#### 3.3 Testes Unitários

```typescript
describe('Contraventamento - New Rules', () => {
    it('should support level 20cm', () => {
        // Teste
    });

    it('should support level 30cm', () => {
        // Teste
    });

    it('should position correctly at 20cm', () => {
        // Teste: aboveGround=5, belowBeam=5
    });

    it('should position correctly at 30cm', () => {
        // Teste: aboveGround=10, belowBeam=10
    });

    it('should position correctly at 40cm+', () => {
        // Teste: aboveGround=20, belowBeam=20
    });
});
```

### Critérios de Conclusão

- ✅ Contraventamento criado para nível 20cm
- ✅ Contraventamento criado para nível 30cm
- ✅ Contraventamento criado para nível 40cm+
- ✅ Posição calculada corretamente
- ✅ Sem restrição de nível mínimo
- ✅ Testes de regressão passam

---

## 🎯 Fase 4: Terreno Editável (4-5 dias)

### Objetivo

Implementar representação gráfica de terreno com edição de solidez.

### Tarefas

#### 4.1 Implementar `createTerreno()` em `elements-factory.ts`

```typescript
export function createTerreno(canvas: Canvas, piloti: Piloti, solidityLevel: 1 | 2 | 3 | 4 | 5 = 1): Group {
    // Criar grupo com:
    // - Cama de rachão (desenho 2D)
    // - Britas laterais (10cm cada lado)

    // Profundidade baseada em solidityLevel:
    // 1 = 13cm, 2 = 25cm, 3 = 38cm, 4 = 50cm, 5 = 63cm

    // Retornar grupo
}
```

#### 4.2 Implementar `drawTerreno()` Renderizador

Arquivo: `src/lib/canvas/renderers/drawTerreno.ts`

```typescript
export function drawTerreno(
    canvas: Canvas,
    piloti: Piloti,
    solidityLevel: 1 | 2 | 3 | 4 | 5
): void {
    // Desenhar cama de rachão:
    // - Padrão de pedras (círculos/polígonos)
    // - Cor cinza/marrom
    // - Profundidade baseada em solidityLevel

    // Desenhar britas laterais:
    // - 10cm de largura em cada lado
    // - Padrão de pedras menores
    // - Cor mais clara

    // Usar Canvas 2D API para desenho
}
```

**Dica:** Usar padrão visual similar à imagem fornecida (camadas de pedra compactada).

#### 4.3 Implementar `useTerreno` Hook

Arquivo: `src/components/rac-editor/hooks/useTerreno.ts`

```typescript
export function useTerreno(canvas: Canvas) {
    const createTerreno = (piloti: Piloti, solidityLevel: 1 | 2 | 3 | 4 | 5) => {
        // Criar terreno
    };

    const updateTerreno = (terreno: Terreno, solidityLevel: 1 | 2 | 3 | 4 | 5) => {
        // Atualizar profundidade
        // Redesenhar
    };

    const deleteTerreno = (terraId: string) => {
        // Deletar terreno
    };

    return {createTerreno, updateTerreno, deleteTerreno};
}
```

#### 4.4 Implementar `TerrenoEditor` Modal

Arquivo: `src/components/rac-editor/modals/editors/terreno/TerrenoEditor.tsx`

```typescript
export function TerrenoEditor({terreno, piloti, onSave, onClose}: Props) {
    // Modal com:
    // - Slider com 5 posições (1-5)
    // - Labels: Seco, Argiloso, Com água no fundo, Com bastante água, Submerso
    // - Exibição de profundidade (13, 25, 38, 50, 63 cm)
    // - Preview visual do terreno
    // - Botão salvar
    // - Botão cancelar

    const handleSliderChange = (value: 1 | 2 | 3 | 4 | 5) => {
        // Atualizar solidityLevel
        // Atualizar preview
    };

    return <Modal>
...
    </Modal>;
}
```

#### 4.5 Implementar Interatividade

Atualizar canvas para:

- Detectar clique no terreno
- Abrir `TerrenoEditor` modal
- Atualizar terreno quando modal é salva

```typescript
// Em hook de interatividade do canvas
canvas.on('mouse:down', (event) => {
    const clickedObject = event.target;

    if (clickedObject?.myType === 'terreno') {
        // Abrir modal de edição
        openTerrenoEditor(clickedObject.terraId);
    }
});
```

#### 4.6 Testes Unitários

```typescript
describe('Terreno', () => {
    it('should create terreno with correct depth for level 1', () => {
        // Teste: depth = 13cm
    });

    it('should create terreno with correct depth for level 5', () => {
        // Teste: depth = 63cm
    });

    it('should draw lateral britas with 10cm width', () => {
        // Teste
    });

    it('should update terreno when solidityLevel changes', () => {
        // Teste
    });

    it('should be clickable and open editor', () => {
        // Teste de interatividade
    });
});
```

### Critérios de Conclusão

- ✅ Terreno renderizado na vista elevada
- ✅ Cama de rachão desenhada com padrão visual
- ✅ Britas laterais (10cm cada lado) desenhadas
- ✅ Clique abre modal de edição
- ✅ Slider com 5 posições funcional
- ✅ Profundidade atualiza corretamente
- ✅ Britas laterais mantêm 10cm
- ✅ Alterações persistem
- ✅ Testes de regressão passam

---

## 🎯 Fase 5: Integração e Testes (2-3 dias)

### Objetivo

Integrar as 3 funcionalidades e executar testes completos.

### Tarefas

#### 5.1 Integração entre Funcionalidades

- Escada + Contraventamento: Ambos aparecem corretamente
- Escada + Terreno: Terreno aparece abaixo da escada
- Contraventamento + Terreno: Posicionamento correto

#### 5.2 Testes de Regressão Completos

```bash
# Rodar todos os testes
pnpm test

# Verificar cobertura
pnpm test:coverage

# Verificar tipos
pnpm tsc --noEmit

# Verificar linting
pnpm lint
```

#### 5.3 Testes de Performance

- Renderização de múltiplos pilotis com escadas
- Renderização de múltiplos terrenos
- Edição de terreno (responsividade)

#### 5.4 Documentação

- Atualizar README.md
- Adicionar comentários de código
- Criar exemplos de uso

### Critérios de Conclusão

- ✅ Todas as funcionalidades integradas
- ✅ Testes de regressão 100% passando
- ✅ Sem performance degradation
- ✅ Documentação atualizada

---

## 🎯 Fase 6: Validação e Deploy (1-2 dias)

### Objetivo

Validar com usuário e fazer deploy.

### Tarefas

#### 6.1 Validação com Usuário

- [ ] Escadas aparecem corretamente
- [ ] Contraventamento posicionado corretamente
- [ ] Terreno renderizado corretamente
- [ ] Edição de terreno funciona
- [ ] Sem bugs visuais

#### 6.2 Correção de Bugs

- Corrigir bugs encontrados na validação

#### 6.3 Deploy

- Fazer commit final
- Fazer push para branch manus
- Criar PR para main (se necessário)

### Critérios de Conclusão

- ✅ Validação aprovada
- ✅ Todos os bugs corrigidos
- ✅ Deploy realizado

---

## 📊 Checklist de Execução

### Fase 1: Preparação

- [ ] Diretórios criados
- [ ] Constantes adicionadas
- [ ] Tipos TypeScript definidos
- [ ] Testes baseline criados

### Fase 2: Escadas

- [ ] `createStair()` implementado
- [ ] Hooks implementados
- [ ] Modal implementada
- [ ] Integração completa
- [ ] Testes passando

### Fase 3: Contraventamento

- [ ] `createContraventamento()` atualizado
- [ ] Regras de posicionamento implementadas
- [ ] Suporte para níveis 20 e 30cm
- [ ] Testes passando

### Fase 4: Terreno

- [ ] `createTerreno()` implementado
- [ ] `drawTerreno()` implementado
- [ ] `TerrenoEditor` implementada
- [ ] Interatividade funcional
- [ ] Testes passando

### Fase 5: Integração

- [ ] Funcionalidades integradas
- [ ] Testes de regressão passando
- [ ] Performance validada
- [ ] Documentação atualizada

### Fase 6: Validação

- [ ] Validação com usuário
- [ ] Bugs corrigidos
- [ ] Deploy realizado

---

## 🚨 Pontos Críticos

1. **Cálculos de Escada:** Validar com especialista
2. **Regras de Contraventamento:** Confirmar com engenharia
3. **Visual de Terreno:** Deve ser realista
4. **Performance:** Monitorar renderização
5. **Testes:** Cobertura mínima 80%

---

## 📞 Suporte

Se encontrar problemas:

1. Verificar logs de erro
2. Revisar testes de regressão
3. Consultar documentação de regras negociais
4. Abrir issue no repositório

---

**Status:** Pronto para Execução  
**Próximo Passo:** Iniciar Fase 1 - Preparação
