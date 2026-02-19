import {useMemo} from 'react';
import * as THREE from 'three';
import {HouseElement, HouseType, PilotiData} from '@/lib/house-manager';
import {BASE_PILOTI_HEIGHT_PX, BASE_TOP_HEIGHT, BASE_TOP_WIDTH, MASTER_PILOTI_FILL,} from '@/lib/canvas-utils';

interface House3DSceneProps {
  houseType: HouseType;
  pilotis: Record<string, PilotiData>;
  elements?: HouseElement[];
  contraventamentos?: Contraventamento3DData[];
  wallColor?: string;
  tipo6FrontSide?: 'top' | 'bottom' | null;
  tipo3OpenSide?: 'left' | 'right' | null;
}

export type Contraventamento3DSide = 'left' | 'right';

export interface Contraventamento3DData {
  id: string;
  col: number;
  startRow: number;
  endRow: number;
  side: Contraventamento3DSide;
  anchorPilotiId: string;
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
const CONTRAV_TOP_WIDTH = 5 * U;
const CONTRAV_SQUARE_WIDTH = 10 * U;
const CONTRAV_OFFSET_M = 0.2;

const FLOOR_BEAM_HEIGHT = 20 * U;
const FLOOR_BEAM_STRIP_DEPTH = 10 * U;
const FLOOR_HEIGHT = 10 * U;
const BODY_PROFILE_HEIGHT = 273 * U;
const WALL_HEIGHT = 213 * U;
const DIAG_W = 244 * U;
const DIAG_H2 = 261 * U;
const CHAPEL_W = 122 * U;
const ROOF_RISE = BODY_PROFILE_HEIGHT - WALL_HEIGHT;
const ROOF_SHORT_SIDE_OVERHANG = 10 * U; // 10 cm on the 3 m side
const ROOF_LONG_SIDE_OVERHANG = 10 * U; // 10 cm on the square-panel side
const ROOF_WAVE_AMPLITUDE = 1.8 * U;
const ROOF_WAVE_PITCH = 28 * U;
const ROOF_WAVE_SEGMENTS_X = 10;
const ROOF_WAVE_SEGMENTS_Z = 28;

const WALL_BASE_Y = PILOTI_TOP_Y + FLOOR_BEAM_HEIGHT + FLOOR_HEIGHT;
const ROOF_BASE_Y = WALL_BASE_Y + WALL_HEIGHT;
const ROOF_TOP_Y = ROOF_BASE_Y + ROOF_RISE;

const WALL_THICKNESS = 2 * U;
const FRONT_BACK_PANEL_OFFSET = WALL_THICKNESS * 0.65;
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

const FLOOR_BEAM_ROWS_Z = [
  HOUSE_DEPTH / 2 - FLOOR_BEAM_STRIP_DEPTH / 2, // A: flush with floor edge
  0, // B: centered
  -HOUSE_DEPTH / 2 + FLOOR_BEAM_STRIP_DEPTH / 2, // C: flush with floor edge
];

const COLORS = {
  roof: '#a8b8c4',
  piloti: '#d8d8d8',
  terrain: '#7da86d',
  floor: '#f7f7f7',
  beam: '#ececec',
  frame: '#bdbdbd',
};

function offsetLightness(hex: string, lightnessOffset: number): string {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, lightnessOffset);
  return `#${c.getHexString()}`;
}

function createFrontBackPanelGeometry(points: Array<[number, number]>): THREE.BufferGeometry {
  const vertices: number[] = [];
  const normalized = points.map(([x, y]) => [x - HOUSE_WIDTH / 2, BODY_PROFILE_HEIGHT - y] as const);

  for (let i = 1; i < normalized.length - 1; i++) {
    const [x0, y0] = normalized[0];
    const [x1, y1] = normalized[i];
    const [x2, y2] = normalized[i + 1];
    vertices.push(x0, y0, 0, x1, y1, 0, x2, y2, 0);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
  geo.computeVertexNormals();
  return geo;
}

function buildOpeningsFromCanvasModel(
  houseType: HouseType,
  rawElements: HouseElement[],
  tipo6FrontSide?: 'top' | 'bottom' | null,
  tipo3OpenSide?: 'left' | 'right' | null,
): SceneOpening[] {
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
    // When "frontal" is placed at the bottom side in 2D, swap front/back faces in 3D.
    const frontFace: SceneOpening['face'] = tipo6FrontSide === 'bottom' ? 'back' : 'front';
    const backFace: SceneOpening['face'] = frontFace === 'front' ? 'back' : 'front';
    openings.push(
      {
        id: 'canvas-front-window-left',
        type: 'window',
        face: frontFace,
        x: fbFrontWindowLeftX,
        y: fbWindowY,
        width: fbWindowW,
        height: fbWindowH,
      },
      {
        id: 'canvas-front-window-right',
        type: 'window',
        face: frontFace,
        x: fbFrontWindowRightX,
        y: fbWindowY,
        width: fbWindowW,
        height: fbWindowH,
      },
      {
        id: 'canvas-front-door',
        type: 'door',
        face: frontFace,
        x: fbFrontDoorX,
        y: fbWindowY,
        width: fbDoorW,
        height: fbDoorH,
      },
      {
        id: 'canvas-back-window',
        type: 'window',
        face: backFace,
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
  const inferredOpenSide: 'left' | 'right' = hasLeftDoor ? 'left' : hasRightDoor ? 'right' : 'right';
  const openSide: 'left' | 'right' = tipo3OpenSide === 'left' || tipo3OpenSide === 'right'
    ? tipo3OpenSide
    : inferredOpenSide;

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

function ContraventamentoMesh({
  contraventamento,
  pilotis,
}: {
  contraventamento: Contraventamento3DData;
  pilotis: Record<string, PilotiData>;
}) {
  const { col, startRow, endRow, side, anchorPilotiId } = contraventamento;
  if (!Number.isInteger(col) || col < 0 || col > 3) return null;
  if (!Number.isInteger(startRow) || !Number.isInteger(endRow)) return null;

  const anchorGrid = parsePilotiId(anchorPilotiId);
  const anchorCol = anchorGrid?.col;
  const anchorRow = anchorGrid?.row;
  const originCol = Number.isInteger(anchorCol) ? anchorCol : col;
  const originRow = Number.isInteger(anchorRow) ? anchorRow : startRow;
  const originPilotiId = anchorGrid ? anchorPilotiId : `piloti_${originCol}_${originRow}`;
  const targetRow = originRow === startRow ? endRow : startRow;
  if (originCol < 0 || originCol > 3) return null;
  if (originRow < 0 || originRow > 2 || targetRow < 0 || targetRow > 2 || originRow === targetRow) return null;

  const [colCenterX] = getPilotiTopXZ(originCol, originRow);
  const [, originZ] = getPilotiTopXZ(originCol, originRow);
  const [, targetZ] = getPilotiTopXZ(originCol, targetRow);

  // 3D scene X axis is mirrored relative to top-view local X used in 2D.
  // Keep right/left matching the 2D side semantics.
  const sideSign = side === 'right' ? -1 : 1;
  const tangentX = colCenterX + sideSign * PILOTI_RADIUS;
  // Same 2D rule: opposite beam edge touches piloti tangent.
  const beamCenterX = tangentX + sideSign * (CONTRAV_TOP_WIDTH / 2);

  const originNivel = Number(pilotis[originPilotiId]?.nivel ?? DEFAULT_PILOTI.nivel);
  const originY = PILOTI_TOP_Y - (originNivel - CONTRAV_OFFSET_M) * BASE_PILOTI_HEIGHT;
  const destinationY = PILOTI_TOP_Y - CONTRAV_OFFSET_M * BASE_PILOTI_HEIGHT;
  if (originY > destinationY) return null;

  const startPoint = new THREE.Vector3(beamCenterX, originY, originZ);
  const endPoint = new THREE.Vector3(beamCenterX, destinationY, targetZ);
  const direction = endPoint.clone().sub(startPoint);
  const length = direction.length();
  if (!Number.isFinite(length) || length <= 0.01) return null;

  direction.normalize();
  const orientation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  const midpoint = startPoint.add(endPoint).multiplyScalar(0.5);
  const beamColor = COLORS.piloti;

  return (
    <mesh
      position={[midpoint.x, midpoint.y, midpoint.z]}
      quaternion={[orientation.x, orientation.y, orientation.z, orientation.w]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[CONTRAV_TOP_WIDTH, length, CONTRAV_SQUARE_WIDTH]} />
      <meshStandardMaterial color={beamColor} roughness={0.65} />
    </mesh>
  );
}

function RoofMesh() {
  const geometry = useMemo(() => {
    const hw = HOUSE_WIDTH / 2;
    const hwRoof = hw + ROOF_LONG_SIDE_OVERHANG;
    const hdRoof = HOUSE_DEPTH / 2 + ROOF_SHORT_SIDE_OVERHANG;
    const rise = ROOF_TOP_Y - ROOF_BASE_Y;

    const positions: number[] = [];
    const indices: number[] = [];
    const rowStride = ROOF_WAVE_SEGMENTS_Z + 1;

    const appendSheet = (side: -1 | 1) => {
      const baseIndex = positions.length / 3;

      for (let ix = 0; ix <= ROOF_WAVE_SEGMENTS_X; ix++) {
        const t = ix / ROOF_WAVE_SEGMENTS_X;
        const x = side === -1 ? -hwRoof + hwRoof * t : hwRoof - hwRoof * t;
        const yBase = ROOF_BASE_Y + rise * t;

        for (let iz = 0; iz <= ROOF_WAVE_SEGMENTS_Z; iz++) {
          const s = iz / ROOF_WAVE_SEGMENTS_Z;
          const z = -hdRoof + 2 * hdRoof * s;
          const wave = Math.sin((z / ROOF_WAVE_PITCH) * Math.PI * 2) * ROOF_WAVE_AMPLITUDE;

          positions.push(x, yBase + wave, z);
        }
      }

      for (let ix = 0; ix < ROOF_WAVE_SEGMENTS_X; ix++) {
        for (let iz = 0; iz < ROOF_WAVE_SEGMENTS_Z; iz++) {
          const a = baseIndex + ix * rowStride + iz;
          const b = a + 1;
          const c = a + rowStride;
          const d = c + 1;
          indices.push(a, b, c, b, d, c);
        }
      }
    };

    appendSheet(-1);
    appendSheet(1);

    const roofGeometry = new THREE.BufferGeometry();
    roofGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    roofGeometry.setIndex(indices);
    roofGeometry.computeVertexNormals();
    return roofGeometry;
  }, []);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={COLORS.roof} roughness={0.9} metalness={0.04} side={THREE.DoubleSide} />
    </mesh>
  );
}

function FrontBackPanels({ wallColor }: { wallColor: string }) {
  const panelOffset = FRONT_BACK_PANEL_OFFSET;
  const sidePanelColor = offsetLightness(wallColor, 0.04);

  const leftDiagGeo = useMemo(
    () =>
      createFrontBackPanelGeometry([
        [0, BODY_PROFILE_HEIGHT - WALL_HEIGHT],
        [DIAG_W, BODY_PROFILE_HEIGHT - DIAG_H2],
        [DIAG_W, BODY_PROFILE_HEIGHT],
        [0, BODY_PROFILE_HEIGHT],
      ]),
    [],
  );

  const chapelGeo = useMemo(
    () =>
      createFrontBackPanelGeometry([
        [DIAG_W, BODY_PROFILE_HEIGHT - DIAG_H2],
        [DIAG_W + CHAPEL_W / 2, 0],
        [DIAG_W + CHAPEL_W, BODY_PROFILE_HEIGHT - DIAG_H2],
        [DIAG_W + CHAPEL_W, BODY_PROFILE_HEIGHT],
        [DIAG_W, BODY_PROFILE_HEIGHT],
      ]),
    [],
  );

  const rightDiagGeo = useMemo(
    () =>
      createFrontBackPanelGeometry([
        [DIAG_W + CHAPEL_W, BODY_PROFILE_HEIGHT - DIAG_H2],
        [HOUSE_WIDTH, BODY_PROFILE_HEIGHT - WALL_HEIGHT],
        [HOUSE_WIDTH, BODY_PROFILE_HEIGHT],
        [DIAG_W + CHAPEL_W, BODY_PROFILE_HEIGHT],
      ]),
    [],
  );

  return (
    <>
      <group position={[0, WALL_BASE_Y, HOUSE_DEPTH / 2 + panelOffset]}>
        <mesh geometry={leftDiagGeo} castShadow receiveShadow>
          <meshStandardMaterial color={sidePanelColor} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={chapelGeo} castShadow receiveShadow>
          <meshStandardMaterial color={sidePanelColor} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={rightDiagGeo} castShadow receiveShadow>
          <meshStandardMaterial color={sidePanelColor} side={THREE.DoubleSide} />
        </mesh>
      </group>

      <group position={[0, WALL_BASE_Y, -HOUSE_DEPTH / 2 - panelOffset]} rotation={[0, Math.PI, 0]}>
        <mesh geometry={leftDiagGeo} castShadow receiveShadow>
          <meshStandardMaterial color={sidePanelColor} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={chapelGeo} castShadow receiveShadow>
          <meshStandardMaterial color={sidePanelColor} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={rightDiagGeo} castShadow receiveShadow>
          <meshStandardMaterial color={sidePanelColor} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </>
  );
}

function HouseShell({ wallColor }: { wallColor: string }) {
  const wallCenterY = WALL_BASE_Y + WALL_HEIGHT / 2;

  return (
    <group>
      {FLOOR_BEAM_ROWS_Z.map((z) => (
        <mesh key={`floor-beam-${z}`} position={[0, PILOTI_TOP_Y + FLOOR_BEAM_HEIGHT / 2, z]} castShadow receiveShadow>
          <boxGeometry args={[HOUSE_WIDTH, FLOOR_BEAM_HEIGHT, FLOOR_BEAM_STRIP_DEPTH]} />
          <meshStandardMaterial color={COLORS.beam} />
        </mesh>
      ))}

      <mesh position={[0, PILOTI_TOP_Y + FLOOR_BEAM_HEIGHT + FLOOR_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[HOUSE_WIDTH, FLOOR_HEIGHT, HOUSE_DEPTH]} />
        <meshStandardMaterial color={COLORS.floor} />
      </mesh>

      <mesh position={[-HOUSE_WIDTH / 2 + WALL_THICKNESS / 2, wallCenterY, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, HOUSE_DEPTH]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      <mesh position={[HOUSE_WIDTH / 2 - WALL_THICKNESS / 2, wallCenterY, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, HOUSE_DEPTH]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      <FrontBackPanels wallColor={wallColor} />

      <RoofMesh />
    </group>
  );
}

function HouseElementMesh({ element }: { element: HouseElement }) {
  const elementWidth = Math.max(element.width * VIEWER_MODEL_SCALE, 1);
  const elementHeight = Math.max(element.height * VIEWER_MODEL_SCALE, 1);
  const elementDepth = 2;
  const frameDepth = elementDepth * 0.2;
  const fillDepth = elementDepth * 0.26;
  const fillOffset = frameDepth / 2 + fillDepth / 2 + 0.03;
  const frontBackGap = 0.08;

  const xOffset = element.x * VIEWER_MODEL_SCALE;
  const yOffset = element.y * VIEWER_MODEL_SCALE;

  const hw = HOUSE_WIDTH / 2;
  const hd = HOUSE_DEPTH / 2;
  const faceProfileHeight = element.face === 'left' || element.face === 'right' ? WALL_HEIGHT : BODY_PROFILE_HEIGHT;
  const y = WALL_BASE_Y + faceProfileHeight - yOffset - elementHeight / 2;

  let position: [number, number, number] = [0, 0, 0];
  let rotation: [number, number, number] = [0, 0, 0];

  switch (element.face) {
    case 'front':
      position = [xOffset - hw + elementWidth / 2, y, hd + FRONT_BACK_PANEL_OFFSET + elementDepth / 2 + frontBackGap];
      break;
    case 'back':
      position = [hw - xOffset - elementWidth / 2, y, -hd - FRONT_BACK_PANEL_OFFSET - elementDepth / 2 - frontBackGap];
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

  const fillColor = COLORS.piloti;

  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[elementWidth + 1.4, elementHeight + 1.4, frameDepth]} />
        <meshBasicMaterial color={COLORS.frame} />
      </mesh>
      <mesh position={[0, 0, fillOffset]}>
        <boxGeometry args={[elementWidth, elementHeight, fillDepth]} />
        <meshBasicMaterial color={fillColor} />
      </mesh>
    </group>
  );
}

export function House3DScene({
  houseType,
  pilotis,
  elements = [],
  contraventamentos = [],
  wallColor = '#d4d4d4',
  tipo6FrontSide = null,
  tipo3OpenSide = null,
}: House3DSceneProps) {
  const sceneOpenings = useMemo(
    () => buildOpeningsFromCanvasModel(houseType, elements, tipo6FrontSide, tipo3OpenSide),
    [houseType, elements, tipo6FrontSide, tipo3OpenSide],
  );
  if (!houseType) return null;

  return (
    <group>
      <TerrainMesh pilotis={pilotis} />

      {ALL_PILOTI_IDS.map((pilotiId) => (
        <PilotiMesh key={pilotiId} pilotiId={pilotiId} pilotis={pilotis} />
      ))}

      {contraventamentos.map((contraventamento) => (
        <ContraventamentoMesh key={contraventamento.id} contraventamento={contraventamento} pilotis={pilotis} />
      ))}

      <HouseShell wallColor={wallColor} />

      {sceneOpenings.map((element) => (
        <HouseElementMesh key={element.id} element={element} />
      ))}
    </group>
  );
}
