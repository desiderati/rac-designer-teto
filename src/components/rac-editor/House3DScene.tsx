import { useMemo, useRef } from 'react';
import { Group } from 'three';
import { Box, Cylinder, Line } from '@react-three/drei';
import * as THREE from 'three';
import { HouseType, PilotiData, HouseElement } from '@/lib/house-manager';

// ============================================
// DIMENSÕES BASE - Alinhadas com canvas-utils
// ============================================

// Dimensões do canvas 2D (em pixels, sem escala)
const BASE_TOP_WIDTH = 610;   // Largura da planta
const BASE_TOP_HEIGHT = 300;  // Profundidade da planta
const BODY_HEIGHT = 220;      // Altura do corpo (elevação)
const ROOF_HEIGHT = 80;       // Altura do telhado

// Escala aplicada no canvas 2D
const SCALE_2D = 0.6;

// Escala adicional para o modelo 3D (para tamanho visual adequado)
const MODEL_SCALE = 0.5;

// Dimensões finais 3D (já com ambas escalas aplicadas)
const HOUSE_WIDTH = BASE_TOP_WIDTH * SCALE_2D * MODEL_SCALE;   // ~183
const HOUSE_DEPTH = BASE_TOP_HEIGHT * SCALE_2D * MODEL_SCALE;  // ~90
const HOUSE_HEIGHT = BODY_HEIGHT * SCALE_2D * MODEL_SCALE;     // ~66
const ROOF_3D_HEIGHT = ROOF_HEIGHT * SCALE_2D * MODEL_SCALE;   // ~24

// ============================================
// PILOTIS
// ============================================

// Grid de pilotis (4 colunas × 3 linhas)
const COLUMN_DISTANCE = 155 * SCALE_2D * MODEL_SCALE;  // Espaçamento horizontal
const ROW_DISTANCE = 135 * SCALE_2D * MODEL_SCALE;     // Espaçamento vertical
const PILOTI_RADIUS = 15 * SCALE_2D * MODEL_SCALE;     // Raio do cilindro

// Altura base de um piloti com height=1.0
const PILOTI_BASE_HEIGHT = 60 * MODEL_SCALE;

// A base da casa fica apoiada nos pilotis
const HOUSE_BASE_Y = PILOTI_BASE_HEIGHT;

// ============================================
// CORES
// ============================================

const COLORS = {
  houseBody: '#d4d4d4',
  roof: '#d4d4d4',
  pilotiNormal: '#d4d4d4',
  pilotiMaster: '#8B4513',     // Marrom para piloti mestre
  edge: '#333333',
  ground: '#e8e8e8',
  window: '#87CEEB',          // Azul claro para janelas
  door: '#8B4513',            // Marrom para portas
  windowFrame: '#555555',
};

// ============================================
// INTERFACES
// ============================================

interface House3DSceneProps {
  houseType: HouseType;
  pilotis: Record<string, PilotiData>;
  elements?: HouseElement[];
}

// ============================================
// FUNÇÕES AUXILIARES PARA PILOTIS
// ============================================

// Extrai posição de grid do ID do piloti (ex: piloti_0_0 → col=0, row=0)
function getPilotiGridPosition(pilotiId: string): { col: number; row: number } | null {
  const match = pilotiId.match(/piloti_(\d+)_(\d+)/);
  if (!match) return null;
  return { col: parseInt(match[1]), row: parseInt(match[2]) };
}

// Calcula posição 3D a partir da posição de grid
function getPiloti3DPosition(col: number, row: number): [number, number, number] {
  // X: [-1.5, -0.5, 0.5, 1.5] * COLUMN_DISTANCE (4 colunas centradas)
  const x = (col - 1.5) * COLUMN_DISTANCE;
  // Z: [-1, 0, 1] * ROW_DISTANCE (3 linhas centradas)
  const z = (row - 1) * ROW_DISTANCE;
  return [x, 0, z];
}

// ============================================
// COMPONENTE: PILOTI 3D
// ============================================

function Piloti3D({ pilotiId, data }: { pilotiId: string; data: PilotiData }) {
  const pos = getPilotiGridPosition(pilotiId);
  if (!pos) return null;

  const [x, _, z] = getPiloti3DPosition(pos.col, pos.row);
  
  // Altura do piloti: base_height × height_multiplier
  const pilotiHeight = PILOTI_BASE_HEIGHT * data.height;
  
  const color = data.isMaster ? COLORS.pilotiMaster : COLORS.pilotiNormal;

  return (
    <group position={[x, pilotiHeight / 2, z]}>
      <Cylinder 
        args={[PILOTI_RADIUS, PILOTI_RADIUS, pilotiHeight, 16]} 
        castShadow 
        receiveShadow
      >
        <meshStandardMaterial color={color} />
      </Cylinder>
      {/* Contorno wireframe */}
      <Cylinder args={[PILOTI_RADIUS * 1.02, PILOTI_RADIUS * 1.02, pilotiHeight * 1.001, 16]}>
        <meshBasicMaterial color={COLORS.edge} wireframe />
      </Cylinder>
    </group>
  );
}

// ============================================
// COMPONENTE: ELEMENTO (JANELA/PORTA)
// ============================================

function HouseElement3D({ element }: { element: HouseElement }) {
  // Converter dimensões de pixels 2D para unidades 3D
  const elementWidth = element.width * SCALE_2D * MODEL_SCALE;
  const elementHeight = element.height * SCALE_2D * MODEL_SCALE;
  const depth = 2; // Profundidade mínima para visualização
  
  // Converter posição de pixels 2D para 3D
  // x: offset do canto esquerdo da face
  // y: offset do topo do corpo da casa
  const xOffset2D = element.x * SCALE_2D * MODEL_SCALE;
  const yOffset2D = element.y * SCALE_2D * MODEL_SCALE;
  
  // Calcular posição 3D baseada na face
  let position: [number, number, number];
  let rotation: [number, number, number] = [0, 0, 0];
  
  // Posição Y: base da casa + altura do corpo - offset do topo - metade da altura do elemento
  const yPos = HOUSE_BASE_Y + HOUSE_HEIGHT - yOffset2D - elementHeight / 2;
  
  switch (element.face) {
    case 'front':
      // Face frontal: Z positivo
      position = [
        xOffset2D - HOUSE_WIDTH / 2 + elementWidth / 2,
        yPos,
        HOUSE_DEPTH / 2 + depth / 2
      ];
      break;
    case 'back':
      // Face traseira: Z negativo, invertido em X
      position = [
        -(xOffset2D - HOUSE_WIDTH / 2 + elementWidth / 2),
        yPos,
        -HOUSE_DEPTH / 2 - depth / 2
      ];
      rotation = [0, Math.PI, 0];
      break;
    case 'left':
      // Face esquerda: X negativo
      position = [
        -HOUSE_WIDTH / 2 - depth / 2,
        yPos,
        xOffset2D - HOUSE_DEPTH / 2 + elementWidth / 2
      ];
      rotation = [0, Math.PI / 2, 0];
      break;
    case 'right':
      // Face direita: X positivo
      position = [
        HOUSE_WIDTH / 2 + depth / 2,
        yPos,
        -(xOffset2D - HOUSE_DEPTH / 2 + elementWidth / 2)
      ];
      rotation = [0, -Math.PI / 2, 0];
      break;
    default:
      position = [0, 0, 0];
  }
  
  const color = element.type === 'door' ? COLORS.door : COLORS.window;
  const frameColor = COLORS.windowFrame;
  
  return (
    <group position={position} rotation={rotation}>
      {/* Elemento principal */}
      <Box args={[elementWidth, elementHeight, depth]} castShadow>
        <meshStandardMaterial color={color} />
      </Box>
      {/* Moldura */}
      <Box args={[elementWidth + 2, elementHeight + 2, depth * 0.5]}>
        <meshStandardMaterial color={frameColor} />
      </Box>
    </group>
  );
}

// ============================================
// COMPONENTE: CORPO DA CASA
// ============================================

function HouseBody() {
  return (
    <group position={[0, HOUSE_BASE_Y + HOUSE_HEIGHT / 2, 0]}>
      <Box args={[HOUSE_WIDTH, HOUSE_HEIGHT, HOUSE_DEPTH]} castShadow receiveShadow>
        <meshStandardMaterial color={COLORS.houseBody} />
      </Box>
      {/* Contorno wireframe */}
      <Box args={[HOUSE_WIDTH * 1.001, HOUSE_HEIGHT * 1.001, HOUSE_DEPTH * 1.001]}>
        <meshBasicMaterial color={COLORS.edge} wireframe />
      </Box>
    </group>
  );
}

// ============================================
// COMPONENTE: TELHADO
// ============================================

function Roof({ houseType }: { houseType: HouseType }) {
  const width = HOUSE_WIDTH;
  const height = ROOF_3D_HEIGHT;
  const roofDepth = HOUSE_DEPTH;
  
  const roofBaseY = HOUSE_BASE_Y + HOUSE_HEIGHT;

  // Geometria de prisma triangular
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    
    const halfWidth = width / 2;
    const halfDepth = roofDepth / 2;
    
    const vertices = new Float32Array([
      // Face frontal (triângulo)
      -halfWidth, 0, halfDepth,
      halfWidth, 0, halfDepth,
      0, height, halfDepth,
      
      // Face traseira (triângulo)
      -halfWidth, 0, -halfDepth,
      0, height, -halfDepth,
      halfWidth, 0, -halfDepth,
      
      // Lateral esquerda
      -halfWidth, 0, halfDepth,
      0, height, halfDepth,
      0, height, -halfDepth,
      
      -halfWidth, 0, halfDepth,
      0, height, -halfDepth,
      -halfWidth, 0, -halfDepth,
      
      // Lateral direita
      halfWidth, 0, halfDepth,
      0, height, -halfDepth,
      0, height, halfDepth,
      
      halfWidth, 0, halfDepth,
      halfWidth, 0, -halfDepth,
      0, height, -halfDepth,
      
      // Base (opcional)
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
  }, [width, height, roofDepth]);

  // Linhas de borda
  const edgePoints = useMemo(() => {
    const halfWidth = width / 2;
    const halfDepth = roofDepth / 2;
    
    return [
      // Triângulo frontal
      [new THREE.Vector3(-halfWidth, 0, halfDepth), new THREE.Vector3(halfWidth, 0, halfDepth)],
      [new THREE.Vector3(halfWidth, 0, halfDepth), new THREE.Vector3(0, height, halfDepth)],
      [new THREE.Vector3(0, height, halfDepth), new THREE.Vector3(-halfWidth, 0, halfDepth)],
      // Triângulo traseiro
      [new THREE.Vector3(-halfWidth, 0, -halfDepth), new THREE.Vector3(halfWidth, 0, -halfDepth)],
      [new THREE.Vector3(halfWidth, 0, -halfDepth), new THREE.Vector3(0, height, -halfDepth)],
      [new THREE.Vector3(0, height, -halfDepth), new THREE.Vector3(-halfWidth, 0, -halfDepth)],
      // Cumeeira e bordas
      [new THREE.Vector3(0, height, halfDepth), new THREE.Vector3(0, height, -halfDepth)],
      [new THREE.Vector3(-halfWidth, 0, halfDepth), new THREE.Vector3(-halfWidth, 0, -halfDepth)],
      [new THREE.Vector3(halfWidth, 0, halfDepth), new THREE.Vector3(halfWidth, 0, -halfDepth)],
    ];
  }, [width, height, roofDepth]);

  return (
    <group position={[0, roofBaseY, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color={COLORS.roof} side={THREE.DoubleSide} />
      </mesh>
      {edgePoints.map((points, i) => (
        <Line key={i} points={points} color={COLORS.edge} lineWidth={1} />
      ))}
    </group>
  );
}

// ============================================
// COMPONENTE: CHÃO
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
// COMPONENTE PRINCIPAL: CENA 3D
// ============================================

export function House3DScene({ houseType, pilotis, elements = [] }: House3DSceneProps) {
  const groupRef = useRef<Group>(null);

  if (!houseType) return null;

  return (
    <group ref={groupRef}>
      {/* Chão */}
      <Ground />
      
      {/* Pilotis - key dinâmico para forçar re-render */}
      {Object.entries(pilotis).map(([id, data]) => (
        <Piloti3D 
          key={`${id}_${data.height}_${data.isMaster}`} 
          pilotiId={id} 
          data={data} 
        />
      ))}
      
      {/* Corpo da casa */}
      <HouseBody />
      
      {/* Janelas e Portas */}
      {elements.map((element) => (
        <HouseElement3D key={element.id} element={element} />
      ))}
      
      {/* Telhado */}
      <Roof houseType={houseType} />
    </group>
  );
}
