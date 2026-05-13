import type {RacEditorLayoutProps} from '@/components/rac-editor/ui/RacEditorLayout.tsx';

type LayoutProps = RacEditorLayoutProps;

interface BuildRacEditorLayoutPropsArgs {
  handleContainerClick: LayoutProps['root']['onClick'];
  menuActions: LayoutProps['menus']['actions'];
  constructionGroups: LayoutProps['menus']['constructionGroups'];
  isDrawing: LayoutProps['menus']['isDrawing'];
  activeSubmenu: LayoutProps['menus']['activeSubmenu'];
  showTips: LayoutProps['menus']['showTips'];
  showZoomControls: LayoutProps['menus']['showZoomControls'];
  isMenuOpen: LayoutProps['menus']['isMenuOpen'];
  currentHouseType: LayoutProps['menus']['houseType'];
  frontViewCount: LayoutProps['menus']['frontViewCount'];
  backViewCount: LayoutProps['menus']['backViewCount'];
  side1ViewCount: LayoutProps['menus']['side1ViewCount'];
  side2ViewCount: LayoutProps['menus']['side2ViewCount'];
  currentFamilyName: LayoutProps['menus']['familyName'];
  displayZoom: LayoutProps['menus']['zoom'];
  canvasToolMode: LayoutProps['menus']['canvasToolMode'];
  isMobile: LayoutProps['menus']['isMobile'];
  documentSaveStatus: LayoutProps['menus']['documentSaveStatus'];
  documentTransitioning: LayoutProps['menus']['documentTransitioning'];
  canvasRef: LayoutProps['canvas']['canvasRef'];
  infoMessage: LayoutProps['canvas']['infoMessage'];
  isAnyEditorOpen: LayoutProps['canvas']['isAnyEditorOpen'];
  isContraventamentoMode: LayoutProps['canvas']['isContraventamentoMode'];
  isPilotiEligibleAsDestination: LayoutProps['canvas']['isPilotiEligibleForContraventamento'];
  setDisplayZoom: LayoutProps['canvas']['onZoomChange'];
  setInfoMessage: LayoutProps['canvas']['onSelectionMessage'];
  handleZoomInteraction: LayoutProps['canvas']['onZoomInteraction'];
  handlePilotiSelect: LayoutProps['canvas']['onPilotiSelect'];
  handleWallSelect: LayoutProps['canvas']['onWallSelect'];
  handleLinearSelect: LayoutProps['canvas']['onLinearSelect'];
  handleTerrainSelect: LayoutProps['canvas']['onTerrainSelect'];
  handleDelete: LayoutProps['canvas']['onDelete'];
  handleContraventamentoPilotiClick: LayoutProps['canvas']['onContraventamentoPilotiClick'];
  handleCancelContraventamento: LayoutProps['canvas']['onContraventamentoCancel'];
  handleFreeDrawPathCreated: LayoutProps['canvas']['onFreeDrawPathCreated'];
  onCanvasDocumentChange: LayoutProps['canvas']['onCanvasDocumentChange'];
  pilotisSetupOpen: LayoutProps['houseTypeSelector']['pilotisSetupOpen'];
  setPilotisSetupOpen: (open: boolean) => void;
  handlePilotisSetupConfirm: LayoutProps['houseTypeSelector']['onPilotisSetupConfirm'];
  houseTypeSelectorOpen: LayoutProps['houseTypeSelector']['houseTypeSelectorOpen'];
  handleHouseTypeSelectorClose: LayoutProps['houseTypeSelector']['onHouseTypeSelectorClose'];
  handleHouseTypeSelected: LayoutProps['houseTypeSelector']['onHouseTypeSelected'];
  nivelDefinitionOpen: LayoutProps['houseTypeSelector']['nivelDefinitionOpen'];
  handleNivelDefinitionClose: LayoutProps['houseTypeSelector']['onCloseNivelDefinition'];
  handleNiveisApplied: LayoutProps['houseTypeSelector']['onApplyNiveis'];
  isPilotiEditorOpen: LayoutProps['modalEditors']['isPilotiEditorOpen'];
  pilotiSelection: LayoutProps['modalEditors']['pilotiSelection'];
  selectedPilotiHeights: LayoutProps['modalEditors']['selectedPilotiHeights'];
  handlePilotiEditorClose: LayoutProps['modalEditors']['onPilotiEditorClose'];
  handlePilotiHeightChange: LayoutProps['modalEditors']['onPilotiHeightChange'];
  handlePilotiNavigate: LayoutProps['modalEditors']['onPilotiNavigate'];
  contraventamentoEditorState: LayoutProps['modalEditors']['contraventamentoEditorState'];
  handleContraventamentoSelect: LayoutProps['modalEditors']['onContraventamentoSelect'];
  handleWallApply: LayoutProps['modalEditors']['onWallApply'];
  closeWallEditor: LayoutProps['modalEditors']['onWallEditorClose'];
  wallSelection: LayoutProps['modalEditors']['wallSelection'];
  wallEditorColor: LayoutProps['modalEditors']['wallEditorColor'];
  isWallEditorOpen: LayoutProps['modalEditors']['isWallEditorOpen'];
  onLinearApply: LayoutProps['modalEditors']['onLinearApply'];
  closeLinearEditor: LayoutProps['modalEditors']['onLinearEditorClose'];
  linearSelection: LayoutProps['modalEditors']['linearSelection'];
  isLinearEditorOpen: LayoutProps['modalEditors']['isLinearEditorOpen'];
  terrainSelection: LayoutProps['modalEditors']['terrainSelection'];
  terrainPilotis: LayoutProps['modalEditors']['terrainPilotis'];
  isTerrainEditorOpen: LayoutProps['modalEditors']['isTerrainEditorOpen'];
  handleTerrainEditorClose: LayoutProps['modalEditors']['onTerrainEditorClose'];
  handleTerrainApply: LayoutProps['modalEditors']['onTerrainApply'];
  pendingViewType: LayoutProps['modalEditors']['pendingViewType'];
  sideSelectorOpen: LayoutProps['modalEditors']['sideSelectorOpen'];
  sideSelectorMode: LayoutProps['modalEditors']['sideSelectorMode'];
  houseSideSlots: LayoutProps['modalEditors']['houseSideSlots'];
  handleSideSelectorClose: LayoutProps['modalEditors']['onSideSelectorClose'];
  handleSideSelected: LayoutProps['modalEditors']['onSideSelected'];
  isSettingsOpen: LayoutProps['modals']['isSettingsOpen'];
  setIsSettingsOpen: LayoutProps['modals']['onSettingsOpenChange'];
  handleSettingsChange: LayoutProps['modals']['onSettingsChange'];
  showRestartConfirm: LayoutProps['modals']['showRestartConfirm'];
  confirmRestartDrawing: LayoutProps['modals']['onConfirmRestartDrawing'];
  closeRestartConfirm: LayoutProps['modals']['onCloseRestartConfirm'];
  is3DViewerOpen: LayoutProps['viewer']['open'];
  setIs3DViewerOpen: LayoutProps['viewer']['onOpenChange'];
  constructionSiteManagementOpen: LayoutProps['workspace']['open'];
  closeConstructionSiteManagement: LayoutProps['workspace']['onClose'];
  constructionSiteManagementPanel: LayoutProps['workspace']['panel'];
}

export function buildRacEditorLayoutProps(args: BuildRacEditorLayoutPropsArgs): RacEditorLayoutProps {
  return {
    root: {
      onClick: args.handleContainerClick,
    },
    menus: {
      actions: args.menuActions,
      constructionGroups: args.constructionGroups,
      isDrawing: args.isDrawing,
      activeSubmenu: args.activeSubmenu,
      showTips: args.showTips,
      showZoomControls: args.showZoomControls,
      isMenuOpen: args.isMenuOpen,
      houseType: args.currentHouseType,
      frontViewCount: args.frontViewCount,
      backViewCount: args.backViewCount,
      side1ViewCount: args.side1ViewCount,
      side2ViewCount: args.side2ViewCount,
      familyName: args.currentFamilyName,
      zoom: args.displayZoom,
      canvasToolMode: args.canvasToolMode,
      isMobile: args.isMobile,
      documentSaveStatus: args.documentSaveStatus,
      documentTransitioning: args.documentTransitioning,
    },
    canvas: {
      canvasRef: args.canvasRef,
      showTips: args.showTips,
      showZoomControls: args.showZoomControls,
      infoMessage: args.infoMessage,
      isAnyEditorOpen: args.isAnyEditorOpen,
      isContraventamentoMode: args.isContraventamentoMode,
      isPilotiEligibleForContraventamento: args.isPilotiEligibleAsDestination,
      canvasToolMode: args.canvasToolMode,
      onZoomChange: args.setDisplayZoom,
      onSelectionMessage: args.setInfoMessage,
      onSelectionAuxCleanup: () => {},
      onZoomInteraction: args.handleZoomInteraction,
      onPilotiSelect: args.handlePilotiSelect,
      onWallSelect: args.handleWallSelect,
      onLinearSelect: args.handleLinearSelect,
      onTerrainSelect: args.handleTerrainSelect,
      onDelete: args.handleDelete,
      onContraventamentoPilotiClick: args.handleContraventamentoPilotiClick,
      onContraventamentoCancel: args.handleCancelContraventamento,
      onFreeDrawPathCreated: args.handleFreeDrawPathCreated,
      onCanvasDocumentChange: args.onCanvasDocumentChange,
    },
    houseTypeSelector: {
      pilotisSetupOpen: args.pilotisSetupOpen,
      onPilotisSetupClose: () => args.setPilotisSetupOpen(false),
      onPilotisSetupConfirm: args.handlePilotisSetupConfirm,
      houseTypeSelectorOpen: args.houseTypeSelectorOpen,
      onHouseTypeSelectorClose: args.handleHouseTypeSelectorClose,
      onHouseTypeSelected: args.handleHouseTypeSelected,
      nivelDefinitionOpen: args.nivelDefinitionOpen,
      onCloseNivelDefinition: args.handleNivelDefinitionClose,
      onApplyNiveis: args.handleNiveisApplied,
    },
    modalEditors: {
      isMobile: args.isMobile,
      isPilotiEditorOpen: args.isPilotiEditorOpen,
      pilotiSelection: args.pilotiSelection,
      selectedPilotiHeights: args.selectedPilotiHeights,
      onPilotiEditorClose: args.handlePilotiEditorClose,
      onPilotiHeightChange: args.handlePilotiHeightChange,
      onPilotiNavigate: args.handlePilotiNavigate,
      contraventamentoEditorState: args.contraventamentoEditorState,
      onContraventamentoSelect: args.handleContraventamentoSelect,
      onWallApply: args.handleWallApply,
      onWallEditorClose: args.closeWallEditor,
      wallSelection: args.wallSelection,
      wallEditorColor: args.wallEditorColor,
      isWallEditorOpen: args.isWallEditorOpen,
      onLinearApply: args.onLinearApply,
      onLinearEditorClose: args.closeLinearEditor,
      linearSelection: args.linearSelection,
      linearEditorType: args.linearSelection?.myType ?? 'line',
      isLinearEditorOpen: args.isLinearEditorOpen,
      terrainSelection: args.terrainSelection,
      terrainPilotis: args.terrainPilotis,
      isTerrainEditorOpen: args.isTerrainEditorOpen,
      onTerrainEditorClose: args.handleTerrainEditorClose,
      onTerrainApply: args.handleTerrainApply,
      pendingViewType: args.pendingViewType,
      sideSelectorOpen: args.sideSelectorOpen,
      sideSelectorMode: args.sideSelectorMode,
      houseSideSlots: args.houseSideSlots,
      onSideSelectorClose: args.handleSideSelectorClose,
      onSideSelected: args.handleSideSelected,
    },
    modals: {
      isMobile: args.isMobile,
      isSettingsOpen: args.isSettingsOpen,
      onSettingsOpenChange: args.setIsSettingsOpen,
      onSettingsChange: args.handleSettingsChange,
      showRestartConfirm: args.showRestartConfirm,
      onConfirmRestartDrawing: args.confirmRestartDrawing,
      onCloseRestartConfirm: args.closeRestartConfirm,
    },
    viewer: {
      open: args.is3DViewerOpen,
      onOpenChange: args.setIs3DViewerOpen,
      canvasRef: args.canvasRef,
    },
    workspace: {
      open: args.constructionSiteManagementOpen,
      onClose: args.closeConstructionSiteManagement,
      panel: args.constructionSiteManagementPanel,
    },
  };
}
