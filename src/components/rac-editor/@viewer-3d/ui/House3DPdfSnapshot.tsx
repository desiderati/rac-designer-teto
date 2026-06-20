import {Canvas, useThree} from '@react-three/fiber';
import {forwardRef, Suspense, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState} from 'react';
import type {CSSProperties} from 'react';
import {HOUSE_3D_WALL_COLORS} from '@/shared/config.ts';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/shared/constants.ts';
import {House3DScene} from '@/components/rac-editor/@viewer-3d/ui/House3DScene.tsx';
import {useHouse3DViewerModel} from '@/components/rac-editor/@viewer-3d/hooks/useHouse3DViewerModel.ts';
import type {House3DPdfSnapshotHandle} from '@/components/rac-editor/@viewer-3d/ports/House3DPdfSnapshotHandle.ts';
import {House3DViewerCameraRig} from '@/components/rac-editor/@viewer-3d/ui/House3DViewerCameraRig.tsx';
import {
  createHouse3DDoorFacingLightingPreset,
  getHouse3DViewerCameraPoseStorageKey,
  readHouse3DViewerCameraPose,
  resolveHouse3DDoorFace,
} from '@/components/rac-editor/@viewer-3d/lib/camera-pose.ts';

const SNAPSHOT_WIDTH = 1000;
const SNAPSHOT_HEIGHT = Math.round(SNAPSHOT_WIDTH * (CANVAS_HEIGHT / CANVAS_WIDTH));
const CAPTURE_TIMEOUT_MS = 2200;

const OFFSCREEN_STYLE: CSSProperties = {
  position: 'fixed',
  left: '-10000px',
  top: 0,
  width: SNAPSHOT_WIDTH,
  height: SNAPSHOT_HEIGHT,
  overflow: 'hidden',
  opacity: 0,
  pointerEvents: 'none',
};

interface PendingCapture {
  timeoutId: number;
  resolve: (dataUrl: string | null) => void;
}

interface House3DPdfSnapshotProps {
  activeHouseId: string | null;
}

interface CaptureBridgeProps {
  requestId: number;
  onCapture: (dataUrl: string | null) => void;
}

export const House3DPdfSnapshot = forwardRef<House3DPdfSnapshotHandle, House3DPdfSnapshotProps>(
  function House3DPdfSnapshot({activeHouseId}, ref) {
  const {
    houseType,
    canRenderHouse,
    pilotis,
    tipo6FrontSide,
    tipo3OpenSide,
    contraventamentos,
    stairs,
  } = useHouse3DViewerModel();
  const [captureRequestId, setCaptureRequestId] = useState(0);
  const pendingCaptureRef = useRef<PendingCapture | null>(null);
  const cameraPoseStorageKey = useMemo(
    () => getHouse3DViewerCameraPoseStorageKey(activeHouseId),
    [activeHouseId],
  );
  const persistedCameraPose = useMemo(
    () => readHouse3DViewerCameraPose(cameraPoseStorageKey),
    [cameraPoseStorageKey, captureRequestId],
  );
  const doorFace = useMemo(
    () => resolveHouse3DDoorFace(houseType, tipo6FrontSide, tipo3OpenSide),
    [houseType, tipo3OpenSide, tipo6FrontSide],
  );
  const lightingPreset = useMemo(
    () => createHouse3DDoorFacingLightingPreset(doorFace),
    [doorFace],
  );

  const finishCapture = useCallback((dataUrl: string | null) => {
    const pendingCapture = pendingCaptureRef.current;
    if (!pendingCapture) return;

    window.clearTimeout(pendingCapture.timeoutId);
    pendingCaptureRef.current = null;
    pendingCapture.resolve(dataUrl);
  }, []);

  useImperativeHandle(ref, () => ({
    captureImageDataUrl: () => {
      if (!canRenderHouse) return Promise.resolve(null);

      const currentPendingCapture = pendingCaptureRef.current;
      if (currentPendingCapture) {
        window.clearTimeout(currentPendingCapture.timeoutId);
        currentPendingCapture.resolve(null);
        pendingCaptureRef.current = null;
      }

      return new Promise((resolve) => {
        const timeoutId = window.setTimeout(() => finishCapture(null), CAPTURE_TIMEOUT_MS);
        pendingCaptureRef.current = {timeoutId, resolve};
        setCaptureRequestId((current) => current + 1);
      });
    },
  }), [canRenderHouse, finishCapture]);

  useEffect(() => () => {
    const pendingCapture = pendingCaptureRef.current;
    if (!pendingCapture) return;

    window.clearTimeout(pendingCapture.timeoutId);
    pendingCaptureRef.current = null;
    pendingCapture.resolve(null);
  }, []);

  if (!canRenderHouse) return null;

  return (
    <div aria-hidden='true' style={OFFSCREEN_STYLE}>
      <Suspense fallback={null}>
        <Canvas
          style={{width: SNAPSHOT_WIDTH, height: SNAPSHOT_HEIGHT}}
          shadows
          frameloop='demand'
          gl={{preserveDrawingBuffer: true}}
        >
          <color attach='background' args={['#f8fafc']}/>
          <House3DViewerCameraRig
            doorFace={doorFace}
            persistedPose={persistedCameraPose}
          />

          <ambientLight intensity={0.6}/>
          <directionalLight
            position={lightingPreset.primaryPosition}
            intensity={0.8}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0005}
            shadow-normalBias={0.03}
            shadow-camera-near={20}
            shadow-camera-far={500}
            shadow-camera-left={-260}
            shadow-camera-right={260}
            shadow-camera-top={260}
            shadow-camera-bottom={-260}
          />
          <directionalLight position={lightingPreset.fillPosition} intensity={0.3}/>

          <House3DScene
            houseType={houseType}
            pilotis={pilotis}
            contraventamentos={contraventamentos}
            stairs={stairs}
            wallColor={HOUSE_3D_WALL_COLORS.viewerInitialColor}
            tipo6FrontSide={tipo6FrontSide}
            tipo3OpenSide={tipo3OpenSide}
          />

          <CaptureBridge requestId={captureRequestId} onCapture={finishCapture}/>
        </Canvas>
      </Suspense>
    </div>
  );
});

function CaptureBridge({requestId, onCapture}: CaptureBridgeProps) {
  const {gl, scene, camera, invalidate} = useThree();

  useEffect(() => {
    if (requestId <= 0) return;

    let disposed = false;
    let firstFrame = 0;
    let secondFrame = 0;
    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        if (disposed) return;

        try {
          invalidate();
          gl.render(scene, camera);
          onCapture(gl.domElement.toDataURL('image/png'));
        } catch (error) {
          console.error('[House3DPdfSnapshot] Falha ao capturar imagem 3D:', error);
          onCapture(null);
        }
      });
    });

    return () => {
      disposed = true;
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [camera, gl, invalidate, onCapture, requestId, scene]);

  return null;
}
