import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { HouseSide, ViewType, houseManager } from '@/lib/house-manager';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

import { useIsMobile } from '@/hooks/use-mobile';

interface SideSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  viewType: ViewType;
  onSelectSide: (side: HouseSide) => void;
}

// Piloti grid layout (3 rows x 4 cols)
const PILOTI_GRID = [
  ['A1', 'A2', 'A3', 'A4'],
  ['B1', 'B2', 'B3', 'B4'],
  ['C1', 'C2', 'C3', 'C4'],
];

function getPilotiIdFromName(name: string): string {
  const row = name.charCodeAt(0) - 65; // A=0, B=1, C=2
  const col = parseInt(name[1]) - 1; // 1=0, 2=1, 3=2, 4=3
  return `piloti_${col}_${row}`;
}

export function SideSelector({ isOpen, onClose, viewType, onSelectSide }: SideSelectorProps) {
  const [hoveredSide, setHoveredSide] = useState<HouseSide | null>(null);
  const [, forceUpdate] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isOpen) return;
    return houseManager.subscribe(() => forceUpdate((v) => v + 1));
  }, [isOpen]);

  // Re-read of houseManager data; forceUpdate exists only to rerender on updates
  const house = isOpen ? houseManager.getHouse() : null;
  const pilotiData = house?.pilotis || {};

  const availableSides = houseManager.getAvailableSides(viewType);

  // Determine which sides can be selected based on view type
  const isLongSide = viewType === 'front' || viewType === 'back';
  const selectableSides: HouseSide[] = isLongSide ? ['top', 'bottom'] : ['left', 'right'];

  const handleSideClick = (side: HouseSide) => {
    if (availableSides.includes(side)) {
      onSelectSide(side);
      onClose();
    }
  };

  const getViewLabel = (type: ViewType): string => {
    switch (type) {
      case 'front': return 'Frontal';
      case 'back': return 'Traseira';
      case 'side1': return 'Lateral Fechada';
      case 'side2': return 'Lateral Aberta';
      default: return '';
    }
  };

  const getSideLabel = (side: HouseSide): string => {
    switch (side) {
      case 'top': return 'Superior';
      case 'bottom': return 'Inferior';
      case 'left': return 'Esquerda';
      case 'right': return 'Direita';
      default: return '';
    }
  };

  const isSideAvailable = (side: HouseSide): boolean => {
    return availableSides.includes(side) && selectableSides.includes(side);
  };

  const getSideAssignment = (side: HouseSide): ViewType | null => {
    return house?.sideAssignments[side] || null;
  };

  // Get highlight color for pilotis based on hovered side
  const getPilotiHighlight = (name: string): boolean => {
    if (!hoveredSide) return false;
    
    const row = name.charCodeAt(0) - 65; // A=0, B=1, C=2
    const col = parseInt(name[1]) - 1; // 0-3
    
    // Top side = row A (row 0)
    // Bottom side = row C (row 2)
    // Left side = col 1 (col 0)
    // Right side = col 4 (col 3)
    switch (hoveredSide) {
      case 'top': return row === 0;
      case 'bottom': return row === 2;
      case 'left': return col === 0;
      case 'right': return col === 3;
      default: return false;
    }
  };

  // Display grid is always in normal order - the flip happens when placing on canvas
  const displayGrid = PILOTI_GRID;

  const content = (
    <div className="flex flex-col items-center gap-2 py-2">
      {/* Top side button (for front/back views) */}
      {isLongSide && (
        <SideButton
          side="top"
          label={getSideLabel('top')}
          isAvailable={isSideAvailable('top')}
          isHovered={hoveredSide === 'top'}
          assignment={getSideAssignment('top')}
          onHover={setHoveredSide}
          onClick={handleSideClick}
          className="w-full max-w-xs"
        />
      )}

      {/* Middle row: Left + Grid + Right */}
      {isLongSide ? (
        <div className="flex items-stretch gap-2 w-full max-w-xs justify-center">
          {/* Piloti Grid */}
          <div className="w-full max-w-xs">
            <div
              className="border-2 border-foreground/30 rounded-lg p-3 bg-muted/30 relative"
              style={{ aspectRatio: '4/3' }}
            >
              <div className="grid grid-rows-3 gap-2 h-full">
                {displayGrid.map((row, rowIdx) => (
                  <div key={rowIdx} className="grid grid-cols-4 gap-2">
                    {row.map((name) => {
                      const pilotiId = getPilotiIdFromName(name);
                      const data = pilotiData[pilotiId] || { height: 1.0, isMaster: false, nivel: 0.3 };
                      const isHighlighted = getPilotiHighlight(name);

                      return (
                        <div
                          key={name}
                          className={cn(
                            'flex flex-col items-center justify-center rounded-full aspect-square transition-all duration-200',
                            'border-2',
                            isHighlighted ? 'bg-primary/20 border-primary scale-110' : 'bg-background border-foreground/20',
                            data.isMaster && 'bg-amber-100 border-amber-500',
                          )}
                        >
                          <span className="text-[10px] font-medium text-foreground/70">{name}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Side views: Left button + Grid + Right button in a row
        <div className="inline-flex items-stretch gap-2"> 
          <SideButton
            side="left"
            label={getSideLabel('left')}
            isAvailable={isSideAvailable('left')}
            isHovered={hoveredSide === 'left'}
            assignment={getSideAssignment('left')}
            onHover={setHoveredSide}
            onClick={handleSideClick}
            vertical
            className="self-stretch"
          />

          <div className="w-80">
            <div
              className="border-2 border-foreground/30 rounded-lg p-3 bg-muted/30 relative"
              style={{ aspectRatio: '4/3' }}
            >
              <div className="grid grid-rows-3 gap-2 h-full">
                {displayGrid.map((row, rowIdx) => (
                  <div key={rowIdx} className="grid grid-cols-4 gap-2">
                    {row.map((name) => {
                      const pilotiId = getPilotiIdFromName(name);
                      const data = pilotiData[pilotiId] || { height: 1.0, isMaster: false, nivel: 0.3 };
                      const isHighlighted = getPilotiHighlight(name);

                      return (
                        <div
                          key={name}
                          className={cn(
                            'flex flex-col items-center justify-center rounded-full aspect-square transition-all duration-200',
                            'border-2',
                            isHighlighted ? 'bg-primary/20 border-primary scale-110' : 'bg-background border-foreground/20',
                            data.isMaster && 'bg-amber-100 border-amber-500',
                          )}
                        >
                          <span className="text-[10px] font-medium text-foreground/70">{name}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SideButton
            side="right"
            label={getSideLabel('right')}
            isAvailable={isSideAvailable('right')}
            isHovered={hoveredSide === 'right'}
            assignment={getSideAssignment('right')}
            onHover={setHoveredSide}
            onClick={handleSideClick}
            vertical
            className="self-stretch"
          />
        </div>
      )}

      {/* Bottom side button (for front/back views) */}
      {isLongSide && (
        <SideButton
          side="bottom"
          label={getSideLabel('bottom')}
          isAvailable={isSideAvailable('bottom')}
          isHovered={hoveredSide === 'bottom'}
          assignment={getSideAssignment('bottom')}
          onHover={setHoveredSide}
          onClick={handleSideClick}
          className="w-full max-w-xs"
        />
      )}

    </div>
  );

  // Desktop: use Dialog (modal)
  if (!isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className={cn(isLongSide ? "sm:max-w-sm" : "sm:max-w-lg")}>
          <div className={cn(!isLongSide && "mx-auto w-fit")}>
            <DialogHeader className={cn(isLongSide ? "text-center max-w-xs mx-auto" : "text-left")}>
              <DialogTitle className="text-lg">Posicionar Vista {getViewLabel(viewType)}</DialogTitle>
              <DialogDescription className="text-sm text-left">
                Clique no lado da casa onde deseja posicionar esta vista
              </DialogDescription>
            </DialogHeader>
            {content}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile: use Sheet (bottom drawer)
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-xl">
        <div className={cn(!isLongSide && "mx-auto w-fit")}>
          <SheetHeader className="text-center pb-2 max-w-xs mx-auto">
            <SheetTitle className="text-lg">Posicionar Vista {getViewLabel(viewType)}</SheetTitle>
            <SheetDescription className="text-sm text-left">
              Toque no lado da casa onde deseja posicionar esta vista
            </SheetDescription>
          </SheetHeader>
          {content}
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface SideButtonProps {
  side: HouseSide;
  label: string;
  isAvailable: boolean;
  isHovered: boolean;
  assignment: ViewType | null;
  onHover: (side: HouseSide | null) => void;
  onClick: (side: HouseSide) => void;
  vertical?: boolean;
  className?: string;
}

function SideButton({
  side,
  label,
  isAvailable,
  isHovered,
  assignment,
  onHover,
  onClick,
  vertical,
  className,
}: SideButtonProps) {
  const getAssignmentLabel = (type: ViewType): string => {
    switch (type) {
      case 'front': return 'Frontal';
      case 'back': return 'Traseira';
      case 'side1': return 'Lat. Fechada';
      case 'side2': return 'Lat. Aberta';
      default: return '';
    }
  };

  // When a view is already assigned to THIS side (meaning it's occupied), use gray hover instead of blue
  // This happens when the user already placed a view here and is hovering over it
  const isOccupied = assignment !== null;
  
  return (
    <button
      disabled={!isAvailable}
      onMouseEnter={() => isAvailable && onHover(side)}
      onMouseLeave={() => onHover(null)}
      onTouchStart={() => isAvailable && onHover(side)}
      onTouchEnd={() => onHover(null)}
      onClick={() => onClick(side)}
      className={cn(
        "px-3 py-1.5 rounded-md border-2 transition-all duration-200",
        "flex items-center justify-center gap-1",
        vertical && "writing-mode-vertical flex-col min-w-[32px] px-1.5 py-3",
        isAvailable
          ? isHovered
            ? isOccupied
              ? "bg-gray-200 text-gray-600 border-gray-400"
              : "bg-primary text-primary-foreground border-primary"
            : isOccupied
              ? "bg-background border-foreground/30 hover:bg-gray-200 hover:border-gray-400"
              : "bg-background border-foreground/30 hover:border-primary hover:bg-primary/10"
          : "bg-muted/50 border-muted-foreground/20 text-muted-foreground cursor-not-allowed",
        className
      )}
      style={vertical ? { writingMode: 'vertical-rl', textOrientation: 'mixed' } : undefined}
    >
      {assignment ? (
        <span className="text-xs opacity-70">{getAssignmentLabel(assignment)}</span>
      ) : (
        <span className="text-sm font-medium">{label}</span>
      )}
    </button>
  );
}
