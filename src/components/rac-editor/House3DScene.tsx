import { useMemo, useRef } from 'react';
import { Group } from 'three';
import { Box, Cylinder, Line } from '@react-three/drei';
import * as THREE from 'three';
import { HouseType, PilotiData } from '@/lib/house-manager';

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
};

interface House3DSceneProps {
  houseType: HouseType;
  pilotis: Record<string, PilotiData>;
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

// House body (the main box)
function HouseBody() {
  const width = BASE_TOP_WIDTH * SCALE * MODEL_SCALE;
  const height = BODY_HEIGHT * SCALE * MODEL_SCALE;
  const depth = BASE_TOP_HEIGHT * SCALE * MODEL_SCALE;

  return (
    <group position={[0, HOUSE_BASE_Y + height / 2, 0]}>
      <Box args={[width, height, depth]} castShadow receiveShadow>
        <meshStandardMaterial color={COLORS.houseBody} />
      </Box>
      {/* Edge lines */}
      <Box args={[width * 1.001, height * 1.001, depth * 1.001]}>
        <meshBasicMaterial color={COLORS.edge} wireframe />
      </Box>
    </group>
  );
}

// Roof component (triangular prism)
function Roof({ houseType }: { houseType: HouseType }) {
  const width = BASE_TOP_WIDTH * SCALE * MODEL_SCALE;
  const height = ROOF_HEIGHT * SCALE * MODEL_SCALE;
  const depth = BASE_TOP_HEIGHT * SCALE * MODEL_SCALE;
  
  const bodyHeight = BODY_HEIGHT * SCALE * MODEL_SCALE;
  const roofBaseY = HOUSE_BASE_Y + bodyHeight; // On top of body

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

export function House3DScene({ houseType, pilotis }: House3DSceneProps) {
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
      
      {/* Roof */}
      <Roof houseType={houseType} />
    </group>
  );
}
