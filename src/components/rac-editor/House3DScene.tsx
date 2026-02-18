import { useMemo, useRef } from 'react';
import { Group } from 'three';
import { Cylinder, Line } from '@react-three/drei';
import * as THREE from 'three';
import { HouseType, PilotiData, HouseElement } from '@/lib/house-manager';

// ============================================
// DIMENSÕES BASE
// ============================================
const BASE_TOP_WIDTH = 610;
const BASE_TOP_HEIGHT = 300;
const BODY_HEIGHT = 220;
const ROOF_HEIGHT = 80;
const SCALE_2D = 0.6;
const MODEL_SCALE = 0.5;

const HOUSE_WIDTH = BASE_TOP_WIDTH * SCALE_2D * MODEL_SCALE;
const HOUSE_DEPTH = BASE_TOP_HEIGHT * SCALE_2D * MODEL_SCALE;
const HOUSE_HEIGHT = BODY_HEIGHT * SCALE_2D * MODEL_SCALE;
const ROOF_3D_HEIGHT = ROOF_HEIGHT * SCALE_2D * MODEL_SCALE;

// Pilotis
const COLUMN_DISTANCE = 155 * SCALE_2D * MODEL_SCALE;
const ROW_DISTANCE = 135 * SCALE_2D * MODEL_SCALE;
const PILOTI_RADIUS = 15 * SCALE_2D * MODEL_SCALE;
const PILOTI_BASE_HEIGHT = 60 * MODEL_SCALE;
const HOUSE_BASE_Y = PILOTI_BASE_HEIGHT;

// Terrain extension beyond house bounds
const TERRAIN_EXT = 50;
const TERRAIN_SUBDIVISIONS = 20;

// ============================================
// CORES
// ============================================
const COLORS = {
  roof: '#8B9DA8',
  pilotiNormal: '#d4d4d4',
  pilotiMaster: '#8B4513',
  edge: '#333333',
  terrain: '#8aad7a',
  elementWhite: '#ffffff',
  elementFrame: '#666666',
};

// ============================================
// INTERFACES
// ============================================
interface House3DSceneProps {
  houseType: HouseType;
  pilotis: Record<string, PilotiData>;
  elements?: HouseElement[];
  wallColor?: string;
}

// ============================================
// TERRAIN HELPERS
// ============================================

/**
 * Returns the Y position of the terrain at a given corner piloti.
 * terrainY = HOUSE_BASE_Y - pilotiHeight + nivel * PILOTI_BASE_HEIGHT
 */
function getCornerTerrainY(pilotis: Record<string, PilotiData>, col: number, row: number): number {
  const id = `piloti_${col}_${row}`;
  const data = pilotis[id] ?? { height: 1.0, nivel: 0.2, isMaster: false };
  const pilotiHeight = PILOTI_BASE_HEIGHT * data.height;
  const terrainOffset = data.nivel * PILOTI_BASE_HEIGHT;
  return HOUSE_BASE_Y - pilotiHeight + terrainOffset;
}

/**
 * Bilinear interpolation of terrain Y for any (col, row) in [0,3] x [0,2] grid.
 * u = col / 3  (0 = left, 1 = right)
 * v = row / 2  (0 = front, 1 = back)
 */
function interpolateTerrainY(
  pilotis: Record<string, PilotiData>,
  col: number,
  row: number
): number {
  const yA1 = getCornerTerrainY(pilotis, 0, 0); // front-left
  const yA4 = getCornerTerrainY(pilotis, 3, 0); // front-right
  const yC1 = getCornerTerrainY(pilotis, 0, 2); // back-left
  const yC4 = getCornerTerrainY(pilotis, 3, 2); // back-right

  const u = col / 3;
  const v = row / 2;

  return (
    (1 - u) * (1 - v) * yA1 +
    u * (1 - v) * yA4 +
    (1 - u) * v * yC1 +
    u * v * yC4
  );
}

// ============================================
// HELPERS PILOTIS
// ============================================
function getPilotiGridPosition(pilotiId: string): { col: number; row: number } | null {
  const match = pilotiId.match(/piloti_(\d+)_(\d+)/);
  if (!match) return null;
  return { col: parseInt(match[1]), row: parseInt(match[2]) };
}

function getPiloti3DPosition(col: number, row: number): [number, number, number] {
  const x = -(col - 1.5) * COLUMN_DISTANCE;
  const z = -(row - 1) * ROW_DISTANCE;
  return [x, 0, z];
}

// ============================================
// PILOTI 3D - base touches terrain, top at HOUSE_BASE_Y
// ============================================
function Piloti3D({
  pilotiId,
  data,
  terrainY,
}: {
  pilotiId: string;
  data: PilotiData;
  terrainY: number;
}) {
  const pos = getPilotiGridPosition(pilotiId);
  if (!pos) return null;

  const [x, , z] = getPiloti3DPosition(pos.col, pos.row);
  const color = data.isMaster ? COLORS.pilotiMaster : COLORS.pilotiNormal;

  // Top is always at HOUSE_BASE_Y; bottom sits on the interpolated terrain
  const visualHeight = Math.max(HOUSE_BASE_Y - terrainY, 0.5);
  const yCenter = terrainY + visualHeight / 2;

  return (
    <group position={[x, yCenter, z]}>
      <Cylinder args={[PILOTI_RADIUS, PILOTI_RADIUS, visualHeight, 16]} castShadow receiveShadow>
        <meshStandardMaterial color={color} />
      </Cylinder>
    </group>
  );
}

// ============================================
// TERRAIN — bilinear interpolation of 4 corners
// ============================================
function Terrain({ pilotis }: { pilotis: Record<string, PilotiData> }) {
  const yA1 = getCornerTerrainY(pilotis, 0, 0); // front-left
  const yA4 = getCornerTerrainY(pilotis, 3, 0); // front-right
  const yC1 = getCornerTerrainY(pilotis, 0, 2); // back-left
  const yC4 = getCornerTerrainY(pilotis, 3, 2); // back-right

  const geometry = useMemo(() => {
    const N = TERRAIN_SUBDIVISIONS;
    const totalWidth = HOUSE_WIDTH + 2 * TERRAIN_EXT;
    const totalDepth = HOUSE_DEPTH + 2 * TERRAIN_EXT;

    const geo = new THREE.PlaneGeometry(totalWidth, totalDepth, N - 1, N - 1);
    // PlaneGeometry is in XY plane; we'll rotate it, but manipulate Y (height) before rotation
    // After -Math.PI/2 rotation around X, Y becomes Z and Z becomes Y in world space.
    // So we must set the Z attribute of the PlaneGeometry to be the terrain height.
    const positions = geo.attributes.position as THREE.BufferAttribute;

    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const idx = j * N + i;
        // u: 0 (left) → 1 (right), v: 0 (front/+Z) → 1 (back/-Z)
        // PlaneGeometry: i=0 is left (x=-totalWidth/2), j=0 is top (y=+totalDepth/2 before rotation)
        const u = i / (N - 1);
        const v = j / (N - 1); // j=0 → front (+hd direction), j=N-1 → back

        const terrainHeight =
          (1 - u) * (1 - v) * yA1 +
          u * (1 - v) * yA4 +
          (1 - u) * v * yC1 +
          u * v * yC4;

        // In PlaneGeometry (before rotation), Z is the normal axis (height after rotation)
        positions.setZ(idx, terrainHeight);
      }
    }

    positions.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, [yA1, yA4, yC1, yC4]);

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <meshStandardMaterial
        color={COLORS.terrain}
        roughness={0.95}
        metalness={0}
        transparent
        opacity={0.85}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ============================================
// ELEMENTO (JANELA/PORTA) - always white
// ============================================
function HouseElement3D({ element }: { element: HouseElement }) {
  // Element coords are already in SCALE_2D space, only apply MODEL_SCALE
  const elementWidth = element.width * MODEL_SCALE;
  const elementHeight = element.height * MODEL_SCALE;
  const depth = 2;

  const xOffset = element.x * MODEL_SCALE;
  const yOffset = element.y * MODEL_SCALE;

  const hw = HOUSE_WIDTH / 2;
  const hd = HOUSE_DEPTH / 2;

  const yPos = HOUSE_BASE_Y + HOUSE_HEIGHT - yOffset - elementHeight / 2;

  let position: [number, number, number];
  let rotation: [number, number, number] = [0, 0, 0];

  switch (element.face) {
    case 'front':
      position = [hw - xOffset - elementWidth / 2, yPos, hd + depth / 2];
      break;
    case 'back':
      position = [xOffset - hw + elementWidth / 2, yPos, -hd - depth / 2];
      rotation = [0, Math.PI, 0];
      break;
    case 'left':
      position = [-hw - depth / 2, yPos, xOffset - hd + elementWidth / 2];
      rotation = [0, Math.PI / 2, 0];
      break;
    case 'right':
      position = [hw + depth / 2, yPos, -(xOffset - hd + elementWidth / 2)];
      rotation = [0, -Math.PI / 2, 0];
      break;
    default:
      position = [0, 0, 0];
  }

  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <boxGeometry args={[elementWidth, elementHeight, depth]} />
        <meshStandardMaterial color={COLORS.elementWhite} />
      </mesh>
      <mesh>
        <boxGeometry args={[elementWidth + 1.5, elementHeight + 1.5, depth * 0.5]} />
        <meshStandardMaterial color={COLORS.elementFrame} />
      </mesh>
    </group>
  );
}

// ============================================
// CORPO DA CASA - paredes individuais + arestas
// ============================================
function HouseBody({ houseType, wallColor }: { houseType: HouseType; wallColor: string }) {
  const hw = HOUSE_WIDTH / 2;
  const hd = HOUSE_DEPTH / 2;
  const BY = HOUSE_BASE_Y;
  const TOP = BY + HOUSE_HEIGHT;
  const cy = BY + HOUSE_HEIGHT / 2;

  const isOpenLeft = houseType === 'tipo3';

  const walls = useMemo(() => {
    const w: { pos: [number, number, number]; rot: [number, number, number]; width: number; height: number; key: string }[] = [
      { pos: [0, cy, hd], rot: [0, 0, 0], width: HOUSE_WIDTH, height: HOUSE_HEIGHT, key: 'front' },
      { pos: [0, cy, -hd], rot: [0, Math.PI, 0], width: HOUSE_WIDTH, height: HOUSE_HEIGHT, key: 'back' },
      { pos: [hw, cy, 0], rot: [0, Math.PI / 2, 0], width: HOUSE_DEPTH, height: HOUSE_HEIGHT, key: 'right' },
    ];
    if (!isOpenLeft) {
      w.push({ pos: [-hw, cy, 0], rot: [0, -Math.PI / 2, 0], width: HOUSE_DEPTH, height: HOUSE_HEIGHT, key: 'left' });
    }
    return w;
  }, [isOpenLeft, cy, hw, hd]);

  const edges = useMemo(() => {
    const e: [THREE.Vector3, THREE.Vector3][] = [];
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

    e.push([v(-hw, BY, hd), v(hw, BY, hd)]);
    e.push([v(-hw, TOP, hd), v(hw, TOP, hd)]);
    e.push([v(-hw, BY, hd), v(-hw, TOP, hd)]);
    e.push([v(hw, BY, hd), v(hw, TOP, hd)]);

    e.push([v(-hw, BY, -hd), v(hw, BY, -hd)]);
    e.push([v(-hw, TOP, -hd), v(hw, TOP, -hd)]);
    e.push([v(-hw, BY, -hd), v(-hw, TOP, -hd)]);
    e.push([v(hw, BY, -hd), v(hw, TOP, -hd)]);

    e.push([v(hw, BY, -hd), v(hw, BY, hd)]);

    if (!isOpenLeft) {
      e.push([v(-hw, BY, -hd), v(-hw, BY, hd)]);
    }

    return e;
  }, [isOpenLeft, hw, hd, BY, TOP]);

  return (
    <group>
      {walls.map((w) => (
        <mesh key={w.key} position={w.pos} rotation={w.rot}>
          <planeGeometry args={[w.width, w.height]} />
          <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <mesh position={[0, BY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[HOUSE_WIDTH, HOUSE_DEPTH]} />
        <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
      </mesh>
      {edges.map((pts, i) => (
        <Line key={i} points={pts} color={COLORS.edge} lineWidth={1} />
      ))}
    </group>
  );
}

// ============================================
// TELHADO
// ============================================
function Roof() {
  const width = HOUSE_WIDTH;
  const height = ROOF_3D_HEIGHT;
  const roofDepth = HOUSE_DEPTH;
  const roofBaseY = HOUSE_BASE_Y + HOUSE_HEIGHT;

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const halfWidth = width / 2;
    const halfDepth = roofDepth / 2;

    const vertices = new Float32Array([
      -halfWidth, 0, halfDepth,
      halfWidth, 0, halfDepth,
      0, height, halfDepth,

      -halfWidth, 0, -halfDepth,
      0, height, -halfDepth,
      halfWidth, 0, -halfDepth,

      -halfWidth, 0, halfDepth,
      0, height, halfDepth,
      0, height, -halfDepth,
      -halfWidth, 0, halfDepth,
      0, height, -halfDepth,
      -halfWidth, 0, -halfDepth,

      halfWidth, 0, halfDepth,
      0, height, -halfDepth,
      0, height, halfDepth,
      halfWidth, 0, halfDepth,
      halfWidth, 0, -halfDepth,
      0, height, -halfDepth,
    ]);

    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.computeVertexNormals();
    return geo;
  }, [width, height, roofDepth]);

  const edgePoints = useMemo(() => {
    const halfWidth = width / 2;
    const halfDepth = roofDepth / 2;
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

    return [
      [v(-halfWidth, 0, halfDepth), v(halfWidth, 0, halfDepth)],
      [v(halfWidth, 0, halfDepth), v(0, height, halfDepth)],
      [v(0, height, halfDepth), v(-halfWidth, 0, halfDepth)],
      [v(-halfWidth, 0, -halfDepth), v(halfWidth, 0, -halfDepth)],
      [v(halfWidth, 0, -halfDepth), v(0, height, -halfDepth)],
      [v(0, height, -halfDepth), v(-halfWidth, 0, -halfDepth)],
      [v(0, height, halfDepth), v(0, height, -halfDepth)],
      [v(-halfWidth, 0, halfDepth), v(-halfWidth, 0, -halfDepth)],
      [v(halfWidth, 0, halfDepth), v(halfWidth, 0, -halfDepth)],
    ];
  }, [width, height, roofDepth]);

  return (
    <group position={[0, roofBaseY, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color={COLORS.roof} side={THREE.DoubleSide} roughness={0.9} metalness={0.1} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      {edgePoints.map((points, i) => (
        <Line key={i} points={points} color={COLORS.edge} lineWidth={1} />
      ))}
    </group>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export function House3DScene({ houseType, pilotis, elements = [], wallColor = '#d4d4d4' }: House3DSceneProps) {
  const groupRef = useRef<Group>(null);

  if (!houseType) return null;

  return (
    <group ref={groupRef}>
      <Terrain pilotis={pilotis} />

      {Object.entries(pilotis).map(([id, data]) => {
        const pos = id.match(/piloti_(\d+)_(\d+)/);
        const terrainY = pos
          ? interpolateTerrainY(pilotis, parseInt(pos[1]), parseInt(pos[2]))
          : HOUSE_BASE_Y - PILOTI_BASE_HEIGHT;

        return (
          <Piloti3D
            key={`${id}_${data.height}_${data.isMaster}_${data.nivel}`}
            pilotiId={id}
            data={data}
            terrainY={terrainY}
          />
        );
      })}

      <HouseBody houseType={houseType} wallColor={wallColor} />

      {elements.map((element) => (
        <HouseElement3D key={element.id} element={element} />
      ))}

      <Roof />
    </group>
  );
}
