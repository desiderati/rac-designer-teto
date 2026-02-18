import { useMemo, useRef } from "react";
import { Group } from "three";
import { Cylinder, Line } from "@react-three/drei";
import * as THREE from "three";
import { HouseType, PilotiData, HouseElement } from "@/lib/house-manager";

// Escalas base (2D -> 3D)
const SCALE_2D = 0.6;
const MODEL_SCALE = 0.5;
const S = SCALE_2D * MODEL_SCALE;

// Dimensões principais da casa
const HOUSE_WIDTH = 610 * S;
const HOUSE_DEPTH = 300 * S;
const BODY_HEIGHT = 273 * S;

// Medidas usadas no perfil do telhado
const DIAG_H1 = 213 * S;
const DIAG_W = 244 * S;
const WALL_HEIGHT = DIAG_H1;
const ROOF_RISE = BODY_HEIGHT - DIAG_H1;

// Grade dos pilotis
const COLUMN_DISTANCE = 155 * S;
const ROW_DISTANCE = 135 * S;
const PILOTI_RADIUS = 15 * S;
const PILOTI_BASE_HEIGHT = 100 * S;
const HOUSE_BASE_Y = PILOTI_BASE_HEIGHT;

// Terreno ao redor da casa
const TERRAIN_EXT = 80;
const TERRAIN_SUBDIVISIONS = 20;

// Paleta de materiais
const COLORS = {
  roofLight: "#a8b8c4",
  roofDark: "#8a9ea8",
  roofEdge: "#5a6a74",
  pilotiNormal: "#d4d4d4",
  pilotiMaster: "#c4905a",
  edge: "#333333",
  terrain: "#7da86d",
  elementWhite: "#ffffff",
  elementFrame: "#666666",
};

interface House3DSceneProps {
  houseType: HouseType;
  pilotis: Record<string, PilotiData>;
  elements?: HouseElement[];
  wallColor?: string;
}

// Altura do terreno em cada canto da grade
function getCornerTerrainY(pilotis: Record<string, PilotiData>, col: number, row: number): number {
  const id = `piloti_${col}_${row}`;
  const data = pilotis[id] ?? { height: 1.0, nivel: 0.2, isMaster: false };
  return HOUSE_BASE_Y - data.nivel * PILOTI_BASE_HEIGHT;
}

// Interpolação bilinear para o restante do terreno
function interpolateTerrainY(pilotis: Record<string, PilotiData>, col: number, row: number): number {
  const yA1 = getCornerTerrainY(pilotis, 0, 0);
  const yA4 = getCornerTerrainY(pilotis, 3, 0);
  const yC1 = getCornerTerrainY(pilotis, 0, 2);
  const yC4 = getCornerTerrainY(pilotis, 3, 2);

  const u = col / 3;
  const v = row / 2;

  return (1 - u) * (1 - v) * yA1 + u * (1 - v) * yA4 + (1 - u) * v * yC1 + u * v * yC4;
}

// Converte piloti_#_# em coordenadas de grade
function getPilotiGridPosition(pilotiId: string): { col: number; row: number } | null {
  const match = pilotiId.match(/piloti_(\d+)_(\d+)/);
  if (!match) return null;
  return { col: parseInt(match[1]), row: parseInt(match[2]) };
}

// Posição do piloti no espaço 3D
function getPiloti3DPosition(col: number, row: number): [number, number, number] {
  const x = (col - 1.5) * COLUMN_DISTANCE;
  const z = (1 - row) * ROW_DISTANCE;
  return [x, 0, z];
}

// Coluna: mantém altura desejada e também encosta no terreno
function Piloti3D({ pilotiId, data, terrainY }: { pilotiId: string; data: PilotiData; terrainY: number }) {
  const pos = getPilotiGridPosition(pilotiId);
  if (!pos) return null;

  const [x, , z] = getPiloti3DPosition(pos.col, pos.row);
  const color = data.isMaster ? COLORS.pilotiMaster : COLORS.pilotiNormal;

  const targetHeight = (data.height ?? 1.0) * PILOTI_BASE_HEIGHT;
  const minToGround = HOUSE_BASE_Y - terrainY;
  const visualHeight = Math.max(targetHeight, minToGround, 0.5);
  const yCenter = HOUSE_BASE_Y - visualHeight / 2;

  return (
    <group position={[x, yCenter, z]}>
      <Cylinder args={[PILOTI_RADIUS, PILOTI_RADIUS, visualHeight, 12]} castShadow receiveShadow>
        <meshStandardMaterial color={color} />
      </Cylinder>
    </group>
  );
}

// Malha do terreno com altura interpolada
function Terrain({ pilotis }: { pilotis: Record<string, PilotiData> }) {
  const yA1 = getCornerTerrainY(pilotis, 0, 0);
  const yA4 = getCornerTerrainY(pilotis, 3, 0);
  const yC1 = getCornerTerrainY(pilotis, 0, 2);
  const yC4 = getCornerTerrainY(pilotis, 3, 2);

  const geometry = useMemo(() => {
    const N = TERRAIN_SUBDIVISIONS;
    const totalWidth = HOUSE_WIDTH + 2 * TERRAIN_EXT;
    const totalDepth = HOUSE_DEPTH + 2 * TERRAIN_EXT;

    const geo = new THREE.PlaneGeometry(totalWidth, totalDepth, N - 1, N - 1);
    const positions = geo.attributes.position as THREE.BufferAttribute;

    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const idx = j * N + i;
        const u = i / (N - 1);
        const v = j / (N - 1);

        const height = (1 - u) * (1 - v) * yA1 + u * (1 - v) * yA4 + (1 - u) * v * yC1 + u * v * yC4;

        positions.setZ(idx, height);
      }
    }

    positions.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, [yA1, yA4, yC1, yC4]);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial color={COLORS.terrain} roughness={0.95} metalness={0} side={THREE.DoubleSide} />
    </mesh>
  );
}

// Porta/janela aplicada na face correta da casa
function HouseElement3D({ element }: { element: HouseElement }) {
  const elementWidth = element.width * MODEL_SCALE;
  const elementHeight = element.height * MODEL_SCALE;
  const depth = 2;

  const xOffset = element.x * MODEL_SCALE;
  const yOffset = element.y * MODEL_SCALE;

  const hw = HOUSE_WIDTH / 2;
  const hd = HOUSE_DEPTH / 2;

  //const yPos = HOUSE_BASE_Y + BODY_HEIGHT - yOffset - elementHeight / 2;
  const yPos = HOUSE_BASE_Y + BODY_HEIGHT;

  let position: [number, number, number];
  let rotation: [number, number, number] = [0, 0, 0];

  switch (element.face) {
    case "front":
      position = [hw - xOffset - elementWidth / 2, yPos, hd + depth / 2];
      break;
    case "back":
      position = [xOffset - hw + elementWidth / 2, yPos, -hd - depth / 2];
      rotation = [0, Math.PI, 0];
      break;
    case "left":
      position = [-hw - depth / 2, yPos, xOffset - hd + elementWidth / 2];
      rotation = [0, Math.PI / 2, 0];
      break;
    case "right":
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
        <boxGeometry args={[elementWidth + 2, elementHeight + 2, depth * 0.4]} />
        <meshStandardMaterial color={COLORS.elementFrame} />
      </mesh>
    </group>
  );
}

// Corpo da casa (paredes + piso)
function HouseBody({ houseType, wallColor }: { houseType: HouseType; wallColor: string }) {
  const hw = HOUSE_WIDTH / 2;
  const hd = HOUSE_DEPTH / 2;
  const BY = HOUSE_BASE_Y;
  const TOP = BY + WALL_HEIGHT;
  const cy = BY + WALL_HEIGHT / 2;

  const isOpenLeft = houseType === "tipo3";

  const walls = useMemo(() => {
    const w: {
      pos: [number, number, number];
      rot: [number, number, number];
      width: number;
      height: number;
      key: string;
    }[] = [
      { pos: [0, cy, hd], rot: [0, 0, 0], width: HOUSE_WIDTH, height: WALL_HEIGHT, key: "front" },
      { pos: [0, cy, -hd], rot: [0, Math.PI, 0], width: HOUSE_WIDTH, height: WALL_HEIGHT, key: "back" },
      { pos: [hw, cy, 0], rot: [0, Math.PI / 2, 0], width: HOUSE_DEPTH, height: WALL_HEIGHT, key: "right" },
    ];
    if (!isOpenLeft) {
      w.push({ pos: [-hw, cy, 0], rot: [0, -Math.PI / 2, 0], width: HOUSE_DEPTH, height: WALL_HEIGHT, key: "left" });
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
        <mesh key={w.key} position={w.pos} rotation={w.rot} receiveShadow>
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

function Roof() {
  const hw = HOUSE_WIDTH / 2;
  const hd = HOUSE_DEPTH / 2;
  const roofBaseY = HOUSE_BASE_Y + WALL_HEIGHT;

  // Perfil do telhado:
  // - laterais começam no topo da parede
  // - pico sobe somente o trecho final do front profile (ROOF_RISE)
  const wallEdgeH = 0;
  const peakH = Math.max(ROOF_RISE, 1);

  const geometry = useMemo(() => {
    const verts: number[] = [];
    const addTri = (
      x1: number,
      y1: number,
      z1: number,
      x2: number,
      y2: number,
      z2: number,
      x3: number,
      y3: number,
      z3: number,
    ) => {
      verts.push(x1, y1, z1, x2, y2, z2, x3, y3, z3);
    };

    const addQuad = (
      x1: number,
      y1: number,
      z1: number,
      x2: number,
      y2: number,
      z2: number,
      x3: number,
      y3: number,
      z3: number,
      x4: number,
      y4: number,
      z4: number,
    ) => {
      addTri(x1, y1, z1, x2, y2, z2, x3, y3, z3);
      addTri(x1, y1, z1, x3, y3, z3, x4, y4, z4);
    };

    addTri(-hw, 0, hd, -hw, wallEdgeH, hd, 0, peakH, hd);
    addTri(hw, 0, hd, 0, peakH, hd, hw, wallEdgeH, hd);
    addTri(-hw, 0, hd, 0, peakH, hd, hw, 0, hd);

    addTri(-hw, 0, -hd, 0, peakH, -hd, -hw, wallEdgeH, -hd);
    addTri(hw, 0, -hd, hw, wallEdgeH, -hd, 0, peakH, -hd);
    addTri(-hw, 0, -hd, hw, 0, -hd, 0, peakH, -hd);

    addQuad(-hw, wallEdgeH, hd, 0, peakH, hd, 0, peakH, -hd, -hw, wallEdgeH, -hd);
    addQuad(hw, wallEdgeH, -hd, 0, peakH, -hd, 0, peakH, hd, hw, wallEdgeH, hd);

    addQuad(-hw, 0, hd, -hw, wallEdgeH, hd, -hw, wallEdgeH, -hd, -hw, 0, -hd);
    addQuad(hw, 0, -hd, hw, wallEdgeH, -hd, hw, wallEdgeH, hd, hw, 0, hd);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(verts), 3));
    geo.computeVertexNormals();
    return geo;
  }, [hw, hd, wallEdgeH, peakH]);

  const edges = useMemo(() => {
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    const lines: [THREE.Vector3, THREE.Vector3][] = [];

    lines.push([v(-hw, 0, hd), v(-hw, wallEdgeH, hd)]);
    lines.push([v(-hw, wallEdgeH, hd), v(0, peakH, hd)]);
    lines.push([v(0, peakH, hd), v(hw, wallEdgeH, hd)]);
    lines.push([v(hw, wallEdgeH, hd), v(hw, 0, hd)]);

    lines.push([v(-hw, 0, -hd), v(-hw, wallEdgeH, -hd)]);
    lines.push([v(-hw, wallEdgeH, -hd), v(0, peakH, -hd)]);
    lines.push([v(0, peakH, -hd), v(hw, wallEdgeH, -hd)]);
    lines.push([v(hw, wallEdgeH, -hd), v(hw, 0, -hd)]);

    lines.push([v(0, peakH, hd), v(0, peakH, -hd)]);
    lines.push([v(-hw, wallEdgeH, hd), v(-hw, wallEdgeH, -hd)]);
    lines.push([v(hw, wallEdgeH, hd), v(hw, wallEdgeH, -hd)]);

    return lines;
  }, [hw, hd, wallEdgeH, peakH]);

  return (
    <group position={[0, roofBaseY, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={COLORS.roofLight}
          side={THREE.DoubleSide}
          roughness={0.9}
          metalness={0.05}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>
      <ChapelRoof wallEdgeH={wallEdgeH} peakH={peakH} hw={hw} hd={hd} />
      {edges.map((pts, i) => (
        <Line key={i} points={pts} color={COLORS.roofEdge} lineWidth={1.2} />
      ))}
    </group>
  );
}

// Faixa central do telhado (cor mais escura)
function ChapelRoof({ wallEdgeH, peakH, hw, hd }: { wallEdgeH: number; peakH: number; hw: number; hd: number }) {
  const chapelLeftX = -hw + DIAG_W;
  const chapelRightX = hw - DIAG_W;

  const geometry = useMemo(() => {
    const verts: number[] = [];
    const addTri = (
      x1: number,
      y1: number,
      z1: number,
      x2: number,
      y2: number,
      z2: number,
      x3: number,
      y3: number,
      z3: number,
    ) => verts.push(x1, y1, z1, x2, y2, z2, x3, y3, z3);

    addTri(chapelLeftX, wallEdgeH, hd + 0.5, 0, peakH, hd + 0.5, chapelRightX, wallEdgeH, hd + 0.5);
    addTri(chapelLeftX, wallEdgeH, -hd - 0.5, chapelRightX, wallEdgeH, -hd - 0.5, 0, peakH, -hd - 0.5);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(verts), 3));
    geo.computeVertexNormals();
    return geo;
  }, [chapelLeftX, chapelRightX, wallEdgeH, peakH, hd]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={COLORS.roofDark}
        side={THREE.DoubleSide}
        roughness={0.9}
        metalness={0.05}
        polygonOffset
        polygonOffsetFactor={-2}
        polygonOffsetUnits={-2}
      />
    </mesh>
  );
}

// Cena completa da casa 3D
export function House3DScene({ houseType, pilotis, elements = [], wallColor = "#d4d4d4" }: House3DSceneProps) {
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
