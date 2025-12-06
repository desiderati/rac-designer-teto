import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faLockOpen, 
  faLock, 
  faShapes, 
  faPencilAlt, 
  faFont, 
  faDownload, 
  faFolderOpen, 
  faTrash, 
  faFilePdf,
  faLayerGroup,
  faArrowLeft,
  faArrowRight,
  faSquare,
  faTree,
  faTint,
  faMinus,
  faLongArrowAltRight,
  faArrowsAltH,
  faDoorOpen
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
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          className={cn(
            'w-10 h-10 rounded-none bg-transparent hover:bg-muted/30 transition-all duration-200',
            isActive && 'bg-orange-500/20 ring-2 ring-orange-500',
            className
          )}
        >
          <FontAwesomeIcon icon={icon} style={{ color }} className="h-5 w-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" className="bg-secondary text-secondary-foreground">
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
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          className="w-9 h-9 rounded bg-muted/20 hover:bg-muted/40"
        >
          <FontAwesomeIcon icon={icon} style={{ color }} className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" className="bg-secondary text-secondary-foreground">
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
        <div className="absolute left-16 top-16 z-50 bg-card border border-border p-2 rounded-r-lg shadow-lg flex flex-col gap-1 animate-in slide-in-from-left-2">
          <SubButton icon={faLayerGroup} title="Visão Superior (Planta)" onClick={onAddHouseTop} color="#6c757d" />
          <SubButton icon={faHome} title="Visão Frontal" onClick={onAddHouseFront} color="#6c757d" />
          <SubButton icon={faHome} title="Visão Traseira" onClick={onAddHouseBack} color="#6c757d" />
          <SubButton icon={faArrowLeft} title="Lateral Esquerda" onClick={onAddHouseSide1} color="#6c757d" />
          <SubButton icon={faArrowRight} title="Lateral Direita" onClick={onAddHouseSide2} color="#6c757d" />
        </div>
      )}

      {/* Elements Submenu */}
      {activeSubmenu === 'elements' && (
        <div className="absolute left-16 top-60 z-50 bg-card border border-border p-2 rounded-r-lg shadow-lg flex flex-col gap-1 animate-in slide-in-from-left-2">
          <SubButton icon={faSquare} title="Objeto / Muro" onClick={onAddWall} color="#6c757d" />
          <SubButton icon={faDoorOpen} title="Porta" onClick={onAddDoor} color="#6c757d" />
          <SubButton icon={faLayerGroup} title="Escada" onClick={onAddStairs} color="#6c757d" />
          <SubButton icon={faTree} title="Árvore" onClick={onAddTree} color="#6c757d" />
          <SubButton icon={faTint} title="Água / Rio" onClick={onAddWater} color="#6c757d" />
          <SubButton icon={faMinus} title="Linha Reta" onClick={onAddLine} color="#6c757d" />
          <SubButton icon={faLongArrowAltRight} title="Seta Simples" onClick={onAddArrow} color="#6c757d" />
          <SubButton icon={faArrowsAltH} title="Distância" onClick={onAddDimension} color="#6c757d" />
        </div>
      )}

      {/* Main Sidebar - matching original HTML style */}
      <aside className="w-16 h-full bg-card border-r border-border flex flex-col items-center py-4 gap-3 overflow-y-auto flex-shrink-0">
        {/* Logo */}
        <div className="text-center mb-2">
          <span className="font-bold text-muted-foreground text-xs">RAC</span>
          <br />
          <span className="font-bold text-xs" style={{ color: '#28a745' }}>TETO</span>
        </div>

        {/* House Button - gray like original */}
        <ToolButton
          icon={faHome}
          title="Casa TETO (Opções)"
          onClick={onToggleHouseMenu}
          color="#6c757d"
          isActive={activeSubmenu === 'house'}
        />

        {/* Unlock - orange/brown like original */}
        <ToolButton 
          icon={faLockOpen} 
          title="Desbloquear (Desagrupar)" 
          onClick={onUngroup} 
          color="#d4a373"
        />
        
        {/* Lock - gray like original */}
        <ToolButton 
          icon={faLock} 
          title="Bloquear (Agrupar)" 
          onClick={onGroup} 
          color="#6c757d"
        />

        {/* Elements - gray like original */}
        <ToolButton
          icon={faShapes}
          title="Elementos"
          onClick={onToggleElementsMenu}
          color="#6c757d"
          isActive={activeSubmenu === 'elements'}
        />
        
        {/* Pencil - olive/green like original */}
        <ToolButton
          icon={faPencilAlt}
          title="Lápis"
          onClick={onToggleDrawMode}
          color="#808000"
          isActive={isDrawing}
        />
        
        {/* Text - dark gray like original */}
        <ToolButton 
          icon={faFont} 
          title="Texto Livre" 
          onClick={onAddText} 
          color="#495057"
        />

        {/* Export JSON - gold/yellow like original */}
        <ToolButton 
          icon={faDownload} 
          title="Exportar Projeto (JSON)" 
          onClick={onExportJSON} 
          color="#c9a227"
        />
        
        {/* Open JSON - tan/brown like original */}
        <ToolButton 
          icon={faFolderOpen} 
          title="Abrir Projeto (JSON)" 
          onClick={() => fileInputRef.current?.click()} 
          color="#d4a373"
        />

        {/* Delete - dark red/brown like original */}
        <ToolButton 
          icon={faTrash} 
          title="Excluir" 
          onClick={onDelete} 
          color="#8b4513"
        />
        
        {/* Save PDF - green like original */}
        <ToolButton 
          icon={faFilePdf} 
          title="Salvar PDF" 
          onClick={onSavePDF} 
          color="#28a745"
        />
      </aside>
    </>
  );
}
