import { cn } from '@/lib/utils';
import { HouseSide } from '@/lib/house-manager';

interface PilotiData {
  height: number;
  isMaster: boolean;
  nivel: number;
}

interface PilotiMinimapProps {
  pilotiData: Record<string, PilotiData>;
  hoveredSide: HouseSide | null;
}

const PILOTI_POSITIONS: { name: string; top: string; left: string }[] = [
  // Row A (top)
  { name: 'A1', top: '8%', left: '12%' },
  { name: 'A2', top: '8%', left: '37%' },
  { name: 'A3', top: '8%', left: '63%' },
  { name: 'A4', top: '8%', left: '88%' },
  // Row B (middle)
  { name: 'B1', top: '50%', left: '12%' },
  { name: 'B2', top: '50%', left: '37%' },
  { name: 'B3', top: '50%', left: '63%' },
  { name: 'B4', top: '50%', left: '88%' },
  // Row C (bottom)
  { name: 'C1', top: '92%', left: '12%' },
  { name: 'C2', top: '92%', left: '37%' },
  { name: 'C3', top: '92%', left: '63%' },
  { name: 'C4', top: '92%', left: '88%' },
];

function getPilotiIdFromName(name: string): string {
  const row = name.charCodeAt(0) - 65;
  const col = parseInt(name[1]) - 1;
  return `piloti_${col}_${row}`;
}

function isHighlighted(name: string, hoveredSide: HouseSide | null): boolean {
  if (!hoveredSide) return false;
  const row = name.charCodeAt(0) - 65;
  const col = parseInt(name[1]) - 1;
  switch (hoveredSide) {
    case 'top': return row === 0;
    case 'bottom': return row === 2;
    case 'left': return col === 0;
    case 'right': return col === 3;
    default: return false;
  }
}

export function PilotiMinimap({ pilotiData, hoveredSide }: PilotiMinimapProps) {
  return (
    <div className="w-full max-w-xs">
      <div
        className="border-2 border-foreground/30 rounded-lg bg-muted/30 relative"
        style={{ aspectRatio: '2/1' }}
      >
        {PILOTI_POSITIONS.map(({ name, top, left }) => {
          const pilotiId = getPilotiIdFromName(name);
          const data = pilotiData[pilotiId] || { height: 1.0, isMaster: false, nivel: 0.3 };
          const highlighted = isHighlighted(name, hoveredSide);

          return (
            <div
              key={name}
              className={cn(
                'absolute flex items-center justify-center rounded-full border-2 transition-all duration-200',
                'w-6 h-6',
                highlighted ? 'bg-primary/20 border-primary scale-125' : 'bg-background border-foreground/20',
                data.isMaster && 'bg-amber-100 border-amber-500',
              )}
              style={{
                top,
                left,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span className="text-[8px] font-medium text-foreground/70 leading-none">
                {name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
