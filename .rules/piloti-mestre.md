# Regras de Piloti Mestre

Este documento consolida as regras do `piloti mestre` no estado atual do projeto.

## 1. Objetivo

Definir como o mestre funciona em toda a aplicação:

1. seleção de um único mestre;
2. comportamento no modal inicial de níveis;
3. comportamento no editor de piloti;
4. sincronização visual e de dados entre vistas e 3D.

## 2. Definição

- `Piloti mestre`: piloti com `isMaster = true`.
- `Mestre global`: em qualquer momento, só pode existir 1 mestre em toda a casa.

## 3. Onde o mestre pode ser definido na UI

Na interface, o toggle de mestre aparece somente nos 4 cantos:

1. `piloti_0_0` (A1)
2. `piloti_3_0` (A4)
3. `piloti_0_2` (C1)
4. `piloti_3_2` (C4)

## 4. Regras no fluxo inicial (`NivelDefinitionEditor`)

### 4.1 Pré-condições para aplicar

Para o botão `Aplicar` ficar habilitado:

1. deve existir pelo menos 1 mestre;
2. os 4 cantos precisam ter sido percorridos no fluxo.

### 4.2 Ao marcar um canto como mestre

1. o canto atual vira mestre;
2. todos os demais cantos perdem `isMaster`;
3. os níveis dos cantos não mestre são elevados para, no mínimo, o nível do mestre atual.

### 4.3 Ao alterar nível do mestre no modal

1. se o nível do mestre aumentar, os demais cantos abaixo desse valor sobem automaticamente;
2. para cantos não mestre, o mínimo permitido no slider passa a ser o nível do mestre.

## 5. Regras no `PilotiEditor`

1. o toggle `Definir como Mestre?` aparece apenas para pilotis de canto;
2. o editor não força ajuste automático de nível dos outros cantos;
3. ao aplicar, envia `isMaster` e `nivel` para atualização central no `HouseManager`.

## 6. Regra de exclusividade global (fonte da verdade)

No `HouseManager.updatePiloti`:

1. se um piloti é atualizado com `isMaster = true`, qualquer mestre anterior é limpo;
2. a limpeza ocorre no estado central e é propagada para todas as vistas registradas.

Implementação de domínio extraída:

1. a regra de mestre único está centralizada no caso de uso `applyPilotiUpdateWithSingleMasterRule`;
2. a camada de aplicação usa a interface `HouseRepository`;
3. `HouseManager` atua como adaptador/orquestrador e sincronizador de canvas/3D.
4. sincronização visual entre vistas foi decomposta em passes privados no `HouseManager` para reduzir complexidade
   local sem mudar regra.

## 7. Regras visuais do mestre

Quando `isMaster = true`:

1. cor de preenchimento: `#D4A574`;
2. cor de borda: `#8B4513`;
3. espessura de borda maior que a padrão.

Quando deixa de ser mestre:

1. volta para estilo visual padrão do piloti;
2. textos de nível permanecem visíveis nos cantos (regra de canto), não por ser mestre.

## 8. Sincronização entre vistas e 3D

Mudanças de mestre são sincronizadas para:

1. planta (`top`);
2. elevações (`front`, `back`, `side`);
3. visualização 3D.

## 9. Relações com outras regras

1. `piloti mestre` e `nível` estão ligados no modal inicial (pisos não mestre não podem ficar abaixo do mestre);
2. contraventamento usa a paleta marrom de mestre para feedback visual, mas elegibilidade continua baseada nas regras
   próprias do contraventamento.

## 10. Referências de código

- `src/components/rac-editor/modals/editors/NivelDefinitionEditor.tsx`
- `src/components/rac-editor/modals/editors/PilotiEditor.tsx`
- `src/components/rac-editor/hooks/usePilotiEditor.ts`
- `src/components/lib/house-manager.ts`
- `src/domain/house/house-aggregate.ts`
- `src/components/lib/canvas/piloti-visual.ts`
- `src/components/rac-editor/House3DScene.tsx`
