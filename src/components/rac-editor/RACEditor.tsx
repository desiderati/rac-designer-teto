import { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas as FabricCanvas, Group, ActiveSelection, FabricObject } from 'fabric';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { Toolbar } from './Toolbar';
import { Canvas, CanvasHandle } from './Canvas';
import { InfoBar } from './InfoBar';
import { Tutorial, getTutorialStepIds } from './Tutorial';
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
} from '@/lib/canvas-utils';

type TutorialStepId = 'main-fab' | 'house' | 'elements' | 'zoom-minimap';

export function RACEditor() {
  const [infoMessage, setInfoMessage] = useState('Dica: Selecione uma ferramenta. (Ctrl+C Copiar, Ctrl+V Colar, Ctrl+Z Desfazer)');
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<'house' | 'elements' | 'overflow' | null>(null);
  const [showTips, setShowTips] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<TutorialStepId | null>(null);
  const canvasRef = useRef<CanvasHandle>(null);

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
    // Close all menus
    setActiveSubmenu(null);
    setIsMenuOpen(false);
    // Start tutorial from beginning
    setTutorialStep('main-fab');
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
  const handleAddHouseTop = () => {
    closeAllMenus();
    const canvas = getCanvas();
    if (canvas) {
      const house = createHouseTop(canvas);
      canvas.add(house);
      canvas.setActiveObject(house);
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
    const objects = group.getObjects();
    const groupLeft = group.left || 0;
    const groupTop = group.top || 0;
    
    canvas.remove(group);
    
    objects.forEach((obj: FabricObject) => {
      obj.set({
        left: (obj.left || 0) + groupLeft,
        top: (obj.top || 0) + groupTop,
      });
      canvas.add(obj);
    });
    
    const selection = new ActiveSelection(objects, { canvas });
    canvas.setActiveObject(selection);
    canvas.requestRenderAll();
    setInfoMessage('Itens desbloqueados (Desagrupados).');
  };

  const handleGroup = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    
    const activeObj = canvas.getActiveObject();
    if (!activeObj || activeObj.type !== 'activeSelection') {
      setInfoMessage('Selecione vários itens para bloquear (agrupar).');
      return;
    }
    
    const activeSelection = activeObj as ActiveSelection;
    const objects = activeSelection.getObjects();
    
    canvas.discardActiveObject();
    
    objects.forEach((obj: FabricObject) => {
      canvas.remove(obj);
    });
    
    const group = new Group(objects, {
      left: activeSelection.left,
      top: activeSelection.top,
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

  return (
    <div className="relative h-screen overflow-hidden bg-muted" onClick={handleContainerClick}>
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
        >
          {/* InfoBar - positioned differently on mobile vs desktop */}
          {showTips && (
            <div className="sm:absolute sm:bottom-2.5 sm:left-1/2 sm:-translate-x-1/2 max-w-md w-full pointer-events-auto">
              <InfoBar message={infoMessage} />
            </div>
          )}
        </Canvas>
      </div>

      {tutorialStep && (
        <Tutorial 
          onComplete={handleTutorialComplete} 
          currentStepId={tutorialStep}
        />
      )}
    </div>
  );
}
