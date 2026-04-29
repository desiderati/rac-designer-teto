import {BufferAttribute, BufferGeometry, Color, MathUtils, PlaneGeometry} from 'three';
import {
  BODY_PROFILE_HEIGHT,
  FLOOR_BEAM_HEIGHT,
  HOUSE_3D_DEPTH,
  HOUSE_3D_FINAL_SCALE,
  HOUSE_3D_VIEWER_SCALE,
  HOUSE_3D_WIDTH,
  PANEL_OFFSET_RATIO,
  PILOTI_BASE_HEIGHT_PX,
  PILOTI_RADIUS,
  PILOTI_STEP_X,
  PILOTI_STEP_Z,
  PILOTI_TOP_Y,
  TERRAIN_THICKNESS,
  WALL_BASE_Y,
} from '@/components/rac-editor/viewer3d/lib/constants.ts';
import {DEFAULT_HOUSE_PILOTI, type HousePiloti} from '@/shared/types/house.ts';
import {PILOTI_CORNER_ID} from '@/shared/config.ts';
import type {Stairs3DData} from '@/components/rac-editor/viewer3d/lib/stairs-parser.ts';

const STAIR_FACE_GAP = 0.35;

export function offsetLightness(hex: string, lightnessOffset: number): string {
  const color = new Color(hex);
  color.offsetHSL(0, 0, lightnessOffset);
  return `#${color.getHexString()}`;
}

export function createFrontBackPanelGeometry(points: Array<[number, number]>): BufferGeometry {
  const vertices: number[] = [];
  const normalized = points.map(
    ([x, y]) => [x - HOUSE_3D_WIDTH / 2, BODY_PROFILE_HEIGHT - y] as const,
  );

  for (let index = 1; index < normalized.length - 1; index += 1) {
    const [x0, y0] = normalized[0];
    const [x1, y1] = normalized[index];
    const [x2, y2] = normalized[index + 1];
    vertices.push(x0, y0, 0, x1, y1, 0, x2, y2, 0);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function parsePilotiId(pilotiId: string): { col: number; row: number } | null {
  const match = pilotiId.match(/piloti_(\d+)_(\d+)/);
  if (!match) return null;
  return {
    col: parseInt(match[1], 10),
    row: parseInt(match[2], 10),
  };
}

export function getPilotiTopXZ(col: number, row: number): [number, number] {
  const x = (1.5 - col) * PILOTI_STEP_X;
  const z = (1 - row) * PILOTI_STEP_Z;
  return [x, z];
}

export function getTerrainYByUV(pilotis: Record<string, HousePiloti>, u: number, v: number): number {
  const clampedU = MathUtils.clamp(u, 0, 1);
  const clampedV = MathUtils.clamp(v, 0, 1);
  const {a1, a4, c1, c4} = getCornerNiveis(pilotis);
  const nivel = bilinear(a1, a4, c1, c4, clampedU, clampedV);
  return PILOTI_TOP_Y - nivel * PILOTI_BASE_HEIGHT_PX;
}

export function resolvePilotiTerrainY(params: {
  pilotis: Record<string, HousePiloti>;
  col: number;
  row: number;
  hideBelowTerrain: boolean;
}): number {
  const centerU = params.col / 3;
  const centerV = params.row / 2;
  const centerY = getTerrainYByUV(params.pilotis, centerU, centerV);
  if (!params.hideBelowTerrain) return centerY;

  // Em terreno íngreme, cortar pelo nível do centro do piloti remove mais do que o necessário.
  // Amostramos múltiplos anéis ao redor do raio para reduzir sobrecorte visual.
  const du = PILOTI_RADIUS / (PILOTI_STEP_X * 3);
  const dv = PILOTI_RADIUS / (PILOTI_STEP_Z * 2);
  let minY = Number.POSITIVE_INFINITY;
  const ringScales = [0, 0.5, 1];
  const ringSamples = 32;

  ringScales.forEach((scale) => {
    if (scale === 0) {
      const y = getTerrainYByUV(params.pilotis, centerU, centerV);
      if (y < minY) minY = y;
      return;
    }

    for (let index = 0; index < ringSamples; index += 1) {
      const angle = (index / ringSamples) * Math.PI * 2;
      const offsetU = Math.cos(angle) * du * scale;
      const offsetV = Math.sin(angle) * dv * scale;
      const y = getTerrainYByUV(params.pilotis, centerU + offsetU, centerV + offsetV);
      if (y < minY) minY = y;
    }
  });

  return Number.isFinite(minY) ? minY : centerY;
}

export function createTerrainVolumeGeometry(
  topGeometry: PlaneGeometry,
  segments: number,
  thickness = TERRAIN_THICKNESS,
): BufferGeometry {
  const topPositions = topGeometry.attributes.position as BufferAttribute;
  const topIndex = topGeometry.index;
  const topVertexCount = topPositions.count;

  const positions: number[] = [];
  const indices: number[] = [];

  for (let index = 0; index < topVertexCount; index += 1) {
    positions.push(topPositions.getX(index), topPositions.getY(index), topPositions.getZ(index));
  }
  for (let index = 0; index < topVertexCount; index += 1) {
    positions.push(topPositions.getX(index), topPositions.getY(index), topPositions.getZ(index) - thickness);
  }

  const topIndices = topIndex ? Array.from(topIndex.array as Iterable<number>) : [];
  for (let index = 0; index < topIndices.length; index += 3) {
    const a = topIndices[index];
    const b = topIndices[index + 1];
    const c = topIndices[index + 2];
    indices.push(a, b, c);
    indices.push(c + topVertexCount, b + topVertexCount, a + topVertexCount);
  }

  const rowStride = segments + 1;
  const edgeLoop: number[] = [];
  for (let ix = 0; ix <= segments; ix += 1) edgeLoop.push(ix);
  for (let iy = 1; iy <= segments; iy += 1) edgeLoop.push(iy * rowStride + segments);
  for (let ix = segments - 1; ix >= 0; ix -= 1) edgeLoop.push(segments * rowStride + ix);
  for (let iy = segments - 1; iy >= 1; iy -= 1) edgeLoop.push(iy * rowStride);

  for (let index = 0; index < edgeLoop.length; index += 1) {
    const aTop = edgeLoop[index];
    const bTop = edgeLoop[(index + 1) % edgeLoop.length];
    const aBottom = aTop + topVertexCount;
    const bBottom = bTop + topVertexCount;

    indices.push(aTop, bTop, aBottom);
    indices.push(bTop, bBottom, aBottom);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Calcula posicionamento e dimensões 3D para encaixar a escada na face correta.
 */
export function computeStairs3DPlacement(stairs: Stairs3DData) {
  const stairHeight = stairs.stairHeightMts * 100 * HOUSE_3D_FINAL_SCALE;
  if (!Number.isFinite(stairHeight) || stairHeight <= 0) return null;

  const totalHeight3D = stairs.stairHeightMts * PILOTI_BASE_HEIGHT_PX;
  const topY = WALL_BASE_Y - FLOOR_BEAM_HEIGHT;
  const bottomY = topY - totalHeight3D;

  let position: { x: number; y: number; z: number } = {x: 0, y: 0, z: 0};
  let rotationY = 0;

  const halfWidth = HOUSE_3D_WIDTH / 2;
  const halfDepth = HOUSE_3D_DEPTH / 2;
  const faceOffset = PANEL_OFFSET_RATIO + STAIR_FACE_GAP;
  const centerFromLeft = stairs.centerFromLeft * HOUSE_3D_VIEWER_SCALE;

  switch (stairs.face) {
    case 'front':
      position = {
        x: centerFromLeft - halfWidth,
        y: WALL_BASE_Y - FLOOR_BEAM_HEIGHT - stairHeight,
        z: halfDepth + faceOffset,
      };
      rotationY = 0;
      break;

    case 'back':
      position = {
        x: halfWidth - centerFromLeft,
        y: WALL_BASE_Y - FLOOR_BEAM_HEIGHT - stairHeight,
        z: -halfDepth - faceOffset,
      };
      rotationY = Math.PI;
      break;

    case 'left':
      position = {
        x: -halfWidth - faceOffset,
        y: WALL_BASE_Y - FLOOR_BEAM_HEIGHT - stairHeight,
        z: centerFromLeft - halfDepth,
      };
      rotationY = -Math.PI / 2;
      break;

    case 'right':
      position = {
        x: halfWidth + faceOffset,
        y: WALL_BASE_Y - FLOOR_BEAM_HEIGHT - stairHeight,
        z: -(centerFromLeft - halfDepth),
      };
      rotationY = Math.PI / 2;
      break;
  }

  return {
    position,
    rotationY,
    totalDepth3D: totalHeight3D,
    totalHeight3D,
    topY,
    bottomY,
  };
}

function bilinear(a1: number, a4: number, c1: number, c4: number, u: number, v: number): number {
  return (1 - u) * (1 - v) * a1 + u * (1 - v) * a4 + (1 - u) * v * c1 + u * v * c4;
}

function getCornerNiveis(pilotis: Record<string, HousePiloti>) {
  const a1 = pilotis[PILOTI_CORNER_ID.topLeft]?.nivel ?? DEFAULT_HOUSE_PILOTI.nivel;
  const a4 = pilotis[PILOTI_CORNER_ID.topRight]?.nivel ?? DEFAULT_HOUSE_PILOTI.nivel;
  const c1 = pilotis[PILOTI_CORNER_ID.bottomLeft]?.nivel ?? DEFAULT_HOUSE_PILOTI.nivel;
  const c4 = pilotis[PILOTI_CORNER_ID.bottomRight]?.nivel ?? DEFAULT_HOUSE_PILOTI.nivel;
  return {a1, a4, c1, c4};
}
