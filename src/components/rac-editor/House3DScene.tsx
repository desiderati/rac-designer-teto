import { useMemo, useRef } from 'react';
import { Group } from 'three';
import { Cylinder, Line } from '@react-three/drei';
import * as THREE from 'three';
import { HouseType, PilotiData, HouseElement } from '@/lib/house-manager';

// ============================================
// CONSTANTES — derivadas de canvas-utils.ts
// s = 0.6 (SCALE_2D), MODEL_SCALE = 0.5
// ============================================
const SCALE_2D = 0.6;
const MODEL_SCALE = 0.5;
const S = SCALE_2D * MODEL_SCALE; // 0.3

// Corpo
const HOUSE_WIDTH = 610 * S;    // 183
const HOUSE_DEPTH = 300 * S;    // 90
const BODY_HEIGHT = 273 * S;    // 81.9

// Telhado — valores de canvas-utils createFrontView
// diagH1 = 213*s → altura dos cantos laterais acima da base das diagonais
// diagH2 = 261*s → altura total da seção diagonal (do topo da parede até o pico)
// diagW  = 244*s → largura de cada diagonal (40% da largura total)
// chapelW = 122*s → largura da seção central / chapel (20%)
//
// A polyline bodyStroke mostra o perfil frontal:
//   (0, bodyH - diagH1)  → canto esquerdo DO TELHADO (quina lateral)
//   (bodyW/2, 0)         → pico central (absoluto topo)
//   (bodyW, bodyH-diagH1)→ canto direito DO TELHADO
//   (bodyW, bodyH)       → base dir
//   (0, bodyH)           → base esq
//
// Logo:
//   wallEdgeH = diagH1   → quanto o canto lateral sobressai da parede
//   peakH     = diagH1   → altura do pico acima do topo da parede
//   (os cantos laterais ficam EXATAMENTE no topo da parede, y = bodyH - diagH1 = bodyH - diagH1)
//   Mas bodyH - diagH1 = 81.9 - 63.9 = 18 → o canto fica a 18 unidades ABAIXO da parede
//   Então: wallEdgeH = -(diagH1 - bodyH) ... não.
//
// Reanalisando: no sistema Y da canvas (Y cresce para baixo):
//   y = 0       → topo absoluto (pico)
//   y = bodyH   → base da parede (chão)
//   y = bodyH - diagH1 = 18 → canto lateral, a 18 de cima, a diagH1 do topo
//
// No sistema 3D (Y cresce para cima):
//   base da parede (topo da parede) = roofBaseY = HOUSE_BASE_Y + BODY_HEIGHT
//   pico = roofBaseY + diagH1  (diagH1 acima do topo da parede)
//   cantos laterais = roofBaseY + 0  (no topo da parede — pois bodyH - diagH1 = 18 e o canto está a diagH1=63.9 do topo)
//   ESPERA: a quina lateral está em y_canvas = bodyH - diagH1 que é 18 do topo.
//   Em 3D: canto lateral = roofBaseY + (bodyH - (bodyH - diagH1)) = roofBaseY + diagH1??? Não.
//   
//   Mapeamento canvas→3D para Y: y3D = roofBaseY + (bodyH - y_canvas)
//     canto lateral: y3D = roofBaseY + (bodyH - (bodyH - diagH1)) = roofBaseY + diagH1? 
//     Mas diagH1 = 63.9 que é quase a mesma altura que BODY_HEIGHT = 81.9...
//     
//   Correto: y_canvas = bodyH - diagH1 → distância do TOPO = diagH1 = 63.9
//            altura acima da BASE = bodyH - (bodyH - diagH1) = diagH1 = 63.9
//            
//   Então cantos laterais ficam a diagH1=63.9 acima da base da parede.
//   O pico fica a bodyH=81.9 acima da base da parede.
//   
//   CONCLUSÃO:
//     WALL_EDGE_H = diagH1 = 213 * S  (cantos laterais, acima do topo da parede)
//     PEAK_H      = bodyH  = 273 * S  (pico central, acima do topo da parede)
//     Pico está diagH1 unidades acima das quinas laterais: 81.9 - 63.9 = 18
//
const DIAG_H1 = 213 * S;   // 63.9 — canto lateral do telhado acima da base da parede
const DIAG_H2 = 261 * S;   // 78.3 — não é mais necessário diretamente
const DIAG_W  = 244 * S;   // 73.2 — largura das diagonais laterais
const CHAPEL_W = 122 * S;  // 36.6 — largura da chapel central

// Altura da quina lateral do telhado acima do topo da parede = DIAG_H1
// Altura do pico central acima do topo da parede = BODY_HEIGHT (pois a parede se "funde" com o telhado na vista frontal)
// Para simplificar a geometria 3D:
const ROOF_WALL_EDGE_H = DIAG_H1;   // 63.9 — cantos laterais acima de roofBaseY
const ROOF_PEAK_H      = 273 * S;   // = BODY_HEIGHT = 81.9 — pico acima de roofBaseY

// Pilotis
const COLUMN_DISTANCE = 155 * S;   // 46.5
const ROW_DISTANCE    = 135 * S;   // 40.5
const PILOTI_RADIUS   = 15 * S;    // 4.5
const PILOTI_BASE_HEIGHT = 60 * MODEL_SCALE; // 30
const HOUSE_BASE_Y = PILOTI_BASE_HEIGHT;     // 30

// Terreno
const TERRAIN_EXT = 80;
const TERRAIN_SUBDIVISIONS = 20;

// ============================================
// CORES
// ============================================
const COLORS = {
  roofLight: '#a8b8c4',    // diagonal esq/dir
  roofDark: '#8a9ea8',     // chapel central
  roofEdge: '#5a6a74',
  pilotiNormal: '#d4d4d4',
  pilotiMaster: '#c4905a',
  edge: '#333333',
  terrain: '#7da86d',
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
// TERRENO — cálculo de altura
// ============================================

/**
 * Calcula a altura Y do terreno em um canto de piloti.
 * nivel é a distância em metros do topo do piloti até o terreno.
 * 1 metro = PILOTI_BASE_HEIGHT unidades 3D.
 * terrainY = HOUSE_BASE_Y - nivel * PILOTI_BASE_HEIGHT
 */
function getCornerTerrainY(pilotis: Record<string, PilotiData>, col: number, row: number): number {
  const id = `piloti_${col}_${row}`;
  const data = pilotis[id] ?? { height: 1.0, nivel: 0.2, isMaster: false };
  return HOUSE_BASE_Y - data.nivel * PILOTI_BASE_HEIGHT;
}

/**
 * Interpolação bilinear do Y do terreno para qualquer posição na grade.
 * u = col/3 (0=esq, 1=dir), v = row/2 (0=frente, 1=trás)
 */
function interpolateTerrainY(pilotis: Record<string, PilotiData>, col: number, row: number): number {
  const yA1 = getCornerTerrainY(pilotis, 0, 0); // frente-esq
  const yA4 = getCornerTerrainY(pilotis, 3, 0); // frente-dir
  const yC1 = getCornerTerrainY(pilotis, 0, 2); // trás-esq
  const yC4 = getCornerTerrainY(pilotis, 3, 2); // trás-dir

  const u = col / 3;
  const v = row / 2;

  return (
    (1 - u) * (1 - v) * yA1 +
    u       * (1 - v) * yA4 +
    (1 - u) * v       * yC1 +
    u       * v       * yC4
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
  // X: col 0 = esquerda (-), col 3 = direita (+)
  const x = (col - 1.5) * COLUMN_DISTANCE;
  // Z: row 0 = frente (+hd), row 2 = trás (-hd)
  const z = (1 - row) * ROW_DISTANCE;
  return [x, 0, z];
}

// ============================================
// PILOTI 3D — base toca o terreno, topo em HOUSE_BASE_Y
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

  const visualHeight = Math.max(HOUSE_BASE_Y - terrainY, 0.5);
  const yCenter = terrainY + visualHeight / 2;

  return (
    <group position={[x, yCenter, z]}>
      <Cylinder args={[PILOTI_RADIUS, PILOTI_RADIUS, visualHeight, 12]} castShadow receiveShadow>
        <meshStandardMaterial color={color} />
      </Cylinder>
    </group>
  );
}

// ============================================
// TERRENO — malha bilinear com subdivisões
// ============================================
function Terrain({ pilotis }: { pilotis: Record<string, PilotiData> }) {
  const yA1 = getCornerTerrainY(pilotis, 0, 0);
  const yA4 = getCornerTerrainY(pilotis, 3, 0);
  const yC1 = getCornerTerrainY(pilotis, 0, 2);
  const yC4 = getCornerTerrainY(pilotis, 3, 2);

  const geometry = useMemo(() => {
    const N = TERRAIN_SUBDIVISIONS;
    const totalWidth  = HOUSE_WIDTH  + 2 * TERRAIN_EXT;
    const totalDepth  = HOUSE_DEPTH  + 2 * TERRAIN_EXT;

    // PlaneGeometry na orientação XY; rotacionamos -PI/2 em X → Y vira Z (profundidade), Z vira Y (altura)
    // j=0 → y = +totalDepth/2 do plano → após rotação → Z+ = FRENTE → row 0 (A)
    // j=N-1 → y = -totalDepth/2 do plano → após rotação → Z- = TRÁS  → row 2 (C)
    const geo = new THREE.PlaneGeometry(totalWidth, totalDepth, N - 1, N - 1);
    const positions = geo.attributes.position as THREE.BufferAttribute;

    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const idx = j * N + i;
        // u: 0=esq → 1=dir  (mapeia A1→A4 / C1→C4)
        // v: 0=frente(j=0) → 1=trás(j=N-1)
        const u = i / (N - 1);
        const v = j / (N - 1);

        const height =
          (1 - u) * (1 - v) * yA1 +
          u       * (1 - v) * yA4 +
          (1 - u) * v       * yC1 +
          u       * v       * yC4;

        // Z é o eixo normal do PlaneGeometry; após rotação -PI/2 em X, Z passa a ser Y no mundo
        positions.setZ(idx, height);
      }
    }

    positions.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, [yA1, yA4, yC1, yC4]);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial
        color={COLORS.terrain}
        roughness={0.95}
        metalness={0}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ============================================
// ELEMENTO (JANELA / PORTA)
// ============================================
function HouseElement3D({ element }: { element: HouseElement }) {
  const elementWidth  = element.width  * MODEL_SCALE;
  const elementHeight = element.height * MODEL_SCALE;
  const depth = 2;

  const xOffset = element.x * MODEL_SCALE;
  const yOffset = element.y * MODEL_SCALE;

  const hw = HOUSE_WIDTH / 2;
  const hd = HOUSE_DEPTH / 2;

  const yPos = HOUSE_BASE_Y + BODY_HEIGHT - yOffset - elementHeight / 2;

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
      {/* Frame */}
      <mesh>
        <boxGeometry args={[elementWidth + 2, elementHeight + 2, depth * 0.4]} />
        <meshStandardMaterial color={COLORS.elementFrame} />
      </mesh>
    </group>
  );
}

// ============================================
// CORPO DA CASA — paredes + fundo
// ============================================
function HouseBody({ houseType, wallColor }: { houseType: HouseType; wallColor: string }) {
  const hw = HOUSE_WIDTH / 2;
  const hd = HOUSE_DEPTH / 2;
  const BY  = HOUSE_BASE_Y;
  const TOP = BY + BODY_HEIGHT;
  const cy  = BY + BODY_HEIGHT / 2;

  const isOpenLeft = houseType === 'tipo3';

  const walls = useMemo(() => {
    const w: {
      pos: [number, number, number];
      rot: [number, number, number];
      width: number;
      height: number;
      key: string;
    }[] = [
      { pos: [0, cy, hd],  rot: [0, 0, 0],           width: HOUSE_WIDTH, height: BODY_HEIGHT, key: 'front' },
      { pos: [0, cy, -hd], rot: [0, Math.PI, 0],      width: HOUSE_WIDTH, height: BODY_HEIGHT, key: 'back'  },
      { pos: [hw, cy, 0],  rot: [0, Math.PI / 2, 0],  width: HOUSE_DEPTH, height: BODY_HEIGHT, key: 'right' },
    ];
    if (!isOpenLeft) {
      w.push({ pos: [-hw, cy, 0], rot: [0, -Math.PI / 2, 0], width: HOUSE_DEPTH, height: BODY_HEIGHT, key: 'left' });
    }
    return w;
  }, [isOpenLeft, cy, hw, hd]);

  const edges = useMemo(() => {
    const e: [THREE.Vector3, THREE.Vector3][] = [];
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

    // Frente
    e.push([v(-hw, BY, hd), v(hw, BY, hd)]);
    e.push([v(-hw, TOP, hd), v(hw, TOP, hd)]);
    e.push([v(-hw, BY, hd), v(-hw, TOP, hd)]);
    e.push([v(hw, BY, hd), v(hw, TOP, hd)]);

    // Trás
    e.push([v(-hw, BY, -hd), v(hw, BY, -hd)]);
    e.push([v(-hw, TOP, -hd), v(hw, TOP, -hd)]);
    e.push([v(-hw, BY, -hd), v(-hw, TOP, -hd)]);
    e.push([v(hw, BY, -hd), v(hw, TOP, -hd)]);

    // Laterais inferiores
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
      {/* Piso */}
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
// TELHADO — perfil pentagonal extrudido
//
// Vista frontal (canvas-utils bodyStroke):
//   (0, bodyH - diagH1)   → canto esq do telhado (quina lateral)
//   (bodyW/2, 0)          → pico central
//   (bodyW, bodyH-diagH1) → canto dir do telhado
//
// Mapeamento canvas→3D (Y_canvas cresce para baixo, Y_3D cresce para cima):
//   Y_3D = roofBaseY + (bodyH - Y_canvas)
//   canto lateral: Y_canvas = bodyH - diagH1  →  Y_3D = roofBaseY + diagH1
//   pico central:  Y_canvas = 0               →  Y_3D = roofBaseY + bodyH
//
// Portanto:
//   wallEdgeH = DIAG_H1  = 213 * S = 63.9 (cantos laterais acima de roofBaseY)
//   peakH     = BODY_HEIGHT = 273 * S = 81.9 (pico acima de roofBaseY)
//
// Seções horizontais (em X, relativo ao centro):
//   esq: -hw .. -hw + DIAG_W
//   chapel: -hw + DIAG_W .. -hw + DIAG_W + CHAPEL_W  (= -CHAPEL_W/2 .. +CHAPEL_W/2)
//   dir: +hw - DIAG_W .. +hw
// ============================================
function Roof() {
  const hw = HOUSE_WIDTH / 2;
  const hd = HOUSE_DEPTH / 2;
  const roofBaseY  = HOUSE_BASE_Y + BODY_HEIGHT;
  const wallEdgeH  = DIAG_H1;        // 63.9
  const peakH      = BODY_HEIGHT;    // 81.9

  // Pontos do perfil frontal/traseiro no espaço local do grupo (Y relativo a roofBaseY)
  // P1: canto esq inferior (no topo da parede, y_local = 0)
  // P2: quina lateral esq  (y_local = wallEdgeH)
  // P3: pico central       (y_local = peakH)
  // P4: quina lateral dir  (y_local = wallEdgeH)
  // P5: canto dir inferior (y_local = 0)

  // Coordenadas X dos pontos-chave:
  // -hw: canto esq
  // -hw + DIAG_W = chapelLeftX: início da chapel
  // 0: centro (pico)
  // +hw - DIAG_W = chapelRightX: fim da chapel
  // +hw: canto dir
  const chapelLeftX  = -hw + DIAG_W;   // -91.5 + 73.2 = -18.3 ... wait: -hw = -91.5
  const chapelRightX = hw - DIAG_W;

  const geometry = useMemo(() => {
    // Faces do telhado (triângulos no sentido anti-horário visto de fora):
    // Face esq-frente: (-hw, 0, +hd) → (-hw, wallEdgeH, +hd) → (0, peakH, +hd)  [triângulo frontal esq]
    // Face dir-frente: (+hw, 0, +hd) → (0, peakH, +hd) → (+hw, wallEdgeH, +hd)  [triângulo frontal dir]
    // (A frente é um pentágono, construído com 3 triângulos)
    //
    // Para o volume 3D:
    // - Faces frontais (z = +hd): pentágono
    // - Faces traseiras (z = -hd): pentágono (espelho)
    // - Face água esq: trapézio conectando frente/trás (lado -hw a pico)
    // - Face água dir: trapézio espelho
    // - Face topo esq: retângulo horizontal (-hw, wallEdgeH, ±hd)  [borda lateral esq]
    // - Face topo dir: retângulo horizontal (+hw, wallEdgeH, ±hd)  [borda lateral dir]

    const verts: number[] = [];
    const addTri = (
      x1: number, y1: number, z1: number,
      x2: number, y2: number, z2: number,
      x3: number, y3: number, z3: number,
    ) => {
      verts.push(x1, y1, z1, x2, y2, z2, x3, y3, z3);
    };

    const addQuad = (
      x1: number, y1: number, z1: number,
      x2: number, y2: number, z2: number,
      x3: number, y3: number, z3: number,
      x4: number, y4: number, z4: number,
    ) => {
      addTri(x1, y1, z1, x2, y2, z2, x3, y3, z3);
      addTri(x1, y1, z1, x3, y3, z3, x4, y4, z4);
    };

    // ── FACE FRONTAL (z = +hd) — pentágono = 3 triângulos ──
    // triângulo esq: canto-esq-baixo, quina-esq, pico
    addTri(-hw, 0, hd, -hw, wallEdgeH, hd, 0, peakH, hd);
    // triângulo dir: canto-dir-baixo, pico, quina-dir
    addTri(hw, 0, hd, 0, peakH, hd, hw, wallEdgeH, hd);
    // triângulo centro-base: canto-esq-baixo, pico, canto-dir-baixo (fecha o pentágono)
    addTri(-hw, 0, hd, 0, peakH, hd, hw, 0, hd);

    // ── FACE TRASEIRA (z = -hd) — mesma ordem mas invertida para normal correta ──
    addTri(-hw, 0, -hd, 0, peakH, -hd, -hw, wallEdgeH, -hd);
    addTri(hw, 0, -hd, hw, wallEdgeH, -hd, 0, peakH, -hd);
    addTri(-hw, 0, -hd, hw, 0, -hd, 0, peakH, -hd);

    // ── ÁGUA ESQUERDA (de -hw, wallEdgeH a 0, peakH, frente/trás) ──
    addQuad(
      -hw, wallEdgeH,  hd,
       0,  peakH,      hd,
       0,  peakH,     -hd,
      -hw, wallEdgeH, -hd,
    );

    // ── ÁGUA DIREITA (de +hw, wallEdgeH a 0, peakH, frente/trás) ──
    addQuad(
       hw, wallEdgeH, -hd,
        0, peakH,     -hd,
        0, peakH,      hd,
       hw, wallEdgeH,  hd,
    );

    // ── TAMPA LATERAL ESQ (horizontal, -hw entre frente/trás) ──
    addQuad(
      -hw, 0,          hd,
      -hw, wallEdgeH,  hd,
      -hw, wallEdgeH, -hd,
      -hw, 0,         -hd,
    );

    // ── TAMPA LATERAL DIR (horizontal, +hw entre frente/trás) ──
    addQuad(
      hw, 0,          -hd,
      hw, wallEdgeH,  -hd,
      hw, wallEdgeH,   hd,
      hw, 0,           hd,
    );

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
    geo.computeVertexNormals();
    return geo;
  }, [hw, hd, wallEdgeH, peakH]);

  // Arestas do telhado
  const edges = useMemo(() => {
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    const lines: [THREE.Vector3, THREE.Vector3][] = [];

    // Contorno frontal
    lines.push([v(-hw, 0, hd), v(-hw, wallEdgeH, hd)]);
    lines.push([v(-hw, wallEdgeH, hd), v(0, peakH, hd)]);
    lines.push([v(0, peakH, hd), v(hw, wallEdgeH, hd)]);
    lines.push([v(hw, wallEdgeH, hd), v(hw, 0, hd)]);

    // Contorno traseiro
    lines.push([v(-hw, 0, -hd), v(-hw, wallEdgeH, -hd)]);
    lines.push([v(-hw, wallEdgeH, -hd), v(0, peakH, -hd)]);
    lines.push([v(0, peakH, -hd), v(hw, wallEdgeH, -hd)]);
    lines.push([v(hw, wallEdgeH, -hd), v(hw, 0, -hd)]);

    // Cumeeiras
    lines.push([v(0, peakH, hd), v(0, peakH, -hd)]);
    lines.push([v(-hw, wallEdgeH, hd), v(-hw, wallEdgeH, -hd)]);
    lines.push([v(hw, wallEdgeH, hd), v(hw, wallEdgeH, -hd)]);

    return lines;
  }, [hw, hd, wallEdgeH, peakH]);

  // Dois materiais: diagonal (claro) e chapel (escuro)
  // Para diferenciar visualmente as seções, usamos a mesma malha mas com cor uniforme
  // (subdivisão de materiais requereria grupos de material — simplificamos com cor única)

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
      {/* Chapel central — overlay com cor diferente */}
      <ChapelRoof wallEdgeH={wallEdgeH} peakH={peakH} hw={hw} hd={hd} />
      {edges.map((pts, i) => (
        <Line key={i} points={pts} color={COLORS.roofEdge} lineWidth={1.2} />
      ))}
    </group>
  );
}

// ============================================
// CHAPEL — seção central do telhado (cor diferente)
// ============================================
function ChapelRoof({ wallEdgeH, peakH, hw, hd }: {
  wallEdgeH: number;
  peakH: number;
  hw: number;
  hd: number;
}) {
  // A chapel ocupa a seção central: de chapelLeftX a chapelRightX em X
  // Sua forma é um triângulo (vista frontal):
  //   base esq: (chapelLeftX,  wallEdgeH, ±hd)
  //   pico:     (0, peakH, ±hd)
  //   base dir: (chapelRightX, wallEdgeH, ±hd)
  //
  // Como a diagonal já tem wallEdgeH nos cantos internos, a chapel "cresce"
  // do wallEdgeH para cima até o pico em ambas as faces frontais.
  //
  // No volume 3D, a chapel é a faixa central do telhado triangular.
  // Já está incluída na geometria principal (mesma forma).
  // Aqui renderizamos apenas a face frontal/traseira da chapel com cor diferente.

  const chapelLeftX  = -hw + DIAG_W;
  const chapelRightX =  hw - DIAG_W;

  const geometry = useMemo(() => {
    const verts: number[] = [];
    const addTri = (
      x1: number, y1: number, z1: number,
      x2: number, y2: number, z2: number,
      x3: number, y3: number, z3: number,
    ) => verts.push(x1, y1, z1, x2, y2, z2, x3, y3, z3);

    // Face frontal da chapel
    addTri(chapelLeftX, wallEdgeH, hd + 0.5, 0, peakH, hd + 0.5, chapelRightX, wallEdgeH, hd + 0.5);
    // Face traseira
    addTri(chapelLeftX, wallEdgeH, -hd - 0.5, chapelRightX, wallEdgeH, -hd - 0.5, 0, peakH, -hd - 0.5);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
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

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export function House3DScene({
  houseType,
  pilotis,
  elements = [],
  wallColor = '#d4d4d4',
}: House3DSceneProps) {
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
