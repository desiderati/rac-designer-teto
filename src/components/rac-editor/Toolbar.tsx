import { 
  Home, 
  LockOpen, 
  Lock, 
  Shapes, 
  Pencil, 
  Type, 
  Download, 
  FolderOpen, 
  Trash2, 
  FileText,
  Layers,
  ArrowLeft,
  ArrowRight,
  Square,
  TreePine,
  Droplets,
  Minus,
  MoveRight,
  ArrowLeftRight,
  DoorOpen
} from 'lucide-react';
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
  icon: Icon, 
  title, 
  onClick, 
  colorClass,
  isActive = false,
  className = ''
}: { 
  icon: React.ElementType; 
  title: string; 
  onClick: () => void;
  colorClass: string;
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
          <Icon className={cn('h-5 w-5', colorClass)} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" className="bg-secondary text-secondary-foreground">
        {title}
      </TooltipContent>
    </Tooltip>
  );
}

function SubButton({ 
  icon: Icon, 
  title, 
  onClick,
  colorClass = 'text-muted-foreground'
}: { 
  icon: React.ElementType; 
  title: string; 
  onClick: () => void;
  colorClass?: string;
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
          <Icon className={cn('h-4 w-4', colorClass)} />
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
          <SubButton icon={Layers} title="Visão Superior (Planta)" onClick={onAddHouseTop} colorClass="text-[#6c757d]" />
          <SubButton icon={Home} title="Visão Frontal" onClick={onAddHouseFront} colorClass="text-[#6c757d]" />
          <SubButton icon={Home} title="Visão Traseira" onClick={onAddHouseBack} colorClass="text-[#6c757d]" />
          <SubButton icon={ArrowLeft} title="Lateral Esquerda" onClick={onAddHouseSide1} colorClass="text-[#6c757d]" />
          <SubButton icon={ArrowRight} title="Lateral Direita" onClick={onAddHouseSide2} colorClass="text-[#6c757d]" />
        </div>
      )}

      {/* Elements Submenu */}
      {activeSubmenu === 'elements' && (
        <div className="absolute left-16 top-60 z-50 bg-card border border-border p-2 rounded-r-lg shadow-lg flex flex-col gap-1 animate-in slide-in-from-left-2">
          <SubButton icon={Square} title="Objeto / Muro" onClick={onAddWall} colorClass="text-[#6c757d]" />
          <SubButton icon={DoorOpen} title="Porta" onClick={onAddDoor} colorClass="text-[#6c757d]" />
          <SubButton icon={Layers} title="Escada" onClick={onAddStairs} colorClass="text-[#6c757d]" />
          <SubButton icon={TreePine} title="Árvore" onClick={onAddTree} colorClass="text-[#6c757d]" />
          <SubButton icon={Droplets} title="Água / Rio" onClick={onAddWater} colorClass="text-[#6c757d]" />
          <SubButton icon={Minus} title="Linha Reta" onClick={onAddLine} colorClass="text-[#6c757d]" />
          <SubButton icon={MoveRight} title="Seta Simples" onClick={onAddArrow} colorClass="text-[#6c757d]" />
          <SubButton icon={ArrowLeftRight} title="Distância" onClick={onAddDimension} colorClass="text-[#6c757d]" />
        </div>
      )}

      {/* Main Sidebar - matching original HTML style */}
      <aside className="w-16 h-full bg-card border-r border-border flex flex-col items-center py-4 gap-3 overflow-y-auto flex-shrink-0">
        {/* Logo */}
        <div className="text-center mb-2">
          <span className="font-bold text-muted-foreground text-xs">RAC</span>
          <br />
          <span className="font-bold text-[#28a745] text-xs">TETO</span>
        </div>

        {/* House Button - gray/brown like original */}
        <ToolButton
          icon={Home}
          title="Casa TETO (Opções)"
          onClick={onToggleHouseMenu}
          colorClass="text-[#6c757d]"
          isActive={activeSubmenu === 'house'}
        />

        {/* Unlock - orange/brown like original */}
        <ToolButton 
          icon={LockOpen} 
          title="Desbloquear (Desagrupar)" 
          onClick={onUngroup} 
          colorClass="text-[#d4a373]"
        />
        
        {/* Lock - gray like original */}
        <ToolButton 
          icon={Lock} 
          title="Bloquear (Agrupar)" 
          onClick={onGroup} 
          colorClass="text-[#6c757d]"
        />

        {/* Elements - gray like original */}
        <ToolButton
          icon={Shapes}
          title="Elementos"
          onClick={onToggleElementsMenu}
          colorClass="text-[#6c757d]"
          isActive={activeSubmenu === 'elements'}
        />
        
        {/* Pencil - olive/green like original */}
        <ToolButton
          icon={Pencil}
          title="Lápis"
          onClick={onToggleDrawMode}
          colorClass="text-[#808000]"
          isActive={isDrawing}
        />
        
        {/* Text - dark gray like original */}
        <ToolButton 
          icon={Type} 
          title="Texto Livre" 
          onClick={onAddText} 
          colorClass="text-[#495057]"
        />

        {/* Export JSON - gold/yellow like original */}
        <ToolButton 
          icon={Download} 
          title="Exportar Projeto (JSON)" 
          onClick={onExportJSON} 
          colorClass="text-[#c9a227]"
        />
        
        {/* Open JSON - tan/brown like original */}
        <ToolButton 
          icon={FolderOpen} 
          title="Abrir Projeto (JSON)" 
          onClick={() => fileInputRef.current?.click()} 
          colorClass="text-[#d4a373]"
        />

        {/* Delete - dark red/brown like original */}
        <ToolButton 
          icon={Trash2} 
          title="Excluir" 
          onClick={onDelete} 
          colorClass="text-[#8b4513]"
        />
        
        {/* Save PDF - green like original */}
        <ToolButton 
          icon={FileText} 
          title="Salvar PDF" 
          onClick={onSavePDF} 
          colorClass="text-[#28a745]"
        />
      </aside>
    </>
  );
}
