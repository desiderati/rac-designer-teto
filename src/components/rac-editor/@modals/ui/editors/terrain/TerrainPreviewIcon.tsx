import {cn} from '@/components/rac-editor/lib/utils.ts';

interface TerrainPreviewIconProps {
  className?: string;
}

export function TerrainPreviewIcon({className}: TerrainPreviewIconProps) {
  return (
    <svg
      viewBox='0 0 100 76'
      className={cn('w-16 h-12 flex-shrink-0 rounded-lg border border-amber-300/80 bg-[#f1f1f1]', className)}
      aria-hidden='true'
    >
      <defs>
        <pattern id='terrain-piloti-hatch' width='4' height='4' patternUnits='userSpaceOnUse'
                 patternTransform='rotate(45)'>
          <line x1='0' y1='0' x2='0' y2='4' stroke='#9aa0a6' strokeWidth='1'/>
        </pattern>
      </defs>

      <path
        d='M0 40
           C8 38, 16 43, 24 40
           C32 38, 40 42, 48 40
           C56 38, 64 43, 72 40
           C80 38, 90 42, 100 40
           L100 76 L0 76 Z'
        fill='#dfddd6'
      />

      <path
        d='M0 40
           C8 38, 16 43, 24 40
           C32 38, 40 42, 48 40
           C56 38, 64 43, 72 40
           C80 38, 90 42, 100 40'
        fill='none'
        stroke='#937015'
        strokeWidth='3'
        strokeLinecap='round'
      />

      {[18, 38, 58, 78].map((x) => (
        <g key={`terrain-piloti-${x}`}>
          <rect x={x} y='8' width='8' height='56' fill='url(#terrain-piloti-hatch)' stroke='#6f6f6f' strokeWidth='1.4'/>
          <rect x={x - 1} y='62' width='10' height='4' fill='#8f795e' stroke='#6d5a46' strokeWidth='0.8'/>
        </g>
      ))}
    </svg>
  );
}

