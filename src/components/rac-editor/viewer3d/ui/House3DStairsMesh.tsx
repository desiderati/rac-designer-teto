import {useMemo} from 'react';
import {COLORS, HOUSE_3D_VIEWER_SCALE} from '@/components/rac-editor/viewer3d/lib/constants.ts';
import type {Stairs3DData} from '@/components/rac-editor/viewer3d/lib/stairs-parser.ts';
import {computeStairs3DPlacement} from '@/components/rac-editor/viewer3d/lib/scene-geometry.ts';

export function StairsMesh({stairs}: { stairs: Stairs3DData }) {
  const placement = useMemo(() => computeStairs3DPlacement(stairs), [stairs]);
  if (!placement) return null;

  const stepCount = Math.round(stairs.stepCount);
  if (!Number.isFinite(stepCount) || stepCount <= 0) return null;

  let stairWidth = Math.max(stairs.stairWidth * HOUSE_3D_VIEWER_SCALE, 1);
  if (!Number.isFinite(stairWidth) || stairWidth <= 0) return null;

  const plankThickness = 2;
  const stringerThickness = plankThickness;
  stairWidth += (stringerThickness * 2) * 1.25;

  const stepDepth = placement.totalHeight3D / stepCount;
  const plankWidth = stairWidth - (stringerThickness * 2);

  const steps: Array<{ y: number; z: number }> = [];
  for (let index = 0; index < stepCount; index += 1) {
    const progress = index / stepCount;
    const y = progress * placement.totalHeight3D + stepDepth - plankThickness;
    const z = plankThickness + (stepCount - 1 - index) * stepDepth;
    steps.push({y, z});
  }

  const stringerLength = Math.sqrt(
    placement.totalDepth3D * placement.totalHeight3D +
    placement.totalDepth3D * placement.totalHeight3D,
  ) + (plankThickness * 5);

  const stringerAngle = Math.atan2(placement.totalDepth3D, placement.totalHeight3D);
  const stringerCenterY = (placement.topY - placement.bottomY) / 2;
  const stringerCenterZ = placement.totalHeight3D / 2;
  const stringerHeight = stepDepth * 0.85;

  return (
    <group
      position={[placement.position.x, placement.position.y, placement.position.z]}
      rotation={[0, placement.rotationY, 0]}
    >
      {steps.map((step, index) => (
        <mesh
          key={`step-${index}`}
          position={[0, step.y, step.z]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[plankWidth, plankThickness, stepDepth * 0.85]}/>
          <meshStandardMaterial color={COLORS.stairsTread} roughness={0.7}/>
        </mesh>
      ))}

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
