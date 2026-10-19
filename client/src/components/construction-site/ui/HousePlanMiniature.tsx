import {getHouseSideLabel, type HousePiloti, type HouseState} from '@/shared/types/house.ts';
import {formatPilotiHeight, getAllPilotiIds} from '@/shared/types/piloti.ts';
import {calculateRenderedDoorGeometryForTopMarker, calculateTopDoorPlacement, resolveTopDoorMarkerSide} from '@/shared/lib/house-door-geometry.ts';

/** Esquema de consulta: não expõe IDs nem altera a definição ou o Canvas da casa. */
export function HousePlanMiniature({pilotis, house}: {
  pilotis: Record<string, HousePiloti>;
  house?: Pick<HouseState, 'houseType' | 'sideMappings' | 'preAssignedSides'>;
}) {
  const bodyWidth = 256, bodyHeight = 146;
  const doorMarkerSide = house ? resolveTopDoorMarkerSide(house) : null;
  const doorGeometry = calculateRenderedDoorGeometryForTopMarker({doorMarkerSide, bodyWidth, bodyHeight});
  const door = calculateTopDoorPlacement({doorMarkerSide, ...doorGeometry, bodyWidth, bodyHeight});
  const doorDescription = doorMarkerSide ? `, porta no lado ${getHouseSideLabel(doorMarkerSide).toLowerCase()}` : '';
  return <svg role='img' aria-label={`Mini planta da casa, sem identificadores de pilotis${doorDescription}`}
    viewBox='0 0 280 170' className='w-full text-slate-700'>
    <rect x='12' y='12' width='256' height='146' fill='white' stroke='currentColor'/>
    {doorMarkerSide ? <g transform={`translate(${12 + bodyWidth / 2 + door.targetLeft}, ${12 + bodyHeight / 2 + door.targetTop}) rotate(${doorMarkerSide === 'left' || doorMarkerSide === 'right' ? 90 : 0})`}>
      <rect x={-doorGeometry.doorWidth / 2} y='-7' width={doorGeometry.doorWidth} height='14' fill='#d4a574' stroke='#92400e'/>
      <text textAnchor='middle' dominantBaseline='central' fontSize='9' fill='currentColor'>Porta</text>
    </g> : null}
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
