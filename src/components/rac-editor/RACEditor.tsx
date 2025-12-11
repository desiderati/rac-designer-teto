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

type TutorialStepId = 'main-fab' | 'house' | 'elements' | 'zoom-minimap' | 'more-options';

export function RACEditor() {
  const [infoMessage, setInfoMessage] = useState('Dica: Selecione uma ferramenta. (Ctrl+C Copiar, Ctrl+V Colar, Ctrl+Z Desfazer)');
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<'house' | 'elements' | 'overflow' | null>(null);
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
  const canvasRef = useRef<CanvasHandle>(null);
  const isMobile = useIsMobile();

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
    // Clear canvas
    const canvas = canvasRef.current?.canvas;
    if (canvas) {
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
      canvasRef.current?.saveHistory();
    }
    
    // Close all menus
    setActiveSubmenu(null);
    setIsMenuOpen(false);
    setShowRestartConfirm(false);
    
    // Remove tutorial completion flag
    localStorage.removeItem('rac-tutorial-completed');
    
    // Start tutorial from beginning
    setTutorialStep('main-fab');
    
    toast.success('Canvas reiniciado!');
  };

  const getCanvas = useCallback((): FabricCanvas | null => canvasRef.current?.canvas || null, []);

  const closeAllMenus = () => setActiveSubmenu(null);

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

  const handleAddHouseTop = () => {
    closeAllMenus();
    const canvas = getCanvas();
    if (canvas) {
      const house = createHouseTop(canvas);
      canvas.add(house);
      canvas.setActiveObject(house);
      showPilotiTutorialIfNeeded(house);
    }
  };

  const handleAddHouseFront = () => {
    closeAllMenus();
    const canvas = getCanvas();
    if (canvas) {
      const house = createHouseFrontBack(canvas, true);
      canvas.add(house);
      canvas.setActiveObject(house);
    }
  };

  const handleAddHouseBack = () => {
    closeAllMenus();
    const canvas = getCanvas();
    if (canvas) {
      const house = createHouseFrontBack(canvas, false);
      canvas.add(house);
      canvas.setActiveObject(house);
    }
  };

  const handleAddHouseSide1 = () => {
    closeAllMenus();
    const canvas = getCanvas();
    if (canvas) {
      const house = createHouseSide(canvas, false);
      canvas.add(house);
      canvas.setActiveObject(house);
    }
  };

  const handleAddHouseSide2 = () => {
    closeAllMenus();
    const canvas = getCanvas();
    if (canvas) {
      const house = createHouseSide(canvas, true);
      canvas.add(house);
      canvas.setActiveObject(house);
    }
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
      canvas.add(wall);
      canvas.setActiveObject(wall);
    }
  };

  const handleAddDoor = () => {
    closeAllMenus();
    const canvas = getCanvas();
    if (canvas) {
      const door = createDoor(canvas);
      canvas.add(door);
      canvas.setActiveObject(door);
    }
  };

  const handleAddStairs = () => {
    closeAllMenus();
    const canvas = getCanvas();
    if (canvas) {
      const stairs = createStairs(canvas);
      canvas.add(stairs);
      canvas.setActiveObject(stairs);
    }
  };

  const handleAddTree = () => {
    closeAllMenus();
    const canvas = getCanvas();
    if (canvas) {
      const tree = createTree(canvas);
      canvas.add(tree);
      canvas.setActiveObject(tree);
    }
  };

  const handleAddWater = () => {
    closeAllMenus();
    const canvas = getCanvas();
    if (canvas) {
      const water = createWater(canvas);
      canvas.add(water);
      canvas.setActiveObject(water);
    }
  };

  const handleAddLine = () => {
    closeAllMenus();
    const canvas = getCanvas();
    if (canvas) {
      const line = createLine(canvas);
      canvas.add(line);
      canvas.setActiveObject(line);
    }
  };

  const handleAddArrow = () => {
    closeAllMenus();
    const canvas = getCanvas();
    if (canvas) {
      const arrow = createArrow(canvas);
      canvas.add(arrow);
      canvas.setActiveObject(arrow);
    }
  };

  const handleAddDimension = () => {
    closeAllMenus();
    const canvas = getCanvas();
    if (canvas) {
      const dimension = createDimension(canvas);
      canvas.add(dimension);
      canvas.setActiveObject(dimension);
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
      canvas.add(text);
      canvas.setActiveObject(text);
    }
  };

  // Export/Import
  const handleExportJSON = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    
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
      activeObjects.forEach((obj) => canvas.remove(obj));
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
    // Reset piloti highlight (respecting master status)
    if (pilotiSelection?.group) {
      const objects = pilotiSelection.group.getObjects();
      objects.forEach((obj: any) => {
        if (obj.isPilotiCircle) {
          if (obj.pilotiIsMaster) {
            obj.set({
              stroke: '#8B4513',
              strokeWidth: 2,
            });
          } else {
            obj.set({
              stroke: 'black',
              strokeWidth: 1.5 * 0.6,
            });
          }
        }
      });
      canvasRef.current?.canvas?.renderAll();
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
    
    // Reset all pilotis stroke (respecting master status)
    pilotiSelection.group.getObjects().forEach((obj: any) => {
      if (obj.isPilotiCircle) {
        if (obj.pilotiIsMaster) {
          obj.set({ stroke: '#8B4513', strokeWidth: 2 });
        } else {
          obj.set({ stroke: 'black', strokeWidth: 1.5 * 0.6 });
        }
      }
    });
    
    // Highlight the new piloti
    const pilotiData = getPilotiFromGroup(pilotiSelection.group, pilotiId);
    if (pilotiData) {
      pilotiData.circle.set({
        stroke: '#3b82f6',
        strokeWidth: 3,
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
          onSelectionChange={setInfoMessage}
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
        isOpen={isPilotiEditorOpen}
        onClose={handlePilotiEditorClose}
        pilotiId={pilotiSelection?.pilotiId ?? null}
        currentHeight={pilotiSelection?.currentHeight ?? 1.0}
        currentIsMaster={pilotiSelection?.currentIsMaster ?? false}
        currentNivel={pilotiSelection?.currentNivel ?? 0.3}
        group={pilotiSelection?.group ?? null}
        isMobile={isMobile}
        anchorPosition={pilotiSelection?.screenPosition}
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
