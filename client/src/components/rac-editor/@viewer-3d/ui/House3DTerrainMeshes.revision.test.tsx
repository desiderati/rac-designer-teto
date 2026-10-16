import {Children, isValidElement, type ReactElement, type ReactNode} from 'react';
import {describe, expect, it} from 'vitest';
import {PilotiMesh} from './House3DTerrainMeshes.tsx';
import {definedPilotis} from '@/test/defined-pilotis.ts';
import {PILOTI_MASTER_FILL_COLOR} from '@/shared/constants.ts';
import {getPilotiTopXZ} from '../lib/scene-geometry.ts';

function materials(node: ReactNode): ReactElement<{color: string}>[] {
  return Children.toArray(node).flatMap((child) => {
    if (!isValidElement<{children?: ReactNode; color: string}>(child)) return [];
    return child.type === 'meshStandardMaterial' ? [child] : materials(child.props.children);
  });
}

describe('A-025 piloti mestre 3D', () => {
  it.each([{id: 'piloti_3_2', row: 2}, {id: 'piloti_3_0', row: 0}])('destaca o volume inteiro e a posição de $id', ({id, row}) => {
    const pilotis = definedPilotis();
    Object.values(pilotis).forEach((point) => {point.isMaster = false; point.height = 2.5; point.nivel = 1;});
    pilotis[id].isMaster = true;
    const master = PilotiMesh({pilotiId: id, pilotis, hideBelowTerrain: false})!;
    const [x, z] = getPilotiTopXZ(3, row);
    expect(master.props.position[0]).toBe(x); expect(master.props.position[2]).toBe(z);
    expect(master.props.userData).toEqual({pilotiId: id, isMaster: true});
    expect(materials(master).length).toBe(2);
    expect(materials(master).every((material) => material.props.color === PILOTI_MASTER_FILL_COLOR)).toBe(true);
    const other = PilotiMesh({pilotiId: 'piloti_0_0', pilotis, hideBelowTerrain: false});
    expect(materials(other).some((material) => material.props.color === PILOTI_MASTER_FILL_COLOR)).toBe(false);
  });
});
