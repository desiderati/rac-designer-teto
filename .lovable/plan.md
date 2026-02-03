
# Plano: Sistema de Tipos de Casa com Vistas Personalizadas

## Resumo

Implementar um novo sistema onde o menu "Casa TETO" abre uma modal de seleção entre dois tipos de casa, cada um com suas próprias vistas permitidas. A Planta será adicionada automaticamente após a seleção e terá proteção contra exclusão.

---

## Comportamento Atual vs Novo

### Atual
- Menu Casa TETO mostra submenu com 5 opções: Planta, Frontal, Traseira, Quadrado Fechado, Quadrado Aberto
- Cada vista pode ser adicionada uma vez
- Planta pode ser excluída a qualquer momento

### Novo
- Menu Casa TETO abre modal para escolher tipo de casa
- Após escolha, Planta é criada automaticamente
- Planta é igual para os dois tipos de casa
- Vistas disponíveis mudam conforme o tipo de casa
- Algumas vistas podem ter até 2 instâncias
- Planta só pode ser excluída após remover todas as outras vistas

---

## Tipos de Casa

### Casa Tipo 6
| Vista | Quantidade Máxima |
|-------|-------------------|
| Planta | 1 (automática) |
| Frontal | 1 |
| Traseira | 1 |
| Quadrado Fechado | 2 |

### Casa Tipo 3
| Vista | Quantidade Máxima |
|-------|-------------------|
| Planta | 1 (automática) |
| Lateral | 2 (renomeação de "Traseira" para este tipo) |
| Quadrado Aberto | 1 |
| Quadrado Fechado | 1 |

---

## Detalhes Técnicos

### 1. Novo Componente: HouseTypeSelector

Criar modal para seleção do tipo de casa com duas opções visuais:

```text
+----------------------------------+
|    Escolha o Tipo de Casa        |
+----------------------------------+
|  +------------+  +------------+  |
|  | Casa       |  | Casa       |  |
|  | Tipo 6     |  | Tipo 3     |  |
|  |            |  |            |  |
|  | [ícone]    |  | [ícone]    |  |
|  +------------+  +------------+  |
+----------------------------------+
```

**Arquivo:** `src/components/rac-editor/HouseTypeSelector.tsx`

### 2. Atualizar HouseManager

Adicionar propriedade `houseType` ao estado e lógica de contagem de vistas:

```typescript
// Novo tipo
export type HouseType = 'tipo6' | 'tipo3' | null;

// Atualizar HouseState
export interface HouseState {
  id: string;
  houseType: HouseType;  // NOVO
  pilotis: Record<string, PilotiData>;
  views: Record<ViewType, ViewInstance[]>;  // Alterado para array (múltiplas instâncias)
  sideAssignments: Record<HouseSide, ViewType | null>;
}

// Nova interface para instâncias de vista
interface ViewInstance {
  group: Group;
  side?: HouseSide;
  instanceId: string;
}
```

**Novos métodos:**
- `setHouseType(type: HouseType)`: Define o tipo e cria a Planta automaticamente
- `getAvailableViewsForType()`: Retorna vistas disponíveis conforme o tipo
- `getViewCount(viewType)`: Conta instâncias de uma vista
- `getMaxViewCount(viewType)`: Retorna limite máximo para o tipo atual
- `canDeletePlant()`: Verifica se a Planta pode ser excluída

**Arquivo:** `src/lib/house-manager.ts`

### 3. Atualizar Toolbar

Modificar comportamento do botão Casa TETO:
- Se não há tipo definido: abrir HouseTypeSelector
- Se tipo já definido: mostrar submenu com vistas disponíveis

Submenu dinâmico baseado no tipo:
- Casa Tipo 6: Frontal, Traseira, Quadrado Fechado (x2)
- Casa Tipo 3: Lateral (x2), Quadrado Aberto, Quadrado Fechado

Botões ficam cinza quando limite atingido.

**Arquivo:** `src/components/rac-editor/Toolbar.tsx`

### 4. Atualizar RACEditor

- Adicionar estado para modal de seleção de tipo
- Modificar lógica de adição de vistas para suportar múltiplas instâncias
- Implementar proteção de exclusão da Planta
- Atualizar handlers para novo fluxo

**Arquivo:** `src/components/rac-editor/RACEditor.tsx`

### 5. Proteção de Exclusão da Planta

Na função `handleDelete`:
1. Verificar se o objeto a ser excluído é a Planta
2. Se for, verificar se existem outras vistas
3. Se existirem, mostrar toast de erro e impedir exclusão
4. Se não existirem, permitir exclusão e resetar `houseType`

### 6. Atualizar SideSelector

Adaptar labels conforme o tipo de casa:
- Casa Tipo 3: "Traseira" vira "Lateral"

**Arquivo:** `src/components/rac-editor/SideSelector.tsx`

---

## Fluxo do Usuário

```text
1. Usuário clica em Casa TETO
         |
         v
2. Modal abre: "Escolha o Tipo de Casa"
         |
    +----+----+
    |         |
    v         v
 Tipo 6    Tipo 3
    |         |
    v         v
3. Planta é criada automaticamente no canvas
         |
         v
4. Submenu mostra vistas disponíveis para o tipo escolhido
         |
         v
5. Usuário adiciona vistas (até o limite de cada uma)
         |
         v
6. Para excluir Planta: remover todas as outras vistas primeiro
         |
         v
7. Após excluir Planta: pode escolher novo tipo
```

---

## Arquivos a Modificar/Criar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/rac-editor/HouseTypeSelector.tsx` | Criar | Modal de seleção de tipo |
| `src/lib/house-manager.ts` | Modificar | Adicionar tipo de casa e contagem |
| `src/components/rac-editor/Toolbar.tsx` | Modificar | Novo fluxo e submenu dinâmico |
| `src/components/rac-editor/RACEditor.tsx` | Modificar | Estados e handlers |
| `src/components/rac-editor/SideSelector.tsx` | Modificar | Labels dinâmicas |

---

## Observações Importantes

1. **Compatibilidade**: Projetos salvos sem tipo de casa precisarão definir tipo na primeira edição
2. **Múltiplas instâncias**: O sistema de lado (esquerda/direita) continuará funcionando, mas permitirá duas vistas do mesmo tipo em lados diferentes
3. **Sincronização de pilotis**: O HouseManager já sincroniza pilotis entre vistas - isso continuará funcionando
4. **Nomenclatura**: "Visão Traseira" só muda para "Lateral" no contexto da Casa Tipo 3
