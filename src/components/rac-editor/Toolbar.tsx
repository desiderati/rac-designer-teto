import { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus,
  faTimes,
  faHome, 
  faHouseChimney,
  faLockOpen, 
  faLock, 
  faShapes, 
  faPenNib, 
  faFont, 
  faFileDownload, 
  faFolderOpen, 
  faTrash, 
  faFilePdf,
  faLayerGroup,
  faArrowLeft,
  faArrowRight,
  faBars,
  faTree,
  faWater,
  faSlash,
  faArrowRightLong,
  faArrowsLeftRight,
  faDoorOpen,
  faStairs,
  faLightbulb
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ToolbarProps {
  onAddHouseTop: () => void;
  onAddHouseFront: () => void;
  onAddHouseBack: () => void;
  onAddHouseSide1: () => void;
  onAddHouseSide2: () => void;
  onUngroup: () => void;
  onGroup: () => void;
  onAddWall: () => void;
  onAddDoor: () => void;
  onAddStairs: () => void;
  onAddTree: () => void;
  onAddWater: () => void;
  onAddLine: () => void;
  onAddArrow: () => void;
  onAddDimension: () => void;
  onToggleDrawMode: () => void;
  onAddText: () => void;
  onExportJSON: () => void;
  onImportJSON: (file: File) => void;
  onDelete: () => void;
  onSavePDF: () => void;
  isDrawing: boolean;
  activeSubmenu: 'house' | 'elements' | null;
  onToggleHouseMenu: () => void;
  onToggleElementsMenu: () => void;
  showTips: boolean;
  onToggleTips: () => void;
  tutorialHighlight?: 'main-fab' | 'house' | 'elements' | 'tips' | null;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
}

function FABButton({ 
  icon, 
  title, 
  onClick, 
  color = '#ecf0f1',
  isActive = false,
  isMain = false,
  className = '',
  isPulsing = false,
}: { 
  icon: IconDefinition; 
  title: string; 
  onClick: () => void;
  color?: string;
  isActive?: boolean;
  isMain?: boolean;
  className?: string;
  isPulsing?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            'border-none rounded-xl bg-[#2c3e50] text-[#ecf0f1] cursor-pointer transition-all duration-200 flex justify-center items-center shadow-lg hover:bg-[#0092DD] hover:scale-105 active:scale-95',
            isMain ? 'w-12 h-12 text-xl' : 'w-11 h-11 text-lg',
            isActive && 'bg-[#e67e22] border-2 border-white',
            isPulsing && 'animate-[pulse_2s_ease-in-out_infinite] ring-4 ring-amber-400 ring-opacity-75 z-50',
            className
          )}
        >
          <FontAwesomeIcon icon={icon} style={{ color }} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="bg-[#333] text-white">
        {title}
      </TooltipContent>
    </Tooltip>
  );
}

function SubMenuButton({ 
  icon, 
  title, 
  onClick,
  color = '#ecf0f1'
}: { 
  icon: IconDefinition; 
  title: string; 
  onClick: () => void;
  color?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className="w-10 h-10 border-none rounded-xl bg-[#34495e] text-[#ecf0f1] text-base cursor-pointer transition-all duration-200 flex justify-center items-center shadow-md hover:bg-[#0092DD] hover:scale-105 active:scale-95"
        >
          <FontAwesomeIcon icon={icon} style={{ color }} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="bg-[#333] text-white">
        {title}
      </TooltipContent>
    </Tooltip>
  );
}

export function Toolbar({
  onAddHouseTop,
  onAddHouseFront,
  onAddHouseBack,
  onAddHouseSide1,
  onAddHouseSide2,
  onUngroup,
  onGroup,
  onAddWall,
  onAddDoor,
  onAddStairs,
  onAddTree,
  onAddWater,
  onAddLine,
  onAddArrow,
  onAddDimension,
  onToggleDrawMode,
  onAddText,
  onExportJSON,
  onImportJSON,
  onDelete,
  onSavePDF,
  isDrawing,
  activeSubmenu,
  onToggleHouseMenu,
  onToggleElementsMenu,
  showTips,
  onToggleTips,
  tutorialHighlight,
  isMenuOpen,
  onToggleMenu,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJSON(file);
      e.target.value = '';
    }
  };

  const handleAction = (action: () => void) => {
    action();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
      
      {/* FAB Container - Fixed position top left */}
      <div className="fixed top-5 left-5 z-50 flex flex-col gap-2">
        {/* Main FAB Button */}
        <FABButton
          icon={isMenuOpen ? faTimes : faPlus}
          title={isMenuOpen ? "Fechar Menu" : "Abrir Menu"}
          onClick={onToggleMenu}
          isMain
          className={isMenuOpen ? 'bg-[#e74c3c] hover:bg-[#c0392b]' : ''}
          isPulsing={tutorialHighlight === 'main-fab'}
        />

        {/* Menu Items - shown when open */}
        {isMenuOpen && (
          <div className="flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
            {/* House Button */}
            <div className="relative">
              <FABButton
                icon={faHome}
                title="Casa TETO (Opções)"
                onClick={() => handleAction(onToggleHouseMenu)}
                isActive={activeSubmenu === 'house'}
                isPulsing={tutorialHighlight === 'house'}
              />
              {/* House Submenu */}
              {activeSubmenu === 'house' && (
                <div className="absolute left-14 top-0 flex flex-row gap-1 animate-in slide-in-from-left-2">
                  <SubMenuButton icon={faLayerGroup} title="Visão Superior (Planta)" onClick={() => handleAction(onAddHouseTop)} />
                  <SubMenuButton icon={faHouseChimney} title="Visão Frontal" onClick={() => handleAction(onAddHouseFront)} />
                  <SubMenuButton icon={faHome} title="Visão Traseira" onClick={() => handleAction(onAddHouseBack)} />
                  <SubMenuButton icon={faArrowLeft} title="Lateral Esquerda" onClick={() => handleAction(onAddHouseSide1)} />
                  <SubMenuButton icon={faArrowRight} title="Lateral Direita" onClick={() => handleAction(onAddHouseSide2)} />
                </div>
              )}
            </div>

            {/* Unlock */}
            <FABButton 
              icon={faLockOpen} 
              title="Desbloquear (Desagrupar)" 
              onClick={() => handleAction(onUngroup)} 
            />
            
            {/* Lock */}
            <FABButton 
              icon={faLock} 
              title="Bloquear (Agrupar)" 
              onClick={() => handleAction(onGroup)} 
            />

            {/* Elements */}
            <div className="relative">
              <FABButton
                icon={faShapes}
                title="Elementos"
                onClick={() => handleAction(onToggleElementsMenu)}
                isActive={activeSubmenu === 'elements'}
                isPulsing={tutorialHighlight === 'elements'}
              />
              {/* Elements Submenu */}
              {activeSubmenu === 'elements' && (
                <div className="absolute left-14 top-0 flex flex-row gap-1 animate-in slide-in-from-left-2">
                  <SubMenuButton icon={faBars} title="Objeto / Muro" onClick={() => handleAction(onAddWall)} />
                  <SubMenuButton icon={faDoorOpen} title="Porta" onClick={() => handleAction(onAddDoor)} />
                  <SubMenuButton icon={faStairs} title="Escada" onClick={() => handleAction(onAddStairs)} />
                  <SubMenuButton icon={faTree} title="Árvore" onClick={() => handleAction(onAddTree)} />
                  <SubMenuButton icon={faWater} title="Água / Rio" onClick={() => handleAction(onAddWater)} />
                  <SubMenuButton icon={faSlash} title="Linha Reta" onClick={() => handleAction(onAddLine)} />
                  <SubMenuButton icon={faArrowRightLong} title="Seta Simples" onClick={() => handleAction(onAddArrow)} />
                  <SubMenuButton icon={faArrowsLeftRight} title="Distância" onClick={() => handleAction(onAddDimension)} />
                </div>
              )}
            </div>
            
            {/* Pencil */}
            <FABButton
              icon={faPenNib}
              title="Lápis"
              onClick={() => handleAction(onToggleDrawMode)}
              isActive={isDrawing}
            />
            
            {/* Text */}
            <FABButton 
              icon={faFont} 
              title="Texto Livre" 
              onClick={() => handleAction(onAddText)} 
            />

            {/* Export JSON */}
            <FABButton 
              icon={faFileDownload} 
              title="Exportar Projeto (JSON)" 
              onClick={() => handleAction(onExportJSON)} 
              color="#ffeaa7"
            />
            
            {/* Open JSON */}
            <FABButton 
              icon={faFolderOpen} 
              title="Abrir Projeto (JSON)" 
              onClick={() => fileInputRef.current?.click()} 
              color="#ffeaa7"
            />

            {/* Delete */}
            <FABButton 
              icon={faTrash} 
              title="Excluir" 
              onClick={() => handleAction(onDelete)} 
              color="#ffaaaa"
            />
            
            {/* Save PDF */}
            <FABButton 
              icon={faFilePdf} 
              title="Salvar PDF" 
              onClick={() => handleAction(onSavePDF)} 
              color="#aaffaa"
            />

            {/* Tips Toggle */}
            <FABButton 
              icon={faLightbulb} 
              title="Dicas" 
              onClick={onToggleTips}
              isActive={showTips}
              color="#f1c40f"
              isPulsing={tutorialHighlight === 'tips'}
            />
          </div>
        )}
      </div>
    </>
  );
}
