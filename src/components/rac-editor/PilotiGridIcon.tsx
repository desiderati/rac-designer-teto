import { cn } from '@/lib/utils';

interface PilotiGridIconProps {
  highlight: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const GRID_ROWS = 3;
const GRID_COLS = 4;

export function PilotiGridIcon({ highlight, className }: PilotiGridIconProps) {
  const isHighlighted = (row: number, col: number): boolean => {
    switch (highlight) {
      case 'top': return row === 0;
      case 'bottom': return row === 2;
      case 'left': return col === 0;
      case 'right': return col === 3;
      default: return false;
    }
  };

  const circles: JSX.Element[] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const cx = 14 + col * 24;
      const cy = 14 + row * 24;
      const highlighted = isHighlighted(row, col);
      circles.push(
        <circle
          key={`${row}-${col}`}
          cx={cx}
          cy={cy}
          r={9}
          fill={highlighted ? 'hsl(var(--primary))' : '#dfe3e8'}
          filter="url(#pilotiShadow)"
        />
      );
    }
  }

  return (
    <svg
      viewBox="0 0 100 76"
      className={cn('w-20 h-14', className)}
      aria-hidden="true"
    >
      <defs>
        <filter id="pilotiShadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000" floodOpacity="0.18" />
        </filter>
      </defs>
      {circles}
    </svg>
  );
}
