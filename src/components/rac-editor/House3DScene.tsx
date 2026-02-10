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

// ============================================
// CORES
// ============================================
const COLORS = {
  roof: '#8B9DA8',
  pilotiNormal: '#d4d4d4',
  pilotiMaster: '#8B4513',
  edge: '#333333',
  ground: '#e8e8e8',
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
// HELPERS PILOTIS
// ============================================
function getPilotiGridPosition(pilotiId: string): { col: number; row: number } | null {
  const match = pilotiId.match(/piloti_(\d+)_(\d+)/);
  if (!match) return null;
  return { col: parseInt(match[1]), row: parseInt(match[2]) };
}

function getPiloti3DPosition(col: number, row: number): [number, number, number] {
  const x = (col - 1.5) * COLUMN_DISTANCE;
  const z = (row - 1) * ROW_DISTANCE;
  return [x, 0, z];
}

// ============================================
// PILOTI 3D - grows DOWNWARD from house body
// ============================================
function Piloti3D({ pilotiId, data }: { pilotiId: string; data: PilotiData }) {
  const pos = getPilotiGridPosition(pilotiId);
  if (!pos) return null;

  const [x, _, z] = getPiloti3DPosition(pos.col, pos.row);
  const pilotiHeight = PILOTI_BASE_HEIGHT * data.height;
  const color = data.isMaster ? COLORS.pilotiMaster : COLORS.pilotiNormal;

  // Hangs from house body bottom downward
  const yCenter = HOUSE_BASE_Y - pilotiHeight / 2;

  return (
    <group position={[x, yCenter, z]}>
      <Cylinder args={[PILOTI_RADIUS, PILOTI_RADIUS, pilotiHeight, 16]} castShadow receiveShadow>
        <meshStandardMaterial color={color} />
      </Cylinder>
    </group>
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

  // Determine face width for positioning
  const isLongSide = element.face === 'front' || element.face === 'back';
  const faceWidth = isLongSide ? HOUSE_WIDTH : HOUSE_DEPTH;

  const yPos = HOUSE_BASE_Y + HOUSE_HEIGHT - yOffset - elementHeight / 2;

  const hw = HOUSE_WIDTH / 2;
  const hd = HOUSE_DEPTH / 2;

  let position: [number, number, number];
  let rotation: [number, number, number] = [0, 0, 0];

  switch (element.face) {
    case 'front':
      // Inverter X para corresponder a vista 2D
      position = [hw - xOffset - elementWidth / 2, yPos, hd + depth / 2];
      break;
    case 'back':
      // Ajustar back para manter simetria com front corrigido
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

  // Individual wall faces
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

  // Edge lines
  const edges = useMemo(() => {
    const e: [THREE.Vector3, THREE.Vector3][] = [];
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

    // Front face (long side, Z = +hd)
    e.push([v(-hw, BY, hd), v(hw, BY, hd)]);       // bottom
    e.push([v(-hw, TOP, hd), v(hw, TOP, hd)]);     // top
    e.push([v(-hw, BY, hd), v(-hw, TOP, hd)]);     // left vert
    e.push([v(hw, BY, hd), v(hw, TOP, hd)]);       // right vert

    // Back face (long side, Z = -hd)
    e.push([v(-hw, BY, -hd), v(hw, BY, -hd)]);     // bottom
    e.push([v(-hw, TOP, -hd), v(hw, TOP, -hd)]);   // top
    e.push([v(-hw, BY, -hd), v(-hw, TOP, -hd)]);   // left vert
    e.push([v(hw, BY, -hd), v(hw, TOP, -hd)]);     // right vert

    // Right side bottom (6m - NO top edge)
    e.push([v(hw, BY, -hd), v(hw, BY, hd)]);

    // Left side bottom (6m - NO top edge, skip if open)
    if (!isOpenLeft) {
      e.push([v(-hw, BY, -hd), v(-hw, BY, hd)]);
    }

    return e;
  }, [isOpenLeft, hw, hd, BY, TOP]);

  return (
    <group>
      {/* Wall faces */}
      {walls.map((w) => (
        <mesh key={w.key} position={w.pos} rotation={w.rot}>
          <planeGeometry args={[w.width, w.height]} />
          <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* Bottom face */}
      <mesh position={[0, BY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[HOUSE_WIDTH, HOUSE_DEPTH]} />
        <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
      </mesh>
      {/* Top face */}
      <mesh position={[0, TOP, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[HOUSE_WIDTH, HOUSE_DEPTH]} />
        <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
      </mesh>
      {/* Edge lines */}
      {edges.map((pts, i) => (
        <Line key={i} points={pts} color={COLORS.edge} lineWidth={1} />
      ))}
    </group>
  );
}

// ============================================
// TELHADO - cor de amianto, sem base diagonal
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

    // Triangular prism WITHOUT base faces (no diagonal)
    const vertices = new Float32Array([
      // Front triangle
      -halfWidth, 0, halfDepth,
      halfWidth, 0, halfDepth,
      0, height, halfDepth,

      // Back triangle
      -halfWidth, 0, -halfDepth,
      0, height, -halfDepth,
      halfWidth, 0, -halfDepth,

      // Left slope
      -halfWidth, 0, halfDepth,
      0, height, halfDepth,
      0, height, -halfDepth,
      -halfWidth, 0, halfDepth,
      0, height, -halfDepth,
      -halfWidth, 0, -halfDepth,

      // Right slope
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
      // Front triangle
      [v(-halfWidth, 0, halfDepth), v(halfWidth, 0, halfDepth)],
      [v(halfWidth, 0, halfDepth), v(0, height, halfDepth)],
      [v(0, height, halfDepth), v(-halfWidth, 0, halfDepth)],
      // Back triangle
      [v(-halfWidth, 0, -halfDepth), v(halfWidth, 0, -halfDepth)],
      [v(halfWidth, 0, -halfDepth), v(0, height, -halfDepth)],
      [v(0, height, -halfDepth), v(-halfWidth, 0, -halfDepth)],
      // Ridge and bottom edges
      [v(0, height, halfDepth), v(0, height, -halfDepth)],
      [v(-halfWidth, 0, halfDepth), v(-halfWidth, 0, -halfDepth)],
      [v(halfWidth, 0, halfDepth), v(halfWidth, 0, -halfDepth)],
    ];
  }, [width, height, roofDepth]);

  return (
    <group position={[0, roofBaseY, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color={COLORS.roof} side={THREE.DoubleSide} roughness={0.9} metalness={0.1} />
      </mesh>
      {edgePoints.map((points, i) => (
        <Line key={i} points={points} color={COLORS.edge} lineWidth={1} />
      ))}
    </group>
  );
}

// ============================================
// CHÃO
// ============================================
function Ground() {
  const size = 400 * MODEL_SCALE;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color={COLORS.ground} transparent opacity={0.5} />
    </mesh>
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
      <Ground />

      {Object.entries(pilotis).map(([id, data]) => (
        <Piloti3D
          key={`${id}_${data.height}_${data.isMaster}`}
          pilotiId={id}
          data={data}
        />
      ))}

      <HouseBody houseType={houseType} wallColor={wallColor} />

      {elements.map((element) => (
        <HouseElement3D key={element.id} element={element} />
      ))}

      <Roof />
    </group>
  );
}
