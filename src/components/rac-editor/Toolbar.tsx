import { 
  Home, 
  LockOpen, 
  Lock, 
  Shapes, 
  PenTool, 
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
  variant = 'default',
  isActive = false,
  className = ''
}: { 
  icon: React.ElementType; 
  title: string; 
  onClick: () => void;
  variant?: 'default' | 'delete' | 'save' | 'json' | 'ungroup' | 'group';
  isActive?: boolean;
  className?: string;
}) {
  const variantClasses = {
    default: 'bg-sidebar-accent/20 text-sidebar-foreground hover:bg-primary hover:text-primary-foreground',
    delete: 'bg-sidebar-accent/20 text-destructive/70 hover:bg-destructive hover:text-destructive-foreground',
    save: 'bg-sidebar-accent/20 text-green-400 hover:bg-green-600 hover:text-primary-foreground',
    json: 'bg-sidebar-accent/20 text-yellow-400 hover:bg-yellow-600 hover:text-primary-foreground',
    ungroup: 'bg-sidebar-accent/20 text-sidebar-foreground hover:bg-yellow-500 hover:text-secondary',
    group: 'bg-sidebar-accent/20 text-sidebar-foreground hover:bg-purple-600 hover:text-primary-foreground',
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          className={cn(
            'w-10 h-10 rounded-lg transition-all duration-200',
            variantClasses[variant],
            isActive && 'bg-orange-500 border-2 border-primary-foreground',
            className
          )}
        >
          <Icon className="h-5 w-5" />
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
  onClick 
}: { 
  icon: React.ElementType; 
  title: string; 
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          className="w-9 h-9 rounded-lg bg-sidebar-accent/20 text-sidebar-foreground hover:bg-primary hover:text-primary-foreground"
        >
          <Icon className="h-4 w-4" />
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
        <div className="absolute left-16 top-16 z-50 bg-sidebar-accent p-2 rounded-r-lg shadow-lg flex flex-col gap-1 animate-in slide-in-from-left-2">
          <SubButton icon={Layers} title="Visão Superior (Planta)" onClick={onAddHouseTop} />
          <SubButton icon={Home} title="Visão Frontal" onClick={onAddHouseFront} />
          <SubButton icon={Home} title="Visão Traseira" onClick={onAddHouseBack} />
          <SubButton icon={ArrowLeft} title="Lateral Esquerda" onClick={onAddHouseSide1} />
          <SubButton icon={ArrowRight} title="Lateral Direita" onClick={onAddHouseSide2} />
        </div>
      )}

      {/* Elements Submenu */}
      {activeSubmenu === 'elements' && (
        <div className="absolute left-16 top-60 z-50 bg-sidebar-accent p-2 rounded-r-lg shadow-lg flex flex-col gap-1 animate-in slide-in-from-left-2">
          <SubButton icon={Square} title="Objeto / Muro" onClick={onAddWall} />
          <SubButton icon={DoorOpen} title="Porta" onClick={onAddDoor} />
          <SubButton icon={Layers} title="Escada" onClick={onAddStairs} />
          <SubButton icon={TreePine} title="Árvore" onClick={onAddTree} />
          <SubButton icon={Droplets} title="Água / Rio" onClick={onAddWater} />
          <SubButton icon={Minus} title="Linha Reta" onClick={onAddLine} />
          <SubButton icon={MoveRight} title="Seta Simples" onClick={onAddArrow} />
          <SubButton icon={ArrowLeftRight} title="Distância" onClick={onAddDimension} />
        </div>
      )}

      {/* Main Sidebar */}
      <aside className="w-16 h-full bg-secondary flex flex-col items-center py-4 gap-2 shadow-lg overflow-y-auto flex-shrink-0">
        {/* Logo */}
        <div className="text-center mb-2">
          <span className="font-bold text-secondary-foreground text-xs">RAC</span>
          <br />
          <span className="font-bold text-primary text-xs">TETO</span>
        </div>

        {/* House Button */}
        <ToolButton
          icon={Home}
          title="Casa TETO (Opções)"
          onClick={onToggleHouseMenu}
          isActive={activeSubmenu === 'house'}
        />

        {/* Divider */}
        <div className="w-8 h-px bg-muted my-1" />

        {/* Group/Ungroup */}
        <ToolButton icon={LockOpen} title="Desbloquear (Desagrupar)" onClick={onUngroup} variant="ungroup" />
        <ToolButton icon={Lock} title="Bloquear (Agrupar)" onClick={onGroup} variant="group" />

        {/* Divider */}
        <div className="w-8 h-px bg-muted my-1" />

        {/* Elements */}
        <ToolButton
          icon={Shapes}
          title="Elementos"
          onClick={onToggleElementsMenu}
          isActive={activeSubmenu === 'elements'}
        />
        <ToolButton
          icon={PenTool}
          title="Lápis"
          onClick={onToggleDrawMode}
          isActive={isDrawing}
        />
        <ToolButton icon={Type} title="Texto Livre" onClick={onAddText} />

        {/* Divider */}
        <div className="w-8 h-px bg-muted my-1" />

        {/* Export/Import */}
        <ToolButton icon={Download} title="Exportar Projeto (JSON)" onClick={onExportJSON} variant="json" />
        <ToolButton 
          icon={FolderOpen} 
          title="Abrir Projeto (JSON)" 
          onClick={() => fileInputRef.current?.click()} 
          variant="json" 
        />

        {/* Divider */}
        <div className="w-8 h-px bg-muted my-1" />

        {/* Delete & Save */}
        <ToolButton icon={Trash2} title="Excluir" onClick={onDelete} variant="delete" />
        <ToolButton icon={FileText} title="Salvar PDF" onClick={onSavePDF} variant="save" />
      </aside>
    </>
  );
}
