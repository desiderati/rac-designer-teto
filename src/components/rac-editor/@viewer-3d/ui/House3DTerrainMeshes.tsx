import {useMemo} from 'react';
import {BufferAttribute, DoubleSide, PlaneGeometry, Quaternion, Vector3} from 'three';
import {
  COLORS,
  CONTRAVENTAMENTO_SQUARE_WIDTH,
  CONTRAVENTAMENTO_TOP_WIDTH,
  HOUSE_3D_DEPTH,
  HOUSE_3D_WIDTH,
  PILOTI_BASE_HEIGHT_PX,
  PILOTI_RADIUS,
  PILOTI_TOP_Y,
  TERRAIN_MARGIN,
  TERRAIN_SEGMENTS,
  TERRAIN_THICKNESS,
} from '@/components/rac-editor/@viewer-3d/lib/constants.ts';
import {DEFAULT_HOUSE_PILOTI, type HousePiloti} from '@/shared/types/house.ts';
import {PILOTI_MASTER_FILL_COLOR} from '@/shared/constants.ts';
import type {Contraventamento3DData} from '@/components/rac-editor/@viewer-3d/lib/parsers/contraventamento-parser.ts';
import {resolvePilotiHeightSegments} from '@/components/rac-editor/@viewer-3d/lib/parsers/piloti-parser.ts';
import {resolveContraventamentoOffsetFromNivel} from '@/shared/types/contraventamento.ts';
import {
  createTerrainVolumeGeometry,
  getPilotiTopXZ,
  getTerrainYByUV,
  parsePilotiId,
  resolvePilotiTerrainY,
} from '@/components/rac-editor/@viewer-3d/lib/scene-geometry.ts';

const MIN_HIDE_BELOW_TERRAIN_NIVEL = 0.5;

export function TerrainMesh({
  pilotis,
  margin,
}: {
  pilotis: Record<string, HousePiloti>;
  margin: number;
}) {
  const topGeometry = useMemo(() => {
    const width = HOUSE_3D_WIDTH + TERRAIN_MARGIN + margin;
    const depth = HOUSE_3D_DEPTH + TERRAIN_MARGIN + margin;

    const geometry = new PlaneGeometry(width, depth, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS);
    const positions = geometry.attributes.position as BufferAttribute;

    for (let index = 0; index < positions.count; index += 1) {
      const x = positions.getX(index);
      const y = positions.getY(index);
      const u = 1 - (x + HOUSE_3D_WIDTH / 2) / HOUSE_3D_WIDTH;
      const v = (y + HOUSE_3D_DEPTH / 2) / HOUSE_3D_DEPTH;
      positions.setZ(index, getTerrainYByUV(pilotis, u, v));
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
  }, [pilotis, margin]);

  const volumeGeometry = useMemo(
    () => createTerrainVolumeGeometry(topGeometry, TERRAIN_SEGMENTS, TERRAIN_THICKNESS),
    [topGeometry],
  );

  return (
    <mesh geometry={volumeGeometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial
        color={COLORS.terrain}
        roughness={2}
        metalness={0}
        side={DoubleSide}
      />
    </mesh>
  );
}

export function PilotiMesh({
  pilotiId,
  pilotis,
  hideBelowTerrain,
}: {
  pilotiId: string;
  pilotis: Record<string, HousePiloti>;
  hideBelowTerrain: boolean;
}) {
  const grid = parsePilotiId(pilotiId);
  if (!grid) return null;

  const data = pilotis[pilotiId] ?? DEFAULT_HOUSE_PILOTI;
  const [x, z] = getPilotiTopXZ(grid.col, grid.row);

  const terrainY = resolvePilotiTerrainY({
    pilotis,
    col: grid.col,
    row: grid.row,
    hideBelowTerrain,
  });

  const nominalHeight = (data.height ?? DEFAULT_HOUSE_PILOTI.height) * PILOTI_BASE_HEIGHT_PX;
  const minHeightToTouchTerrain = Math.max(PILOTI_TOP_Y - terrainY, 0);
  const {visibleHeight, topVisibleHeight, bottomVisibleHeight} = resolvePilotiHeightSegments({
    nominalHeight,
    minHeightToTouchTerrain,
    hideBelowTerrain,
    minVisibleHeightWhenHidden: MIN_HIDE_BELOW_TERRAIN_NIVEL * PILOTI_BASE_HEIGHT_PX,
  });
  if (visibleHeight <= 0) return null;

  const centerY = PILOTI_TOP_Y - visibleHeight / 2;
  const topColor = data.isMaster ? PILOTI_MASTER_FILL_COLOR : COLORS.piloti;

  return (
    <group position={[x, centerY, z]}>
      {bottomVisibleHeight > 0 && (
        <mesh position={[0, -topVisibleHeight / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[PILOTI_RADIUS, PILOTI_RADIUS, bottomVisibleHeight, 16]}/>
          <meshStandardMaterial color={COLORS.pilotiLower} roughness={0.65}/>
        </mesh>
      )}

      {topVisibleHeight > 0 && (
        <mesh position={[0, bottomVisibleHeight / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[PILOTI_RADIUS, PILOTI_RADIUS, topVisibleHeight, 16]}/>
          <meshStandardMaterial color={topColor} roughness={0.65}/>
        </mesh>
      )}
    </group>
  );
}

export function ContraventamentoMesh({
  contraventamento,
  pilotis,
}: {
  contraventamento: Contraventamento3DData;
  pilotis: Record<string, HousePiloti>;
}) {
  const {col, startRow, endRow, side, anchorPilotiId} = contraventamento;
  if (!Number.isInteger(col) || col < 0 || col > 3) return null;
  if (!Number.isInteger(startRow) || !Number.isInteger(endRow)) return null;

  const anchorGrid = parsePilotiId(anchorPilotiId);
  const originCol = anchorGrid?.col ?? col;
  const originRow = anchorGrid?.row ?? startRow;
  const originPilotiId = anchorGrid ? anchorPilotiId : `piloti_${originCol}_${originRow}`;
  const targetRow = originRow === startRow ? endRow : startRow;
  if (originCol < 0 || originCol > 3) return null;
  if (originRow < 0 || originRow > 2 || targetRow < 0 || targetRow > 2 || originRow === targetRow) return null;

  const [colCenterX] = getPilotiTopXZ(originCol, originRow);
  const [, originZ] = getPilotiTopXZ(originCol, originRow);
  const [, targetZ] = getPilotiTopXZ(originCol, targetRow);

  const sideSign = side === 'right' ? -1 : 1;
  const tangentX = colCenterX + sideSign * PILOTI_RADIUS;
  const beamCenterX = tangentX + sideSign * (CONTRAVENTAMENTO_TOP_WIDTH / 2);

  const originNivel = Number(pilotis[originPilotiId]?.nivel ?? DEFAULT_HOUSE_PILOTI.nivel);
  const originY =
    PILOTI_TOP_Y - (originNivel - resolveContraventamentoOffsetFromNivel(originNivel, true)) * PILOTI_BASE_HEIGHT_PX;

  const destinationPilotiId = `piloti_${originCol}_${targetRow}`;
  const destinationNivel = Number(pilotis[destinationPilotiId]?.nivel ?? DEFAULT_HOUSE_PILOTI.nivel);
  const destinationY =
    PILOTI_TOP_Y - resolveContraventamentoOffsetFromNivel(destinationNivel, false) * PILOTI_BASE_HEIGHT_PX;

  const startPoint = new Vector3(beamCenterX, originY, originZ);
  const endPoint = new Vector3(beamCenterX, destinationY, targetZ);
  const direction = endPoint.clone().sub(startPoint);
  const length = direction.length();
  if (!Number.isFinite(length) || length <= 0.01) return null;

  direction.normalize();
  const orientation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction);
  const midpoint = startPoint.add(endPoint).multiplyScalar(0.5);

  return (
    <mesh
      position={[midpoint.x, midpoint.y, midpoint.z]}
      quaternion={[orientation.x, orientation.y, orientation.z, orientation.w]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[CONTRAVENTAMENTO_TOP_WIDTH, length, CONTRAVENTAMENTO_SQUARE_WIDTH]}/>
      <meshStandardMaterial color={COLORS.contraventamento} roughness={0.65}/>
    </mesh>
  );
}
