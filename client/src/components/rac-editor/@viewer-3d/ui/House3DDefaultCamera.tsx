import {useThree} from '@react-three/fiber';
import {PerspectiveCamera} from '@react-three/drei';
import {
  HOUSE_3D_CAMERA_FOV,
  HOUSE_3D_CAMERA_POSITION,
  HOUSE_3D_COMPACT_CAMERA_FOV,
  HOUSE_3D_COMPACT_CAMERA_MAX_WIDTH,
  HOUSE_3D_COMPACT_CAMERA_POSITION,
} from '@/components/rac-editor/@viewer-3d/lib/constants.ts';

export function House3DDefaultCamera() {
  const width = useThree((state) => state.size.width);
  const isCompact = width <= HOUSE_3D_COMPACT_CAMERA_MAX_WIDTH;

  return (
    <PerspectiveCamera
      makeDefault
      position={isCompact ? HOUSE_3D_COMPACT_CAMERA_POSITION : HOUSE_3D_CAMERA_POSITION}
      fov={isCompact ? HOUSE_3D_COMPACT_CAMERA_FOV : HOUSE_3D_CAMERA_FOV}
    />
  );
}
