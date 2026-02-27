# ✅ Checklist de Regressão Adaptativo (Agent 1 v2)

**Data da Análise:** 27 de Fevereiro de 2026
**Commit Head:** `c18108c`

---

## 📖 Introdução

Este checklist foi gerado dinamicamente com base nas áreas de maior risco identificadas pela análise do Agent 1 v2. O foco principal é validar as correções dos **12 testes que estão falhando** e garantir que as refatorações propostas não introduzam novos bugs. A prioridade é a estabilização da `main`.

---

## 🚨 Fase 1: Validação das Correções Críticas (BLOCKERS)

**Objetivo:** Garantir que as correções implementadas para os testes quebrados restauraram a funcionalidade esperada.

### 1.1. Layout e Gerenciamento de Vistas (`house-views-layout`)

- [ ] **Adição de Vistas:** Confirmar que é possível adicionar todos os tipos de vistas (`top`, `front`, `back`, `side1`, `side2`) através da UI.
- [ ] **Limite de Vistas:** Tentar adicionar mais vistas do que o permitido para um tipo de casa e verificar se a UI bloqueia a ação com a mensagem correta.
- [ ] **Posicionamento Automático:** Adicionar múltiplas vistas e confirmar que elas são posicionadas corretamente no canvas, sem sobreposição.
- [ ] **Remoção de Vistas:** Remover vistas em diferentes ordens e garantir que o estado (`sideMappings`) é atualizado corretamente.

### 1.2. Marcador de Porta na Vista de Topo (`house-top-view-door-marker`)

- [ ] **Visibilidade do Marcador:** Selecionar uma porta em uma vista de elevação e confirmar que o marcador correspondente aparece na vista de topo.
- [ ] **Posicionamento do Marcador:** Mover a porta e verificar se a posição do marcador na vista de topo é atualizada em tempo real.
- [ ] **Geometria do Marcador:** Verificar se a largura e o posicionamento do marcador de porta correspondem visualmente à porta na vista 3D.

### 1.3. Reconstrução do Canvas (`canvas-rebuild` e `house-manager`)

- [ ] **Carregar Projeto (JSON):** Carregar um projeto salvo e verificar se o estado dos pilotis (altura, nível, master) e das vistas é restaurado corretamente.
- [ ] **Cenário de Canvas Vazio:** Executar a função de reconstrução em um canvas sem nenhum grupo de casa e confirmar que o `houseType` no estado global se torna `null`.

### 1.4. Nomenclatura de Arquivos (`*.strategy.ts`)

- [ ] **Criação de Elementos:** Após a renomeação dos arquivos `straregy`, verificar se a criação de vistas (`top`, `front`, `side`) ainda funciona como esperado.
- [ ] **Verificação de Build:** Rodar `npm run build` para garantir que não há erros de importação ou resolução de módulos após a renomeação.

---

## 🛠️ Fase 2: Validação das Refatorações de Code Smells

**Objetivo:** Assegurar que a eliminação de duplicação e a refatoração de hooks não quebraram a funcionalidade existente.

### 2.1. Padrão `withScalingGuard`

- [ ] **Redimensionamento de Linha:** Criar e redimensionar um objeto `line` e verificar se a label e a espessura se mantêm consistentes.
- [ ] **Redimensionamento de Seta:** Criar e redimensionar um objeto `arrow` e garantir que a ponta da seta não fica distorcida.
- [ ] **Redimensionamento de Cota:** Criar e redimensionar um objeto `distance` e confirmar que os `ticks` (marcadores de início e fim) permanecem alinhados.
- [ ] **Redimensionamento de Parede:** Criar e redimensionar um objeto `wall` e verificar se o preenchimento (hachura) se adapta corretamente.

### 2.2. Hook `useCanvasContraventamento`

- [ ] **Ativação do Modo:** Entrar no modo de contraventamento e verificar se o cursor do mouse muda e se os pilotis elegíveis são destacados.
- [ ] **Seleção de Pilotis:** Clicar em um piloti inicial e final (na mesma coluna) e confirmar que o contraventamento é desenhado corretamente.
- [ ] **Cancelamento da Ação:** Pressionar `ESC` durante a seleção e garantir que o modo é cancelado e os destaques são removidos.

---

## 🏗️ Fase 3: Validação das Melhorias Arquiteturais

**Objetivo:** Testar as áreas que serão impactadas pela refatoração de componentes e hooks complexos.

### 3.1. Viewport e Zoom (`useCanvasViewport`)

- [ ] **Zoom (Mouse):** Usar o scroll do mouse para aplicar zoom in/out e verificar se a ação é fluida.
- [ ] **Pan (Mouse):** Pressionar a barra de espaço e arrastar o mouse para mover o canvas.
- [ ] **Zoom (Pinch):** Em um dispositivo touch, usar o gesto de pinça para aplicar zoom e verificar a suavidade da interação.
- [ ] **Pan (Touch):** Usar um ou dois dedos para mover o canvas em um dispositivo touch.

### 3.2. Editor Principal (`RacEditor.tsx`)

- [ ] **Fluxo Completo (Sanity Check):**
  1. Iniciar um novo projeto.
  2. Selecionar um tipo de casa.
  3. Adicionar uma vista de planta (`top`).
  4. Adicionar uma vista de elevação (`front`).
  5. Adicionar um objeto (ex: `wall`) na vista de planta.
  6. Abrir o editor de objetos e alterar sua cor.
  7. Salvar o projeto como JSON.
  8. Reiniciar o canvas e carregar o projeto salvo.
  9. Verificar se o estado foi 100% restaurado.

---

## 📝 Checklist de Regressão Manual (E2E)

- [ ] **Cenário 1: Projeto do Zero**
  - [ ] Criar um novo projeto, selecionar casa tipo 6, adicionar todas as vistas possíveis e verificar se os limites são respeitados.
- [ ] **Cenário 2: Edição de Pilotis**
  - [ ] Abrir o editor de um piloti, alterar seu nível e altura, e confirmar que a mudança se reflete visualmente e nos dados do modelo.
- [ ] **Cenário 3: Contraventamento Completo**
  - [ ] Adicionar contraventamentos em diferentes colunas e lados, remover um deles e verificar se o estado é consistente.
- [ ] **Cenário 4: Interação com a UI**
  - [ ] Abrir e fechar todos os menus, submenus e modais para garantir que não há crashes ou estados inesperados na UI.
