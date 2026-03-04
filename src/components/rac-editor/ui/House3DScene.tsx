import {useMemo} from 'react';
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  MathUtils,
  PlaneGeometry,
  Quaternion,
  Vector3,
} from 'three';
import {DEFAULT_HOUSE_PILOTI, House3DElement, type HousePiloti, type HouseType} from '@/shared/types/house.ts';
import {
  BODY_PROFILE_HEIGHT,
  CHAPEL_WIDTH,
  COLORS,
  CONTRAVENTAMENTO_SQUARE_WIDTH,
  CONTRAVENTAMENTO_TOP_WIDTH,
  DIAG_HEIGHT,
  DIAG_WIDTH,
  FLOOR_BEAM_HEIGHT,
  FLOOR_BEAM_ROWS_Z,
  FLOOR_BEAM_STRIP_DEPTH,
  FLOOR_HEIGHT,
  HOUSE_3D_DEPTH,
  HOUSE_3D_FINAL_SCALE,
  HOUSE_3D_VIEWER_SCALE,
  HOUSE_3D_WIDTH,
  PANEL_OFFSET_RATIO,
  PILOTI_BASE_HEIGHT_PX,
  PILOTI_RADIUS,
  PILOTI_STEP_X,
  PILOTI_STEP_Z,
  PILOTI_TOP_Y,
  ROOF_BASE_Y,
  ROOF_LONG_SIDE_OVERHANG,
  ROOF_SHORT_SIDE_OVERHANG,
  ROOF_TOP_Y,
  ROOF_WAVE_AMPLITUDE,
  ROOF_WAVE_PITCH,
  ROOF_WAVE_SEGMENTS_X,
  ROOF_WAVE_SEGMENTS_Z,
  TERRAIN_MARGIN,
  TERRAIN_SEGMENTS,
  TERRAIN_THICKNESS,
  WALL_BASE_Y,
  WALL_HEIGHT,
  WALL_THICKNESS,
} from '@/components/rac-editor/lib/3d/constants.ts';
import {
  buildHouseElementsFromCanvasModel,
} from '@/components/rac-editor/lib/3d/house-elements-parser.ts';
import {Contraventamento3DData} from '@/components/rac-editor/lib/3d/contraventamento-parser.ts';
import {Stairs3DData} from '@/components/rac-editor/lib/3d/stairs-parser.ts';
import {resolvePilotiHeightSegments} from '@/components/rac-editor/lib/3d/piloti-parser.ts';
import {PILOTI_MASTER_FILL_COLOR} from '@/shared/constants.ts';
import {ALL_PILOTI_IDS, HOUSE_3D_WALL_COLORS, PILOTI_CORNER_ID} from '@/shared/config.ts';
import {resolveContraventamentoOffsetFromNivel} from '@/shared/types/contraventamento.ts';

interface House3DSceneProps {
  houseType: HouseType;
  pilotis: Record<string, HousePiloti>;
  contraventamentos?: Contraventamento3DData[];
  stairs?: Stairs3DData;
  wallColor?: string;
  tipo6FrontSide?: 'top' | 'bottom' | null;
  tipo3OpenSide?: 'left' | 'right' | null;
  hideBelowTerrain?: boolean;
}

const MIN_HIDE_BELOW_TERRAIN_NIVEL = 0.5;
const STAIR_FACE_GAP = 0.35;

export function House3DScene({
  houseType,
  pilotis,
  contraventamentos = [],
  stairs = null,
  wallColor = HOUSE_3D_WALL_COLORS.sceneFallbackColor,
  tipo6FrontSide = null,
  tipo3OpenSide = null,
  hideBelowTerrain = false,
}: House3DSceneProps) {

  const houseElements = useMemo(
    () => buildHouseElementsFromCanvasModel(houseType, tipo6FrontSide, tipo3OpenSide),
    [houseType, tipo6FrontSide, tipo3OpenSide],
  );
  if (!houseType) return null;

  return (
    <group>
      <TerrainMesh pilotis={pilotis} margin={stairs.stairHeightMts * 100 * HOUSE_3D_VIEWER_SCALE}/>

      {ALL_PILOTI_IDS.map((pilotiId) => (
        <PilotiMesh
          key={pilotiId}
          pilotiId={pilotiId}
          pilotis={pilotis}
          hideBelowTerrain={hideBelowTerrain}
        />
      ))}

      {contraventamentos.map((contraventamento) => (
        <ContraventamentoMesh key={contraventamento.id} contraventamento={contraventamento} pilotis={pilotis}/>
      ))}

      <HouseMesh wallColor={wallColor}/>

      {houseElements.map((element) => (
        <HouseElementMesh key={element.id} element={element}/>
      ))}

      {stairs && <StairsMesh stairs={stairs}/>}
    </group>
  );
}

function StairsMesh({stairs}: { stairs: Stairs3DData }) {
  const stepCount = Math.round(stairs.stepCount);
  if (!Number.isFinite(stepCount) || stepCount <= 0) return null;

  let stairWidth = Math.max(stairs.stairWidth * HOUSE_3D_VIEWER_SCALE, 1);
  if (!Number.isFinite(stairWidth) || stairWidth <= 0) return null;

  const placement =
    useMemo(() => computeStairs3DPlacement(stairs), [stairs]);

  const plankThickness = 2;
  const stringerThickness = plankThickness
  stairWidth += (stringerThickness * 2) * 1.25; // 1.25 = Para as vigas laterais da escada nâo baterem na porta!

  const stepDepth = placement.totalHeight3D / stepCount;
  const plankWidth = stairWidth - (stringerThickness * 2);

  // Build steps and stringers
  const steps = useMemo(() => {
    const result: Array<{ y: number; z: number }> = [];
    for (let i = 0; i < stepCount; i++) {
      const t = i / stepCount;
      const y = t * placement.totalHeight3D + stepDepth - plankThickness;
      const z = plankThickness + (stepCount - 1 - i) * stepDepth;
      result.push({y, z});
    }
    return result;
  }, [stepCount, placement, stepDepth]);

  // Stringer geometry: inclined beam from bottom to top
  const stringerLength = Math.sqrt(
    placement.totalDepth3D * placement.totalHeight3D +
    placement.totalDepth3D * placement.totalHeight3D,
  ) + (plankThickness * 5);

  const stringerAngle = Math.atan2(placement.totalDepth3D, placement.totalHeight3D);
  const stringerCenterY = (placement.topY - placement.bottomY) / 2;
  const stringerCenterZ = placement.totalHeight3D / 2;
  const stringerHeight = stepDepth * 0.85; // Para a viga lateral seja 0.85 da profundidade do degrau.

  return (
    <group position={[placement.position.x, placement.position.y, placement.position.z]}
           rotation={[0, placement.rotationY, 0]}>
      {/* Step planks */}
      {steps.map((step, i) => (
        <mesh
          key={`step-${i}`}
          position={[0, step.y, step.z]}
          castShadow
          receiveShadow
        >
          {/* 0.85 para que os degraus não fiquem muito grandes e ultrapassem as vigas laterias da escada. */}
          <boxGeometry args={[plankWidth, plankThickness, stepDepth * 0.85]}/>
          <meshStandardMaterial color={COLORS.stairsTread} roughness={0.7}/>
        </mesh>
      ))}

      {/* Left stringer */}
      <mesh
        position={[
          -(stairWidth / 2) + stringerThickness / 2,
          stringerCenterY,
          stringerCenterZ,
        ]}
        rotation={[stringerAngle - Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[stringerThickness, stringerLength, stringerHeight]}/>
        <meshStandardMaterial color={COLORS.stairsStinger} roughness={0.7}/>
      </mesh>

      {/* Right stringer */}
      <mesh
        position={[
          (stairWidth / 2) - stringerThickness / 2,
          stringerCenterY,
          stringerCenterZ,
        ]}
        rotation={[stringerAngle - Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[stringerThickness, stringerLength, stringerHeight]}/>
        <meshStandardMaterial color={COLORS.stairsStinger} roughness={0.7}/>
      </mesh>
    </group>
  );
}

function TerrainMesh({
  pilotis,
  margin,
}: {
  pilotis: Record<string, HousePiloti>;
  margin: number;
}) {
  const topGeometry = useMemo(() => {
    const width = HOUSE_3D_WIDTH + TERRAIN_MARGIN + margin;
    const depth = HOUSE_3D_DEPTH + TERRAIN_MARGIN + margin;

    const geo = new PlaneGeometry(width, depth, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS);
    const positions = geo.attributes.position as BufferAttribute;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const u = 1 - (x + HOUSE_3D_WIDTH / 2) / HOUSE_3D_WIDTH;
      const v = (y + HOUSE_3D_DEPTH / 2) / HOUSE_3D_DEPTH;
      positions.setZ(i, getTerrainYByUV(pilotis, u, v));
    }

    positions.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, [pilotis]);

  const volumeGeometry = useMemo(
    () => createTerrainVolumeGeometry(topGeometry, TERRAIN_SEGMENTS, TERRAIN_THICKNESS),
    [topGeometry],
  );

  return (
    <mesh geometry={volumeGeometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial
        color={COLORS.terrain}
        roughness={2}
        metalness={0}
        side={DoubleSide}
      />
    </mesh>
  );
}

function PilotiMesh({
  pilotiId,
  pilotis,
  hideBelowTerrain,
}: {
  pilotiId: string;
  pilotis: Record<string, HousePiloti>;
  hideBelowTerrain: boolean;
}) {
  const grid = parsePilotiId(pilotiId);
  if (!grid) return null;

  const data = pilotis[pilotiId] ?? DEFAULT_HOUSE_PILOTI;
  const [x, z] = getPilotiTopXZ(grid.col, grid.row);

  // No eixo de 6m (front/back), o UV do terreno segue o índice de coluna direto.
  // Inverter esse eixo aqui causa recorte flipado na ocultação abaixo do terreno.
  const terrainY = resolvePilotiTerrainY({
    pilotis,
    col: grid.col,
    row: grid.row,
    hideBelowTerrain,
  });

  const nominalHeight = (data.height ?? DEFAULT_HOUSE_PILOTI.height) * PILOTI_BASE_HEIGHT_PX;
  const minHeightToTouchTerrain = Math.max(PILOTI_TOP_Y - terrainY, 0);
  const {visibleHeight, topVisibleHeight, bottomVisibleHeight} = resolvePilotiHeightSegments({
    nominalHeight,
    minHeightToTouchTerrain,
    hideBelowTerrain,
    minVisibleHeightWhenHidden: MIN_HIDE_BELOW_TERRAIN_NIVEL * PILOTI_BASE_HEIGHT_PX,
  });
  if (visibleHeight <= 0) return null;

  const centerY = PILOTI_TOP_Y - visibleHeight / 2;
  const topColor = data.isMaster ? PILOTI_MASTER_FILL_COLOR : COLORS.piloti;

  return (
    <group position={[x, centerY, z]}>
      {bottomVisibleHeight > 0 && (
        <mesh position={[0, -topVisibleHeight / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[PILOTI_RADIUS, PILOTI_RADIUS, bottomVisibleHeight, 16]}/>
          <meshStandardMaterial color={COLORS.pilotiLower} roughness={0.65}/>
        </mesh>
      )}

      {topVisibleHeight > 0 && (
        <mesh position={[0, bottomVisibleHeight / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[PILOTI_RADIUS, PILOTI_RADIUS, topVisibleHeight, 16]}/>
          <meshStandardMaterial color={topColor} roughness={0.65}/>
        </mesh>
      )}
    </group>
  );
}

function ContraventamentoMesh({
  contraventamento,
  pilotis,
}: {
  contraventamento: Contraventamento3DData;
  pilotis: Record<string, HousePiloti>;
}) {
  const {col, startRow, endRow, side, anchorPilotiId} = contraventamento;
  if (!Number.isInteger(col) || col < 0 || col > 3) return null;
  if (!Number.isInteger(startRow) || !Number.isInteger(endRow)) return null;

  const anchorGrid = parsePilotiId(anchorPilotiId);
  const originCol = anchorGrid?.col ?? col;
  const originRow = anchorGrid?.row ?? startRow;
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
  const beamCenterX = tangentX + sideSign * (CONTRAVENTAMENTO_TOP_WIDTH / 2);

  const originNivel = Number(pilotis[originPilotiId]?.nivel ?? DEFAULT_HOUSE_PILOTI.nivel);
  const originY =
    PILOTI_TOP_Y - (originNivel - resolveContraventamentoOffsetFromNivel(originNivel, true)) * PILOTI_BASE_HEIGHT_PX;

  const destinationPilotiId = `piloti_${originCol}_${targetRow}`;
  const destinationNivel = Number(pilotis[destinationPilotiId]?.nivel ?? DEFAULT_HOUSE_PILOTI.nivel);
  const destinationY =
    PILOTI_TOP_Y - resolveContraventamentoOffsetFromNivel(destinationNivel, false) * PILOTI_BASE_HEIGHT_PX;

  const startPoint = new Vector3(beamCenterX, originY, originZ);
  const endPoint = new Vector3(beamCenterX, destinationY, targetZ);
  const direction = endPoint.clone().sub(startPoint);
  const length = direction.length();
  if (!Number.isFinite(length) || length <= 0.01) return null;

  direction.normalize();
  const orientation =
    new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction);

  const midpoint = startPoint.add(endPoint).multiplyScalar(0.5);
  const beamColor = COLORS.piloti;

  return (
    <mesh
      position={[midpoint.x, midpoint.y, midpoint.z]}
      quaternion={[orientation.x, orientation.y, orientation.z, orientation.w]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[CONTRAVENTAMENTO_TOP_WIDTH, length, CONTRAVENTAMENTO_SQUARE_WIDTH]}/>
      <meshStandardMaterial color={beamColor} roughness={0.65}/>
    </mesh>
  );
}

function HouseMesh({wallColor}: { wallColor: string }) {
  const wallCenterY = WALL_BASE_Y + WALL_HEIGHT / 2;

  return (
    <group>
      {FLOOR_BEAM_ROWS_Z.map((z) => (
        <mesh key={`floor-beam-${z}`} position={[0, PILOTI_TOP_Y + FLOOR_BEAM_HEIGHT / 2, z]} castShadow receiveShadow>
          <boxGeometry args={[HOUSE_3D_WIDTH, FLOOR_BEAM_HEIGHT, FLOOR_BEAM_STRIP_DEPTH]}/>
          <meshStandardMaterial color={COLORS.beam}/>
        </mesh>
      ))}

      <mesh position={[0, PILOTI_TOP_Y + FLOOR_BEAM_HEIGHT + FLOOR_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[HOUSE_3D_WIDTH, FLOOR_HEIGHT, HOUSE_3D_DEPTH]}/>
        <meshStandardMaterial color={COLORS.floor}/>
      </mesh>

      <mesh position={[-HOUSE_3D_WIDTH / 2 + WALL_THICKNESS / 2, wallCenterY, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, HOUSE_3D_DEPTH]}/>
        <meshStandardMaterial color={wallColor}/>
      </mesh>

      <mesh position={[HOUSE_3D_WIDTH / 2 - WALL_THICKNESS / 2, wallCenterY, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, HOUSE_3D_DEPTH]}/>
        <meshStandardMaterial color={wallColor}/>
      </mesh>

      <FrontBackPanels wallColor={wallColor}/>

      <RoofMesh/>
    </group>
  );
}

function FrontBackPanels({wallColor}: { wallColor: string }) {
  const panelOffset = PANEL_OFFSET_RATIO;
  const sidePanelColor = offsetLightness(wallColor, 0.04);

  const leftDiagGeo = useMemo(
    () =>
      createFrontBackPanelGeometry([
        [0, BODY_PROFILE_HEIGHT - WALL_HEIGHT],
        [DIAG_WIDTH, BODY_PROFILE_HEIGHT - DIAG_HEIGHT],
        [DIAG_WIDTH, BODY_PROFILE_HEIGHT],
        [0, BODY_PROFILE_HEIGHT],
      ]),
    [],
  );

  const chapelGeo = useMemo(
    () =>
      createFrontBackPanelGeometry([
        [DIAG_WIDTH, BODY_PROFILE_HEIGHT - DIAG_HEIGHT],
        [DIAG_WIDTH + CHAPEL_WIDTH / 2, 0],
        [DIAG_WIDTH + CHAPEL_WIDTH, BODY_PROFILE_HEIGHT - DIAG_HEIGHT],
        [DIAG_WIDTH + CHAPEL_WIDTH, BODY_PROFILE_HEIGHT],
        [DIAG_WIDTH, BODY_PROFILE_HEIGHT],
      ]),
    [],
  );

  const rightDiagGeo = useMemo(
    () =>
      createFrontBackPanelGeometry([
        [DIAG_WIDTH + CHAPEL_WIDTH, BODY_PROFILE_HEIGHT - DIAG_HEIGHT],
        [HOUSE_3D_WIDTH, BODY_PROFILE_HEIGHT - WALL_HEIGHT],
        [HOUSE_3D_WIDTH, BODY_PROFILE_HEIGHT],
        [DIAG_WIDTH + CHAPEL_WIDTH, BODY_PROFILE_HEIGHT],
      ]),
    [],
  );

  return (
    <>
      <group position={[0, WALL_BASE_Y, HOUSE_3D_DEPTH / 2 + panelOffset]}>
        <mesh geometry={leftDiagGeo} castShadow receiveShadow>
          <meshStandardMaterial color={sidePanelColor} side={DoubleSide}/>
        </mesh>
        <mesh geometry={chapelGeo} castShadow receiveShadow>
          <meshStandardMaterial color={sidePanelColor} side={DoubleSide}/>
        </mesh>
        <mesh geometry={rightDiagGeo} castShadow receiveShadow>
          <meshStandardMaterial color={sidePanelColor} side={DoubleSide}/>
        </mesh>
      </group>

      <group position={[0, WALL_BASE_Y, -HOUSE_3D_DEPTH / 2 - panelOffset]} rotation={[0, Math.PI, 0]}>
        <mesh geometry={leftDiagGeo} castShadow receiveShadow>
          <meshStandardMaterial color={sidePanelColor} side={DoubleSide}/>
        </mesh>
        <mesh geometry={chapelGeo} castShadow receiveShadow>
          <meshStandardMaterial color={sidePanelColor} side={DoubleSide}/>
        </mesh>
        <mesh geometry={rightDiagGeo} castShadow receiveShadow>
          <meshStandardMaterial color={sidePanelColor} side={DoubleSide}/>
        </mesh>
      </group>
    </>
  );
}

function RoofMesh() {
  const geometry = useMemo(() => {
    const hw = HOUSE_3D_WIDTH / 2;
    const hwRoof = hw + ROOF_SHORT_SIDE_OVERHANG;
    const hdRoof = HOUSE_3D_DEPTH / 2 + ROOF_LONG_SIDE_OVERHANG;
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

    const roofGeometry = new BufferGeometry();
    roofGeometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
    roofGeometry.setIndex(indices);
    roofGeometry.computeVertexNormals();
    return roofGeometry;
  }, []);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={COLORS.roof} roughness={0.9} metalness={0.04} side={DoubleSide}/>
    </mesh>
  );
}

function HouseElementMesh({element}: { element: House3DElement }) {
  const elementWidth = Math.max(element.width * HOUSE_3D_VIEWER_SCALE, 1);
  const elementHeight = Math.max(element.height * HOUSE_3D_VIEWER_SCALE, 1);
  const elementDepth = 2;
  const frameDepth = elementDepth * 0.2;
  const fillDepth = elementDepth * 0.26;
  const fillOffset = frameDepth / 2 + fillDepth / 2 + 0.03;
  const frontBackGap = 0.08;

  const xOffset = element.x * HOUSE_3D_VIEWER_SCALE;
  const yOffset = element.y * HOUSE_3D_VIEWER_SCALE;

  const hw = HOUSE_3D_WIDTH / 2;
  const hd = HOUSE_3D_DEPTH / 2;
  const faceProfileHeight =
    element.face === 'left' || element.face === 'right' ? WALL_HEIGHT : BODY_PROFILE_HEIGHT;

  const y = WALL_BASE_Y + faceProfileHeight - yOffset - elementHeight / 2;

  let position: [number, number, number] = [0, 0, 0];
  let rotation: [number, number, number] = [0, 0, 0];

  switch (element.face) {
    case 'front':
      position = [xOffset - hw + elementWidth / 2, y, hd + PANEL_OFFSET_RATIO + elementDepth / 2 + frontBackGap];
      break;

    case 'back':
      position = [hw - xOffset - elementWidth / 2, y, -hd - PANEL_OFFSET_RATIO - elementDepth / 2 - frontBackGap];
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
        <boxGeometry args={[elementWidth + 1.4, elementHeight + 1.4, frameDepth]}/>
        <meshBasicMaterial color={COLORS.frame}/>
      </mesh>
      <mesh position={[0, 0, fillOffset]}>
        <boxGeometry args={[elementWidth, elementHeight, fillDepth]}/>
        <meshBasicMaterial color={fillColor}/>
      </mesh>
    </group>
  );
}

function offsetLightness(hex: string, lightnessOffset: number): string {
  const c = new Color(hex);
  c.offsetHSL(0, 0, lightnessOffset);
  return `#${c.getHexString()}`;
}

function createFrontBackPanelGeometry(points: Array<[number, number]>): BufferGeometry {
  const vertices: number[] = [];
  const normalized =
    points.map(
      ([x, y]) => [x - HOUSE_3D_WIDTH / 2, BODY_PROFILE_HEIGHT - y] as const
    );

  for (let i = 1; i < normalized.length - 1; i++) {
    const [x0, y0] = normalized[0];
    const [x1, y1] = normalized[i];
    const [x2, y2] = normalized[i + 1];
    vertices.push(x0, y0, 0, x1, y1, 0, x2, y2, 0);
  }

  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
  geo.computeVertexNormals();
  return geo;
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

function getCornerNiveis(pilotis: Record<string, HousePiloti>) {
  const a1 = pilotis[PILOTI_CORNER_ID.topLeft]?.nivel ?? DEFAULT_HOUSE_PILOTI.nivel;
  const a4 = pilotis[PILOTI_CORNER_ID.topRight]?.nivel ?? DEFAULT_HOUSE_PILOTI.nivel;
  const c1 = pilotis[PILOTI_CORNER_ID.bottomLeft]?.nivel ?? DEFAULT_HOUSE_PILOTI.nivel;
  const c4 = pilotis[PILOTI_CORNER_ID.bottomRight]?.nivel ?? DEFAULT_HOUSE_PILOTI.nivel;
  return {a1, a4, c1, c4};
}

function getTerrainYByUV(pilotis: Record<string, HousePiloti>, u: number, v: number): number {
  const clampedU = MathUtils.clamp(u, 0, 1);
  const clampedV = MathUtils.clamp(v, 0, 1);
  const {a1, a4, c1, c4} = getCornerNiveis(pilotis);
  const nivel = bilinear(a1, a4, c1, c4, clampedU, clampedV);
  return PILOTI_TOP_Y - nivel * PILOTI_BASE_HEIGHT_PX;
}

function getPilotiTopXZ(col: number, row: number): [number, number] {
  const x = (1.5 - col) * PILOTI_STEP_X;
  const z = (1 - row) * PILOTI_STEP_Z;
  return [x, z];
}

/**
 * Computes the 3D position and dimensions for placing the stair mesh.
 */
export function computeStairs3DPlacement(stairs: Stairs3DData) {
  const stairHeight = stairs.stairHeightMts * 100 * HOUSE_3D_FINAL_SCALE;
  if (!Number.isFinite(stairHeight) || stairHeight <= 0) return null;

  // Total run = total height (45° angle)
  const totalHeight3D = stairs.stairHeightMts * PILOTI_BASE_HEIGHT_PX;
  const topY = WALL_BASE_Y - FLOOR_BEAM_HEIGHT;
  const bottomY = topY - totalHeight3D;

  let position: { x: number, y: number, z: number } = {x: 0, y: 0, z: 0};
  let rotationY = 0;

  const halfWidth = HOUSE_3D_WIDTH / 2;
  const halfDepth = HOUSE_3D_DEPTH / 2;
  const faceOffset = PANEL_OFFSET_RATIO + STAIR_FACE_GAP;

  // Position at the door location on the corresponding face

  const centerFromLeft = stairs.centerFromLeft * HOUSE_3D_VIEWER_SCALE;
  switch (stairs.face) {
    case 'front':
      position = {
        x: centerFromLeft - halfWidth,
        y: WALL_BASE_Y - FLOOR_BEAM_HEIGHT - stairHeight,
        z: halfDepth + faceOffset
      };
      rotationY = 0;
      break;

    case 'back':
      position = {
        x: halfWidth - centerFromLeft,
        y: WALL_BASE_Y - FLOOR_BEAM_HEIGHT - stairHeight,
        z: -halfDepth - faceOffset
      };
      rotationY = Math.PI;
      break;

    case 'left':
      position = {
        x: -halfWidth - faceOffset,
        y: WALL_BASE_Y - FLOOR_BEAM_HEIGHT - stairHeight,
        z: centerFromLeft - halfDepth
      };
      rotationY = -Math.PI / 2;
      break;

    case 'right':
      position = {
        x: halfWidth + faceOffset,
        y: WALL_BASE_Y - FLOOR_BEAM_HEIGHT - stairHeight,
        z: -(centerFromLeft - halfDepth)
      };
      rotationY = Math.PI / 2;
      break;
  }

  return {
    position,
    rotationY,
    totalDepth3D: totalHeight3D,
    totalHeight3D,
    topY,
    bottomY,
  };
}

function resolvePilotiTerrainY(params: {
  pilotis: Record<string, HousePiloti>;
  col: number;
  row: number;
  hideBelowTerrain: boolean;
}): number {
  const centerU = params.col / 3;
  const centerV = params.row / 2;
  const centerY = getTerrainYByUV(params.pilotis, centerU, centerV);
  if (!params.hideBelowTerrain) return centerY;

  // Em terreno íngreme, cortar pelo nível do centro do piloti remove mais do que o necessário.
  // Aqui usamos o menor Y amostrado em múltiplos anéis ao redor do raio do piloti
  // para reduzir sobrecorte visual.
  const du = PILOTI_RADIUS / (PILOTI_STEP_X * 3);
  const dv = PILOTI_RADIUS / (PILOTI_STEP_Z * 2);
  let minY = Number.POSITIVE_INFINITY;
  const ringScales = [0, 0.5, 1];
  const ringSamples = 32;

  ringScales.forEach((scale) => {
    if (scale === 0) {
      const y = getTerrainYByUV(params.pilotis, centerU, centerV);
      if (y < minY) minY = y;
      return;
    }

    for (let i = 0; i < ringSamples; i += 1) {
      const angle = (i / ringSamples) * Math.PI * 2;
      const offsetU = Math.cos(angle) * du * scale;
      const offsetV = Math.sin(angle) * dv * scale;
      const y = getTerrainYByUV(params.pilotis, centerU + offsetU, centerV + offsetV);
      if (y < minY) minY = y;
    }
  });

  return Number.isFinite(minY) ? minY : centerY;
}

function createTerrainVolumeGeometry(
  topGeometry: PlaneGeometry,
  segments: number,
  thickness: number,
): BufferGeometry {
  const topPositions = topGeometry.attributes.position as BufferAttribute;
  const topIndex = topGeometry.index;
  const topVertexCount = topPositions.count;

  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < topVertexCount; i += 1) {
    positions.push(topPositions.getX(i), topPositions.getY(i), topPositions.getZ(i));
  }
  for (let i = 0; i < topVertexCount; i += 1) {
    positions.push(topPositions.getX(i), topPositions.getY(i), topPositions.getZ(i) - thickness);
  }

  const topIndices = topIndex ? Array.from(topIndex.array as Iterable<number>) : [];
  for (let i = 0; i < topIndices.length; i += 3) {
    const a = topIndices[i];
    const b = topIndices[i + 1];
    const c = topIndices[i + 2];
    indices.push(a, b, c);
    indices.push(c + topVertexCount, b + topVertexCount, a + topVertexCount);
  }

  const rowStride = segments + 1;
  const edgeLoop: number[] = [];
  for (let ix = 0; ix <= segments; ix += 1) edgeLoop.push(ix);
  for (let iy = 1; iy <= segments; iy += 1) edgeLoop.push(iy * rowStride + segments);
  for (let ix = segments - 1; ix >= 0; ix -= 1) edgeLoop.push(segments * rowStride + ix);
  for (let iy = segments - 1; iy >= 1; iy -= 1) edgeLoop.push(iy * rowStride);

  for (let i = 0; i < edgeLoop.length; i += 1) {
    const aTop = edgeLoop[i];
    const bTop = edgeLoop[(i + 1) % edgeLoop.length];
    const aBottom = aTop + topVertexCount;
    const bBottom = bTop + topVertexCount;

    indices.push(aTop, bTop, aBottom);
    indices.push(bTop, bBottom, aBottom);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
