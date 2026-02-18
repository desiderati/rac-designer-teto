import { useMemo } from 'react';
import * as THREE from 'three';
import { HouseElement, HouseType, PilotiData } from '@/lib/house-manager';
import { BASE_PILOTI_HEIGHT_PX, BASE_TOP_HEIGHT, BASE_TOP_WIDTH, MASTER_PILOTI_FILL } from '@/lib/canvas-utils';

interface House3DSceneProps {
  houseType: HouseType;
  pilotis: Record<string, PilotiData>;
  elements?: HouseElement[];
  wallColor?: string;
}

interface SceneOpening {
  id: string;
  type: 'window' | 'door';
  face: 'front' | 'back' | 'left' | 'right';
  x: number;
  y: number;
  width: number;
  height: number;
}

const TOP_VIEW_SCALE = 0.6; // Same scale used by createHouseTop
const VIEWER_MODEL_SCALE = 0.5;
const U = TOP_VIEW_SCALE * VIEWER_MODEL_SCALE;

const HOUSE_WIDTH = BASE_TOP_WIDTH * U;
const HOUSE_DEPTH = BASE_TOP_HEIGHT * U;

const PILOTI_STEP_X = 155 * U;
const PILOTI_STEP_Z = 135 * U;
const PILOTI_RADIUS = 15 * U;
const BASE_PILOTI_HEIGHT = BASE_PILOTI_HEIGHT_PX * U;
const PILOTI_TOP_Y = BASE_PILOTI_HEIGHT;

const FLOOR_BEAM_HEIGHT = 20 * U;
const BODY_PROFILE_HEIGHT = 273 * U;
const WALL_HEIGHT = 213 * U;
const ROOF_RISE = BODY_PROFILE_HEIGHT - WALL_HEIGHT;

const WALL_BASE_Y = PILOTI_TOP_Y + FLOOR_BEAM_HEIGHT;
const ROOF_BASE_Y = WALL_BASE_Y + WALL_HEIGHT;
const ROOF_TOP_Y = ROOF_BASE_Y + ROOF_RISE;

const WALL_THICKNESS = 2 * U;
const TERRAIN_MARGIN = 90 * U;
const TERRAIN_SEGMENTS = 28;

const DEFAULT_PILOTI: PilotiData = {
  height: 1.0,
  isMaster: false,
  nivel: 0.2,
};

const ALL_PILOTI_IDS = Array.from({ length: 3 * 4 }, (_, index) => {
  const col = index % 4;
  const row = Math.floor(index / 4);
  return `piloti_${col}_${row}`;
});

const COLORS = {
  roof: '#a8b8c4',
  piloti: '#f4f4f4',
  terrain: '#7da86d',
  beam: '#f2f2f2',
  door: '#f5efe2',
  window: '#eef6ff',
  frame: '#666666',
};

function buildOpeningsFromCanvasModel(houseType: HouseType, rawElements: HouseElement[]): SceneOpening[] {
  if (!houseType) return [];

  const s = TOP_VIEW_SCALE;
  const bodyW = BASE_TOP_WIDTH * s;
  const bodyH = 273 * s;
  const sideW = BASE_TOP_HEIGHT * s;
  const sideWallH = 213 * s;

  const fbDoorW = 80 * s;
  const fbDoorH = 191 * s;
  const fbWindowW = 80 * s;
  const fbWindowH = 70 * s;
  const fbDoorShiftX = 30 * s;
  const fbWindowShiftX = 30 * s;
  const fbWindowY = bodyH - fbDoorH;
  const fbBackWindowX = 95 * s;

  const fbFrontDoorX = bodyW - fbWindowW - fbWindowShiftX - fbDoorW - fbDoorShiftX;
  const fbFrontWindowRightX = bodyW - fbWindowW - fbWindowShiftX;
  const fbFrontWindowLeftX = 95 * s;

  const sideDoorW = 80 * s;
  const sideDoorH = 191 * s;
  const sideWindowW = 80 * s;
  const sideWindowH = 70 * s;
  const sideDoorShiftX = 45 * s;
  const sideWindowShiftX = 45 * s;
  const sideDoorX = sideW - sideDoorW - sideDoorShiftX;
  const sideWindowX = sideW - sideDoorW - sideDoorShiftX - sideWindowW - sideWindowShiftX;
  const sideOpeningY = sideWallH - sideDoorH;

  const openings: SceneOpening[] = [];

  if (houseType === 'tipo6') {
    openings.push(
      {
        id: 'canvas-front-window-left',
        type: 'window',
        face: 'front',
        x: fbFrontWindowLeftX,
        y: fbWindowY,
        width: fbWindowW,
        height: fbWindowH,
      },
      {
        id: 'canvas-front-window-right',
        type: 'window',
        face: 'front',
        x: fbFrontWindowRightX,
        y: fbWindowY,
        width: fbWindowW,
        height: fbWindowH,
      },
      {
        id: 'canvas-front-door',
        type: 'door',
        face: 'front',
        x: fbFrontDoorX,
        y: fbWindowY,
        width: fbDoorW,
        height: fbDoorH,
      },
      {
        id: 'canvas-back-window',
        type: 'window',
        face: 'back',
        x: fbBackWindowX,
        y: fbWindowY,
        width: fbWindowW,
        height: fbWindowH,
      },
    );
    return openings;
  }

  const hasLeftDoor = rawElements.some((e) => e.type === 'door' && e.face === 'left');
  const hasRightDoor = rawElements.some((e) => e.type === 'door' && e.face === 'right');
  const openSide: 'left' | 'right' = hasLeftDoor ? 'left' : hasRightDoor ? 'right' : 'right';

  openings.push(
    {
      id: 'canvas-tipo3-front-window',
      type: 'window',
      face: 'front',
      x: fbBackWindowX,
      y: fbWindowY,
      width: fbWindowW,
      height: fbWindowH,
    },
    {
      id: 'canvas-tipo3-back-window',
      type: 'window',
      face: 'back',
      x: fbBackWindowX,
      y: fbWindowY,
      width: fbWindowW,
      height: fbWindowH,
    },
    {
      id: `canvas-tipo3-${openSide}-window`,
      type: 'window',
      face: openSide,
      x: sideWindowX,
      y: sideOpeningY,
      width: sideWindowW,
      height: sideWindowH,
    },
    {
      id: `canvas-tipo3-${openSide}-door`,
      type: 'door',
      face: openSide,
      x: sideDoorX,
      y: sideOpeningY,
      width: sideDoorW,
      height: sideDoorH,
    },
  );

  return openings;
}

function parsePilotiId(pilotiId: string): { col: number; row: number } | null {
  const match = pilotiId.match(/piloti_(\d+)_(\d+)/);
  if (!match) return null;
  return {
    col: parseInt(match[1], 10),
    row: parseInt(match[2], 10),
  };
}

function bilinear(a1: number, a4: number, c1: number, c4: number, u: number, v: number): number {
  return (1 - u) * (1 - v) * a1 + u * (1 - v) * a4 + (1 - u) * v * c1 + u * v * c4;
}

function getCornerNiveis(pilotis: Record<string, PilotiData>) {
  const a1 = pilotis.piloti_0_0?.nivel ?? DEFAULT_PILOTI.nivel;
  const a4 = pilotis.piloti_3_0?.nivel ?? DEFAULT_PILOTI.nivel;
  const c1 = pilotis.piloti_0_2?.nivel ?? DEFAULT_PILOTI.nivel;
  const c4 = pilotis.piloti_3_2?.nivel ?? DEFAULT_PILOTI.nivel;
  return { a1, a4, c1, c4 };
}

function getTerrainYByUV(pilotis: Record<string, PilotiData>, u: number, v: number): number {
  const clampedU = THREE.MathUtils.clamp(u, 0, 1);
  const clampedV = THREE.MathUtils.clamp(v, 0, 1);
  const { a1, a4, c1, c4 } = getCornerNiveis(pilotis);
  const nivel = bilinear(a1, a4, c1, c4, clampedU, clampedV);
  return PILOTI_TOP_Y - nivel * BASE_PILOTI_HEIGHT;
}

function getPilotiTopXZ(col: number, row: number): [number, number] {
  const x = (1.5 - col) * PILOTI_STEP_X;
  const z = (1 - row) * PILOTI_STEP_Z;
  return [x, z];
}

function TerrainMesh({ pilotis }: { pilotis: Record<string, PilotiData> }) {
  const geometry = useMemo(() => {
    const width = HOUSE_WIDTH + TERRAIN_MARGIN * 2;
    const depth = HOUSE_DEPTH + TERRAIN_MARGIN * 2;
    const geo = new THREE.PlaneGeometry(width, depth, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS);
    const positions = geo.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const u = 1 - (x + HOUSE_WIDTH / 2) / HOUSE_WIDTH;
      const v = (y + HOUSE_DEPTH / 2) / HOUSE_DEPTH;
      positions.setZ(i, getTerrainYByUV(pilotis, u, v));
    }

    positions.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, [pilotis]);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial color={COLORS.terrain} roughness={0.95} metalness={0} side={THREE.DoubleSide} />
    </mesh>
  );
}

function PilotiMesh({ pilotiId, pilotis }: { pilotiId: string; pilotis: Record<string, PilotiData> }) {
  const grid = parsePilotiId(pilotiId);
  if (!grid) return null;

  const data = pilotis[pilotiId] ?? DEFAULT_PILOTI;
  const [x, z] = getPilotiTopXZ(grid.col, grid.row);
  const terrainY = getTerrainYByUV(pilotis, 1 - grid.col / 3, grid.row / 2);

  const nominalHeight = (data.height ?? DEFAULT_PILOTI.height) * BASE_PILOTI_HEIGHT;
  const minHeightToTouchTerrain = Math.max(PILOTI_TOP_Y - terrainY, 0);
  const finalHeight = Math.max(nominalHeight, minHeightToTouchTerrain, 0.5);
  const centerY = PILOTI_TOP_Y - finalHeight / 2;

  return (
    <group position={[x, centerY, z]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[PILOTI_RADIUS, PILOTI_RADIUS, finalHeight, 16]} />
        <meshStandardMaterial color={data.isMaster ? MASTER_PILOTI_FILL : COLORS.piloti} roughness={0.65} />
      </mesh>
    </group>
  );
}

function RoofMesh() {
  const geometry = useMemo(() => {
    const hw = HOUSE_WIDTH / 2;
    const hd = HOUSE_DEPTH / 2;

    const vertices = new Float32Array([
      -hw,
      ROOF_BASE_Y,
      hd, // 0 left eave front
      -hw,
      ROOF_BASE_Y,
      -hd, // 1 left eave back
      0,
      ROOF_TOP_Y,
      -hd, // 2 ridge back
      0,
      ROOF_TOP_Y,
      hd, // 3 ridge front
      hw,
      ROOF_BASE_Y,
      hd, // 4 right eave front
      hw,
      ROOF_BASE_Y,
      -hd, // 5 right eave back
    ]);

    const indices = [
      0,
      1,
      2,
      0,
      2,
      3, // left roof sheet
      4,
      5,
      2,
      0,
      4,
      2, // right roof sheet
    ];

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={COLORS.roof} roughness={0.9} metalness={0.04} side={THREE.DoubleSide} />
    </mesh>
  );
}

function HouseShell({ wallColor }: { wallColor: string }) {
  const wallCenterY = WALL_BASE_Y + WALL_HEIGHT / 2;

  return (
    <group>
      <mesh position={[0, PILOTI_TOP_Y + FLOOR_BEAM_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[HOUSE_WIDTH, FLOOR_BEAM_HEIGHT, HOUSE_DEPTH]} />
        <meshStandardMaterial color={COLORS.beam} />
      </mesh>

      <mesh position={[0, wallCenterY, HOUSE_DEPTH / 2 - WALL_THICKNESS / 2]} castShadow receiveShadow>
        <boxGeometry args={[HOUSE_WIDTH, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      <mesh position={[0, wallCenterY, -HOUSE_DEPTH / 2 + WALL_THICKNESS / 2]} castShadow receiveShadow>
        <boxGeometry args={[HOUSE_WIDTH, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      <mesh position={[-HOUSE_WIDTH / 2 + WALL_THICKNESS / 2, wallCenterY, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, HOUSE_DEPTH]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      <mesh position={[HOUSE_WIDTH / 2 - WALL_THICKNESS / 2, wallCenterY, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, HOUSE_DEPTH]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      <RoofMesh />
    </group>
  );
}

function HouseElementMesh({ element }: { element: HouseElement }) {
  const elementWidth = Math.max(element.width * VIEWER_MODEL_SCALE, 1);
  const elementHeight = Math.max(element.height * VIEWER_MODEL_SCALE, 1);
  const elementDepth = 2;

  const xOffset = element.x * VIEWER_MODEL_SCALE;
  const yOffset = element.y * VIEWER_MODEL_SCALE;

  const hw = HOUSE_WIDTH / 2;
  const hd = HOUSE_DEPTH / 2;
  const y = WALL_BASE_Y + BODY_PROFILE_HEIGHT - yOffset - elementHeight / 2;

  let position: [number, number, number] = [0, 0, 0];
  let rotation: [number, number, number] = [0, 0, 0];

  switch (element.face) {
    case 'front':
      position = [xOffset - hw + elementWidth / 2, y, hd + elementDepth / 2];
      break;
    case 'back':
      position = [hw - xOffset - elementWidth / 2, y, -hd - elementDepth / 2];
      rotation = [0, Math.PI, 0];
      break;
    case 'left':
      position = [-hw - elementDepth / 2, y, xOffset - hd + elementWidth / 2];
      rotation = [0, Math.PI / 2, 0];
      break;
    case 'right':
      position = [hw + elementDepth / 2, y, -(xOffset - hd + elementWidth / 2)];
      rotation = [0, -Math.PI / 2, 0];
      break;
    default:
      return null;
  }

  const fillColor = element.type === 'door' ? COLORS.door : COLORS.window;

  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <boxGeometry args={[elementWidth + 1.4, elementHeight + 1.4, elementDepth * 0.6]} />
        <meshStandardMaterial color={COLORS.frame} />
      </mesh>
      <mesh position={[0, 0, elementDepth * 0.18]} castShadow>
        <boxGeometry args={[elementWidth, elementHeight, elementDepth * 0.35]} />
        <meshStandardMaterial color={fillColor} />
      </mesh>
    </group>
  );
}

export function House3DScene({ houseType, pilotis, elements = [], wallColor = '#d4d4d4' }: House3DSceneProps) {
  const sceneOpenings = useMemo(() => buildOpeningsFromCanvasModel(houseType, elements), [houseType, elements]);
  if (!houseType) return null;

  return (
    <group>
      <TerrainMesh pilotis={pilotis} />

      {ALL_PILOTI_IDS.map((pilotiId) => (
        <PilotiMesh key={pilotiId} pilotiId={pilotiId} pilotis={pilotis} />
      ))}

      <HouseShell wallColor={wallColor} />

      {sceneOpenings.map((element) => (
        <HouseElementMesh key={element.id} element={element} />
      ))}
    </group>
  );
}
