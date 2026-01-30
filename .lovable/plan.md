
Contexto do problema (o que está acontecendo agora)
- O código atual adiciona a linha como child do grupo da Planta (topGroup), mas ela ainda “aparece longe” ou “parada” em um lugar fixo.
- Isso é típico de 2 causas no Fabric:
  1) O Line está sendo criado com posicionamento/origem que faz ele ser desenhado com um offset inesperado dentro do group (por padrão, Line usa x1/y1/x2/y2 + left/top; se left/top/origin não forem coerentes com os pontos negativos, o “zero” não fica onde esperamos).
  2) O group pode estar com cache/bounds “stale” (o projeto já tem uma função específica para isso: refreshHouseGroupRendering), então o que você vê pode não ser o que está realmente dentro do group (ou fica “congelado” visualmente).

Objetivo (mantendo 100% isolado)
- Ao selecionar uma vista já inserida no canvas (front/back/side1/side2), desenhar (ou atualizar) uma linha azul que fique colada no retângulo do corpo da casa dentro da Planta, no lado correspondente ao “side” escolhido na inserção.
- Ao deselecionar (selection cleared) ou selecionar a própria Planta (top), remover o highlight.
- Não tocar em: regras de “uma vista por tipo”, HouseManager, inserção de vistas, piloti editor, nível do mestre, undo/redo, etc.

Diagnóstico técnico do que precisa mudar no código atual
O seu helper syncPlantSideHighlight está correto em “ideia”, mas tem três fragilidades que explicam o bug visual:

A) Criação do Line sem left/top explícitos
- Hoje: new Line(coords, { originX:'center', originY:'center' }) sem definir left/top.
- Em Fabric, Line não funciona “como um path em coordenadas locais puras”; ele combina x1/y1/x2/y2 com posicionamento (left/top) e origin. Se left/top não forem definidos, o Fabric calcula internamente e isso pode deslocar a linha dentro do group.

B) Adição ao group sem forçar recálculo de bounds/cache
- O projeto já tem histórico de “group cache/bounds” causando cortes e render incorreto (vide refreshHouseGroupRendering).
- Para garantir que o highlight realmente seja renderizado no lugar correto (e continue colado ao mover/escala/rotacionar a Planta), precisamos aplicar o mesmo padrão de refresh apenas no topGroup (não no canvas inteiro).

C) Remoção parcial de highlights dentro do group
- Hoje remove apenas 1 existingHighlight (find). Se houver mais de um (por tentativas anteriores), podem sobrar linhas antigas e confundir o render.
- Precisamos remover todos os filhos com isSideHighlight.

Plano de correção (mudança mínima, apenas Canvas.tsx)
Arquivo: src/components/rac-editor/Canvas.tsx

1) Ajustar a limpeza de highlights (isolada, sem afetar nada mais)
- Manter a limpeza de stale highlights soltos no canvas, mas com cuidado:
  - Continuar removendo canvas.getObjects().filter(o => o.isSideHighlight === true) (isso pega somente highlights soltos, top-level).
- Dentro do topGroup:
  - Em vez de find, fazer filter e remover todos:
    - const highlights = topGroup.getObjects().filter(o => (o as any).isSideHighlight)
    - if (highlights.length) topGroup.remove(...highlights)

2) Tornar a criação do Line determinística no sistema local do group
- Continuar calculando w/h a partir do houseBody dentro do topGroup (isso está correto).
- Gerar coords como você já faz (top/bottom/left/right).
- Criar o Line com posicionamento explícito:
  - Definir left: 0 e top: 0 (ou outro padrão fixo) e manter origin coerente.
  - Opção segura e previsível para Fabric em group-local:
    - originX: 'center', originY: 'center', left: 0, top: 0
    - coords permanecem com valores negativos/positivos (ex.: -w/2 … +w/2)
- Garantir que o Line não interfira com interação:
  - selectable: false, evented: false, excludeFromExport: true, strokeUniform: true

3) Inserir highlight usando fluxo que atualiza o grupo corretamente
- Trocar topGroup.add(highlightLine) por um método que atualize bounds:
  - Preferência 1: topGroup.addWithUpdate(highlightLine) (se estiver disponível no Fabric v6 usado aqui).
  - Preferência 2 (mais alinhada com o padrão do projeto): topGroup.add(highlightLine) + refreshHouseGroupRendering(topGroup)
- Em seguida: canvas.requestRenderAll()

Observação importante de isolamento:
- Para não afetar outras funcionalidades, vamos chamar refreshHouseGroupRendering SOMENTE no topGroup e somente quando:
  - houver remoção de highlight antigo, ou
  - houver adição de highlight novo.
Isso evita qualquer impacto em pilotis, outras vistas, ou performance geral.

4) Tornar a detecção da vista selecionada mais robusta (sem mexer em regras)
- Hoje usa somente (activeObject as any).houseViewType.
- Vamos manter isso, mas adicionar fallback leve (apenas leitura):
  - const rawView = (activeObject as any).houseViewType ?? (activeObject as any).houseView
  - Normalizar para ViewType quando possível:
    - 'front'|'back'|'side1'|'side2' ok
    - 'top' => não desenha
  - Isso não altera estado nenhum; só evita casos em que houseViewType não esteja presente por algum JSON/undo/import.

5) Garantir o “não desenhar nada” quando não deve
- Se activeObject == null => remover highlight do topGroup e render
- Se viewType == 'top' => remover highlight e render
- Se não achar side no houseManager => remover highlight e render
- Se não achar topGroup ou houseBody => não desenhar (só render)

6) (Opcional e seguro) Pequena instrumentação temporária para confirmar o lado/coords sem mexer em funcionalidade
- Se você topar, podemos adicionar um console.debug bem específico e fácil de remover, apenas quando desenha:
  - viewType, side, w, h
- Mas como você está cansado de regressões, eu posso pular isso e ir direto no ajuste determinístico do Line + refresh.

Critérios de aceite (o que você vai testar)
- Selecionar Front (já no canvas) => a linha azul aparece exatamente no lado Superior/Inferior da Planta correspondente ao side escolhido na inserção.
- Selecionar Side1/Side2 => a linha azul aparece exatamente no lado Esquerda/Direita da Planta.
- Clicar no vazio (selection cleared) => a linha some.
- Selecionar a própria Planta => a linha some.
- Mover/rotacionar/escalar a Planta => a linha continua colada no retângulo da Planta (não fica “parada longe”).
- Abrir/usar editor de pilotis e campo “Nível do mestre” => nada muda (não tocamos nessa área).
- Regra “uma vista por tipo” => nada muda (não tocamos em house-manager nem em inserção).

Risco de regressão (e como evitamos)
- Risco: mexer em refreshHouseGroupRendering pode afetar outros grupos.
  - Mitigação: aplicar SOMENTE no topGroup, e só no momento de adicionar/remover o highlight.
- Risco: highlight entrar no histórico/undo.
  - Já está marcado excludeFromExport e é não-interativo; não vamos alterar history hooks.
  - O saveHistory é acionado por object:added/removed. Como o highlight é adicionado/ removido, ele pode entrar no histórico. Se isso for indesejado, podemos (num passo separado e ainda isolado) evitar que o highlight dispare saveHistory, mas isso exigiria tocar no handler global de object:added/removed. Por enquanto, manteremos como está para não tocar em fluxo global; primeiro vamos corrigir o bug visual.

Sequência de implementação (curta e segura)
1) Editar apenas src/components/rac-editor/Canvas.tsx:
   - Ajustar remoção de highlight dentro do topGroup para remover todos.
   - Ajustar criação do Line para setar left/top explicitamente.
   - Adicionar refreshHouseGroupRendering(topGroup) após add/remove (importando a função de canvas-utils).
   - Trocar add por addWithUpdate se disponível, senão manter add + refresh.
2) Testes manuais conforme critérios acima.