import {useMemo} from 'react';
import {BufferAttribute, BufferGeometry, DoubleSide} from 'three';
import {
  BODY_PROFILE_HEIGHT,
  CHAPEL_WIDTH,
  COLORS,
  DIAG_HEIGHT,
  DIAG_WIDTH,
  FLOOR_BEAM_HEIGHT,
  FLOOR_BEAM_ROWS_Z,
  FLOOR_BEAM_STRIP_DEPTH,
  FLOOR_HEIGHT,
  HOUSE_3D_DEPTH,
  HOUSE_3D_VIEWER_SCALE,
  HOUSE_3D_WIDTH,
  PANEL_OFFSET_RATIO,
  PILOTI_TOP_Y,
  ROOF_BASE_Y,
  ROOF_LONG_SIDE_OVERHANG,
  ROOF_SHORT_SIDE_OVERHANG,
  ROOF_TOP_Y,
  ROOF_WAVE_AMPLITUDE,
  ROOF_WAVE_PITCH,
  ROOF_WAVE_SEGMENTS_X,
  ROOF_WAVE_SEGMENTS_Z,
  WALL_BASE_Y,
  WALL_HEIGHT,
  WALL_THICKNESS,
} from '@/components/rac-editor/viewer3d/lib/constants.ts';
import {HOUSE_BASE_WIDTH} from '@/shared/constants.ts';
import type {House3DElement, HouseType} from '@/shared/types/house.ts';
import {
  createFrontBackPanelGeometry,
  offsetLightness,
} from '@/components/rac-editor/viewer3d/lib/scene-geometry.ts';

export function HouseMesh({wallColor, houseType, tipo3OpenSide}: {
  wallColor: string;
  houseType: HouseType;
  tipo3OpenSide?: 'left' | 'right' | null;
}) {
  const wallCenterY = WALL_BASE_Y + WALL_HEIGHT / 2;

  return (
    <group>
      {FLOOR_BEAM_ROWS_Z.map((z) => (
        <mesh key={`floor-beam-${z}`} position={[0, PILOTI_TOP_Y + FLOOR_BEAM_HEIGHT / 2, z]} castShadow receiveShadow>
          <boxGeometry args={[HOUSE_3D_WIDTH, FLOOR_BEAM_HEIGHT, FLOOR_BEAM_STRIP_DEPTH]}/>
          <meshStandardMaterial color={COLORS.beam}/>
        </mesh>
      ))}

      {houseType === 'tipo3' && <DoorReinforcementBeam tipo3OpenSide={tipo3OpenSide}/>}

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

export function HouseElementMesh({element}: { element: House3DElement }) {
  const elementWidth = Math.max(element.width * HOUSE_3D_VIEWER_SCALE, 1);
  const elementHeight = Math.max(element.height * HOUSE_3D_VIEWER_SCALE, 1);
  const elementDepth = 2;
  const frameDepth = elementDepth * 0.2;
  const fillDepth = elementDepth * 0.26;
  const fillOffset = frameDepth / 2 + fillDepth / 2 + 0.03;
  const frontBackGap = 0.08;

  const xOffset = element.x * HOUSE_3D_VIEWER_SCALE;
  const yOffset = element.y * HOUSE_3D_VIEWER_SCALE;

  const halfWidth = HOUSE_3D_WIDTH / 2;
  const halfDepth = HOUSE_3D_DEPTH / 2;
  const faceProfileHeight =
    element.face === 'left' || element.face === 'right' ? WALL_HEIGHT : BODY_PROFILE_HEIGHT;

  const y = WALL_BASE_Y + faceProfileHeight - yOffset - elementHeight / 2;

  let position: [number, number, number] = [0, 0, 0];
  let rotation: [number, number, number] = [0, 0, 0];

  switch (element.face) {
    case 'front':
      position = [xOffset - halfWidth + elementWidth / 2, y, halfDepth + PANEL_OFFSET_RATIO + elementDepth / 2 + frontBackGap];
      break;

    case 'back':
      position = [halfWidth - xOffset - elementWidth / 2, y, -halfDepth - PANEL_OFFSET_RATIO - elementDepth / 2 - frontBackGap];
      rotation = [0, Math.PI, 0];
      break;

    case 'left':
      position = [-halfWidth - elementDepth / 2, y, xOffset - halfDepth + elementWidth / 2];
      rotation = [0, Math.PI / 2, 0];
      break;

    case 'right':
      position = [halfWidth + elementDepth / 2, y, -(xOffset - halfDepth + elementWidth / 2)];
      rotation = [0, -Math.PI / 2, 0];
      break;

    default:
      return null;
  }

  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[elementWidth + 1.4, elementHeight + 1.4, frameDepth]}/>
        <meshBasicMaterial color={COLORS.frame}/>
      </mesh>
      <mesh position={[0, 0, fillOffset]}>
        <boxGeometry args={[elementWidth, elementHeight, fillDepth]}/>
        <meshBasicMaterial color={COLORS.piloti}/>
      </mesh>
    </group>
  );
}

function DoorReinforcementBeam({tipo3OpenSide}: { tipo3OpenSide?: 'left' | 'right' | null }) {
  const openSide = tipo3OpenSide === 'left' || tipo3OpenSide === 'right' ? tipo3OpenSide : 'right';
  const doorCenterZ = (HOUSE_BASE_WIDTH / 4 - FLOOR_BEAM_STRIP_DEPTH) * HOUSE_3D_VIEWER_SCALE;
  const beamX = openSide === 'right' ? doorCenterZ : -doorCenterZ;
  const centerZ = FLOOR_BEAM_ROWS_Z[1];
  const edgeZ = openSide === 'right' ? FLOOR_BEAM_ROWS_Z[2] : FLOOR_BEAM_ROWS_Z[0];
  const beamLength = Math.abs(edgeZ - centerZ);
  const beamCenterZ = (centerZ + edgeZ) / 2;
  const beamY = PILOTI_TOP_Y + FLOOR_BEAM_HEIGHT / 2;

  return (
    <mesh position={[beamX, beamY, beamCenterZ]} castShadow receiveShadow>
      <boxGeometry args={[FLOOR_BEAM_STRIP_DEPTH, FLOOR_BEAM_HEIGHT, beamLength]}/>
      <meshStandardMaterial color={COLORS.beam}/>
    </mesh>
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
    const halfWidth = HOUSE_3D_WIDTH / 2;
    const roofHalfWidth = halfWidth + ROOF_SHORT_SIDE_OVERHANG;
    const roofHalfDepth = HOUSE_3D_DEPTH / 2 + ROOF_LONG_SIDE_OVERHANG;
    const rise = ROOF_TOP_Y - ROOF_BASE_Y;

    const positions: number[] = [];
    const indices: number[] = [];
    const rowStride = ROOF_WAVE_SEGMENTS_Z + 1;

    const appendSheet = (side: -1 | 1) => {
      const baseIndex = positions.length / 3;

      for (let ix = 0; ix <= ROOF_WAVE_SEGMENTS_X; ix += 1) {
        const t = ix / ROOF_WAVE_SEGMENTS_X;
        const x = side === -1 ? -roofHalfWidth + roofHalfWidth * t : roofHalfWidth - roofHalfWidth * t;
        const yBase = ROOF_BASE_Y + rise * t;

        for (let iz = 0; iz <= ROOF_WAVE_SEGMENTS_Z; iz += 1) {
          const s = iz / ROOF_WAVE_SEGMENTS_Z;
          const z = -roofHalfDepth + 2 * roofHalfDepth * s;
          const wave = Math.sin((z / ROOF_WAVE_PITCH) * Math.PI * 2) * ROOF_WAVE_AMPLITUDE;
          positions.push(x, yBase + wave, z);
        }
      }

      for (let ix = 0; ix < ROOF_WAVE_SEGMENTS_X; ix += 1) {
        for (let iz = 0; iz < ROOF_WAVE_SEGMENTS_Z; iz += 1) {
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
