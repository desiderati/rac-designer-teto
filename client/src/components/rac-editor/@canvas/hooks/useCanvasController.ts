import {useCallback, type Dispatch, type RefObject, type SetStateAction} from 'react';
import type {CanvasControllerHandle} from '@/components/rac-editor/@canvas/ports/CanvasControllerHandle.ts';
import type {MenuSubmenu} from '@/components/rac-editor/@menus/lib/menu-types.ts';
import {useEditorPorts, useEditorStore} from '@/bootstrap/editor-bootstrap.ts';
import {useCanvasActions} from '@/components/rac-editor/@canvas/hooks/useCanvasActions.ts';
import {useRacEditorTerrainActions} from '@/components/rac-editor/hooks/useRacEditorTerrainActions.ts';
import {useCanvasHouseViewActions} from '@/components/rac-editor/@canvas/hooks/useCanvasHouseViewActions.ts';
import {useCanvasTools} from '@/components/rac-editor/@canvas/hooks/useCanvasTools.ts';
import type {useHouseTypeFlow} from '@/components/rac-editor/@modals/hooks/useHouseTypeFlow.ts';
import type {CanvasHouseRuntimeHandle} from '@/components/rac-editor/@canvas/ports/CanvasHouseRuntimeHandle.ts';
import {createHouseFieldAnalysisDraft} from '@/components/construction-site/lib/house-field-analysis.ts';

type HouseTypeFlowState = Pick<
  ReturnType<typeof useHouseTypeFlow>,
  | 'pendingViewType'
  | 'setPendingViewType'
  | 'sideSelectorMode'
  | 'setSideSelectorMode'
  | 'setHouseSideSlots'
  | 'pendingNivelSide'
  | 'setPendingNivelSide'
  | 'niveisAppliedRef'
  | 'transitionToNivelRef'
>;

export function shouldRestoreConfiguredHouseTopView(
  analysisStatus: 'prepared' | 'inserted' | undefined,
  topHouseGroupOnCanvas: boolean | null,
): boolean {
  return (analysisStatus === 'prepared' || analysisStatus === 'inserted')
    // `null` significa que o handle Fabric ainda não expôs o runtime. O
    // comando de inserção aguarda a hidratação no lifecycle; tratar esse caso
    // como “já existe” deixava casas configuradas presas no Canvas vazio.
    && topHouseGroupOnCanvas !== true;
}

export function resolveConfiguredHouseAnalysisStatus(params: {
  explicitStatus: 'prepared' | 'inserted' | undefined;
  hasHouseBeenDefined?: boolean;
  houseType: string | null;
  persistedHouseType: string | null | undefined;
  persistedPilotiCount: number;
}): 'prepared' | 'inserted' | undefined {
  if (params.explicitStatus) return params.explicitStatus;
  const effectiveHouseType = params.houseType ?? params.persistedHouseType;
  if (!effectiveHouseType) return undefined;

  return params.hasHouseBeenDefined || params.persistedHouseType || params.persistedPilotiCount > 0
    ? 'prepared'
    : undefined;
}

interface UseRacEditorCanvasControllerArgs extends HouseTypeFlowState {
  canvasRef: RefObject<CanvasControllerHandle | null>;
  isDrawing: boolean;
  setIsDrawing: Dispatch<SetStateAction<boolean>>;
  setInfoMessage: Dispatch<SetStateAction<string>>;
  setActiveSubmenu: Dispatch<SetStateAction<MenuSubmenu>>;
  setSideSelectorOpen: Dispatch<SetStateAction<boolean>>;
  setNivelDefinitionOpen: Dispatch<SetStateAction<boolean>>;
  onHouseDrawingChange: () => void;
  runHouseInsertion?: (insert: () => void) => Promise<void>;
}

/**
 * Coordena a camada de aplicação que transforma comandos da UI em operações do canvas.
 */
export function useCanvasController({
  canvasRef,
  isDrawing,
  setIsDrawing,
  setInfoMessage,
  setActiveSubmenu,
  pendingViewType,
  setPendingViewType,
  sideSelectorMode,
  setSideSelectorMode,
  setHouseSideSlots,
  pendingNivelSide,
  setPendingNivelSide,
  niveisAppliedRef,
  transitionToNivelRef,
  setSideSelectorOpen,
  setNivelDefinitionOpen,
  onHouseDrawingChange,
  runHouseInsertion,
}: UseRacEditorCanvasControllerArgs) {
  const editorStore = useEditorStore();
  const {houseReadPort, houseWritePort, settingsPort, constructionSiteManagementPort} = useEditorPorts();

  const {
    getVisibleCenter,
    addObjectToCanvas,
    closeAllMenus,
    disableDrawingMode,
    handleDelete,
  } = useCanvasActions({
    canvasRef,
    isDrawing,
    setIsDrawing,
    setInfoMessage,
    houseReadPort,
    houseWritePort,
    onCloseSubmenus: () => setActiveSubmenu(null),
  });

  const hasTopHouseGroupOnCanvas = useCallback(() => {
    const runtimeHandle = canvasRef.current as (CanvasControllerHandle & Partial<CanvasHouseRuntimeHandle>) | null;
    const runtimePort = runtimeHandle?.createCanvasHouseRuntimePort?.();
    if (!runtimePort) return null;
    return runtimePort.getHouseGroups().some((group) => group.houseViewType === 'top' || group.houseView === 'top');
  }, [canvasRef]);

  const getConfiguredHouseForInsertion = useCallback(() => {
    const site = constructionSiteManagementPort.getConstructionSiteSnapshot();
    const house = site?.houses.find((entry) => entry.id === site.constructionSite.activeHouseId);
    const analysisStatus = house
      ? resolveConfiguredHouseAnalysisStatus({
        explicitStatus: house.fieldAnalysis?.status,
        hasHouseBeenDefined: house.hasHouseBeenDefined,
        houseType: house.houseType ?? house.drawingDocument.house?.houseType ?? null,
        persistedHouseType: house.drawingDocument.house?.houseType,
        persistedPilotiCount: house.pilotiLayout.points.length,
      })
      : undefined;
    if (!house || (analysisStatus !== 'prepared' && analysisStatus !== 'inserted')) return null;

    // Não consultar `isViewAtLimit` aqui: essa consulta também limpa registros
    // órfãos e persiste a casa. Durante o bootstrap, o Fabric ainda pode estar
    // vazio enquanto o documento válido aguarda hidratação, o que transformava
    // a abertura do menu em uma alteração remota e apagava a Planta lógica.
    if (!shouldRestoreConfiguredHouseTopView(analysisStatus, hasTopHouseGroupOnCanvas())) return null;

    return analysisStatus === 'prepared'
      ? constructionSiteManagementPort.getHouseFieldAnalysis(site.constructionSite.id, house.id)
      : createHouseFieldAnalysisDraft(house);
  }, [constructionSiteManagementPort, hasTopHouseGroupOnCanvas]);

  const {
    terrainSelection,
    isTerrainEditorOpen,
    handleTerrainSelect,
    handleTerrainEditorClose,
    handleTerrainApply,
  } = useRacEditorTerrainActions({
    canvasRef,
    editorStore,
    setInfoMessage,
  });

  const handleFreeDrawPathCreated = useCallback(() => {
    setIsDrawing(false);
    setInfoMessage('Traço concluído. O Lápis foi desativado; selecione-o novamente para continuar desenhando.');
  }, [setInfoMessage, setIsDrawing]);

  const {
    handleSideSelected,
    handleNiveisApplied,
    handleNivelDefinitionClose,
    handleSideSelectorClose,
    handleAddHouseView,
    handleHouseTypeSelected: handleHouseTypeSelectedFromFlow,
  } = useCanvasHouseViewActions({
    runHouseInsertion,
    getPreparedHouse: getConfiguredHouseForInsertion,
    canvasRef,
    getVisibleCenter,
    closeAllMenus,
    addObjectToCanvas,
    onHouseDrawingChange,
    houseReadPort,
    houseWritePort,
    pendingViewType,
    setPendingViewType,
    sideSelectorMode,
    setSideSelectorMode,
    setHouseSideSlots,
    pendingNivelSide,
    setPendingNivelSide,
    niveisAppliedRef,
    transitionToNivelRef,
    shouldShowAllElevationNivelLabels: () =>
      !settingsPort.getSettings().autoAdjustPilotiHeightsFromNivel,
    shouldConfigureCornerPilotiNiveisOnHouseInsert: () =>
      settingsPort.getSettings().configureCornerPilotiNiveisOnHouseInsert,
    setSideSelectorOpen,
    setNivelDefinitionOpen,
  });

  const {
    handleAddWall,
    handleAddStreetStraight,
    handleAddStreetCorner,
    handleAddDirtRoad,
    handleAddSquare,
    handleAddTriangle,
    handleAddCircle,
    handleAddDoor,
    handleAddStairs,
    handleAddTree,
    handleAddWater,
    handleAddFossa,
    handleAddSiteElement,
    handleAddLine,
    handleAddArrow,
    handleAddDistance,
    handleToggleDrawMode,
    handleAddText,
  } = useCanvasTools({
    canvasRef,
    addObjectToCanvas,
    closeAllMenus,
    disableDrawingMode,
    isDrawing,
    setIsDrawing,
    setInfoMessage,
  });

  const shouldAutoInsertConfiguredHouse = useCallback(
    () => Boolean(getConfiguredHouseForInsertion()),
    [getConfiguredHouseForInsertion],
  );

  return {
    closeAllMenus,
    disableDrawingMode,
    handleDelete,
    terrainSelection,
    isTerrainEditorOpen,
    handleTerrainSelect,
    handleTerrainEditorClose,
    handleTerrainApply,
    handleFreeDrawPathCreated,
    handleSideSelected,
    handleNiveisApplied,
    handleNivelDefinitionClose,
    handleSideSelectorClose,
    handleAddHouseView,
    shouldAutoInsertConfiguredHouse,
    handleHouseTypeSelectedFromFlow,
    handleAddWall,
    handleAddStreetStraight,
    handleAddStreetCorner,
    handleAddDirtRoad,
    handleAddSquare,
    handleAddTriangle,
    handleAddCircle,
    handleAddDoor,
    handleAddStairs,
    handleAddTree,
    handleAddWater,
    handleAddFossa,
    handleAddSiteElement,
    handleAddLine,
    handleAddArrow,
    handleAddDistance,
    handleToggleDrawMode,
    handleAddText,
  };
}
