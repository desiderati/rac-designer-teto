import {useEffect, useMemo, useRef} from 'react';
import type {RefObject} from 'react';
import {OrbitControls, PerspectiveCamera} from '@react-three/drei';
import {useThree} from '@react-three/fiber';
import type {PerspectiveCamera as ThreePerspectiveCamera} from 'three';
import {
  HOUSE_3D_COMPACT_CAMERA_MAX_WIDTH,
} from '@/components/rac-editor/@viewer-3d/lib/constants.ts';
import type {
  House3DDoorFace,
  House3DViewerCameraPose,
  House3DViewerCameraPoseReader,
} from '@/components/rac-editor/@viewer-3d/lib/camera-pose.ts';
import {
  createHouse3DDoorFacingCameraPose,
  readHouse3DViewerCameraPoseFromRuntime,
} from '@/components/rac-editor/@viewer-3d/lib/camera-pose.ts';

interface House3DViewerCameraRigProps {
  doorFace: House3DDoorFace;
  persistedPose: House3DViewerCameraPose | null;
  onCameraPoseReaderChange?: (reader: House3DViewerCameraPoseReader | null) => void;
}

interface OrbitControlsRuntime {
  target?: {
    x?: unknown;
    y?: unknown;
    z?: unknown;
  };
}

export function House3DViewerCameraRig({
  doorFace,
  persistedPose,
  onCameraPoseReaderChange,
}: House3DViewerCameraRigProps) {
  const width = useThree((state) => state.size.width);
  const controlsRef = useRef<OrbitControlsRuntime | null>(null);
  const isCompact = width <= HOUSE_3D_COMPACT_CAMERA_MAX_WIDTH;
  const initialPose = useMemo(
    () => persistedPose ?? createHouse3DDoorFacingCameraPose({doorFace, compact: isCompact}),
    [doorFace, isCompact, persistedPose],
  );

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={initialPose.position}
        fov={initialPose.fov}
        zoom={initialPose.zoom}
      />
      {onCameraPoseReaderChange
        ? <House3DViewerCameraPoseBridge
            controlsRef={controlsRef}
            onCameraPoseReaderChange={onCameraPoseReaderChange}
          />
        : null}
      <OrbitControls
        ref={controlsRef as never}
        enablePan
        enableZoom
        enableRotate
        minDistance={80}
        maxDistance={700}
        target={initialPose.target}
      />
    </>
  );
}

function House3DViewerCameraPoseBridge({
  controlsRef,
  onCameraPoseReaderChange,
}: {
  controlsRef: RefObject<OrbitControlsRuntime | null>;
  onCameraPoseReaderChange: (reader: House3DViewerCameraPoseReader | null) => void;
}) {
  const camera = useThree((state) => state.camera as ThreePerspectiveCamera);

  useEffect(() => {
    onCameraPoseReaderChange(() => readHouse3DViewerCameraPoseFromRuntime(camera, controlsRef.current));
    return () => onCameraPoseReaderChange(null);
  }, [camera, controlsRef, onCameraPoseReaderChange]);

  return null;
}
