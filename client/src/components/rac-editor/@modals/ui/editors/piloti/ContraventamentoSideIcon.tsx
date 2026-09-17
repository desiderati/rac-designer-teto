import type {
  ContraventamentoHorizontalSide,
  ContraventamentoVerticalSide,
} from '@/shared/types/contraventamento.ts';
import {PILOTI_MASTER_STYLE} from '@/shared/config.ts';

interface ContraventamentoSideIconProps {
  side: ContraventamentoVerticalSide;
  size?: number;
}

export function ContraventamentoSideIcon({side, size = 64}: ContraventamentoSideIconProps) {
  // Keep the whole icon composition centered while placing the beam tangent
  // to the piloti stack on the selected side.
  const pilotiCenterX = side === 'left' ? 34 : 30;
  const beamX = side === 'left' ? pilotiCenterX - 10 : pilotiCenterX + 6;

  return (
    <svg width={size} height={size} viewBox='0 0 64 64' aria-hidden='true'>
      <rect x={beamX} y='8' width='4' height='48' rx='2' fill={PILOTI_MASTER_STYLE.strokeColor}/>
      <circle cx={pilotiCenterX} cy='14' r='6' fill='#0ea5e9'/>
      <circle cx={pilotiCenterX} cy='32' r='6' fill='#0ea5e9'/>
      <circle cx={pilotiCenterX} cy='50' r='6' fill='#0ea5e9'/>
    </svg>
  );
}

interface ContraventamentoHorizontalSideIconProps {
  side: ContraventamentoHorizontalSide;
  size?: number;
}

export function ContraventamentoHorizontalSideIcon({
  side,
  size = 64,
}: ContraventamentoHorizontalSideIconProps) {
  const centerY = 20;
  const radius = 5;
  const beamHeight = 4;
  const beamY = side === 'top'
    ? centerY - radius - beamHeight
    : centerY + radius;

  return (
    <svg width={size} height={size} viewBox='0 0 64 40' aria-hidden='true'>
      <rect x='8' y={beamY} width='48' height={beamHeight} rx='2' fill={PILOTI_MASTER_STYLE.strokeColor}/>
      <circle cx='14' cy={centerY} r={radius} fill='#0ea5e9'/>
      <circle cx='26' cy={centerY} r={radius} fill='#0ea5e9'/>
      <circle cx='38' cy={centerY} r={radius} fill='#0ea5e9'/>
      <circle cx='50' cy={centerY} r={radius} fill='#0ea5e9'/>
    </svg>
  );
}
