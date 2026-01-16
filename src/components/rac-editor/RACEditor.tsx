import { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas as FabricCanvas, Group, ActiveSelection, FabricObject } from 'fabric';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { Toolbar } from './Toolbar';
import { Canvas, CanvasHandle, PilotiSelection, DistanceSelection } from './Canvas';
import { InfoBar } from './InfoBar';
import { Tutorial, getTutorialStepIds } from './Tutorial';
import { PilotiEditor } from './PilotiEditor';
import { DistanceEditor } from './DistanceEditor';
import { PilotiTutorialBalloon } from './PilotiTutorialBalloon';
import { SideSelector } from './SideSelector';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  customProps,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  formatPilotiHeight,
  getPilotiFromGroup,
} from '@/lib/canvas-utils';
import { houseManager, ViewType, HouseSide } from '@/lib/house-manager';

type TutorialStepId = 'main-fab' | 'house' | 'elements' | 'zoom-minimap' | 'more-options';

export function RACEditor() {
  const [infoMessage, setInfoMessage] = useState('Dica: Selecione uma ferramenta. (Ctrl+C Copiar, Ctrl+V Colar, Ctrl+Z Desfazer)');
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<'house' | 'elements' | 'lines' | 'overflow' | null>(null);
  const [showTips, setShowTips] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<TutorialStepId | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showUngroupConfirm, setShowUngroupConfirm] = useState(false);
  const [groupToUngroup, setGroupToUngroup] = useState<Group | null>(null);
  const [pilotiSelection, setPilotiSelection] = useState<PilotiSelection | null>(null);
  const [isPilotiEditorOpen, setIsPilotiEditorOpen] = useState(false);
  const [distanceSelection, setDistanceSelection] = useState<DistanceSelection | null>(null);
  const [isDistanceEditorOpen, setIsDistanceEditorOpen] = useState(false);
  const [pilotiTutorialPosition, setPilotiTutorialPosition] = useState<{ x: number; y: number } | null>(null);
  const [sideSelectorOpen, setSideSelectorOpen] = useState(false);
  const [pendingViewType, setPendingViewType] = useState<ViewType | null>(null);
  const canvasRef = useRef<CanvasHandle>(null);
  const isMobile = useIsMobile();

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
    setShowRestartConfirm(false);
    
    // Remove all tutorial completion flags
    localStorage.removeItem('rac-tutorial-completed');
    localStorage.removeItem('rac-piloti-tutorial-shown');
    
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
          y: groupMatrix[5] + pilotiTop * groupMatrix[3],
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
    // Check if view already exists
    if (houseManager.hasView(viewType)) {
      toast.error(`Vista ${getViewLabel(viewType)} já foi adicionada. Delete-a primeiro para adicionar novamente.`);
      return;
    }

    // Top view doesn't need side selection
    if (viewType === 'top') {
      addViewToCanvas(viewType);
      return;
    }

    // Check if side selection is needed
    if (houseManager.needsSideSelection(viewType)) {
      setPendingViewType(viewType);
      setSideSelectorOpen(true);
    } else {
      // Auto-select side
      const side = houseManager.getAutoSelectedSide(viewType);
      addViewToCanvas(viewType, side || undefined);
    }
  };

  const getViewLabel = (type: ViewType): string => {
    switch (type) {
      case 'top': return 'Planta';
      case 'front': return 'Frontal';
      case 'back': return 'Traseira';
      case 'side1': return 'Lateral Fechada';
      case 'side2': return 'Lateral Aberta';
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
        house = createHouseSide(canvas, false);
        break;
      case 'side2':
        house = createHouseSide(canvas, true);
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
    if (pendingViewType) {
      addViewToCanvas(pendingViewType, side);
      setPendingViewType(null);
    }
    setSideSelectorOpen(false);
  };

  const handleSideSelectorClose = () => {
    setSideSelectorOpen(false);
    setPendingViewType(null);
  };

  const handleAddHouseTop = () => {
    closeAllMenus();
    requestAddView('top');
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
    
    // Check if this is a house (has pilotis)
    const hasPilotis = group.getObjects().some((obj: any) => obj.isPilotiCircle);
    
    if (hasPilotis) {
      // Show confirmation dialog for houses
      setGroupToUngroup(group);
      setShowUngroupConfirm(true);
    } else {
      // Direct ungroup for non-house groups
      performUngroup(group);
    }
  };

  const performUngroup = (group: Group) => {
    const canvas = getCanvas();
    if (!canvas) return;
    
    // In Fabric.js v6, removeAll() properly extracts objects with correct coordinates
    const items = group.removeAll();
    
    // Group piloti objects together (circle + text + hitArea with same pilotiId)
    const pilotiMap = new Map<string, FabricObject[]>();
    const nonPilotiItems: FabricObject[] = [];
    
    items.forEach((item: FabricObject) => {
      const pilotiId = (item as any).pilotiId;
      if (pilotiId && ((item as any).isPilotiCircle || (item as any).isPilotiText || (item as any).isPilotiHitArea || (item as any).isPilotiNivelText)) {
        if (!pilotiMap.has(pilotiId)) {
          pilotiMap.set(pilotiId, []);
        }
        pilotiMap.get(pilotiId)!.push(item);
      } else {
        nonPilotiItems.push(item);
      }
    });
    
    // Create piloti groups and add to canvas
    const resultItems: FabricObject[] = [...nonPilotiItems];
    
    pilotiMap.forEach((pilotiItems, pilotiId) => {
      if (pilotiItems.length > 1) {
        // Create a group for this piloti
        const pilotiGroup = new Group(pilotiItems, {
          subTargetCheck: true,
        });
        (pilotiGroup as any).myType = 'pilotiGroup';
        (pilotiGroup as any).pilotiId = pilotiId;
        pilotiGroup.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false });
        resultItems.push(pilotiGroup);
      } else if (pilotiItems.length === 1) {
        resultItems.push(pilotiItems[0]);
      }
    });
    
    // Add all items to canvas
    canvas.add(...resultItems);
    
    // Remove the now-empty group
    canvas.remove(group);
    
    // Create selection with ungrouped objects
    const selection = new ActiveSelection(resultItems, { canvas });
    canvas.setActiveObject(selection);
    canvas.requestRenderAll();
    setInfoMessage('Itens desbloqueados (Desagrupados). Pilotis mantidos agrupados.');
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
    console.log('Active object:', activeObj);
    console.log('Active object type:', activeObj?.type);
    
    if (!activeObj) {
      setInfoMessage('Selecione vários itens para bloquear (agrupar).');
      return;
    }
    
    // In Fabric.js v6, check for ActiveSelection using isType or constructor
    const isActiveSelection = activeObj.type === 'activeSelection' || activeObj.type === 'activeselection';
    console.log('Is ActiveSelection:', isActiveSelection);
    
    if (!isActiveSelection) {
      setInfoMessage('Selecione vários itens para bloquear (agrupar).');
      return;
    }
    
    const activeSelection = activeObj as ActiveSelection;
    const objects = activeSelection.getObjects();
    console.log('Objects to group:', objects.length);
    
    if (objects.length < 2) {
      setInfoMessage('Selecione pelo menos 2 itens para agrupar.');
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
    
    // Create group with the objects
    const group = new Group(objects, {
      left: selLeft,
      top: selTop,
    });
    group.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false });
    
    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.requestRenderAll();
    setInfoMessage('Itens bloqueados (Agrupados). Redimensionamento proporcional ativado.');
  };

  // Element actions
  const handleAddWall = () => {
    closeAllMenus();
    const canvas = getCanvas();
    if (canvas) {
      const wall = createWall(canvas);
      addObjectToCanvas(wall);
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

  const handleAddLine = () => {
    closeAllMenus();
    const canvas = getCanvas();
    if (canvas) {
      const line = createLine(canvas);
      addObjectToCanvas(line);
    }
  };

  const handleAddArrow = () => {
    closeAllMenus();
    const canvas = getCanvas();
    if (canvas) {
      const arrow = createArrow(canvas);
      addObjectToCanvas(arrow);
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
      const textObj = dimension.getObjects().find(obj => obj.type === 'i-text') as any;
      const currentValue = textObj?.text?.trim() || '';
      
      // Calculate screen position for the editor
      const canvasPosition = canvasRef.current?.getCanvasPosition();
      const container = canvas.getElement().parentElement?.parentElement;
      
      if (container && canvasPosition) {
        const rect = container.getBoundingClientRect();
        const { x: viewportX, y: viewportY, zoom } = canvasPosition;
        
        const scaledWidth = CANVAS_WIDTH * zoom;
        const scaledHeight = CANVAS_HEIGHT * zoom;
        
        const canvasX = scaledWidth <= rect.width 
          ? (rect.width - scaledWidth) / 2 
          : -viewportX;
        const canvasY = scaledHeight <= rect.height 
          ? (rect.height - scaledHeight) / 2 
          : -viewportY;
        
        const groupLeft = dimension.left || 0;
        const groupTop = dimension.top || 0;
        
        const screenX = rect.left + (groupLeft * zoom) + canvasX;
        const screenY = rect.top + (groupTop * zoom) + canvasY;
        
        setDistanceSelection({
          group: dimension,
          currentValue,
          screenPosition: { x: screenX, y: screenY },
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
      newIsDrawing 
        ? '<b>Modo Desenho:</b> Risque na tela livremente.' 
        : '<b>Dica:</b> Modo desenho desativado.'
    );
  };

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
        canvas.renderAll();
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

    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
      canvas.discardActiveObject();
      
      activeObjects.forEach((obj) => {
        // If it's a house view, remove from house manager
        if ((obj as any).myType === 'house') {
          const rawView = (obj as any).houseViewType ?? (obj as any).houseView;
          // houseViewType uses our internal ViewType; houseView comes from canvas-utils
          const viewType: ViewType | null =
            rawView === 'top' ? 'top' :
            rawView === 'front' ? 'front' :
            rawView === 'back' ? 'back' :
            rawView === 'side1' ? 'side1' :
            rawView === 'side2' ? 'side2' :
            // canvas-utils uses "side" for both side1/side2; fallback to reference-based removal
            null;

          if (viewType) {
            houseManager.removeViewByType(viewType);
          } else {
            houseManager.removeView(obj as Group);
          }
        }

        canvas.remove(obj);
      });
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
      format: [CANVAS_WIDTH, CANVAS_HEIGHT],
    });
    
    pdf.addImage(imgData, 'PNG', 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    pdf.save('RAC-TETO.pdf');
    
    toast.success('PDF salvo com sucesso!');
  };

  const handleToggleHouseMenu = () => {
    disableDrawingMode();
    setActiveSubmenu(prev => prev === 'house' ? null : 'house');
    
    // Advance tutorial if this was the highlighted step
    if (tutorialStep === 'house') {
      advanceTutorial('house');
    }
  };

  const handleToggleElementsMenu = () => {
    disableDrawingMode();
    setActiveSubmenu(prev => prev === 'elements' ? null : 'elements');
    
    // Advance tutorial if this was the highlighted step
    if (tutorialStep === 'elements') {
      advanceTutorial('elements');
    }
  };

  const handleToggleLinesMenu = () => {
    disableDrawingMode();
    setActiveSubmenu(prev => prev === 'lines' ? null : 'lines');
  };

  const handleToggleOverflowMenu = () => {
    disableDrawingMode();
    setActiveSubmenu(prev => prev === 'overflow' ? null : 'overflow');
    
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
    localStorage.setItem('rac-tutorial-completed', 'true');
  };

  const handlePilotiSelect = (selection: PilotiSelection | null) => {
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
              strokeWidth: obj.isPilotiRect ? 4 : 3,
            });
          } else {
            // Reset para cores “normais”
            if (obj.pilotiIsMaster) {
              obj.set({
                stroke: '#8B4513',
                strokeWidth: obj.isPilotiRect ? 3 : 2,
              });
            } else {
              obj.set({
                stroke: obj.isPilotiRect ? '#333' : 'black',
                strokeWidth: obj.isPilotiRect ? 2 : 1.5 * 0.6,
              });
            }
          }
        }
      });
      canvas.renderAll();
    }
    setPilotiSelection(null);
  };

  const handlePilotiHeightChange = (newHeight: number) => {
    canvasRef.current?.saveHistory();
    canvasRef.current?.canvas?.renderAll();
    setInfoMessage(`Altura do piloti atualizada para ${formatPilotiHeight(newHeight)} m.`);
  };

  const handlePilotiNavigate = (pilotiId: string, height: number, isMaster: boolean, nivel: number) => {
    if (!pilotiSelection?.group) return;
    
    const canvas = canvasRef.current?.canvas;
    if (!canvas) return;
    
    // Com popover aberto, a casa continua selecionada: todos amarelos, só o atual azul
    const activeObject = canvas.getActiveObject();
    const houseStillSelected = activeObject === pilotiSelection.group;

    pilotiSelection.group.getObjects().forEach((obj: any) => {
      if (obj.isPilotiCircle || obj.isPilotiRect) {
        if (houseStillSelected) {
          obj.set({
            stroke: '#facc15',
            strokeWidth: obj.isPilotiRect ? 4 : 3,
          });
        } else if (obj.pilotiIsMaster) {
          obj.set({ stroke: '#8B4513', strokeWidth: obj.isPilotiRect ? 3 : 2 });
        } else {
          obj.set({
            stroke: obj.isPilotiRect ? '#333' : 'black',
            strokeWidth: obj.isPilotiRect ? 2 : 1.5 * 0.6,
          });
        }
      }
    });

    // Highlight the new piloti
    const pilotiData = getPilotiFromGroup(pilotiSelection.group, pilotiId);
    if (pilotiData) {
      (pilotiData.circle as any).set({
        stroke: '#3b82f6',
        strokeWidth: (pilotiData.circle as any).isPilotiRect ? 5 : 4,
      });
    }
    
    canvas.renderAll();
    
    // Update selection state
    setPilotiSelection(prev => prev ? {
      ...prev,
      pilotiId,
      currentHeight: height,
      currentIsMaster: isMaster,
      currentNivel: nivel,
    } : null);
    
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

  const handleDistanceValueChange = (newValue: string) => {
    canvasRef.current?.saveHistory();
    canvasRef.current?.canvas?.renderAll();
    setInfoMessage(`Distância atualizada para: ${newValue || '(vazio)'}.`);
  };

  return (
    <div className="relative h-full overflow-hidden bg-muted" onClick={handleContainerClick}>
      <Toolbar
        onAddHouseTop={handleAddHouseTop}
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
        tutorialHighlight={tutorialStep}
        isMenuOpen={isMenuOpen}
        onToggleMenu={handleToggleMenu}
        onRestartTutorial={handleRestartTutorial}
        isTutorialActive={tutorialStep !== null}
      />
      
      <div className="h-full p-2.5 overflow-hidden relative">
        <Canvas
          ref={canvasRef}
          onSelectionChange={(msg) => {
            setInfoMessage(msg);
            dismissPilotiTutorial();
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
          isEditorOpen={isPilotiEditorOpen || isDistanceEditorOpen}
          onDelete={handleDelete}
        >
          {/* InfoBar - positioned differently on mobile vs desktop */}
          {showTips && (
            <div className="sm:absolute sm:bottom-2.5 sm:left-1/2 sm:-translate-x-1/2 max-w-md w-full pointer-events-auto">
              <InfoBar message={infoMessage} />
            </div>
          )}
        </Canvas>
      </div>

      <PilotiEditor
        key={pilotiSelection?.pilotiId ?? 'closed'}
        isOpen={isPilotiEditorOpen}
        onClose={handlePilotiEditorClose}
        pilotiId={pilotiSelection?.pilotiId ?? null}
        currentHeight={pilotiSelection?.currentHeight ?? 1.0}
        currentIsMaster={pilotiSelection?.currentIsMaster ?? false}
        currentNivel={pilotiSelection?.currentNivel ?? 0.3}
        group={pilotiSelection?.group ?? null}
        isMobile={isMobile}
        anchorPosition={pilotiSelection?.screenPosition}
        houseView={pilotiSelection?.houseView ?? 'top'}
        onHeightChange={handlePilotiHeightChange}
        onNavigate={handlePilotiNavigate}
      />

      <DistanceEditor
        isOpen={isDistanceEditorOpen}
        onClose={handleDistanceEditorClose}
        group={distanceSelection?.group ?? null}
        currentValue={distanceSelection?.currentValue ?? ''}
        isMobile={isMobile}
        anchorPosition={distanceSelection?.screenPosition}
        onValueChange={handleDistanceValueChange}
      />

      {pendingViewType && (
        <SideSelector
          isOpen={sideSelectorOpen}
          onClose={handleSideSelectorClose}
          viewType={pendingViewType}
          onSelectSide={handleSideSelected}
        />
      )}

      {tutorialStep && (
        <Tutorial 
          onComplete={handleTutorialComplete} 
          currentStepId={tutorialStep}
        />
      )}

      {pilotiTutorialPosition && (
        <PilotiTutorialBalloon
          position={pilotiTutorialPosition}
          onClose={handleClosePilotiTutorial}
        />
      )}

      <AlertDialog open={showRestartConfirm} onOpenChange={setShowRestartConfirm}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Reiniciar Canvas</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá limpar todo o conteúdo do canvas e iniciar o tutorial novamente. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestartTutorial}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showUngroupConfirm} onOpenChange={setShowUngroupConfirm}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Desagrupar Casa</AlertDialogTitle>
            <AlertDialogDescription>
              Ao desagrupar a casa, ela perderá a funcionalidade de edição de pilotis e se tornará apenas um conjunto de formas sem funcionalidades especiais. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setGroupToUngroup(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUngroup}>
              Desagrupar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
