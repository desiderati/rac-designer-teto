import type {HousePiloti} from '@/shared/types/house.ts';
import {formatPilotiHeight, getAllPilotiIds} from '@/shared/types/piloti.ts';

/** Esquema de consulta: não expõe IDs nem altera a definição ou o Canvas da casa. */
export function HousePlanMiniature({pilotis}: {pilotis: Record<string, HousePiloti>}) {
  return <svg role='img' aria-label='Mini planta da casa, sem identificadores de pilotis'
    viewBox='0 0 280 170' className='w-full text-slate-700'>
    <rect x='12' y='12' width='256' height='146' fill='white' stroke='currentColor'/>
    {getAllPilotiIds().map((id) => {
      const piloti = pilotis[id];
      if (!piloti || piloti.height <= 0) return null;
      const [, column, row] = id.split('_').map(Number);
      const x = 30 + column * (220 / 3);
      const y = 26 + row * 59;
      return <g key={id}>
        <circle cx={x} cy={y} r='12' fill={piloti.isMaster ? '#d4a574' : 'white'} stroke='currentColor'/>
        <text x={x} y={y} textAnchor='middle' dominantBaseline='central' fontSize='9' fill='currentColor'>{formatPilotiHeight(piloti.height)}</text>
      </g>;
    })}
  </svg>;
}
