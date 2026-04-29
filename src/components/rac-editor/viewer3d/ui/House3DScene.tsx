import {useMemo} from 'react';
import {HOUSE_3D_VIEWER_SCALE} from '@/components/rac-editor/viewer3d/lib/constants.ts';
import {buildHouseElementsFromCanvasModel} from '@/components/rac-editor/viewer3d/lib/house-elements-parser.ts';
import type {Contraventamento3DData} from '@/components/rac-editor/viewer3d/lib/contraventamento-parser.ts';
import type {Stairs3DData} from '@/components/rac-editor/viewer3d/lib/stairs-parser.ts';
import {ALL_PILOTI_IDS, HOUSE_3D_WALL_COLORS} from '@/shared/config.ts';
import type {HousePiloti, HouseType} from '@/shared/types/house.ts';
import {TerrainMesh, PilotiMesh, ContraventamentoMesh} from './House3DTerrainMeshes.tsx';
import {HouseElementMesh, HouseMesh} from './House3DStructureMeshes.tsx';
import {StairsMesh} from './House3DStairsMesh.tsx';

interface House3DSceneProps {
  houseType: HouseType;
  pilotis: Record<string, HousePiloti>;
  contraventamentos?: Contraventamento3DData[];
  stairs?: Stairs3DData;
  wallColor?: string;
  tipo6FrontSide?: 'top' | 'bottom' | null;
  tipo3OpenSide?: 'left' | 'right' | null;
  hideBelowTerrain?: boolean;
}

export function House3DScene({
  houseType,
  pilotis,
  contraventamentos = [],
  stairs = null,
  wallColor = HOUSE_3D_WALL_COLORS.sceneFallbackColor,
  tipo6FrontSide = null,
  tipo3OpenSide = null,
  hideBelowTerrain = false,
}: House3DSceneProps) {
  const houseElements = useMemo(
    () => buildHouseElementsFromCanvasModel(houseType, tipo6FrontSide, tipo3OpenSide),
    [houseType, tipo6FrontSide, tipo3OpenSide],
  );
  if (!houseType) return null;

  return (
    <group>
      <TerrainMesh pilotis={pilotis} margin={(stairs?.stairHeightMts ?? 0) * 100 * HOUSE_3D_VIEWER_SCALE}/>

      {ALL_PILOTI_IDS.map((pilotiId) => (
        <PilotiMesh
          key={pilotiId}
          pilotiId={pilotiId}
          pilotis={pilotis}
          hideBelowTerrain={hideBelowTerrain}
        />
      ))}

      {contraventamentos.map((contraventamento) => (
        <ContraventamentoMesh key={contraventamento.id} contraventamento={contraventamento} pilotis={pilotis}/>
      ))}

      <HouseMesh wallColor={wallColor} houseType={houseType} tipo3OpenSide={tipo3OpenSide}/>

      {houseElements.map((element) => (
        <HouseElementMesh key={element.id} element={element}/>
      ))}

      {stairs && <StairsMesh stairs={stairs}/>}
    </group>
  );
}
