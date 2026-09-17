import type {RefObject} from 'react';
import type {CanvasHandle} from '@/components/rac-editor/@canvas/ports/CanvasHandle.ts';
import type {HouseWritePort} from '@/components/rac-editor/ports/HouseWritePort.ts';

interface RestartActiveHouseDrawingArgs {
  canvasRef: RefObject<CanvasHandle | null>;
  houseWritePort: Pick<HouseWritePort, 'resetHouse' | 'setHouseType'>;
  resetInsertionFlow?: () => void;
}

export function restartActiveHouseDrawing({
  canvasRef,
  houseWritePort,
  resetInsertionFlow,
}: RestartActiveHouseDrawingArgs): void {
  houseWritePort.resetHouse();
  houseWritePort.setHouseType(null);
  resetInsertionFlow?.();
  canvasRef.current?.resetSurface();
}
