import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
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
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useRef } from 'react';

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
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

function ToolButton({ 
  icon, 
  title, 
  onClick, 
  color,
  isActive = false,
  className = ''
}: { 
  icon: IconDefinition; 
  title: string; 
  onClick: () => void;
  color: string;
  isActive?: boolean;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            'w-[42px] h-[42px] mb-2 border-none rounded-[10px] bg-white/10 text-[#ecf0f1] text-lg cursor-pointer transition-all duration-200 flex justify-center items-center hover:bg-[#0092DD] hover:scale-105 active:scale-95',
            isActive && 'bg-[#e67e22] border-2 border-white',
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

function SubButton({ 
  icon, 
  title, 
  onClick,
  color = '#6c757d'
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
          className="w-10 h-10 border-none rounded-[10px] bg-white/10 text-[#ecf0f1] text-base cursor-pointer transition-all duration-200 flex justify-center items-center hover:bg-[#0092DD] hover:scale-105 active:scale-95"
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
  isCollapsed,
  onToggleCollapse,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJSON(file);
      e.target.value = '';
    }
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
      
      {/* House Submenu */}
      {activeSubmenu === 'house' && (
        <div className="absolute left-16 top-16 z-50 bg-[#34495e] p-2 rounded-r-lg shadow-lg flex flex-col gap-1 animate-in slide-in-from-left-2">
          <SubButton icon={faLayerGroup} title="Visão Superior (Planta)" onClick={onAddHouseTop} color="#ecf0f1" />
          <SubButton icon={faHouseChimney} title="Visão Frontal" onClick={onAddHouseFront} color="#ecf0f1" />
          <SubButton icon={faHome} title="Visão Traseira" onClick={onAddHouseBack} color="#ecf0f1" />
          <SubButton icon={faArrowLeft} title="Lateral Esquerda" onClick={onAddHouseSide1} color="#ecf0f1" />
          <SubButton icon={faArrowRight} title="Lateral Direita" onClick={onAddHouseSide2} color="#ecf0f1" />
        </div>
      )}

      {/* Elements Submenu */}
      {activeSubmenu === 'elements' && (
        <div className="absolute left-16 top-60 z-50 bg-[#34495e] p-2 rounded-r-lg shadow-lg flex flex-col gap-1 animate-in slide-in-from-left-2">
          <SubButton icon={faBars} title="Objeto / Muro" onClick={onAddWall} color="#ecf0f1" />
          <SubButton icon={faDoorOpen} title="Porta" onClick={onAddDoor} color="#ecf0f1" />
          <SubButton icon={faStairs} title="Escada" onClick={onAddStairs} color="#ecf0f1" />
          <SubButton icon={faTree} title="Árvore" onClick={onAddTree} color="#ecf0f1" />
          <SubButton icon={faWater} title="Água / Rio" onClick={onAddWater} color="#ecf0f1" />
          <SubButton icon={faSlash} title="Linha Reta" onClick={onAddLine} color="#ecf0f1" />
          <SubButton icon={faArrowRightLong} title="Seta Simples" onClick={onAddArrow} color="#ecf0f1" />
          <SubButton icon={faArrowsLeftRight} title="Distância" onClick={onAddDimension} color="#ecf0f1" />
        </div>
      )}

      {/* Main Sidebar - matching original HTML style */}
      <aside className={cn(
        'h-full bg-[#2c3e50] flex flex-col items-center py-4 gap-3 overflow-y-auto flex-shrink-0 shadow-[2px_0_5px_rgba(0,0,0,0.2)] transition-all duration-300',
        isCollapsed ? 'w-10' : 'w-16'
      )}>
        {/* Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="w-6 h-6 mb-2 border-none rounded bg-white/10 text-[#ecf0f1] text-xs cursor-pointer transition-all duration-200 flex justify-center items-center hover:bg-[#0092DD]"
        >
          <FontAwesomeIcon icon={isCollapsed ? faChevronRight : faChevronLeft} />
        </button>

        {!isCollapsed && (
          <>
            {/* Logo */}
            <div className="text-center mb-2">
              <span className="font-bold text-white text-xs">RAC</span>
              <br />
              <span className="font-bold text-xs" style={{ color: '#0092DD' }}>TETO</span>
            </div>

            {/* House Button */}
            <ToolButton
              icon={faHome}
              title="Casa TETO (Opções)"
              onClick={onToggleHouseMenu}
              color="#ecf0f1"
              isActive={activeSubmenu === 'house'}
            />

            {/* Unlock */}
            <ToolButton 
              icon={faLockOpen} 
              title="Desbloquear (Desagrupar)" 
              onClick={onUngroup} 
              color="#ecf0f1"
            />
            
            {/* Lock */}
            <ToolButton 
              icon={faLock} 
              title="Bloquear (Agrupar)" 
              onClick={onGroup} 
              color="#ecf0f1"
            />

            {/* Elements */}
            <ToolButton
              icon={faShapes}
              title="Elementos"
              onClick={onToggleElementsMenu}
              color="#ecf0f1"
              isActive={activeSubmenu === 'elements'}
            />
            
            {/* Pencil */}
            <ToolButton
              icon={faPenNib}
              title="Lápis"
              onClick={onToggleDrawMode}
              color="#ecf0f1"
              isActive={isDrawing}
            />
            
            {/* Text */}
            <ToolButton 
              icon={faFont} 
              title="Texto Livre" 
              onClick={onAddText} 
              color="#ecf0f1"
            />

            {/* Export JSON */}
            <ToolButton 
              icon={faFileDownload} 
              title="Exportar Projeto (JSON)" 
              onClick={onExportJSON} 
              color="#ffeaa7"
            />
            
            {/* Open JSON */}
            <ToolButton 
              icon={faFolderOpen} 
              title="Abrir Projeto (JSON)" 
              onClick={() => fileInputRef.current?.click()} 
              color="#ffeaa7"
            />

            {/* Delete */}
            <ToolButton 
              icon={faTrash} 
              title="Excluir" 
              onClick={onDelete} 
              color="#ffaaaa"
            />
            
            {/* Save PDF */}
            <ToolButton 
              icon={faFilePdf} 
              title="Salvar PDF" 
              onClick={onSavePDF} 
              color="#aaffaa"
            />
          </>
        )}
      </aside>
    </>
  );
}
