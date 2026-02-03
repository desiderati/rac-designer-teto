# Plano: Sistema de Tipos de Casa com Vistas Personalizadas

## Status: ✅ IMPLEMENTADO

---

## Resumo

Sistema implementado onde o menu "Casa TETO" abre uma modal de seleção entre dois tipos de casa, cada um com suas próprias vistas permitidas. A Planta é adicionada automaticamente após a seleção e tem proteção contra exclusão.

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

## Arquivos Modificados/Criados

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/rac-editor/HouseTypeSelector.tsx` | ✅ Criado | Modal de seleção de tipo |
| `src/lib/house-manager.ts` | ✅ Modificado | Adicionado tipo de casa, contagem de vistas e múltiplas instâncias |
| `src/components/rac-editor/Toolbar.tsx` | ✅ Modificado | Novo fluxo e submenu dinâmico |
| `src/components/rac-editor/RACEditor.tsx` | ✅ Modificado | Estados, handlers e proteção de exclusão |
| `src/components/rac-editor/SideSelector.tsx` | ✅ Modificado | Labels dinâmicas |

---

## Funcionalidades Implementadas

1. ✅ Modal para seleção de tipo de casa (Tipo 6 ou Tipo 3)
2. ✅ Planta criada automaticamente após seleção do tipo
3. ✅ Submenu dinâmico baseado no tipo de casa selecionado
4. ✅ Suporte a múltiplas instâncias de vistas (ex: 2x Quadrado Fechado)
5. ✅ Badges mostrando contagem atual/máximo quando aplicável
6. ✅ Botões desabilitados (cinza) quando limite atingido
7. ✅ Proteção de exclusão da Planta (só pode ser excluída após remover outras vistas)
8. ✅ Reset do tipo de casa ao excluir a Planta
9. ✅ Labels dinâmicas (Traseira → Lateral para Casa Tipo 3)
