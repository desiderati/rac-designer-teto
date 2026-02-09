

# Plano: Alterar Ícone da Casa Tipo 3

## Objetivo
Substituir o ícone `faHouseChimney` da Casa Tipo 3 por um ícone que represente melhor o conceito - um quadrado com uma porta, similar ao "Quadrado Aberto" usado na Toolbar.

## Alteração

### Arquivo: `src/components/rac-editor/HouseTypeSelector.tsx`

**De:**
```typescript
import { faHome, faHouseChimney } from '@fortawesome/free-solid-svg-icons';
```

**Para:**
```typescript
import { faHome, faDoorOpen } from '@fortawesome/free-solid-svg-icons';
```

**E na linha 48, de:**
```typescript
icon={type === 'tipo6' ? faHome : faHouseChimney}
```

**Para:**
```typescript
icon={type === 'tipo6' ? faHome : faDoorOpen}
```

## Resultado Visual

| Casa Tipo 6 | Casa Tipo 3 |
|-------------|-------------|
| Casa com telhado (faHome) | Quadrado com porta (faDoorOpen) |

O ícone `faDoorOpen` representa visualmente um quadrado com uma porta aberta, que é exatamente o que você descreveu.

