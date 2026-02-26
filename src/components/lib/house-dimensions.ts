/**
 * Fonte única de verdade para dimensões geométricas da casa usadas em 2D e 3D.
 * Todos os valores em px são definidos em px-base antes da aplicação de escala.
 */
export const HOUSE_DIMENSIONS = {

  /** Dimensões-base do footprint total da casa. */
  footprint: {

    /** Largura total da casa no eixo X (px-base). */
    width: 610,

    /** Profundidade total da casa no eixo Z (px-base). */
    depth: 300,
  },

  /** Configurações de visualização usadas para alinhamento entre vistas. */
  view: {

    /** Escala global aplicada na visualização 2D da casa. */
    scale: 0.5,

    /** Espaçamento horizontal de segurança ao redor das vistas para casa tipo 6 (px-base). */
    padding: 50,
  },

  /** Dimensões dos pilotis e posicionamento dos respectivos rótulos. */
  piloti: {

    /** Largura visual do piloti quando renderizado como retângulo (px-base). */
    width: 30,

    /** Altura de referência usada na normalização dos cálculos de piloti (metros). */
    baseHeight: 1.0,

    /** Nível padrão do piloti na criação (metros). */
    nivel: 0.2,

    /** Deslocamento do texto de nível em relação ao marcador do piloti (px-base). */
    nivelLabelOffset: 12,

    /** Raio do marcador circular de piloti na vista superior (px-base). */
    radius: 15,

    /** Espaçamento horizontal entre colunas de pilotis (px-base). */
    columnSpacing: 155,

    /** Espaçamento vertical entre linhas de pilotis (px-base). */
    rowSpacing: 135,

    /** Margem entre bordas lado tipo 6 e a linha mais próxima de pilotis (px-base). */
    margin: 55,
  },

  /** Dimensões estruturais principais de piso, vigas e paredes. */
  structure: {

    /** Altura total do perfil do corpo da casa usado em fachada (px-base). */
    bodyHeight: 273,

    /** Altura livre da parede, sem elementos de telhado (px-base). */
    wallHeight: 213,

    /** Espessura de parede usada em representação 3D (px-base). */
    wallThickness: 0,

    /** Largura auxiliar da diagonal de transição entre corpo e telhado (px-base). */
    diagonalWidth: 244,

    /** Altura auxiliar da diagonal de transição entre corpo e telhado (px-base). */
    diagonalHeight: 261,

    /** Largura do elemento frontal tipo capela na composição da fachada (px-base). */
    chapelWidth: 122,

    /** Espessura da laje/piso nos perfis frontal e lateral (px-base). */
    floorHeight: 10,

    /** Altura da viga principal de piso (px-base). */
    floorBeamHeight: 20,

    /** Profundidade da faixa secundária no perfil da viga (px-base). */
    floorBeamStripDepth: 10,

    /**
     * Por que isso existe:?
     * 1. evitar sobreposição/cintilação de faces (z-fighting) com as paredes laterais
     * 2. manter portas/janelas alinhadas com esses painéis
     */
    panelOffsetRatio: 0.65,
  },

  /** Parâmetros de beiral e ondulação do telhado. */
  roof: {

    /** Beiral do telhado nas bordas do lado tipo 3 (px-base). */
    shortSideOverhang: 20,

    /** Beiral do telhado nas bordas do lado tipo 6 (px-base). */
    longSideOverhang: 10,

    /** Amplitude da onda de corrugação da malha do telhado (px-base). */
    waveAmplitude: 2,

    /** Passo da onda de corrugação da malha do telhado (px-base). */
    wavePitch: 20,

    /** Quantidade de segmentos da malha do telhado no eixo X. */
    waveSegmentsX: 40,

    /** Quantidade de segmentos da malha do telhado no eixo Z. */
    waveSegmentsZ: 40,
  },

  /** Dimensões do plano de terreno ao redor da casa. */
  terrain: {

    /** Margem adicional aplicada ao redor do footprint para criar o terreno (px-base). */
    margin: 100,

    /** Quantidade de segmentos da malha de terreno (ambos os eixos). */
    segments: 30,
  },

  /** Dimensões de portas/janelas e offsets de posicionamento por vista. */
  openings: {

    /** Dimensões comuns de aberturas compartilhadas por todas as fachadas. */
    common: {

      /** Largura padrão da porta (px-base). */
      doorWidth: 80,

      /** Altura padrão da porta (px-base). */
      doorHeight: 191,

      /** Largura padrão da janela (px-base). */
      windowWidth: 80,

      /** Altura padrão da janela (px-base). */
      windowHeight: 70,
    },

    /** Offsets de aberturas para fachadas frontal e traseira. */
    frontBack: {

      /** Deslocamento horizontal da porta em relação ao centro da fachada (px-base). */
      doorShiftX: 30,

      /** Deslocamento horizontal da janela em relação ao centro da fachada (px-base). */
      windowShiftX: 30,

      /** Posição X absoluta auxiliar para janela lateral na fachada frontal/traseira (px-base). */
      windowLateralX: 95,
    },

    /** Offsets de aberturas para fachadas laterais. */
    side: {

      /** Deslocamento horizontal da porta na fachada lateral (px-base). */
      doorShiftX: 45,

      /** Deslocamento horizontal da janela na fachada lateral (px-base). */
      windowShiftX: 45,
    },

    /** Dimensões do marcador de porta na vista superior. */
    topDoorMarker: {

      /** Dimensão do lado maior do marcador de porta (px-base). */
      longSize: 80,

      /** Dimensão do lado menor do marcador de porta (px-base). */
      shortSize: 20,
    },
  },

  /** Dimensões e altura-base de posicionamento do contraventamento. */
  contraventamento: {

    /** Largura da linha superior do contraventamento na representação 2D (px-base). */
    topWidth: 5,

    /** Altura do contraventamento na representação 2D (px-base). */
    squareWidth: 15,

    /** Altura-base padrão a partir do chão para posicionamento do contraventamento (metros). */
    offsetFromGround: 0.2,
  },
} as const;
