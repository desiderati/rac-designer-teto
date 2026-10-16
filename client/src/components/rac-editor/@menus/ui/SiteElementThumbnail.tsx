import type {BuildingDoorSide} from '@shared/types/site-element.ts';

/** Miniatura de Construção na mesma área visual dos ícones da barra. */
export function SiteElementThumbnail({side = 'bottom'}: {side?: BuildingDoorSide}) {
  return <svg viewBox='0 0 64 64' className='h-4 w-4 shrink-0' aria-hidden='true'>
    <g transform={`rotate(${{bottom: 0, top: 180, left: 90, right: -90}[side]} 32 32)`}>
      <path d='M4 4 H60 V60 H44 M20 60 H4 V4' fill='none' stroke='currentColor' strokeWidth='5'/>
      <path d='M44 60 V36' fill='none' stroke='currentColor' strokeWidth='4'/>
      <path d='M20 60 A24 24 0 0 1 44 36' fill='none' stroke='currentColor' strokeWidth='3' strokeDasharray='4 4'/>
    </g>
  </svg>;
}
