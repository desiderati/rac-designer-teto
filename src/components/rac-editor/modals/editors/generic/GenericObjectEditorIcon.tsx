import {cn} from '@/components/lib/utils.ts';
import {
  GenericObjectEditorType
} from '@/components/rac-editor/modals/editors/generic/strategies/generic-object-editor-strategy.ts';

interface GenericObjectEditorIconProps {
  type: GenericObjectEditorType;
  className?: string;
}

function WallIcon() {
  return (
    <>
      <rect x='5' y='12' width='90' height='52' rx='2' fill='#eef1f5' stroke='none'/>
      <rect x='5' y='12' width='90' height='52' rx='2' fill='none' stroke='hsl(var(--primary))' strokeWidth='3'
            strokeDasharray='6 4'/>
    </>
  );
}

function LineIcon() {
  return (
    <>
      <line x1='5' y1='18' x2='95' y2='18' stroke='#dfe3e8' strokeWidth='6' strokeLinecap='round'/>
      <line x1='5' y1='38' x2='95' y2='38' stroke='#dfe3e8' strokeWidth='6' strokeLinecap='round'/>
      <line x1='5' y1='58' x2='95' y2='58' stroke='hsl(var(--primary))' strokeWidth='6' strokeLinecap='round'/>
    </>
  );
}

function ArrowIcon() {
  const y = 38;
  return (
    <g>
      <line x1='5' y1={y} x2='78' y2={y} stroke='hsl(var(--primary))' strokeWidth='4' strokeLinecap='round'/>
      <polyline points={`68,${y - 10} 84,${y} 68,${y + 10}`} fill='none' stroke='hsl(var(--primary))' strokeWidth='4'
                strokeLinecap='round' strokeLinejoin='round'/>
    </g>
  );
}

function DistanceIcon() {
  return (
    <>
      <line x1='5' y1='50' x2='95' y2='50' stroke='hsl(var(--primary))' strokeWidth='3' strokeDasharray='6 4'/>
      <line x1='5' y1='42' x2='5' y2='58' stroke='hsl(var(--primary))' strokeWidth='2.5'/>
      <line x1='95' y1='42' x2='95' y2='58' stroke='hsl(var(--primary))' strokeWidth='2.5'/>
      <text x='50' y='36' textAnchor='middle' fill='hsl(var(--primary))' fontSize='18' fontWeight='600'
            fontFamily='Arial'>
        1,0 m
      </text>
    </>
  );
}

export function GenericObjectEditorIcon({type, className}: GenericObjectEditorIconProps) {
  return (
    <svg
      viewBox='0 0 100 76'
      className={cn('w-20 h-14', className)}
      aria-hidden='true'
    >
      {type === 'wall' && <WallIcon/>}
      {type === 'line' && <LineIcon/>}
      {type === 'arrow' && <ArrowIcon/>}
      {type === 'distance' && <DistanceIcon/>}
    </svg>
  );
}
