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

// Paredes com espessura
const WALL_THICKNESS = 4;

// Telhado com beiral
const ROOF_OVERHANG = 12;

// ============================================
// CORES
// ============================================
const COLORS = {
  roof: '#8B9DA8',
  pilotiNormal: '#d4d4d4',
  pilotiMaster: '#8B4513',
  edge: '#333333',
  ground: '#e8e8e8',
  openingInterior: '#1a1a1a',
  openingFrame: '#555555',
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
// TEXTURA PROCEDURAL - Telhado ondulado
// ============================================
function createCorrugatedTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Base color
  ctx.fillStyle = '#8B9DA8';
  ctx.fillRect(0, 0, 256, 256);

  // Horizontal corrugation stripes
  for (let y = 0; y < 256; y += 6) {
    const brightness = y % 12 < 6 ? 0 : 20;
    ctx.fillStyle = `rgba(0,0,0,${brightness / 255})`;
    ctx.fillRect(0, y, 256, 3);
    ctx.fillStyle = `rgba(255,255,255,${brightness / 255})`;
    ctx.fillRect(0, y + 3, 256, 3);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
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
// PILOTI 3D - seção circular, cresce para baixo
// ============================================
function Piloti3D({ pilotiId, data }: { pilotiId: string; data: PilotiData }) {
  const pos = getPilotiGridPosition(pilotiId);
  if (!pos) return null;

  const [x, _, z] = getPiloti3DPosition(pos.col, pos.row);
  const pilotiHeight = PILOTI_BASE_HEIGHT * data.height;
  const color = data.isMaster ? COLORS.pilotiMaster : COLORS.pilotiNormal;

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
// ELEMENTO (JANELA/PORTA) - abertura recortada
// ============================================
function HouseElement3D({ element }: { element: HouseElement }) {
  const elementWidth = element.width * MODEL_SCALE;
  const elementHeight = element.height * MODEL_SCALE;
  const depthOffset = WALL_THICKNESS / 2 + 0.5;

  const xOffset = element.x * MODEL_SCALE;
  const yOffset = element.y * MODEL_SCALE;

  const yPos = HOUSE_BASE_Y + HOUSE_HEIGHT - yOffset - elementHeight / 2;

  const hw = HOUSE_WIDTH / 2;
  const hd = HOUSE_DEPTH / 2;

  let position: [number, number, number];
  let rotation: [number, number, number] = [0, 0, 0];

  switch (element.face) {
    case 'front':
      position = [hw - xOffset - elementWidth / 2, yPos, hd + depthOffset];
      break;
    case 'back':
      position = [xOffset - hw + elementWidth / 2, yPos, -hd - depthOffset];
      rotation = [0, Math.PI, 0];
      break;
    case 'left':
      position = [-hw - depthOffset, yPos, xOffset - hd + elementWidth / 2];
      rotation = [0, Math.PI / 2, 0];
      break;
    case 'right':
      position = [hw + depthOffset, yPos, -(xOffset - hd + elementWidth / 2)];
      rotation = [0, -Math.PI / 2, 0];
      break;
    default:
      position = [0, 0, 0];
  }

  const frameThickness = 1.5;

  return (
    <group position={position} rotation={rotation}>
      {/* Dark interior - simulates hole/opening */}
      <mesh>
        <boxGeometry args={[elementWidth, elementHeight, WALL_THICKNESS + 1]} />
        <meshStandardMaterial color={COLORS.openingInterior} />
      </mesh>
      {/* Frame - top */}
      <mesh position={[0, elementHeight / 2 + frameThickness / 2, 0]}>
        <boxGeometry args={[elementWidth + frameThickness * 2, frameThickness, WALL_THICKNESS + 1.5]} />
        <meshStandardMaterial color={COLORS.openingFrame} />
      </mesh>
      {/* Frame - bottom */}
      <mesh position={[0, -elementHeight / 2 - frameThickness / 2, 0]}>
        <boxGeometry args={[elementWidth + frameThickness * 2, frameThickness, WALL_THICKNESS + 1.5]} />
        <meshStandardMaterial color={COLORS.openingFrame} />
      </mesh>
      {/* Frame - left */}
      <mesh position={[-elementWidth / 2 - frameThickness / 2, 0, 0]}>
        <boxGeometry args={[frameThickness, elementHeight, WALL_THICKNESS + 1.5]} />
        <meshStandardMaterial color={COLORS.openingFrame} />
      </mesh>
      {/* Frame - right */}
      <mesh position={[elementWidth / 2 + frameThickness / 2, 0, 0]}>
        <boxGeometry args={[frameThickness, elementHeight, WALL_THICKNESS + 1.5]} />
        <meshStandardMaterial color={COLORS.openingFrame} />
      </mesh>
    </group>
  );
}

// ============================================
// CORPO DA CASA - paredes com espessura + arestas
// ============================================
function HouseBody({ houseType, wallColor }: { houseType: HouseType; wallColor: string }) {
  const hw = HOUSE_WIDTH / 2;
  const hd = HOUSE_DEPTH / 2;
  const BY = HOUSE_BASE_Y;
  const TOP = BY + HOUSE_HEIGHT;
  const cy = BY + HOUSE_HEIGHT / 2;
  const wt = WALL_THICKNESS;
  const hwt = wt / 2;

  const isOpenLeft = houseType === 'tipo3';

  // Walls with thickness using boxGeometry
  const walls = useMemo(() => {
    const w: { pos: [number, number, number]; size: [number, number, number]; key: string }[] = [
      // Front wall (long side, Z = +hd)
      { pos: [0, cy, hd + hwt], size: [HOUSE_WIDTH + wt, HOUSE_HEIGHT, wt], key: 'front' },
      // Back wall (long side, Z = -hd)
      { pos: [0, cy, -hd - hwt], size: [HOUSE_WIDTH + wt, HOUSE_HEIGHT, wt], key: 'back' },
      // Right wall (short side, X = +hw)
      { pos: [hw + hwt, cy, 0], size: [wt, HOUSE_HEIGHT, HOUSE_DEPTH], key: 'right' },
    ];
    if (!isOpenLeft) {
      // Left wall (short side, X = -hw)
      w.push({ pos: [-hw - hwt, cy, 0], size: [wt, HOUSE_HEIGHT, HOUSE_DEPTH], key: 'left' });
    }
    return w;
  }, [isOpenLeft, cy, hw, hd, hwt, wt]);

  // Edge lines
  const edges = useMemo(() => {
    const e: [THREE.Vector3, THREE.Vector3][] = [];
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    const ohw = hw + wt;
    const ohd = hd + wt;

    // Front face outer edges
    e.push([v(-ohw, BY, ohd), v(ohw, BY, ohd)]);
    e.push([v(-ohw, TOP, ohd), v(ohw, TOP, ohd)]);
    e.push([v(-ohw, BY, ohd), v(-ohw, TOP, ohd)]);
    e.push([v(ohw, BY, ohd), v(ohw, TOP, ohd)]);

    // Back face outer edges
    e.push([v(-ohw, BY, -ohd), v(ohw, BY, -ohd)]);
    e.push([v(-ohw, TOP, -ohd), v(ohw, TOP, -ohd)]);
    e.push([v(-ohw, BY, -ohd), v(-ohw, TOP, -ohd)]);
    e.push([v(ohw, BY, -ohd), v(ohw, TOP, -ohd)]);

    // Side bottom connections
    e.push([v(ohw, BY, -ohd), v(ohw, BY, ohd)]);
    if (!isOpenLeft) {
      e.push([v(-ohw, BY, -ohd), v(-ohw, BY, ohd)]);
    }

    return e;
  }, [isOpenLeft, hw, hd, BY, TOP, wt]);

  return (
    <group>
      {/* Thick wall boxes */}
      {walls.map((w) => (
        <mesh key={w.key} position={w.pos} castShadow receiveShadow>
          <boxGeometry args={w.size} />
          <meshStandardMaterial color={wallColor} />
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
// TELHADO - textura ondulada + beiral
// ============================================
function Roof() {
  const overhang = ROOF_OVERHANG;
  const width = HOUSE_WIDTH + overhang * 2;
  const height = ROOF_3D_HEIGHT;
  const roofDepth = HOUSE_DEPTH + overhang * 2;
  const roofBaseY = HOUSE_BASE_Y + HOUSE_HEIGHT;

  const corrugatedTexture = useMemo(() => createCorrugatedTexture(), []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const halfWidth = width / 2;
    const halfDepth = roofDepth / 2;

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

    // UVs for texture mapping
    const uvs = new Float32Array([
      // Front triangle
      0, 0,  1, 0,  0.5, 1,
      // Back triangle
      0, 0,  0.5, 1,  1, 0,
      // Left slope
      0, 0,  0, 1,  1, 1,
      0, 0,  1, 1,  1, 0,
      // Right slope
      1, 0,  1, 1,  0, 1,
      1, 0,  0, 0,  1, 1,
    ]);

    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
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
        <meshStandardMaterial
          map={corrugatedTexture}
          side={THREE.DoubleSide}
          roughness={0.9}
          metalness={0.1}
        />
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
