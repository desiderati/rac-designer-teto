import { ContraventamentoSide } from '@/lib/canvas-utils';

interface ContraventamentoSideIconProps {
  side: ContraventamentoSide;
  size?: number;
}

export function ContraventamentoSideIcon({ side, size = 64 }: ContraventamentoSideIconProps) {
  // Keep the whole icon composition centered while placing the beam tangent
  // to the piloti stack on the selected side.
  const pilotiCenterX = side === 'left' ? 34 : 30;
  const beamX = side === 'left' ? pilotiCenterX - 10 : pilotiCenterX + 6;

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect x={beamX} y="8" width="4" height="48" rx="2" fill="#8B4513" />
      <circle cx={pilotiCenterX} cy="14" r="6" fill="#0ea5e9" />
      <circle cx={pilotiCenterX} cy="32" r="6" fill="#0ea5e9" />
      <circle cx={pilotiCenterX} cy="50" r="6" fill="#0ea5e9" />
    </svg>
  );
}

