import { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas as FabricCanvas, Group, ActiveSelection, FabricObject, Rect, IText, Line } from 'fabric';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { Toolbar } from './Toolbar';
import {
  Canvas,
  CanvasHandle,
  PilotiSelection,
  DistanceSelection,
  ObjectNameSelection,
  LineArrowCanvasSelection,
  ContraventamentoCanvasSelection,
} from './Canvas';
import { InfoBar } from './InfoBar';
import { Tutorial, getTutorialStepIds } from './Tutorial';
import { PilotiEditor } from './PilotiEditor';
import { GenericEditor, GenericEditorType } from './GenericEditor';
import { PilotiTutorialBalloon } from './PilotiTutorialBalloon';
import { OnboardingBalloon } from './OnboardingBalloon';
import { SideSelector } from './SideSelector';
import { NivelDefinitionModal, NivelEntry } from './NivelDefinitionModal';
import { HouseTypeSelector } from './HouseTypeSelector';
import { House3DViewer } from './House3DViewer';
import { SettingsModal } from './SettingsModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { getSettings } from '@/lib/settings';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle } from
'@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle } from
'@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import {
  createHouseTop,
  createHouseFrontBack,
  createHouseSide,
  createLine,
  createArrow,
  createDimension,
  createWater,
  createStairs,
  createWall,
  createDoor,
  createTree,
  createText,
  createFossa,
  customProps,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  formatPilotiHeight,
  getPilotiFromGroup,
  addContraventamentoBeam,
  highlightContraventamentoPilotis,
  resetContraventamentoPilotis,
  removeContraventamentosFromGroup,
  setContraventamentoSelection,
  syncContraventamentoElevationsFromTop,
  ContraventamentoSide,
} from '@/lib/canvas-utils';
import { houseManager, ViewType, HouseSide, HouseType } from '@/lib/house-manager';

type TutorialStepId = 'main-fab' | 'house' | 'elements' | 'zoom-minimap' | 'more-options';

export function RACEditor() {
  const [infoMessage, setInfoMessage] = useState('Dica: Selecione uma ferramenta. (Ctrl+C Copiar, Ctrl+V Colar, Ctrl+Z Desfazer)');
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<'house' | 'elements' | 'lines' | 'overflow' | null>(null);
  const [showTips, setShowTips] = useState(false);
  const [showZoomControls, setShowZoomControls] = useState(() => getSettings().zoomEnabledByDefault);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<TutorialStepId | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showUngroupConfirm, setShowUngroupConfirm] = useState(false);
  const [groupToUngroup, setGroupToUngroup] = useState<Group | null>(null);
  const [pilotiSelection, setPilotiSelection] = useState<PilotiSelection | null>(null);
  const [isPilotiEditorOpen, setIsPilotiEditorOpen] = useState(false);
  const [distanceSelection, setDistanceSelection] = useState<DistanceSelection | null>(null);
  const [isDistanceEditorOpen, setIsDistanceEditorOpen] = useState(false);
  const [objectNameSelection, setObjectNameSelection] = useState<ObjectNameSelection | null>(null);
  const [isObjectNameEditorOpen, setIsObjectNameEditorOpen] = useState(false);
  const [lineArrowSelection, setLineArrowSelection] = useState<LineArrowCanvasSelection | null>(null);
  const [isLineArrowEditorOpen, setIsLineArrowEditorOpen] = useState(false);
  const [onboardingBalloon, setOnboardingBalloon] = useState<{position: {x: number;y: number;};text: string;} | null>(null);
  const [pilotiTutorialPosition, setPilotiTutorialPosition] = useState<{x: number;y: number;} | null>(null);
  const [sideSelectorOpen, setSideSelectorOpen] = useState(false);
  const [pendingViewType, setPendingViewType] = useState<ViewType | null>(null);
  const [sideSelectorMode, setSideSelectorMode] = useState<'position' | 'choose-instance'>('position');
  const [instanceSlots, setInstanceSlots] = useState<{label: string;side: HouseSide;onCanvas: boolean;}[]>([]);
  const [houseTypeSelectorOpen, setHouseTypeSelectorOpen] = useState(false);
  const [tutorialHouseSelectorPreview, setTutorialHouseSelectorPreview] = useState(false);
  const [is3DViewerOpen, setIs3DViewerOpen] = useState(false);
  const [nivelDefinitionOpen, setNivelDefinitionOpen] = useState(false);
  const [pendingNivelSide, setPendingNivelSide] = useState<HouseSide | null>(null);
  const niveisAppliedRef = useRef(false);
  const transitionToNivelRef = useRef(false);
  const [houseVersion, forceUpdate] = useState(0);
  const canvasRef = useRef<CanvasHandle>(null);
  const isMobile = useIsMobile();

  // ── Contraventamento state ─────────────────────────────────────────────────
  const [isContraventamentoMode, setIsContraventamentoMode] = useState(false);
  const [selectedContraventamento, setSelectedContraventamento] = useState<ContraventamentoCanvasSelection | null>(null);
  const [contraventamentoStep, setContraventamentoStep] = useState<'select-first' | 'select-second'>('select-first');
  const [contraventamentoFirst, setContraventamentoFirst] = useState<{
    pilotiId: string;
    col: number;
    row: number;
    group: Group;
  } | null>(null);
  const [contraventamentoSide, setContraventamentoSide] = useState<ContraventamentoSide | null>(null);

  // Subscribe to house manager changes
  useEffect(() => {
    return houseManager.subscribe(() => forceUpdate((v) => v + 1));
  }, []);

  // Initialize house manager when canvas is ready
  useEffect(() => {
    let tries = 0;
    const id = window.setInterval(() => {
      const canvas = canvasRef.current?.canvas;
      if (canvas) {
        houseManager.initialize(canvas);
        window.clearInterval(id);
      }
      tries += 1;
      if (tries > 50) {
        // stop trying after ~5s
        window.clearInterval(id);
      }
    }, 100);

    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('rac-tutorial-completed');
    if (!tutorialCompleted) {
      setTutorialStep('main-fab');
    }
  }, []);

  const advanceTutorial = (completedStep: TutorialStepId) => {
    const steps = getTutorialStepIds() as TutorialStepId[];
    const currentIndex = steps.indexOf(completedStep);
    if (currentIndex < steps.length - 1) {
      setTutorialStep(steps[currentIndex + 1]);
    } else {
      // Tutorial complete
      setTutorialStep(null);
      setHouseTypeSelectorOpen(false);
      setTutorialHouseSelectorPreview(false);
      localStorage.setItem('rac-tutorial-completed', 'true');
    }
  };

  const handleRestartTutorial = () => {
    setShowRestartConfirm(true);
  };

  const confirmRestartTutorial = () => {
    // Clear canvas and history
    const canvas = canvasRef.current?.canvas;
    if (canvas) {
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
      // Clear history first, then save the empty state as the only entry
      canvasRef.current?.clearHistory();
      canvasRef.current?.saveHistory();
    }

    // Reset house manager
    houseManager.reset();

    // Close all menus
    setActiveSubmenu(null);
    setIsMenuOpen(false);
    setHouseTypeSelectorOpen(false);
    setTutorialHouseSelectorPreview(false);
    setShowRestartConfirm(false);

    // Remove all tutorial completion flags
    localStorage.removeItem('rac-tutorial-completed');
    localStorage.removeItem('rac-piloti-tutorial-shown');
    localStorage.removeItem('rac-wall-tip-shown');
    localStorage.removeItem('rac-line-tip-shown');
    localStorage.removeItem('rac-arrow-tip-shown');

    // Close piloti tutorial balloon if open
    setPilotiTutorialPosition(null);

    // Start tutorial from beginning
    setTutorialStep('main-fab');

    toast.success('Canvas reiniciado!');
  };

  const getCanvas = useCallback((): FabricCanvas | null => canvasRef.current?.canvas || null, []);

  // Calculate the center of the visible viewport in canvas coordinates
  const getVisibleCenter = useCallback(() => {
    const handle = canvasRef.current;
    if (handle && typeof handle.getVisibleCenter === 'function') {
      return handle.getVisibleCenter();
    }
    return { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
  }, []);

  // Add object to canvas at the visible center
  const addObjectToCanvas = useCallback((obj: FabricObject) => {
    const canvas = getCanvas();
    if (!canvas) return;

    const center = getVisibleCenter();
    obj.set({ left: center.x, top: center.y });
    canvas.add(obj);
    canvas.setActiveObject(obj);
  }, [getCanvas, getVisibleCenter]);

  // Dismiss piloti tutorial balloon on any user action
  const dismissPilotiTutorial = useCallback(() => {
    if (pilotiTutorialPosition) {
      setPilotiTutorialPosition(null);
      localStorage.setItem('rac-piloti-tutorial-shown', 'true');
    }
  }, [pilotiTutorialPosition]);

  const closeAllMenus = () => {
    setActiveSubmenu(null);
    dismissPilotiTutorial();
    setOnboardingBalloon(null);
  };

  const disableDrawingMode = () => {
    const canvas = getCanvas();
    if (isDrawing && canvas) {
      setIsDrawing(false);
      canvas.isDrawingMode = false;
      canvas.selection = true;
      setInfoMessage('Dica: Selecione uma ferramenta.');
    }
  };

  const handleToggleMenu = () => {
    dismissPilotiTutorial();
    const newIsOpen = !isMenuOpen;
    setIsMenuOpen(newIsOpen);

    if (!newIsOpen) {
      // Closing menu - reset submenus
      setActiveSubmenu(null);
    }

    // Advance tutorial if this was the highlighted step
    if (tutorialStep === 'main-fab' && newIsOpen) {
      advanceTutorial('main-fab');
    }
  };

  // Dismiss piloti tutorial on canvas interaction
  const handleCanvasInteraction = useCallback(() => {
    dismissPilotiTutorial();
  }, [dismissPilotiTutorial]);

  // House actions
  const showPilotiTutorialIfNeeded = (house: Group) => {
    // Only show on desktop
    if (isMobile) return;

    const pilotiTutorialShown = localStorage.getItem('rac-piloti-tutorial-shown');
    if (pilotiTutorialShown) return;

    // Find piloti A1 (piloti_0_0) in the house group
    const canvas = canvasRef.current?.canvas;
    if (!canvas) return;

    // Small delay to ensure the house is rendered
    setTimeout(() => {
      const objects = house.getObjects();
      const pilotiA1 = objects.find((obj: any) => obj.pilotiId === 'piloti_0_0' && obj.isPilotiCircle);

      if (pilotiA1) {
        // Get the screen position of piloti A1
        const groupMatrix = house.calcTransformMatrix();
        const pilotiLeft = (pilotiA1 as any).left || 0;
        const pilotiTop = (pilotiA1 as any).top || 0;

        // Transform from local to canvas coordinates
        const canvasPoint = {
          x: groupMatrix[4] + pilotiLeft * groupMatrix[0],
          y: groupMatrix[5] + pilotiTop * groupMatrix[3]
        };

        // Get container bounds
        const container = canvas.getElement().parentElement;
        if (container) {
          const rect = container.getBoundingClientRect();
          const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];

          const screenX = rect.left + canvasPoint.x * vpt[0] + vpt[4];
          const screenY = rect.top + canvasPoint.y * vpt[3] + vpt[5];

          setPilotiTutorialPosition({ x: screenX, y: screenY });
        }
      }
    }, 100);
  };

  const handleClosePilotiTutorial = () => {
    setPilotiTutorialPosition(null);
    localStorage.setItem('rac-piloti-tutorial-shown', 'true');
  };

  // Helper to add a view with side selection logic
  const requestAddView = (viewType: ViewType) => {
    // Check if view is at limit
    if (houseManager.isViewAtLimit(viewType)) {
      const label = getViewLabel(viewType);
      toast.error(`Limite de ${label} atingido para este tipo de casa.`);
      return;
    }

    // Top view doesn't need side selection
    if (viewType === 'top') {
      addViewToCanvas(viewType);
      return;
    }

    // Check pre-assigned slots
    const slots = houseManager.getPreAssignedSlots(viewType);

    if (slots.length > 0) {
      const available = slots.filter((s) => !s.onCanvas);

      if (available.length === 0) {
        toast.error(`Todas as instâncias de ${getViewLabel(viewType)} já estão no canvas.`);
        return;
      }

      if (available.length === 1) {
        addViewToCanvas(viewType, available[0].side);
        return;
      }

      // Multiple available - open choose-instance modal
      setPendingViewType(viewType);
      setInstanceSlots(slots);
      setSideSelectorMode('choose-instance');
      setSideSelectorOpen(true);
      return;
    }

    // Fallback: old behavior (no pre-assigned slots)
    const availableSides = houseManager.getAvailableSides(viewType);
    if (availableSides.length === 0) {
      toast.error('Nenhum lado disponível para esta vista.');
      return;
    }

    if (availableSides.length === 1) {
      addViewToCanvas(viewType, availableSides[0]);
      return;
    }

    setPendingViewType(viewType);
    setSideSelectorMode('position');
    setSideSelectorOpen(true);
  };

  const getViewLabel = (type: ViewType): string => {
    const houseType = houseManager.getHouseType();
    switch (type) {
      case 'top':return 'Planta';
      case 'front':return 'Frontal';
      case 'back':return houseType === 'tipo3' ? 'Lateral' : 'Traseira';
      case 'side1':return 'Quadrado Fechado';
      case 'side2':return 'Quadrado Aberto';
    }
  };

  const addViewToCanvas = (viewType: ViewType, side?: HouseSide) => {
    closeAllMenus();
    const canvas = getCanvas();
    if (!canvas) return;

    let house: Group;
    switch (viewType) {
      case 'top':
        house = createHouseTop(canvas);
        break;
      case 'front':
        // Flip horizontally when positioned at top (superior)
        house = createHouseFrontBack(canvas, true, side === 'top');
        break;
      case 'back':
        // Flip horizontally when positioned at top (superior)
        house = createHouseFrontBack(canvas, false, side === 'top');
        break;
      case 'side1':
        house = createHouseSide(canvas, false, side === 'right');
        break;
      case 'side2':
        house = createHouseSide(canvas, true, side === 'right');
        break;
    }

    // Register with house manager (this applies synced piloti data)
    houseManager.registerView(viewType, house, side);

    addObjectToCanvas(house);

    if (viewType === 'top') {
      showPilotiTutorialIfNeeded(house);
    }

    toast.success(`Vista ${getViewLabel(viewType)} adicionada!`);
  };

  const handleSideSelected = (side: HouseSide) => {
    if (!pendingViewType) {
      setSideSelectorOpen(false);
      return;
    }

    if (sideSelectorMode === 'position' && !houseManager.hasPreAssignedSlots()) {
      // Initial positioning — open NivelDefinitionModal instead of adding immediately
      houseManager.autoAssignAllSides(pendingViewType, side);
      setPendingNivelSide(side);
      niveisAppliedRef.current = false;
      // Use a flag to prevent handleSideSelectorClose from clearing pendingViewType
      transitionToNivelRef.current = true;
      setSideSelectorOpen(false);
      setNivelDefinitionOpen(true);
      return;
    } else {
      // Regular side selection or choose-instance
      addViewToCanvas(pendingViewType, side);
    }

    setPendingViewType(null);
    setSideSelectorOpen(false);
  };

  const handleNiveisApplied = (niveis: Record<string, NivelEntry>) => {
    // Capture pending values before any state clearing
    const viewType = pendingViewType;
    const side = pendingNivelSide;


    // Mark as applied so onClose won't reset the house manager
    niveisAppliedRef.current = true;

    // Update corner pilotis in HouseManager with the defined levels
    for (const [pilotiId, entry] of Object.entries(niveis)) {
      houseManager.updatePiloti(pilotiId, {
        isMaster: entry.isMaster,
        nivel: entry.nivel
      });
    }

    // Calculate recommended heights for all 12 pilotis using bilinear interpolation
    houseManager.calculateAndApplyRecommendedHeights();

    // Add plant + initial view

    if (viewType) {
      addViewToCanvas('top'); // Plant
      addViewToCanvas(viewType, side ?? undefined); // Initial view

      // Reposition so plant is above and view is below
      const canvas = getCanvas();
      if (canvas) {
        setTimeout(() => {
          const house = houseManager.getHouse();
          const plantInst = house?.views.top?.[0];
          const viewInst = house?.views[viewType]?.find((v) => v.side === side);
          const plantGroup = plantInst?.group;
          const viewGroup = viewInst?.group;
          if (plantGroup && viewGroup) {
            const center = getVisibleCenter();
            const gap = 30;
            const ph = (plantGroup.height || 0) * (plantGroup.scaleY || 1);
            const vh = (viewGroup.height || 0) * (viewGroup.scaleY || 1);
            const totalHeight = ph + gap + vh;
            plantGroup.set({ left: center.x, top: center.y - totalHeight / 2 + ph / 2 });
            viewGroup.set({ left: center.x, top: center.y + totalHeight / 2 - vh / 2 });
            plantGroup.setCoords();
            viewGroup.setCoords();
            canvas.renderAll();
          }
        }, 50);
      }
    }

    // Clear state and close modal
    setPendingViewType(null);
    setPendingNivelSide(null);
    setNivelDefinitionOpen(false);
  };

  const handleNivelDefinitionClose = () => {
    // If apply was just done, don't reset anything
    if (niveisAppliedRef.current) {
      niveisAppliedRef.current = false;
      setNivelDefinitionOpen(false);
      return;
    }
    // User cancelled — reset house type since we already auto-assigned
    houseManager.setHouseType(null);
    houseManager.reset();
    setPendingViewType(null);
    setPendingNivelSide(null);
    setNivelDefinitionOpen(false);
  };

  const handleSideSelectorClose = () => {
    // If transitioning to nivel definition modal, don't clear pendingViewType
    if (transitionToNivelRef.current) {
      transitionToNivelRef.current = false;
      setSideSelectorOpen(false);
      return;
    }
    // If this was initial positioning and user cancelled, reset house type
    if (sideSelectorMode === 'position' && !houseManager.hasPreAssignedSlots()) {
      houseManager.setHouseType(null);
    }
    setSideSelectorOpen(false);
    setPendingViewType(null);
  };

  // House type selection
  const handleOpenHouseTypeSelector = () => {
    closeAllMenus();
    setHouseTypeSelectorOpen(true);

    // Advance tutorial if this was the highlighted step
    if (tutorialStep === 'house') {
      setTutorialHouseSelectorPreview(true);
      advanceTutorial('house');
    }
  };

  const handleHouseTypeSelected = (type: HouseType) => {
    if (!type) return;

    // Set the house type
    houseManager.setHouseType(type);

    // Initialize default windows and doors
    houseManager.initializeDefaultElements();

    // Open SideSelector to position the initial view
    // tipo6: position the front view (top/bottom)
    // tipo3: position the open square (left/right)
    const initialViewType: ViewType = type === 'tipo6' ? 'front' : 'side2';
    setPendingViewType(initialViewType);
    setSideSelectorMode('position');
    setSideSelectorOpen(true);
  };

  const handleHouseTypeSelectorClose = () => {
    setHouseTypeSelectorOpen(false);
    setTutorialHouseSelectorPreview(false);
  };

  const handleAddHouseFront = () => {
    closeAllMenus();
    requestAddView('front');
  };

  const handleAddHouseBack = () => {
    closeAllMenus();
    requestAddView('back');
  };

  const handleAddHouseSide1 = () => {
    closeAllMenus();
    requestAddView('side1');
  };

  const handleAddHouseSide2 = () => {
    closeAllMenus();
    requestAddView('side2');
  };

  // Group/Ungroup
  const handleUngroup = () => {
    const canvas = getCanvas();
    if (!canvas) return;

    const activeObj = canvas.getActiveObject();
    if (!activeObj || activeObj.type !== 'group') {
      setInfoMessage('Selecione um grupo para desbloquear.');
      return;
    }

    const group = activeObj as Group;
    if (!(group as any).isMacroGroup) {
      setInfoMessage('Desagrupar só é permitido para grupos macro (objetos inteiros).');
      return;
    }

    performUngroup(group);
  };

  const performUngroup = (group: Group) => {
    const canvas = getCanvas();
    if (!canvas) return;

    const items = group.removeAll();
    canvas.remove(group);
    if (items.length === 0) {
      canvas.requestRenderAll();
      return;
    }
    canvas.add(...items);

    // Keep both macro objects selected after ungroup for quick reposition/edit.
    const selection = new ActiveSelection(items, { canvas });
    canvas.setActiveObject(selection);
    canvas.requestRenderAll();
    canvasRef.current?.saveHistory();
    setInfoMessage('Grupo macro desagrupado.');
  };

  const confirmUngroup = () => {
    if (groupToUngroup) {
      performUngroup(groupToUngroup);
    }
    setShowUngroupConfirm(false);
    setGroupToUngroup(null);
  };

  const handleGroup = () => {
    const canvas = getCanvas();
    if (!canvas) return;

    const activeObj = canvas.getActiveObject();
    if (!activeObj) {
      setInfoMessage('Selecione vários itens para bloquear (agrupar).');
      return;
    }

    const isActiveSelection = activeObj.type === 'activeSelection' || activeObj.type === 'activeselection';
    if (!isActiveSelection) {
      setInfoMessage('Selecione vários itens para bloquear (agrupar).');
      return;
    }

    const activeSelection = activeObj as ActiveSelection;
    const objects = activeSelection.getObjects();

    if (objects.length < 2) {
      setInfoMessage('Selecione pelo menos 2 itens para agrupar.');
      return;
    }

    const canvasObjects = canvas.getObjects();
    const hasNonTopLevelObject = objects.some((obj) => !canvasObjects.includes(obj));
    if (hasNonTopLevelObject) {
      setInfoMessage('Agrupamento permitido apenas para objetos inteiros (macro), não para elementos internos.');
      return;
    }

    // Save selection position
    const selLeft = activeSelection.left;
    const selTop = activeSelection.top;

    // Discard selection first
    canvas.discardActiveObject();

    // Remove objects from canvas
    objects.forEach((obj: FabricObject) => {
      canvas.remove(obj);
    });

    // Create macro group only from top-level canvas objects.
    const group = new Group(objects, {
      left: selLeft ?? 0,
      top: selTop ?? 0,
    });
    (group as any).isMacroGroup = true;
    (group as any).myType = 'macroGroup';
    group.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false });

    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.requestRenderAll();
    canvasRef.current?.saveHistory();
    setInfoMessage('Objetos macro agrupados.');
  };

  // Helper to show onboarding balloon at an object's position
  const showOnboardingBalloon = (obj: FabricObject, text: string) => {
    const canvas = canvasRef.current?.canvas;
    if (!canvas) return;
    const canvasPosition = canvasRef.current?.getCanvasPosition();
    const container = canvas.getElement().parentElement?.parentElement;
    if (!container || !canvasPosition) return;

    const rect = container.getBoundingClientRect();
    const { x: vpX, y: vpY, zoom } = canvasPosition;
    const scaledWidth = CANVAS_WIDTH * zoom;
    const scaledHeight = CANVAS_HEIGHT * zoom;
    const canvasX = scaledWidth <= rect.width ? (rect.width - scaledWidth) / 2 : -vpX;
    const canvasY = scaledHeight <= rect.height ? (rect.height - scaledHeight) / 2 : -vpY;
    const center = obj.getCenterPoint();
    const screenX = rect.left + center.x * zoom + canvasX;
    const screenY = rect.top + center.y * zoom + canvasY;
    setOnboardingBalloon({ position: { x: screenX, y: screenY }, text });
  };

  // Element actions
  const handleAddWall = () => {
    closeAllMenus();
    const canvas = getCanvas();
    if (canvas) {
      const wall = createWall(canvas);
      addObjectToCanvas(wall);

      // First-time tip as yellow balloon
      if (!localStorage.getItem('rac-wall-tip-shown')) {
        localStorage.setItem('rac-wall-tip-shown', 'true');
        setTimeout(() => showOnboardingBalloon(wall, 'Clique duas vezes para definir ou alterar o nome do objeto.'), 100);
      }
    }
  };

  const handleAddDoor = () => {
    closeAllMenus();
    const canvas = getCanvas();
    if (canvas) {
      const door = createDoor(canvas);
      addObjectToCanvas(door);
    }
  };

  const handleAddStairs = () => {
    closeAllMenus();
    const canvas = getCanvas();
    if (canvas) {
      const stairs = createStairs(canvas);
      addObjectToCanvas(stairs);
    }
  };

  const handleAddTree = () => {
    closeAllMenus();
    const canvas = getCanvas();
    if (canvas) {
      const tree = createTree(canvas);
      addObjectToCanvas(tree);
    }
  };

  const handleAddWater = () => {
    closeAllMenus();
    const canvas = getCanvas();
    if (canvas) {
      const water = createWater(canvas);
      addObjectToCanvas(water);
    }
  };

  const handleAddFossa = () => {
    closeAllMenus();
    const canvas = getCanvas();
    if (canvas) {
      const fossa = createFossa(canvas);
      addObjectToCanvas(fossa);
    }
  };

  const handleAddLine = () => {
    closeAllMenus();
    const canvas = getCanvas();
    if (canvas) {
      const line = createLine(canvas);
      addObjectToCanvas(line);

      // First-time tip as yellow balloon
      if (!localStorage.getItem('rac-line-tip-shown')) {
        localStorage.setItem('rac-line-tip-shown', 'true');
        setTimeout(() => showOnboardingBalloon(line, 'Clique duas vezes para definir um texto ou a cor da linha reta.'), 100);
      }
    }
  };

  const handleAddArrow = () => {
    closeAllMenus();
    const canvas = getCanvas();
    if (canvas) {
      const arrow = createArrow(canvas);
      addObjectToCanvas(arrow);

      // First-time tip as yellow balloon
      if (!localStorage.getItem('rac-arrow-tip-shown')) {
        localStorage.setItem('rac-arrow-tip-shown', 'true');
        setTimeout(() => showOnboardingBalloon(arrow, 'Clique duas vezes para definir um texto ou a cor da seta simples.'), 100);
      }
    }
  };

  const handleAddDimension = () => {
    closeAllMenus();
    const canvas = getCanvas();
    if (canvas) {
      const center = getVisibleCenter();
      const dimension = createDimension(canvas, center);
      canvas.add(dimension);
      canvas.setActiveObject(dimension);

      // Automatically open editor for the new dimension
      const textObj = dimension.getObjects().find((obj) => obj.type === 'i-text') as any;
      const currentValue = textObj?.text?.trim() || '';

      // Calculate screen position for the editor
      const canvasPosition = canvasRef.current?.getCanvasPosition();
      const container = canvas.getElement().parentElement?.parentElement;

      if (container && canvasPosition) {
        const rect = container.getBoundingClientRect();
        const { x: viewportX, y: viewportY, zoom } = canvasPosition;

        const scaledWidth = CANVAS_WIDTH * zoom;
        const scaledHeight = CANVAS_HEIGHT * zoom;

        const canvasX = scaledWidth <= rect.width ?
        (rect.width - scaledWidth) / 2 :
        -viewportX;
        const canvasY = scaledHeight <= rect.height ?
        (rect.height - scaledHeight) / 2 :
        -viewportY;

        const groupLeft = dimension.left || 0;
        const groupTop = dimension.top || 0;

        const screenX = rect.left + groupLeft * zoom + canvasX;
        const screenY = rect.top + groupTop * zoom + canvasY;

        setDistanceSelection({
          group: dimension,
          currentValue,
          screenPosition: { x: screenX, y: screenY }
        });
        setIsDistanceEditorOpen(true);
      }
    }
  };

  const handleToggleDrawMode = () => {
    closeAllMenus();
    const canvas = getCanvas();
    if (!canvas) return;

    const newIsDrawing = !isDrawing;
    setIsDrawing(newIsDrawing);
    canvas.isDrawingMode = newIsDrawing;
    canvas.selection = !newIsDrawing;

    setInfoMessage(
      newIsDrawing ?
      '<b>Modo Desenho:</b> Risque na tela livremente.' :
      '<b>Dica:</b> Modo desenho desativado.'
    );
  };

  // Atalho de teclado "L" para alternar modo Lápis
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key !== 'l' && e.key !== 'L') return;
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable)) return;
      e.preventDefault();
      handleToggleDrawMode();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing]);

  // Atalho de teclado "Z" para alternar Zoom/Minimap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key !== 'z' && e.key !== 'Z') return;
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable)) return;
      e.preventDefault();
      setShowZoomControls((prev) => {
        const next = !prev;
        if (tutorialStep === 'zoom-minimap') advanceTutorial('zoom-minimap');
        return next;
      });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tutorialStep]);

  const handleAddText = () => {
    disableDrawingMode();
    const canvas = getCanvas();
    if (canvas) {
      const text = createText(canvas);
      addObjectToCanvas(text);
    }
  };

  // Export/Import
  const handleExportJSON = () => {
    const canvas = getCanvas();
    if (!canvas) return;

    // Custom properties are now included via prototype extension
    const json = canvas.toJSON();
    const blob = new Blob([JSON.stringify(json)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = 'RAC-TETO-Projeto.json';
    link.href = URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setInfoMessage('Projeto salvo como JSON!');
    toast.success('Projeto exportado com sucesso!');
  };

  const handleImportJSON = (file: File) => {
    const canvas = getCanvas();
    if (!canvas) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      canvas.clear();
      canvas.loadFromJSON(evt.target?.result as string).then(() => {
        setIsContraventamentoMode(false);
        setSelectedContraventamento(null);
        setContraventamentoStep('select-first');
        setContraventamentoFirst(null);
        setContraventamentoSide(null);
        refreshHouseGroupsOnCanvas(canvas);
        houseManager.rebuildFromCanvas();
        canvas.renderAll();
        syncContraventamentoElevationsFromTop(
          getTopViewGroup(),
          houseManager.getAllGroups().filter((g) => (g as any).houseView !== 'top'),
          (pilotiId) => houseManager.getPilotiData(pilotiId).nivel
        );
        canvasRef.current?.saveHistory();
        setInfoMessage('Projeto carregado!');
        toast.success('Projeto carregado com sucesso!');
      });
    };
    reader.readAsText(file);
  };

  const handleDelete = () => {
    const canvas = getCanvas();
    if (!canvas) return;

    if (selectedContraventamento) {
      const removed = removeContraventamentosFromGroup(
        selectedContraventamento.group,
        (obj) => (obj as any).contraventamentoId === selectedContraventamento.contraventamentoId
      );
      if (removed > 0) {
        setContraventamentoSelection(selectedContraventamento.group, null);
        setSelectedContraventamento(null);
        syncContraventamentoElevationsFromTop(
          getTopViewGroup(),
          houseManager.getAllGroups().filter((g) => (g as any).houseView !== 'top'),
          (pilotiId) => houseManager.getPilotiData(pilotiId).nivel
        );
        canvas.requestRenderAll();
        canvasRef.current?.saveHistory();
        setInfoMessage('Contraventamento removido.');
        toast.success('Contraventamento removido!');
        return;
      }
      setSelectedContraventamento(null);
    }

    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
      const topGroup = getTopViewGroup();
      if (topGroup) setContraventamentoSelection(topGroup, null);
      setSelectedContraventamento(null);
      canvas.discardActiveObject();

      for (const obj of activeObjects) {
        // If it's a house view, check protection rules
        if ((obj as any).myType === 'house') {
          const rawView = (obj as any).houseViewType ?? (obj as any).houseView;
          const viewType: ViewType | null =
          rawView === 'top' ? 'top' :
          rawView === 'front' ? 'front' :
          rawView === 'back' ? 'back' :
          rawView === 'side1' ? 'side1' :
          rawView === 'side2' ? 'side2' :
          null;

          // Check if trying to delete the plant (top view)
          if (viewType === 'top') {
            if (!houseManager.canDeletePlant()) {
              toast.error('Remova todas as outras vistas antes de apagar a planta.');
              // Re-select the object since we discarded
              canvas.setActiveObject(obj);
              return;
            }
            // Reset house type when deleting plant
            houseManager.setHouseType(null);
          }

          if (viewType) {
            houseManager.removeView(obj as Group);
          } else {
            houseManager.removeView(obj as Group);
          }
        }

        canvas.remove(obj);
      }
      setInfoMessage('Objeto excluído.');
    }
  };

  const handleSavePDF = async () => {
    const canvas = getCanvas();
    if (!canvas) return;

    canvas.discardActiveObject();
    canvas.renderAll();

    const imgData = canvas.toDataURL();

    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'px',
      format: [CANVAS_WIDTH, CANVAS_HEIGHT]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    pdf.save('RAC-TETO.pdf');

    toast.success('PDF salvo com sucesso!');
  };

  const handleToggleHouseMenu = () => {
    disableDrawingMode();
    // During the tutorial "Casa TETO" step, open selector preview in the background
    // and keep it locked, then advance tutorial flow.
    if (tutorialStep === 'house') {
      closeAllMenus();
      setHouseTypeSelectorOpen(true);
      setTutorialHouseSelectorPreview(true);
      advanceTutorial('house');
      return;
    }

    // Only show submenu if house type is already selected
    if (houseManager.getHouseType()) {
      setActiveSubmenu((prev) => prev === 'house' ? null : 'house');
    } else {
      // Open type selector instead
      handleOpenHouseTypeSelector();
    }
  };

  const handleToggleElementsMenu = () => {
    disableDrawingMode();
    setActiveSubmenu((prev) => prev === 'elements' ? null : 'elements');

    // Advance tutorial if this was the highlighted step
    if (tutorialStep === 'elements') {
      advanceTutorial('elements');
    }
  };

  const handleToggleLinesMenu = () => {
    disableDrawingMode();
    setActiveSubmenu((prev) => prev === 'lines' ? null : 'lines');
  };

  const handleToggleOverflowMenu = () => {
    disableDrawingMode();
    setActiveSubmenu((prev) => prev === 'overflow' ? null : 'overflow');

    // Advance tutorial if this was the highlighted step
    if (tutorialStep === 'more-options') {
      advanceTutorial('more-options');
    }
  };

  const handleToggleTips = () => {
    setShowTips(!showTips);
  };

  // Close menus when clicking outside
  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.submenu') && !target.closest('button')) {
      closeAllMenus();
    }
  };

  const handleTutorialComplete = () => {
    setTutorialStep(null);
    setHouseTypeSelectorOpen(false);
    setTutorialHouseSelectorPreview(false);
    localStorage.setItem('rac-tutorial-completed', 'true');
  };

  // ── Contraventamento handlers ──────────────────────────────────────────────

  /** Returns the top-view group from the canvas (if it exists). */
  const getTopViewGroup = useCallback((): Group | null => {
    const canvas = getCanvas();
    if (!canvas) return null;
    const obj = canvas.getObjects().find(
      (o: any) => o.type === 'group' && o.myType === 'house' && o.houseView === 'top'
    );
    return (obj as Group) ?? null;
  }, [getCanvas]);

  const getContraventamentoColumnSides = useCallback((group: Group, col: number) => {
    const s = 0.6;
    const cD = 155 * s;
    const colCenterX = [-1.5 * cD, -0.5 * cD, 0.5 * cD, 1.5 * cD][col] ?? 0;
    const occupied = { left: false, right: false };

    group.getObjects().forEach((obj: any) => {
      if (!obj.isContraventamento) return;
      if (Number(obj.contraventamentoCol) !== col) return;

      let side: ContraventamentoSide | null = null;
      if (obj.contraventamentoSide === 'left' || obj.contraventamentoSide === 'right') {
        side = obj.contraventamentoSide;
      } else {
        const width = Number(obj.width ?? 0) * Number(obj.scaleX ?? 1);
        const centerX = Number(obj.left ?? 0) + width / 2;
        side = centerX < colCenterX ? 'left' : 'right';
        obj.contraventamentoSide = side;
      }

      occupied[side] = true;
    });

    return occupied;
  }, []);

  /** Check whether a piloti can be used as origin (step 1). */
  const isPilotiEligibleAsOrigin = useCallback((pilotiId: string): boolean => {
    const data = houseManager.getPilotiData(pilotiId);
    if ((data?.nivel ?? 0) <= 0.40) return false;

    const match = pilotiId.match(/piloti_(\d+)_(\d+)/);
    if (!match) return false;
    const col = parseInt(match[1], 10);

    const topGroup = getTopViewGroup();
    if (!topGroup) return false;

    const occupiedSides = getContraventamentoColumnSides(topGroup, col);
    return !(occupiedSides.left && occupiedSides.right);
  }, [getContraventamentoColumnSides, getTopViewGroup]);

  /** Check whether a piloti can be used as destination (step 2). */
  const isPilotiEligibleAsDestination = useCallback((
    pilotiId: string,
    first: { col: number; row: number } | null
  ): boolean => {
    if (!first) return false;
    const data = houseManager.getPilotiData(pilotiId);
    if ((data?.nivel ?? 0) <= 0.40) return false;
    const match = pilotiId.match(/piloti_(\d+)_(\d+)/);
    if (!match) return false;
    const col = parseInt(match[1], 10);
    const row = parseInt(match[2], 10);
    return col === first.col && row !== first.row;
  }, []);

  /** Eligibility callback consumed by Canvas (single-click interception). */
  const isPilotiEligible = useCallback((pilotiId: string): boolean => {
    if (contraventamentoStep === 'select-second') {
      return isPilotiEligibleAsDestination(pilotiId, contraventamentoFirst ? {
        col: contraventamentoFirst.col,
        row: contraventamentoFirst.row,
      } : null);
    }
    return isPilotiEligibleAsOrigin(pilotiId);
  }, [contraventamentoStep, contraventamentoFirst, isPilotiEligibleAsDestination, isPilotiEligibleAsOrigin]);

  const enterContraventamentoSecondStep = useCallback((
    first: { pilotiId: string; col: number; row: number; group: Group },
    side: ContraventamentoSide
  ) => {
    setContraventamentoFirst(first);
    setContraventamentoSide(side);
    setContraventamentoStep('select-second');
    highlightContraventamentoPilotis(
      first.group,
      (candidatePilotiId) => isPilotiEligibleAsDestination(candidatePilotiId, first),
      first.col,
      first.pilotiId
    );
    toast.info(`Lado ${side === 'left' ? 'esquerdo' : 'direito'} selecionado. Selecione o piloti final na mesma coluna.`);
  }, [isPilotiEligibleAsDestination]);

  const syncContraventamentoElevations = useCallback(() => {
    const topGroup = getTopViewGroup();
    const targets = houseManager.getAllGroups().filter((g) => (g as any).houseView !== 'top');
    syncContraventamentoElevationsFromTop(
      topGroup,
      targets,
      (pilotiId) => houseManager.getPilotiData(pilotiId).nivel
    );
  }, [getTopViewGroup]);

  /** Cancel contraventamento mode and reset visuals */
  const handleCancelContraventamento = useCallback(() => {
    const topGroup = getTopViewGroup();
    if (topGroup) resetContraventamentoPilotis(topGroup);
    setIsContraventamentoMode(false);
    setContraventamentoStep('select-first');
    setContraventamentoFirst(null);
    setContraventamentoSide(null);
  }, [getTopViewGroup]);

  /** Called by Canvas when a piloti circle is clicked in contraventamento mode */
  const handleContraventamentoPilotiClick = useCallback((
    pilotiId: string, col: number, row: number, group: Group
  ) => {
    if (contraventamentoStep === 'select-first') {
      const occupiedSides = getContraventamentoColumnSides(group, col);
      if (occupiedSides.left && occupiedSides.right) {
        toast.warning('Esta coluna já possui contraventamentos nos lados esquerdo e direito.');
        return;
      }

      const first = { pilotiId, col, row, group };
      setContraventamentoFirst(first);

      const side: ContraventamentoSide = occupiedSides.left ? 'right' : 'left';
      enterContraventamentoSecondStep(first, side);
      return;
    }

    if (!contraventamentoFirst || !contraventamentoSide) {
      toast.warning('Selecione o primeiro piloti para iniciar o contraventamento.');
      setContraventamentoStep('select-first');
      setContraventamentoFirst(null);
      setContraventamentoSide(null);
      highlightContraventamentoPilotis(group, isPilotiEligibleAsOrigin);
      return;
    }

    if (col !== contraventamentoFirst.col) {
      toast.warning('Selecione o piloti final na mesma coluna do primeiro.');
      return;
    }
    if (row === contraventamentoFirst.row) {
      toast.warning('Selecione um piloti final diferente do primeiro.');
      return;
    }

    const occupiedSides = getContraventamentoColumnSides(contraventamentoFirst.group, col);
    if (occupiedSides[contraventamentoSide]) {
      toast.warning(`A coluna já possui contraventamento no lado ${contraventamentoSide === 'left' ? 'esquerdo' : 'direito'}.`);
      setContraventamentoStep('select-first');
      setContraventamentoFirst(null);
      setContraventamentoSide(null);
      highlightContraventamentoPilotis(contraventamentoFirst.group, isPilotiEligibleAsOrigin);
      return;
    }

    const createdId = addContraventamentoBeam(
      contraventamentoFirst.group,
      { col, row: contraventamentoFirst.row },
      { col, row },
      { anchorPilotiId: contraventamentoFirst.pilotiId, side: contraventamentoSide }
    );
    if (!createdId) {
      toast.error('Não foi possível criar o contraventamento.');
      return;
    }

    resetContraventamentoPilotis(contraventamentoFirst.group);
    setContraventamentoSelection(contraventamentoFirst.group, null);
    setSelectedContraventamento(null);
    setIsContraventamentoMode(false);
    setContraventamentoStep('select-first');
    setContraventamentoFirst(null);
    setContraventamentoSide(null);
    syncContraventamentoElevations();
    canvasRef.current?.saveHistory();
    toast.success('Contraventamento adicionado!');
  }, [
    contraventamentoStep,
    contraventamentoFirst,
    contraventamentoSide,
    getContraventamentoColumnSides,
    isPilotiEligibleAsOrigin,
    enterContraventamentoSecondStep,
    syncContraventamentoElevations,
  ]);

  const handleContraventamentoSelect = useCallback((selection: ContraventamentoCanvasSelection | null) => {
    const topGroup = getTopViewGroup();
    if (!topGroup) {
      setSelectedContraventamento(null);
      return;
    }
    setContraventamentoSelection(topGroup, selection?.contraventamentoId ?? null);
    setSelectedContraventamento(selection);
    if (selection) {
      setInfoMessage('Contraventamento selecionado. Use Excluir para remover.');
    }
  }, [getTopViewGroup]);

  useEffect(() => {
    syncContraventamentoElevations();
  }, [houseVersion, syncContraventamentoElevations]);

  // ESC cancels contraventamento mode
  useEffect(() => {
    if (!isContraventamentoMode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancelContraventamento();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isContraventamentoMode, handleCancelContraventamento]);

  // Keep contraventamento highlights stable across any re-render/style reset.
  useEffect(() => {
    if (!isContraventamentoMode) return;
    const topGroup = getTopViewGroup();
    if (!topGroup) return;

    if (contraventamentoStep === 'select-second' && contraventamentoFirst) {
      highlightContraventamentoPilotis(
        topGroup,
        (candidatePilotiId) => isPilotiEligibleAsDestination(candidatePilotiId, {
          col: contraventamentoFirst.col,
          row: contraventamentoFirst.row,
        }),
        contraventamentoFirst.col,
        contraventamentoFirst.pilotiId
      );
      return;
    }

    highlightContraventamentoPilotis(topGroup, isPilotiEligibleAsOrigin);
  }, [
    isContraventamentoMode,
    contraventamentoStep,
    contraventamentoFirst,
    getTopViewGroup,
    isPilotiEligibleAsDestination,
    isPilotiEligibleAsOrigin,
  ]);

  const handlePilotiSelect = (selection: PilotiSelection | null) => {
    // In contraventamento mode, piloti clicks are handled by handleContraventamentoPilotiClick
    if (isContraventamentoMode) return;
    if (selection) handleContraventamentoSelect(null);
    setPilotiSelection(selection);
    if (selection) {
      setIsPilotiEditorOpen(true);
      // Close piloti tutorial if open (user figured it out)
      if (pilotiTutorialPosition) {
        handleClosePilotiTutorial();
      }
    }
  };

  const handlePilotiEditorClose = () => {
    setIsPilotiEditorOpen(false);
    const canvas = canvasRef.current?.canvas;
    const group = pilotiSelection?.group;
    if (group && canvas) {
      // Se a casa ainda estiver selecionada, TODOS os pilotis ficam amarelos (todas as visões)
      const activeObject = canvas.getActiveObject();
      const houseStillSelected = activeObject === group;

      const objects = group.getObjects();
      objects.forEach((obj: any) => {
        if (obj.isPilotiCircle || obj.isPilotiRect) {
          if (houseStillSelected) {
            obj.set({
              stroke: '#facc15',
              strokeWidth: obj.isPilotiRect ? 4 : 3
            });
          } else {
            // Reset para cores “normais”
            if (obj.pilotiIsMaster) {
              obj.set({
                stroke: '#8B4513',
                strokeWidth: obj.isPilotiRect ? 3 : 2
              });
            } else {
              obj.set({
                stroke: obj.isPilotiRect ? '#333' : 'black',
                strokeWidth: obj.isPilotiRect ? 2 : 1.5 * 0.6
              });
            }
          }
        }
      });
      canvas.renderAll();
    }
    setPilotiSelection(null);
  };

  const getContraventamentoEditorState = useCallback(() => {
    const disabled = {
      leftDisabled: true,
      rightDisabled: true,
      leftActive: false,
      rightActive: false,
    };

    if (!pilotiSelection?.pilotiId) return disabled;

    const topGroup = getTopViewGroup();
    if (!topGroup) return disabled;

    const match = pilotiSelection.pilotiId.match(/piloti_(\d+)_(\d+)/);
    if (!match) return disabled;

    const col = parseInt(match[1], 10);
    const occupiedSides = getContraventamentoColumnSides(topGroup, col);
    const data = houseManager.getPilotiData(pilotiSelection.pilotiId);
    const canReceiveContraventamento = (data?.nivel ?? 0) > 0.40;

    if (!canReceiveContraventamento) {
      return {
        leftDisabled: true,
        rightDisabled: true,
        leftActive: false,
        rightActive: false,
      };
    }

    return {
      leftDisabled: false,
      rightDisabled: false,
      leftActive: occupiedSides.left,
      rightActive: occupiedSides.right,
    };
  }, [pilotiSelection?.pilotiId, getTopViewGroup, getContraventamentoColumnSides, houseVersion]);

  const handleContraventamentoFromPilotiSide = useCallback((side: ContraventamentoSide) => {
    if (!pilotiSelection?.pilotiId) return;

    const topGroup = getTopViewGroup();
    if (!topGroup) {
      toast.error('Adicione uma vista planta primeiro.');
      return;
    }

    const match = pilotiSelection.pilotiId.match(/piloti_(\d+)_(\d+)/);
    if (!match) return;

    const col = parseInt(match[1], 10);
    const row = parseInt(match[2], 10);
    const data = houseManager.getPilotiData(pilotiSelection.pilotiId);
    if ((data?.nivel ?? 0) <= 0.40) {
      toast.warning('O piloti precisa ter nível maior que 40cm para contraventar.');
      return;
    }

    const occupiedSides = getContraventamentoColumnSides(topGroup, col);
    // Side already exists on this column: treat click as remove action.
    if (occupiedSides[side]) {
      const s = 0.6;
      const cD = 155 * s;
      const colCenterX = [-1.5 * cD, -0.5 * cD, 0.5 * cD, 1.5 * cD][col] ?? 0;

      const removed = removeContraventamentosFromGroup(topGroup, (obj) => {
        const anyObj = obj as any;
        if (Number(anyObj.contraventamentoCol) !== col) return false;

        if (anyObj.contraventamentoSide === 'left' || anyObj.contraventamentoSide === 'right') {
          return anyObj.contraventamentoSide === side;
        }

        const width = Number(anyObj.width ?? 0) * Number(anyObj.scaleX ?? 1);
        const centerX = Number(anyObj.left ?? 0) + width / 2;
        const inferredSide: ContraventamentoSide = centerX < colCenterX ? 'left' : 'right';
        return inferredSide === side;
      });

      if (removed > 0) {
        if (isContraventamentoMode) handleCancelContraventamento();
        setContraventamentoSelection(topGroup, null);
        setSelectedContraventamento(null);
        syncContraventamentoElevations();
        canvasRef.current?.saveHistory();
        forceUpdate((v) => v + 1);
        toast.success(`Contraventamento do lado ${side === 'left' ? 'esquerdo' : 'direito'} removido.`);
      }
      return;
    }

    const first = { pilotiId: pilotiSelection.pilotiId, col, row, group: topGroup };

    setIsPilotiEditorOpen(false);
    setPilotiSelection(null);
    setContraventamentoSelection(topGroup, null);
    setSelectedContraventamento(null);
    setActiveSubmenu(null);
    setIsContraventamentoMode(true);
    enterContraventamentoSecondStep(first, side);
  }, [
    pilotiSelection?.pilotiId,
    getTopViewGroup,
    getContraventamentoColumnSides,
    isContraventamentoMode,
    handleCancelContraventamento,
    syncContraventamentoElevations,
    enterContraventamentoSecondStep,
  ]);

  const handlePilotiHeightChange = (newHeight: number) => {
    syncContraventamentoElevations();
    canvasRef.current?.saveHistory();
    canvasRef.current?.canvas?.renderAll();
    setInfoMessage(`Altura do piloti atualizada para ${formatPilotiHeight(newHeight)} m.`);
  };

  const handlePilotiNavigate = (pilotiId: string, height: number, isMaster: boolean, nivel: number) => {
    if (!pilotiSelection?.group) return;

    const canvas = canvasRef.current?.canvas;
    if (!canvas) return;

    // Update highlights across ALL house groups (cross-view sync)
    // First, set all pilotis in all house groups to yellow
    canvas.getObjects().forEach((obj: any) => {
      if (obj.type === 'group' && obj.myType === 'house') {
        obj.getObjects().forEach((child: any) => {
          if (child.isPilotiCircle || child.isPilotiRect) {
            child.set({
              stroke: '#facc15',
              strokeWidth: child.isPilotiRect ? 4 : 3
            });
          }
        });
      }
    });

    // Now highlight the selected piloti in ALL views (same pilotiId)
    canvas.getObjects().forEach((obj: any) => {
      if (obj.type === 'group' && obj.myType === 'house') {
        obj.getObjects().forEach((child: any) => {
          if ((child.isPilotiCircle || child.isPilotiRect) && child.pilotiId === pilotiId) {
            child.set({
              stroke: '#3b82f6',
              strokeWidth: child.isPilotiRect ? 5 : 4
            });
          }
        });
      }
    });

    canvas.renderAll();

    // Update selection state
    setPilotiSelection((prev) => prev ? {
      ...prev,
      pilotiId,
      currentHeight: height,
      currentIsMaster: isMaster,
      currentNivel: nivel
    } : null);

    syncContraventamentoElevations();
    setInfoMessage(`Piloti selecionado – Altura atual: ${formatPilotiHeight(height)} m.`);
  };

  const handleDistanceSelect = (selection: DistanceSelection | null) => {
    setDistanceSelection(selection);
    if (selection) {
      setIsDistanceEditorOpen(true);
    }
  };

  const handleDistanceEditorClose = () => {
    setIsDistanceEditorOpen(false);
    setDistanceSelection(null);
  };

  const handleObjectNameSelect = (selection: ObjectNameSelection | null) => {
    setObjectNameSelection(selection);
    if (selection) {
      setIsObjectNameEditorOpen(true);
    }
  };

  const handleObjectNameEditorClose = () => {
    setIsObjectNameEditorOpen(false);
    setObjectNameSelection(null);
  };

  const handleLineArrowSelect = (selection: LineArrowCanvasSelection | null) => {
    if (selection) {
      setLineArrowSelection(selection);
      setIsLineArrowEditorOpen(true);
    }
  };

  const handleLineArrowEditorClose = () => {
    setIsLineArrowEditorOpen(false);
    setLineArrowSelection(null);
  };

  // Unified apply handler for GenericEditor
  const handleGenericApply = (editorType: GenericEditorType, newValue: string, newColor: string) => {
    const canvas = canvasRef.current?.canvas;
    if (!canvas) return;

    if (editorType === 'wall' && objectNameSelection) {
      const obj = objectNameSelection.object;
      const name = newValue;

      // Check if the object is already in a group with a label
      const parentGroup = (obj as any)._group as Group | undefined;
      const existingLabel = parentGroup?.getObjects().find(
        (o: any) => o.myType === 'wallLabel'
      ) as IText | undefined;

      if (parentGroup && existingLabel) {
        if (name) {
          existingLabel.set({ text: name, fill: newColor });
          // Update color of the wall itself
          obj.set({ stroke: newColor });
          parentGroup.setCoords();
        } else {
          const groupLeft = parentGroup.left || 0;
          const groupTop = parentGroup.top || 0;
          canvas.remove(parentGroup);
          obj.set({ left: groupLeft, top: groupTop });
          obj.setCoords();
          canvas.add(obj);
        }
      } else if (name && !parentGroup) {
        const label = new IText(name, {
          fontSize: 14,
          fontFamily: 'Arial',
          fill: newColor,
          originX: 'center',
          originY: 'center',
          textAlign: 'center',
          selectable: false,
          evented: false
        });
        (label as any).myType = 'wallLabel';

        canvas.remove(obj);
        const objLeft = obj.left || 0;
        const objTop = obj.top || 0;
        obj.set({ left: 0, top: 0, originX: 'center', originY: 'center', stroke: newColor });
        label.set({ left: 0, top: 0 });

        const group = new Group([obj, label], {
          left: objLeft, top: objTop, originX: 'center', originY: 'center'
        });
        (group as any).myType = (obj as any).myType;
        (group as any).pilotiId = (obj as any).pilotiId;
        (group as any).wallId = (obj as any).wallId;
        canvas.add(group);
        canvas.setActiveObject(group);
      } else if (!name && !parentGroup) {
        // Just apply color, no label
        obj.set({ stroke: newColor });
      }
      canvas.renderAll();
      canvasRef.current?.saveHistory();
      setInfoMessage(`Objeto atualizado.`);

    } else if ((editorType === 'line' || editorType === 'arrow') && lineArrowSelection) {
      const obj = lineArrowSelection.object;
      const color = newColor;
      const label = newValue;

      // Check if obj IS the group containing a lineArrowLabel (not looking for parent group)
      const isGroupWithLabel = obj.type === 'group' && (obj as Group).getObjects().some((o: any) => o.myType === 'lineArrowLabel');

      if (isGroupWithLabel) {
        const group = obj as Group;
        const existingLabel = group.getObjects().find((o: any) => o.myType === 'lineArrowLabel') as IText | undefined;

        // Apply color to the line/arrow children (handle nested arrow group)
        group.getObjects().forEach((child: any) => {
          if (child.myType === 'lineArrowLabel') return;
          if (child.type === 'line') child.set({ stroke: color });
          if (child.type === 'group') {
            // Nested arrow group (rect + triangle)
            child.getObjects().forEach((ac: any) => {
              if (ac.type === 'rect') ac.set({ fill: color });
              if (ac.type === 'triangle') ac.set({ fill: color });
            });
          }
          if (child.type === 'rect') child.set({ fill: color });
          if (child.type === 'triangle') child.set({ fill: color });
        });

        if (label && existingLabel) {
          existingLabel.set({ text: label, fill: color });
          group.setCoords();
        } else if (!label && existingLabel) {
          // Remove label: ungroup
          const groupLeft = group.left || 0;
          const groupTop = group.top || 0;
          const origObj = group.getObjects().find((o: any) => o.myType !== 'lineArrowLabel')!;
          canvas.remove(group);
          origObj.set({ left: groupLeft, top: groupTop });
          origObj.setCoords();
          canvas.add(origObj);
        }
      } else {
        // Apply color directly to the object (no label group yet)
        if (lineArrowSelection.myType === 'line') {
          (obj as any).set({ stroke: color });
        } else {
          const grp = obj as Group;
          grp.getObjects().forEach((child: any) => {
            if (child.type === 'rect') child.set({ fill: color });
            if (child.type === 'triangle') child.set({ fill: color });
          });
        }

        if (label) {
          // Create label and group with the object
          const textLabel = new IText(label, {
            fontSize: 14,
            fontFamily: 'Arial',
            fill: color,
            originX: 'center',
            originY: 'center',
            textAlign: 'center',
            selectable: false,
            evented: false,
            backgroundColor: 'rgba(255,255,255,0.8)'
          });
          (textLabel as any).myType = 'lineArrowLabel';

          const objLeft = obj.left || 0;
          const objTop = obj.top || 0;
          canvas.remove(obj);
          // Normalize line coordinates to center at origin (like dimension does)
          if (obj.type === 'line') {
            const lineObj = obj as Line;
            const lw = Math.abs((lineObj.x2 || 0) - (lineObj.x1 || 0));
            lineObj.set({ x1: -lw / 2, y1: 0, x2: lw / 2, y2: 0, left: 0, top: 0, originX: 'center', originY: 'center' });
          } else {
            obj.set({ left: 0, top: 0, originX: 'center', originY: 'center' });
          }
          textLabel.set({ left: 0, top: -20 });

          const newGroup = new Group([obj, textLabel], {
            left: objLeft, top: objTop, originX: 'center', originY: 'center',
            lockScalingY: true
          });
          (newGroup as any).myType = (obj as any).myType;
          newGroup.setControlsVisibility({ mt: false, mb: false });

          // Capture the normalized top after Fabric adjusts it
          const labelNormalizedTop = textLabel.top!;

          // Scaling handler: expand horizontally, keep text undeformed
          newGroup.on('scaling', function (this: Group) {
            const nw = this.width! * this.scaleX!;
            const isArrowGroup = this._objects.some((c: any) => c.type === 'group' && c.myType !== 'lineArrowLabel');
            this._objects.forEach((child: any) => {
              if (child.myType === 'lineArrowLabel') {
                if (isArrowGroup) {
                  child.set({ scaleX: 1, scaleY: 1 });
                } else {
                  child.set({ left: 0, top: -20, scaleX: 1, scaleY: 1 });
                }
              } else if (child.type === 'line') {
                const lineObj = child as Line;
                lineObj.set({ x1: -nw / 2, x2: nw / 2, scaleX: 1, scaleY: 1 });
              } else if (child.type === 'group' && child.myType !== 'lineArrowLabel') {
                const arrowChildren = (child as Group).getObjects();
                arrowChildren.forEach((ac: any) => {
                  if (ac.type === 'rect') ac.set({ width: nw, scaleX: 1, scaleY: 1 });
                  if (ac.type === 'triangle') ac.set({ left: nw / 2, scaleX: 1, scaleY: 1 });
                });
                child.set({ width: nw, scaleX: 1, scaleY: 1 });
              }
            });
            this.set({ width: nw, scaleX: 1, scaleY: 1 });
          });

          canvas.add(newGroup);
          canvas.setActiveObject(newGroup);
        }
      }

      canvas.requestRenderAll();
      canvasRef.current?.saveHistory();
      setInfoMessage(`Linha/seta atualizada.`);

    } else if (editorType === 'dimension' && distanceSelection) {
      const group = distanceSelection.group;
      const textObj = group.getObjects().find((obj) => obj.type === 'i-text') as IText;
      if (textObj) {
        textObj.set({ text: newValue || ' ', fill: newColor });
      }
      // Apply color to lines and triangles in the dimension group
      group.getObjects().forEach((child: any) => {
        if (child.type === 'line') child.set({ stroke: newColor });
        if (child.type === 'triangle') child.set({ fill: newColor });
      });
      group.dirty = true;
      canvas.requestRenderAll();
      canvasRef.current?.saveHistory();
      setInfoMessage(`Distância atualizada para: ${newValue || '(vazio)'}.`);
    }
  };

  // Get current house type and view counts
  const currentHouseType = houseManager.getHouseType();
  const contraventamentoEditorState = getContraventamentoEditorState();

  return (
    <div className="relative h-full overflow-hidden bg-muted" onClick={handleContainerClick}>
      <Toolbar
        onOpenHouseTypeSelector={handleOpenHouseTypeSelector}
        onAddHouseFront={handleAddHouseFront}
        onAddHouseBack={handleAddHouseBack}
        onAddHouseSide1={handleAddHouseSide1}
        onAddHouseSide2={handleAddHouseSide2}
        onUngroup={handleUngroup}
        onGroup={handleGroup}
        onAddWall={handleAddWall}
        onAddDoor={handleAddDoor}
        onAddStairs={handleAddStairs}
        onAddTree={handleAddTree}
        onAddWater={handleAddWater}
        onAddFossa={handleAddFossa}
        onAddLine={handleAddLine}
        onAddArrow={handleAddArrow}
        onAddDimension={handleAddDimension}
        onToggleDrawMode={handleToggleDrawMode}
        onAddText={handleAddText}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        onDelete={handleDelete}
        onSavePDF={handleSavePDF}
        isDrawing={isDrawing}
        activeSubmenu={activeSubmenu}
        onToggleHouseMenu={handleToggleHouseMenu}
        onToggleElementsMenu={handleToggleElementsMenu}
        onToggleLinesMenu={handleToggleLinesMenu}
        onToggleOverflowMenu={handleToggleOverflowMenu}
        showTips={showTips}
        onToggleTips={handleToggleTips}
        showZoomControls={showZoomControls}
        onToggleZoomControls={() => {
          setShowZoomControls(!showZoomControls);
          if (tutorialStep === 'zoom-minimap') advanceTutorial('zoom-minimap');
        }}
        onOpen3DViewer={() => setIs3DViewerOpen(true)}
        tutorialHighlight={tutorialStep}
        isMenuOpen={isMenuOpen}
        onToggleMenu={handleToggleMenu}
        onRestartTutorial={handleRestartTutorial}
        isTutorialActive={tutorialStep !== null}
        houseType={currentHouseType}
        frontViewCount={{ current: houseManager.getViewCount('front'), max: houseManager.getMaxViewCount('front') }}
        backViewCount={{ current: houseManager.getViewCount('back'), max: houseManager.getMaxViewCount('back') }}
        side1ViewCount={{ current: houseManager.getViewCount('side1'), max: houseManager.getMaxViewCount('side1') }}
        side2ViewCount={{ current: houseManager.getViewCount('side2'), max: houseManager.getMaxViewCount('side2') }}
        onOpenSettings={() => {setActiveSubmenu(null);setIsSettingsOpen(true);}}
      />

      
      <div className="h-full p-2.5 overflow-hidden relative">
        <Canvas
          ref={canvasRef}
          onSelectionChange={(msg) => {
            setInfoMessage(msg);
            dismissPilotiTutorial();
            setOnboardingBalloon(null);
          }}
          onHistorySave={() => {}}
          onZoomInteraction={() => {
            if (tutorialStep === 'zoom-minimap') advanceTutorial('zoom-minimap');
          }}
          onMinimapInteraction={() => {
            if (tutorialStep === 'zoom-minimap') advanceTutorial('zoom-minimap');
          }}
          tutorialHighlight={tutorialStep}
          showTips={showTips}
          onPilotiSelect={handlePilotiSelect}
          onDistanceSelect={handleDistanceSelect}
          onObjectNameSelect={handleObjectNameSelect}
          onLineArrowSelect={handleLineArrowSelect}
          isEditorOpen={isPilotiEditorOpen || isDistanceEditorOpen || isObjectNameEditorOpen || isLineArrowEditorOpen}
          onDelete={handleDelete}
          showZoomControls={showZoomControls}
          isContraventamentoMode={isContraventamentoMode}
          isSelectingContraventamentoDestination={isContraventamentoMode && contraventamentoStep === 'select-second'}
          isPilotiEligibleForContraventamento={isPilotiEligible}
          onContraventamentoPilotiClick={handleContraventamentoPilotiClick}
          onContraventamentoSelect={handleContraventamentoSelect}
          onContraventamentoCancel={handleCancelContraventamento}>

          {/* InfoBar - positioned differently on mobile vs desktop */}
          {showTips &&
          <div className="sm:absolute sm:bottom-2.5 sm:left-1/2 sm:-translate-x-1/2 max-w-md w-full pointer-events-auto">
              <InfoBar message={infoMessage} />
            </div>
          }
        </Canvas>
      </div>

      <PilotiEditor
        isOpen={isPilotiEditorOpen}
        onClose={handlePilotiEditorClose}
        pilotiId={pilotiSelection?.pilotiId ?? null}
        currentHeight={pilotiSelection?.currentHeight ?? 1.0}
        currentIsMaster={pilotiSelection?.currentIsMaster ?? false}
        currentNivel={pilotiSelection?.currentNivel ?? 0.2}
        group={pilotiSelection?.group ?? null}
        isMobile={isMobile}
        anchorPosition={pilotiSelection?.screenPosition}
        houseView={pilotiSelection?.houseView ?? 'top'}
        onHeightChange={handlePilotiHeightChange}
        onNavigate={handlePilotiNavigate}
        contraventamentoLeftDisabled={contraventamentoEditorState.leftDisabled}
        contraventamentoRightDisabled={contraventamentoEditorState.rightDisabled}
        contraventamentoLeftActive={contraventamentoEditorState.leftActive}
        contraventamentoRightActive={contraventamentoEditorState.rightActive}
        onContraventamentoSideAction={handleContraventamentoFromPilotiSide} />


      <GenericEditor
        isOpen={isDistanceEditorOpen}
        onClose={handleDistanceEditorClose}
        editorType="dimension"
        object={distanceSelection?.group ?? null}
        canvas={canvasRef.current?.canvas ?? null}
        currentValue={distanceSelection?.currentValue ?? ''}
        currentColor={(() => {
          const g = distanceSelection?.group;
          if (!g) return '#000000';
          const t = g.getObjects().find((o) => o.type === 'i-text') as any;
          return t?.fill as string || '#000000';
        })()}
        isMobile={isMobile}
        anchorPosition={distanceSelection?.screenPosition}
        onApply={(v, c) => handleGenericApply('dimension', v, c)} />


      <GenericEditor
        isOpen={isObjectNameEditorOpen}
        onClose={handleObjectNameEditorClose}
        editorType="wall"
        object={objectNameSelection?.object ?? null}
        canvas={canvasRef.current?.canvas ?? null}
        currentValue={objectNameSelection?.currentValue ?? ''}
        currentColor={(() => {
          const obj = objectNameSelection?.object;
          if (!obj) return '#333333';
          return (obj as any).stroke as string || '#333333';
        })()}
        isMobile={isMobile}
        anchorPosition={objectNameSelection?.screenPosition}
        onApply={(v, c) => handleGenericApply('wall', v, c)} />


      <GenericEditor
        isOpen={isLineArrowEditorOpen}
        onClose={handleLineArrowEditorClose}
        editorType={lineArrowSelection?.myType === 'arrow' ? 'arrow' : 'line'}
        object={lineArrowSelection?.object ?? null}
        canvas={canvasRef.current?.canvas ?? null}
        currentValue={lineArrowSelection?.currentLabel ?? ''}
        currentColor={lineArrowSelection?.currentColor ?? '#000000'}
        isMobile={isMobile}
        anchorPosition={lineArrowSelection?.screenPosition}
        onApply={(v, c) => handleGenericApply(lineArrowSelection?.myType === 'arrow' ? 'arrow' : 'line', v, c)} />


      {pendingViewType &&
      <SideSelector
        isOpen={sideSelectorOpen}
        onClose={handleSideSelectorClose}
        viewType={pendingViewType}
        onSelectSide={handleSideSelected}
        mode={sideSelectorMode}
        instanceSlots={instanceSlots} />

      }

      <HouseTypeSelector
        isOpen={houseTypeSelectorOpen}
        onClose={handleHouseTypeSelectorClose}
        onSelectType={handleHouseTypeSelected}
        tutorialLocked={tutorialHouseSelectorPreview} />


      <House3DViewer
        open={is3DViewerOpen}
        onOpenChange={setIs3DViewerOpen} />


      <SettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        onSettingsChange={() => setShowZoomControls(getSettings().zoomEnabledByDefault)} />


      {tutorialStep &&
      <Tutorial
        onComplete={handleTutorialComplete}
        currentStepId={tutorialStep} />

      }

      {pilotiTutorialPosition &&
      <PilotiTutorialBalloon
        position={pilotiTutorialPosition}
        onClose={handleClosePilotiTutorial} />

      }

      {onboardingBalloon &&
      <OnboardingBalloon
        position={onboardingBalloon.position}
        text={onboardingBalloon.text}
        onClose={() => setOnboardingBalloon(null)} />

      }

      {isMobile ?
      <>
          <Drawer open={showRestartConfirm} onOpenChange={setShowRestartConfirm}>
            <DrawerContent>
              <DrawerHeader className="text-center pb-2">
                <DrawerTitle className="text-center text-2xl">Reiniciar Canvas</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-4">
                <div className="bg-white rounded-xl p-4">
                  <p className="text-sm text-muted-foreground">
                    Isso irá limpar todo o conteúdo do canvas e iniciar o tutorial novamente. Deseja continuar?
                  </p>
                </div>
                <div className="flex pt-4 gap-[16px]">
                  <Button variant="outline" className="flex-1 bg-white" onClick={() => setShowRestartConfirm(false)}>Cancelar</Button>
                  <Button className="flex-1" onClick={() => {confirmRestartTutorial();}}>Confirmar</Button>
                </div>
              </div>
            </DrawerContent>
          </Drawer>

          <Drawer open={showUngroupConfirm} onOpenChange={(open) => {if (!open) {setShowUngroupConfirm(false);setGroupToUngroup(null);}}}>
            <DrawerContent>
              <DrawerHeader className="text-center pb-2">
                <DrawerTitle className="text-center text-2xl">Desagrupar Casa</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-4">
                <div className="bg-white rounded-xl p-4">
                  <p className="text-sm text-muted-foreground">
                    Ao desagrupar a casa, ela perderá a funcionalidade de edição de pilotis e se tornará apenas um conjunto de formas sem funcionalidades especiais. Deseja continuar?
                  </p>
                </div>
                <div className="flex gap-3 pt-3">
                  <Button variant="outline" className="flex-1 bg-white" onClick={() => {setShowUngroupConfirm(false);setGroupToUngroup(null);}}>Cancelar</Button>
                  <Button className="flex-1" onClick={confirmUngroup}>Desagrupar</Button>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </> :

      <>
          <Dialog open={showRestartConfirm} onOpenChange={setShowRestartConfirm}>
            <DialogContent className="sm:max-w-sm" hideCloseButton>
              <DialogHeader className="text-center">
                <DialogTitle className="text-center text-2xl">Reiniciar Canvas</DialogTitle>
              </DialogHeader>
              <div className="bg-white rounded-xl p-4">
                <p className="text-sm text-muted-foreground">
                  Isso irá limpar todo o conteúdo do canvas e iniciar o tutorial novamente. Deseja continuar?
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 bg-white" onClick={() => setShowRestartConfirm(false)}>Cancelar</Button>
                <Button className="flex-1" onClick={() => {confirmRestartTutorial();}}>Confirmar</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showUngroupConfirm} onOpenChange={setShowUngroupConfirm}>
            <DialogContent className="sm:max-w-sm" hideCloseButton>
              <DialogHeader className="text-center">
                <DialogTitle className="text-center text-2xl">Desagrupar Casa</DialogTitle>
              </DialogHeader>
              <div className="bg-white rounded-xl p-4">
                <p className="text-sm text-muted-foreground">
                  Ao desagrupar a casa, ela perderá a funcionalidade de edição de pilotis e se tornará apenas um conjunto de formas sem funcionalidades especiais. Deseja continuar?
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 bg-white" onClick={() => {setShowUngroupConfirm(false);setGroupToUngroup(null);}}>Cancelar</Button>
                <Button className="flex-1" onClick={confirmUngroup}>Desagrupar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      }

      <NivelDefinitionModal
        isOpen={nivelDefinitionOpen}
        onClose={handleNivelDefinitionClose}
        onApply={handleNiveisApplied}
        pilotiData={houseManager.getHouse()?.pilotis || {}} />

    </div>);

}
