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
      const cx = 12 + col * 20;
      const cy = 12 + row * 20;
      const highlighted = isHighlighted(row, col);
      circles.push(
        <circle
          key={`${row}-${col}`}
          cx={cx}
          cy={cy}
          r={5}
          fill={highlighted ? 'hsl(var(--primary))' : '#d1d5db'}
        />
      );
    }
  }

  return (
    <svg
      viewBox="0 0 84 64"
      className={cn('w-16 h-12', className)}
      aria-hidden="true"
    >
      {circles}
    </svg>
  );
}
