import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';

export const APP_SETTINGS_DEFAULTS = {
  autoNavigatePiloti: false,
  zoomEnabledByDefault: true,
  openEditorsAtFixedPosition: false,
  disableDrawModeAfterFreehand: false,
  showStairsOnTopView: false,
} as const;

export const STORAGE_KEYS = {
  settings: 'rac-settings',
  tutorialCompleted: 'rac-tutorial-completed',
  pilotiTipShown: 'rac-piloti-tip-shown',
  wallTipShown: 'rac-wall-tip-shown',
  lineTipShown: 'rac-line-tip-shown',
  arrowTipShown: 'rac-arrow-tip-shown',
  distanceTipShown: 'rac-distance-tip-shown',
} as const;

export const VIEWPORT = {
  mobileBreakpoint: 768,
  mobileMaxWidthQuery: '(max-width: 767px)',
} as const;

export const CANVAS_DEFAULTS = {
  width: 1300,
  height: 1300,
} as const;

export const CANVAS_STYLE = {
  backgroundColor: '#fff',
  fontFamily: 'Arial',
  fontSize: 15,
  fontColor: '#333',
} as const;

export const CANVAS_ELEMENT_STYLE = {
  strokeWidth: 2,
  strokeColor: {
    doorElement: '#8b4513',
    fossaElement: '#5d4037',
    linearElement: '#000',
    stairsElement: '#8b4513',
    treeElement: '#27ae60',
    wallElement: '#666',
    waterElement: '#0092dd',
  },
  fillColor: {
    doorBody: '#d4a574',
    fossaBody: 'rgba(139, 90, 43, 0.3)',
    stairsBody: '#d4a574',
    treeBody: 'rgba(46, 204, 113, 0.6)',
    wallBody: 'rgba(128, 128, 128, 0.3)',
  },
} as const;

export const HOUSE_DEFAULTS = {
  width: HOUSE_DIMENSIONS.footprint.width,
  height: HOUSE_DIMENSIONS.footprint.depth,

  viewScale: HOUSE_DIMENSIONS.view.scale,
  viewPadding: HOUSE_DIMENSIONS.view.padding,

  // Espaçamento vertical (em pixels) entre duas vistas quando elas são inseridas no canvas.
  viewBetweenGap: 50,

  pilotiBaseHeight: HOUSE_DIMENSIONS.piloti.baseHeight,
  pilotiIsMaster: false,
  pilotiNivel: HOUSE_DIMENSIONS.piloti.nivel,
  pilotiNivelLabelOffset: HOUSE_DIMENSIONS.piloti.nivelLabelOffset,
  pilotiRadius: HOUSE_DIMENSIONS.piloti.radius,
} as const;

export const HOUSE_2D_STYLE = {
  outlineStrokeColor: '#333',
  surfaceBackgroundColor: '#fff',
  panelBackgroundColor: '#eee',
  outlineStrokeWidth: 1.5,
  transparentColor: 'transparent',
} as const;

export const HOUSE_3D_WALL_COLOR_OPTIONS = [
  {name: 'Terracota', value: '#c4967a'},
  {name: 'Bege', value: '#d4b896'},
  {name: 'Cinza', value: '#d4d4d4'},
  {name: 'Branco', value: '#f0f0f0'},
  {name: 'Azul', value: '#a8c4d8'},
  {name: 'Verde', value: '#b8d4b8'},
  {name: 'Rosa', value: '#e0b8b8'},
  {name: 'Amarelo', value: '#f5e6a3'},
] as const;

export const HOUSE_3D_WALL_COLOR_BY_NAME = Object.fromEntries(
  HOUSE_3D_WALL_COLOR_OPTIONS.map(({name, value}) => [name, value]),
) as Record<(typeof HOUSE_3D_WALL_COLOR_OPTIONS)[number]['name'], string>;

export const HOUSE_3D_WALL_COLORS = {
  viewerInitialColor: HOUSE_3D_WALL_COLOR_BY_NAME.Azul,
  sceneFallbackColor: HOUSE_3D_WALL_COLOR_BY_NAME.Cinza,
} as const;

export const PILOTI_STYLE = {
  strokeWidth: 2,
  strokeWidthTopView: 1.5,
  selectedStrokeWidth: 4,
  selectedStrokeWidthTopView: 3,

  strokeColor: HOUSE_2D_STYLE.outlineStrokeColor,
  stripeColor: HOUSE_2D_STYLE.outlineStrokeColor,
  fillColor: HOUSE_2D_STYLE.surfaceBackgroundColor,

  nivelFontSize: 10,
  heightFontSize: 20,
  nivelFontSizeTopView: 12,
  heightFontSizeTopView: CANVAS_STYLE.fontSize,

  heightFontColor: '#888',
} as const;

export const PILOTI_MASTER_STYLE = {
  fillColor: '#d4a574',
  strokeColor: '#8b4513',
  strokeWidth: PILOTI_STYLE.selectedStrokeWidth,
  strokeWidthTopView: PILOTI_STYLE.selectedStrokeWidthTopView,
} as const;

export const PILOTI_VISUAL_FEEDBACK_COLORS = {
  emphasizedStrokeColor: '#facc15',
  focusedStrokeColor: '#3b82f6',
  dimmedStrokeColor: '#eee',
} as const;

export const PILOTI_CORNER_ID = {
  topLeft: 'piloti_0_0',
  topRight: 'piloti_3_0',
  bottomLeft: 'piloti_0_2',
  bottomRight: 'piloti_3_2',
} as const;

export const PILOTI_CORNER_ID_LIST = [
  PILOTI_CORNER_ID.topLeft,
  PILOTI_CORNER_ID.topRight,
  PILOTI_CORNER_ID.bottomLeft,
  PILOTI_CORNER_ID.bottomRight,
] as const;

// Corner piloti IDs (A1, A4, C1, C4) - only these can be master and have nivel
export const PILOTI_CORNER_IDS: readonly string[] = [...PILOTI_CORNER_ID_LIST];

export const ALL_PILOTI_IDS = Array.from({length: 3 * 4}, (_, index) => {
  const col = index % 4;
  const row = Math.floor(index / 4);
  return `piloti_${col}_${row}`;
});

export const CONTRAVENTAMENTO = {
  fillColor: PILOTI_MASTER_STYLE.fillColor,
  strokeColor: PILOTI_MASTER_STYLE.strokeColor,
  strokeWidth: PILOTI_STYLE.strokeWidthTopView,
} as const;

export const TERRAIN_STYLE = {
  strokeColor: '#8b6914',
  fillColor: 'rgba(139, 105, 20, 0.10)',

  selectedStrokeColor: '#b7791f',
  selectedFillColor: 'rgba(250, 204, 21, 0.28)',
} as const;

export type TerrainSolidityLevel = 1 | 2 | 3 | 4 | 5;

export const TERRAIN_SOLIDITY = {
  defaultLevel: 1,
  sideGravelWidth: 10,
  sideGravelWidthMt3: 8,
  voidFactorGravel: 1.20,
  voidFactorRachao: 1.40,
  levels: {
    1: {label: 'Seco', rachao: 20, rachaoMt3: 20},
    2: {label: 'Argiloso', rachao: 30, rachaoMt3: 30},
    3: {label: 'Água no fundo', rachao: 40, rachaoMt3: 40},
    4: {label: 'Bastante água', rachao: 50, rachaoMt3: 50},
    5: {label: 'Submerso', rachao: 60, rachaoMt3: 60},
  },
} as const;

export function normalizeTerrainSolidityLevel(value: number): TerrainSolidityLevel {
  const numeric = Number(value);
  if (numeric >= 5) return 5;
  if (numeric <= 1) return 1;
  if (numeric === 2 || numeric === 3 || numeric === 4) return numeric;
  return TERRAIN_SOLIDITY.defaultLevel;
}

export const ZOOM_LIMITS = {
  min: 0.25,
  max: 2,
  wheelStep: 0.1,
  pinchScaleFactor: 0.005,
} as const;

export const ZOOM_SLIDER = {
  minPercent: ZOOM_LIMITS.min * 100,
  maxPercent: ZOOM_LIMITS.max * 100,
  thumbSize: 12,
  height: 16,
} as const;

export const MINIMAP = {
  size: 75,
  minObjectSize: 2,
  minViewportSize: 4,
} as const;

export const TIMINGS = {
  mobileTapToEditDelayMs: 300,
  mobilePilotiTapDelayMs: 50,
  tutorialBalloonDelayMs: 100,
  pilotiTutorialDelayMs: 100,
  pilotiAutoNavigateDelayMs: 150,
  stackedViewRepositionDelayMs: 50,
  pinchEndDebounceMs: 450,
  houseInitializationPollMs: 100,
  houseInitializationMaxRetries: 50,
} as const;

export const INTERACTION_THRESHOLDS = {
  mobilePanActivation: 5,
} as const;

export const TOAST_MESSAGES = {
  houseViewAdded: (viewLabel: string): string => `Vista ${viewLabel} adicionada!`,
  houseViewLimitReached: (viewLabel: string): string => `Limite de ${viewLabel} atingido para este tipo de casa.`,
  houseViewAllInstancesAlreadyOnCanvas: (viewLabel: string): string =>
    `Todas as instâncias de ${viewLabel} já estão no canvas.`,

  houseViewHasNoAvailableSide: 'Nenhum lado disponível para esta vista.',
  projectExportedSuccessfully: 'Projeto exportado com sucesso!',
  invalidJsonFile: 'Arquivo JSON inválido.',
  projectLoadedSuccessfully: 'Projeto carregado com sucesso!',
  contraventamentoRemovedSuccessfully: 'Contraventamento removido!',
  removeOtherViewsBeforeDeletingTopView: 'Remova todas as outras vistas antes de apagar a planta.',
  pdfSavedSuccessfully: 'PDF salvo com sucesso!',
  canvasRestartedSuccessfully: 'Canvas reiniciado!',
  noHouse3DToInsert: 'Nenhuma casa 3D para inserir.',
  house3DCanvasUnavailable: 'Canvas 3D não disponível.',
  house3DInsertedSuccessfully: 'Visão 3D inserida no canvas.',
  failedToInsertHouse3DOnCanvas: 'Não foi possível inserir no canvas.',
  failedToCaptureHouse3DImage: 'Falha ao capturar a imagem 3D.',
  topViewUnavailableForContraventamento: 'Não foi possível identificar a vista planta para contraventamento.',

  contraventamentoSideSelected: (sideLabel: string): string =>
    `Lado ${sideLabel} selecionado. Selecione o piloti final na mesma coluna.`,

  contraventamentoColumnAlreadyUsesBothSides:
    'Esta coluna já possui contraventamentos nos lados esquerdo e direito.',

  contraventamentoNotSelected:
    'Nenhum piloti de destino selecionado para contraventamento.',

  contraventamentoSelectFirstPiloti:
    'Selecione o primeiro piloti para iniciar o contraventamento.',

  contraventamentoSelectSecondPilotiInSameColumn:
    'Selecione o piloti final na mesma coluna do primeiro.',

  contraventamentoSelectDifferentSecondPiloti:
    'Selecione um piloti final diferente do primeiro.',

  contraventamentoColumnSideAlreadyOccupied: (sideLabel: string): string =>
    `A coluna já possui contraventamento no lado ${sideLabel}.`,

  failedToCreateContraventamento: 'Não foi possível criar o contraventamento.',
  contraventamentoAddedSuccessfully: 'Contraventamento adicionado!',
  addTopViewBeforeContraventamento: 'Adicione uma vista planta primeiro.',
  contraventamentoRequiresNivelAboveXCentimeters:
    'O piloti precisa ter nível de pelo menos 20cm para contraventar.',
  contraventamentoRequiresOutOfProportionColumn:
    'A coluna só permite contraventamento quando pelo menos um piloti está fora de proporção.',

  contraventamentoRemovedFromSide: (sideLabel: string): string =>
    `Contraventamento do lado ${sideLabel} removido.`,
} as const;

export const EDITOR_INFO_MESSAGES = {
  projectSavedAsJson: 'Projeto salvo como JSON!',
  projectLoaded: 'Projeto carregado!',
  contraventamentoRemoved: 'Contraventamento removido.',
} as const;

export const EDITOR_ICON_COLORS = {
  neutralStrokeColor: '#dfe3e8',
} as const;

export const TOOLBAR_THEME = {
  iconDefaultColor: '#ecf0f1',
  iconZoomDisabledColor: '#74b9ff',
  iconDeleteColor: '#ffaaaa',
  overflowFileActionIconColor: '#ffeaa7',
  overflowViewerActionIconColor: '#74b9ff',
  overflowTipsActionIconColor: '#f1c40f',
  overflowSettingsActionIconColor: EDITOR_ICON_COLORS.neutralStrokeColor,
  classes: {
    baseButtonShell:
      'border-none rounded-xl cursor-pointer transition-all duration-200 flex justify-center items-center',

    mainButtonSurface: 'bg-[#2c3e50] text-[#ecf0f1] shadow-lg hover:bg-[#0092DD] hover:scale-105 active:scale-95',
    mainButtonActiveSurface: 'bg-[#e67e22] border-2 border-white',
    mainMenuToggleOpenedSurface: 'bg-[#e74c3c] hover:bg-[#c0392b]',
    disabledActionSurface: 'opacity-40 cursor-not-allowed hover:!scale-100 hover:!bg-[#2c3e50]',
    submenuDefaultSurface: 'bg-[#34495e] cursor-pointer',
    submenuDisabledSurface: 'opacity-40 cursor-not-allowed bg-[#2c3e50]',
    submenuActiveSurface: 'bg-[#e67e22] border-2 border-white cursor-pointer',
    submenuAvailableHoverSurface: 'hover:bg-[#0092DD] hover:scale-105 active:scale-95',
    tooltipSurface: 'bg-[#333] text-white',
  },
} as const;

export const GENERIC_OBJECT_EDITOR_COLOR_PALETTE = [
  {name: 'Vermelho', value: '#e74c3c'},
  {name: 'Azul', value: '#3498db'},
  {name: 'Verde', value: '#27ae60'},
  {name: 'Amarelo', value: '#f1c40f'},
  {name: 'Preto', value: '#000000'},
  {name: 'Cinza', value: '#7f8c8d'},
  {name: 'Marrom', value: '#795548'},
  {name: 'Laranja', value: '#e67e22'},
] as const;
