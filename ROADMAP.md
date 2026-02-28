# 🗺️ ROADMAP - Novas Funcionalidades RAC Designer

**Data:** 2026-02-27  
**Status:** Em Planejamento  
**Prioridade:** Alta

---

## 📋 Visão Geral

Este roadmap define 3 novas funcionalidades críticas para o RAC Designer:

1. **Escadas Automáticas** - Geração automática em planta e elevação
2. **Contraventamento Inteligente** - Posicionamento dinâmico baseado em nível
3. **Terreno Editável** - Representação gráfica e edição de solidez do solo

---

## 🎯 Funcionalidade 1: Escadas Automáticas

### Descrição

Adição automática de escadas tanto na vista planta (TopView) quanto na vista elevada que contenha a porta.

### Requisitos Técnicos

#### Cálculo de Dimensões

- **Altura da Escada:** Calculada com base na altura do menor contato com o solo + 10 cm
- **Nível Esquerdo:** Calculado automaticamente
- **Nível Direito:** Calculado automaticamente

#### Comportamento

- Escada aparece automaticamente quando um piloti com porta é criado/modificado.
- Dimensões ajustam-se dinamicamente com mudanças de altura.
- Aparece em ambas as vistas: TopView e Elevation.
- O tamanho da escada será igual na vista TopView. Terá a mesma quantidade de degraus.
- Usar a mesma funcionalidade de Top Door Marker para gerar na Top View.
- Desabilitar o botão de criar escada na Toolbar.

#### Arquivos Afetados

```
src/lib/canvas/factory/stairs.strategy.ts

```

#### Dependências

- Cálculos de altura de piloti
- Sistema de renderização TopView
- Sistema de renderização Elevation

### Critérios de Aceitação

- ✅ Escada criada automaticamente quando piloti com porta é adicionado
- ✅ Dimensões calculadas corretamente (altura = menor contato + 10cm)
- ✅ Nível esquerdo/direito calculado automaticamente
- ✅ Escada visível em TopView
- ✅ Escada visível em Elevation
- ✅ Escada atualiza quando piloti é modificado
- ✅ Testes de regressão passam

---

## 🎯 Funcionalidade 2: Contraventamento Inteligente

### Descrição

Adição automática de contraventamento com posicionamento dinâmico baseado no nível do piloti.

### Requisitos Técnicos

#### Regras de Posicionamento

```
Nível 20 cm:
  - Contraventamento fica ABAIXO de 5 cm da viga
  - Contraventamento fica ACIMA de 5 cm do chão

Nível 30 cm:
  - Contraventamento fica ABAIXO de 10 cm da viga
  - Contraventamento fica ACIMA de 10 cm do chão

Nível ≥ 40 cm:
  - Contraventamento fica ABAIXO de 20 cm da viga
  - Contraventamento fica ACIMA de 20 cm do chão
```

#### Mudanças de Lógica

- ❌ **Removido:** Restrição de nível mínimo (era 40cm)
- ✅ **Adicionado:** Suporte para níveis 20cm e 30cm
- ✅ **Adicionado:** Cálculo dinâmico de posição

#### Dependências

- Sistema de cálculo de altura de piloti
- Sistema de renderização de vigas
- Constantes de contraventamento

### Critérios de Aceitação

- ✅ Contraventamento criado para piloti nível 20cm
- ✅ Contraventamento criado para piloti nível 30cm
- ✅ Contraventamento criado para piloti nível ≥40cm
- ✅ Posição calculada corretamente para cada nível
- ✅ Contraventamento atualiza quando piloti é modificado
- ✅ Testes de regressão passam
- ✅ Sem restrição de nível mínimo

---

## 🎯 Funcionalidade 3: Terreno Editável com Solidez

### Descrição

Na visão elevada, incluir representação gráfica de cama de pedras (rachão) com britas laterais. Permitir edição do tipo
de terreno via modal.

### Requisitos Técnicos

#### Representação Gráfica

- **Cama de Rachão:** Desenho 2D no canvas com padrão de pedras
- **Britas Laterais:** 10cm de largura em cada lado do piloti
- **Aparência:** Baseada na imagem fornecida (camadas de pedra compactada)

#### Tipos de Terreno (Slider 1-5)

```
1 = Seco
   └─ Cama de rachão: 13 cm

2 = Argiloso
   └─ Cama de rachão: 25 cm

3 = Com água no fundo
   └─ Cama de rachão: 38 cm

4 = Com bastante água
   └─ Cama de rachão: 50 cm

5 = Submerso
   └─ Cama de rachão: 63 cm
```

#### Interatividade

- Clique no terreno na vista elevada abre modal de edição
- Modal contém slider com 5 posições
- Slider permite selecionar tipo de terreno
- Cama de rachão atualiza dinamicamente
- Britas laterais sempre 10cm em cada lado

#### Dependências

- Sistema de renderização 2D (Canvas)
- Sistema de interatividade (click handlers)
- Modal de edição genérica
- Slider component

### Critérios de Aceitação

- ✅ Terreno renderizado na vista elevada
- ✅ Cama de rachão desenhada com padrão de pedras
- ✅ Britas laterais (10cm cada lado) desenhadas
- ✅ Clique no terreno abre modal de edição
- ✅ Modal contém slider com 5 posições
- ✅ Slider atualiza tipo de terreno
- ✅ Cama de rachão atualiza com tamanho correto
- ✅ Britas laterais mantêm 10cm de largura
- ✅ Alterações persistem no modelo
- ✅ Testes de regressão passam

---

## 🔄 Dependências Externas

- Biblioteca de renderização 2D (Canvas)
- Componente Slider (UI)
- Sistema de Modal (UI)
- Sistema de Cálculos Geométricos

---

## 📝 Notas Importantes

1. **Escadas:** Dimensionamento automático é crítico - validar cálculos com especialista
2. **Contraventamento:** Mudança de regra requer validação com engenharia
3. **Terreno:** Padrão visual de pedras deve ser realista - considerar texturas
4. **Performance:** Renderização de terreno pode impactar performance - otimizar
5. **Testes:** Cada funcionalidade requer testes de regressão robustos
