import { cn } from '@/lib/utils';

type EditorIconType = 'wall' | 'line' | 'arrow' | 'dimension';

interface EditorTypeIconProps {
  type: EditorIconType;
  className?: string;
}

function WallIcon() {
  // Dashed rectangle with bottom line in primary blue
  return (
    <>
      {/* Top dashed line */}
      <line x1="10" y1="12" x2="90" y2="12" stroke="#dfe3e8" strokeWidth="3" strokeDasharray="6 4" />
      {/* Left dashed line */}
      <line x1="10" y1="12" x2="10" y2="64" stroke="#dfe3e8" strokeWidth="3" strokeDasharray="6 4" />
      {/* Right dashed line */}
      <line x1="90" y1="12" x2="90" y2="64" stroke="#dfe3e8" strokeWidth="3" strokeDasharray="6 4" />
      {/* Bottom line in blue */}
      <line x1="10" y1="64" x2="90" y2="64" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" />
    </>
  );
}

function LineIcon() {
  // 3 horizontal lines, last one in blue
  return (
    <>
      <line x1="10" y1="18" x2="90" y2="18" stroke="#dfe3e8" strokeWidth="4" strokeLinecap="round" />
      <line x1="10" y1="38" x2="90" y2="38" stroke="#dfe3e8" strokeWidth="4" strokeLinecap="round" />
      <line x1="10" y1="58" x2="90" y2="58" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" />
    </>
  );
}

function ArrowIcon() {
  // Two arrows pointing right, last one in blue
  const arrowPath = (y: number, color: string) => (
    <g>
      <line x1="12" y1={y} x2="72" y2={y} stroke={color} strokeWidth="4" strokeLinecap="round" />
      <polyline points={`62,${y - 10} 78,${y} 62,${y + 10}`} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
  return (
    <>
      {arrowPath(26, '#dfe3e8')}
      {arrowPath(50, 'hsl(var(--primary))')}
    </>
  );
}

function DimensionIcon() {
  // Dashed line with value label on top
  return (
    <>
      {/* Gray dashed line */}
      <line x1="10" y1="50" x2="90" y2="50" stroke="#dfe3e8" strokeWidth="3" strokeDasharray="6 4" />
      {/* End markers */}
      <line x1="10" y1="42" x2="10" y2="58" stroke="#dfe3e8" strokeWidth="2.5" />
      <line x1="90" y1="42" x2="90" y2="58" stroke="#dfe3e8" strokeWidth="2.5" />
      {/* Blue value text */}
      <text x="50" y="36" textAnchor="middle" fill="hsl(var(--primary))" fontSize="18" fontWeight="600" fontFamily="Arial">
        1,0 m
      </text>
    </>
  );
}

export function EditorTypeIcon({ type, className }: EditorTypeIconProps) {
  return (
    <svg
      viewBox="0 0 100 76"
      className={cn('w-20 h-14', className)}
      aria-hidden="true"
    >
      {type === 'wall' && <WallIcon />}
      {type === 'line' && <LineIcon />}
      {type === 'arrow' && <ArrowIcon />}
      {type === 'dimension' && <DimensionIcon />}
    </svg>
  );
}
