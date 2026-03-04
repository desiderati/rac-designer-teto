## 2026-02-28

### Novas funcionalidades (ROADMAP)

- Escadas automáticas implementadas:
- criação automática na `TopView` com base no lado da porta;
- criação automática na vista elevada que contém porta;
- na vista elevada, a escada agora usa exatamente a mesma geometria da planta (`retângulo + linhas de degrau`);
- ajuste de posicionamento para encostar o contorno da escada na base da porta (sem gap visual de `stroke`);
- ajuste de cálculo de altura para considerar `nível baixo + 10cm + piso + viga` (garantindo contato com o terreno);
- ajuste de deslocamento na planta para a escada não sobrepor metade da porta;
- alinhamento horizontal da escada da elevação usando o mesmo `X` da porta (origem esquerda);
- cálculo da altura da escada em desnível por interpolação binomial do terreno nos dois lados da escada, usando o lado
  mais próximo do terreno;
- altura de degrau ajustada para `20 cm` (antes `10 cm`);
- profundidade visual de cada degrau ajustada proporcionalmente à altura do degrau para evitar escada visualmente "pela
  metade";
- cálculo automático dos níveis laterais da escada e mesma quantidade de degraus entre vistas;
- botão manual de escada desabilitado na toolbar.

- Contraventamento atualizado:
- remoção da restrição anterior de nível `> 40 cm`;
- elegibilidade ajustada para `nível >= 20 cm`;
- posicionamento dinâmico na elevação conforme regra:
- `20 cm -> offset 5 cm`;
- `30 cm -> offset 10 cm`;
- `>= 40 cm -> offset 20 cm`.
- adição de rotina de contraventamento automático por coluna quando piloti fica fora de proporção (
  `altura < nível * 3`);
- remoção automática apenas dos contraventamentos automáticos quando a coluna volta a ficar proporcional;
- preservação de contraventamentos manuais já existentes na coluna (sem duplicação automática);
- nova metadata serializável `isAutoContraventamento` para distinguir fluxos automático/manual;
- sincronização imediata das elevações após criação/remoção automática.

- Terreno editável nas vistas elevadas:
- adição de cama de rachão com padrão gráfico no canvas 2D;
- adição de britas laterais com largura de `10 cm` em cada lado;
- suporte a tipo de terreno de `1` a `5` com espessuras:
- `1: 13 cm`, `2: 25 cm`, `3: 38 cm`, `4: 50 cm`, `5: 63 cm`;
- clique no terreno abre editor com slider para alteração de tipo de solo;
- persistência do tipo de terreno no modelo serializado do canvas.
- desenho de rachão/britas alterado para ficar ao redor de cada piloti (laterais + base), em vez de faixa contínua sob a
  linha de terreno.
- refinamento de alinhamento/largura: uso do envelope visual do piloti (incluindo `stroke` e faixa hachurada) para
  evitar deslocamento lateral e base menor que o piloti.
- ajuste adicional de envelope para usar somente o retângulo real do piloti (eliminando micro-deslocamento causado pela
  faixa hachurada).
- clique no terreno robustecido: seleção não depende mais do `target` direto do Fabric, varrendo grupos de casa na
  posição do ponteiro.
- recálculo explícito de bounds do grupo (`_calcBounds`) antes de `setCoords` no fluxo de escada automática.
- inclusão explícita do `terrainHitArea` no conjunto de elementos adicionados à vista (hit-test do terreno volta a
  funcionar).
- ajuste de posição vertical do rachão para iniciar abaixo da base do piloti.
- recálculo de bounds (`_calcBounds` + `setCoords`) ao final de `updateGroundInGroup`.
- `terrainHitArea` passou a ser `evented=true` e a seleção de terreno usa também `subTargets` do Fabric.
- correção de requisito: labels de **Nível do terreno** foram restauradas e as labels de **altura dos pilotis** nas
  vistas elevadas foram removidas.
- ajuste adicional no recálculo de coords/bounds do grupo após regenerar terreno (`setCoords` em novos elementos +
  `requestRenderAll`).
- altura do preenchimento de terreno ajustada para considerar `fundo do piloti + cama de rachão + padding`.
- ordem de renderização ajustada: pilotis/estrutura ficam na frente de brita/rachão nas vistas elevadas.
- clique no terreno não dispara quando o ponteiro está sobre piloti (prioridade para edição de piloti).
- recálculo de bounds do grupo reforçado para grupo ativo após atualização de terreno.
- editor de terreno passa a abrir apenas com duplo clique (`mouse:dblclick`), não mais com clique simples.
- tipo de terreno (solidez) migrado para estado global da casa (`terrainType`), deixando de ser por vista elevada.
- aplicação de alteração de terreno agora propaga para todas as vistas elevadas registradas da casa.
- ao abrir o editor de terreno, o valor exibido no slider sempre reflete o `terrainType` global da casa.

### Validações executadas

- `npm run test` (todos os smoke tests passaram).
- `npm run build` (build de produção concluído com sucesso).
- `npm run lint` continua com passivo preexistente amplo fora do escopo desta entrega.
