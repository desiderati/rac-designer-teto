import {cn} from '@/components/rac-editor/lib/utils.ts';
import {EDITOR_ICON_COLORS} from '@/shared/config.ts';
import {PILOTI_MASTER_FILL_COLOR} from '@/shared/constants.ts';

const GRID_ROWS = 3;
const GRID_COLS = 4;

const ROW_LETTERS = ['A', 'B', 'C'];

interface PilotiGridIconProps {
  highlight?: 'top' | 'bottom' | 'left' | 'right';
  selectedPiloti?: string;
  masterPiloti?: string;
  className?: string;
}

export function PilotiGridIcon({highlight, selectedPiloti, masterPiloti, className}: PilotiGridIconProps) {
  const getColor = (row: number, col: number): string => {
    const name = getPilotiNameAt(row, col);

    // Individual mode takes precedence
    if (selectedPiloti && name === selectedPiloti) return 'hsl(var(--primary))';
    if (masterPiloti && name === masterPiloti) return PILOTI_MASTER_FILL_COLOR;

    // Side highlight mode
    if (highlight) {
      const isHighlighted =
        (highlight === 'top' && row === 0) ||
        (highlight === 'bottom' && row === 2) ||
        (highlight === 'left' && col === 0) ||
        (highlight === 'right' && col === 3);
      if (isHighlighted) return 'hsl(var(--primary))';
    }

    return EDITOR_ICON_COLORS.neutralStrokeColor;
  };

  const circles: JSX.Element[] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const cx = 14 + col * 24;
      const cy = 14 + row * 24;
      circles.push(
        <circle
          key={`${row}-${col}`}
          cx={cx}
          cy={cy}
          r={9}
          fill={getColor(row, col)}
          filter='url(#pilotiShadow)'
        />
      );
    }
  }

  return (
    <svg
      viewBox='0 0 100 76'
      className={cn('w-20 h-14', className)}
      aria-hidden='true'
    >
      <defs>
        <filter id='pilotiShadow' x='-20%' y='-20%' width='140%' height='160%'>
          <feDropShadow dx='0' dy='1.5' stdDeviation='1.5' floodColor='#000' floodOpacity='0.18'/>
        </filter>
      </defs>
      {circles}
    </svg>
  );
}

function getPilotiNameAt(row: number, col: number): string {
  return `${ROW_LETTERS[row]}${col + 1}`;
}

