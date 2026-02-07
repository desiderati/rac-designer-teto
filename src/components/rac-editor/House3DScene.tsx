import { useMemo, useRef } from 'react';
import { Group } from 'three';
import { Box, Cylinder, Line } from '@react-three/drei';
import * as THREE from 'three';
import { HouseType, PilotiData, HouseElement } from '@/lib/house-manager';

// Base dimensions from canvas-utils (matching the 2D house)
const BASE_TOP_WIDTH = 610;
const BASE_TOP_HEIGHT = 300;
const SCALE = 0.6;
const BODY_HEIGHT = 220;
const ROOF_HEIGHT = 80;

// Piloti grid spacing
const COLUMN_DISTANCE = 155 * SCALE;
const ROW_DISTANCE = 135 * SCALE;
const PILOTI_RADIUS = 15 * SCALE;

// Scale factor to make the 3D model a reasonable size
const MODEL_SCALE = 0.5;

// Colors - unified house color
const COLORS = {
  houseBody: '#d4d4d4',
  roof: '#d4d4d4',
  pilotiNormal: '#d4d4d4',
  pilotiMaster: '#8B4513', // Brown for master piloti
  edge: '#333333',
  ground: '#e8e8e8',
  window: '#87CEEB', // Light blue for windows
  door: '#8B4513', // Brown for doors
  windowFrame: '#555555',
};

interface House3DSceneProps {
  houseType: HouseType;
  pilotis: Record<string, PilotiData>;
  elements?: HouseElement[];
}

// Map piloti ID to grid position
function getPilotiGridPosition(pilotiId: string): { col: number; row: number } | null {
  // Format: piloti_col_row (e.g., piloti_0_0 = A1)
  const match = pilotiId.match(/piloti_(\d+)_(\d+)/);
  if (!match) return null;
  return { col: parseInt(match[1]), row: parseInt(match[2]) };
}

// Get 3D position for a piloti based on grid position
function getPiloti3DPosition(col: number, row: number): [number, number, number] {
  // X positions: [-1.5, -0.5, 0.5, 1.5] * COLUMN_DISTANCE
  const x = (col - 1.5) * COLUMN_DISTANCE * MODEL_SCALE;
  
  // Z positions: [-1, 0, 1] * ROW_DISTANCE
  const z = (row - 1) * ROW_DISTANCE * MODEL_SCALE;
  
  return [x, 0, z];
}

// House body Y position (pilotis extend from ground to this point)
const HOUSE_BASE_Y = 60 * MODEL_SCALE * 1.5; // Average piloti base height
const HOUSE_WIDTH = BASE_TOP_WIDTH * SCALE * MODEL_SCALE;
const HOUSE_HEIGHT = BODY_HEIGHT * SCALE * MODEL_SCALE;
const HOUSE_DEPTH = BASE_TOP_HEIGHT * SCALE * MODEL_SCALE;

// Piloti component
function Piloti3D({ 
  pilotiId, 
  data 
}: { 
  pilotiId: string; 
  data: PilotiData;
}) {
  const pos = getPilotiGridPosition(pilotiId);
  if (!pos) return null;

  const [x, _, z] = getPiloti3DPosition(pos.col, pos.row);
  
  // Height = from ground (0) to house base, scaled by piloti height factor
  const pilotiHeight = HOUSE_BASE_Y * data.height;
  
  const color = data.isMaster ? COLORS.pilotiMaster : COLORS.pilotiNormal;
  const radius = PILOTI_RADIUS * MODEL_SCALE;

  return (
    <group position={[x, pilotiHeight / 2, z]}>
      <Cylinder 
        args={[radius, radius, pilotiHeight, 16]} 
        castShadow 
        receiveShadow
      >
        <meshStandardMaterial color={color} />
      </Cylinder>
      {/* Edge outline */}
      <Cylinder args={[radius * 1.02, radius * 1.02, pilotiHeight * 1.001, 16]}>
        <meshBasicMaterial color={COLORS.edge} wireframe />
      </Cylinder>
    </group>
  );
}

// Window/Door element component
function HouseElement3D({ element }: { element: HouseElement }) {
  const elementWidth = element.width * HOUSE_WIDTH;
  const elementHeight = element.height * HOUSE_HEIGHT;
  const depth = 2; // Small depth for the element
  
  // Calculate position based on face and relative coordinates
  let position: [number, number, number];
  let rotation: [number, number, number] = [0, 0, 0];
  
  const xOffset = (element.x - 0.5) * HOUSE_WIDTH;
  const yOffset = HOUSE_BASE_Y + HOUSE_HEIGHT - (element.y * HOUSE_HEIGHT) - elementHeight / 2;
  
  switch (element.face) {
    case 'front':
      position = [xOffset, yOffset, HOUSE_DEPTH / 2 + depth / 2];
      break;
    case 'back':
      position = [-xOffset, yOffset, -HOUSE_DEPTH / 2 - depth / 2];
      rotation = [0, Math.PI, 0];
      break;
    case 'left':
      position = [-HOUSE_WIDTH / 2 - depth / 2, yOffset, (element.x - 0.5) * HOUSE_DEPTH];
      rotation = [0, Math.PI / 2, 0];
      break;
    case 'right':
      position = [HOUSE_WIDTH / 2 + depth / 2, yOffset, -(element.x - 0.5) * HOUSE_DEPTH];
      rotation = [0, -Math.PI / 2, 0];
      break;
    default:
      position = [0, 0, 0];
  }
  
  const color = element.type === 'door' ? COLORS.door : COLORS.window;
  const frameColor = COLORS.windowFrame;
  
  return (
    <group position={position} rotation={rotation}>
      {/* Main element */}
      <Box args={[elementWidth, elementHeight, depth]} castShadow>
        <meshStandardMaterial color={color} />
      </Box>
      {/* Frame */}
      <Box args={[elementWidth + 2, elementHeight + 2, depth * 0.5]}>
        <meshStandardMaterial color={frameColor} />
      </Box>
    </group>
  );
}

// House body (the main box)
function HouseBody() {
  return (
    <group position={[0, HOUSE_BASE_Y + HOUSE_HEIGHT / 2, 0]}>
      <Box args={[HOUSE_WIDTH, HOUSE_HEIGHT, HOUSE_DEPTH]} castShadow receiveShadow>
        <meshStandardMaterial color={COLORS.houseBody} />
      </Box>
      {/* Edge lines */}
      <Box args={[HOUSE_WIDTH * 1.001, HOUSE_HEIGHT * 1.001, HOUSE_DEPTH * 1.001]}>
        <meshBasicMaterial color={COLORS.edge} wireframe />
      </Box>
    </group>
  );
}

// Roof component (triangular prism)
function Roof({ houseType }: { houseType: HouseType }) {
  const width = HOUSE_WIDTH;
  const height = ROOF_HEIGHT * SCALE * MODEL_SCALE;
  const depth = HOUSE_DEPTH;
  
  const roofBaseY = HOUSE_BASE_Y + HOUSE_HEIGHT; // On top of body

  // Create triangular roof geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    
    const halfWidth = width / 2;
    const halfDepth = depth / 2;
    
    // Vertices for a triangular prism roof
    const vertices = new Float32Array([
      // Front face (triangle)
      -halfWidth, 0, halfDepth,
      halfWidth, 0, halfDepth,
      0, height, halfDepth,
      
      // Back face (triangle)
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
      
      // Bottom (optional, usually hidden)
      -halfWidth, 0, halfDepth,
      halfWidth, 0, -halfDepth,
      halfWidth, 0, halfDepth,
      
      -halfWidth, 0, halfDepth,
      -halfWidth, 0, -halfDepth,
      halfWidth, 0, -halfDepth,
    ]);
    
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.computeVertexNormals();
    
    return geo;
  }, [width, height, depth]);

  // Wireframe edges for the roof
  const edgePoints = useMemo(() => {
    const halfWidth = width / 2;
    const halfDepth = depth / 2;
    
    return [
      // Front triangle
      [new THREE.Vector3(-halfWidth, 0, halfDepth), new THREE.Vector3(halfWidth, 0, halfDepth)],
      [new THREE.Vector3(halfWidth, 0, halfDepth), new THREE.Vector3(0, height, halfDepth)],
      [new THREE.Vector3(0, height, halfDepth), new THREE.Vector3(-halfWidth, 0, halfDepth)],
      // Back triangle
      [new THREE.Vector3(-halfWidth, 0, -halfDepth), new THREE.Vector3(halfWidth, 0, -halfDepth)],
      [new THREE.Vector3(halfWidth, 0, -halfDepth), new THREE.Vector3(0, height, -halfDepth)],
      [new THREE.Vector3(0, height, -halfDepth), new THREE.Vector3(-halfWidth, 0, -halfDepth)],
      // Ridge and edges
      [new THREE.Vector3(0, height, halfDepth), new THREE.Vector3(0, height, -halfDepth)],
      [new THREE.Vector3(-halfWidth, 0, halfDepth), new THREE.Vector3(-halfWidth, 0, -halfDepth)],
      [new THREE.Vector3(halfWidth, 0, halfDepth), new THREE.Vector3(halfWidth, 0, -halfDepth)],
    ];
  }, [width, height, depth]);

  return (
    <group position={[0, roofBaseY, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color={COLORS.roof} side={THREE.DoubleSide} />
      </mesh>
      {/* Edge lines */}
      {edgePoints.map((points, i) => (
        <Line key={i} points={points} color={COLORS.edge} lineWidth={1} />
      ))}
    </group>
  );
}

// Ground plane for reference
function Ground() {
  const size = 400 * MODEL_SCALE;
  
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color={COLORS.ground} transparent opacity={0.5} />
    </mesh>
  );
}

export function House3DScene({ houseType, pilotis, elements = [] }: House3DSceneProps) {
  const groupRef = useRef<Group>(null);

  if (!houseType) return null;

  return (
    <group ref={groupRef}>
      {/* Ground plane */}
      <Ground />
      
      {/* Pilotis */}
      {Object.entries(pilotis).map(([id, data]) => (
        <Piloti3D key={id} pilotiId={id} data={data} />
      ))}
      
      {/* House body */}
      <HouseBody />
      
      {/* Windows and Doors */}
      {elements.map((element) => (
        <HouseElement3D key={element.id} element={element} />
      ))}
      
      {/* Roof */}
      <Roof houseType={houseType} />
    </group>
  );
}
