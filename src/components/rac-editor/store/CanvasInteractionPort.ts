import type {
  CanvasGroup,
  CanvasObject,
  ElementStrategyKey,
} from '@/components/rac-editor/lib/canvas';
import type {EditorScreenPoint} from '@/components/rac-editor/canvas/types.ts';
import type {GenericObjectEditorType} from '@/components/rac-editor/lib/canvas/generic-object-editor-strategy.ts';
import type {HouseSide, HouseViewType} from '@/shared/types/house.ts';
import type {CanvasDebugPort} from '@/components/rac-editor/store/CanvasDebugPort.ts';
import type {CanvasDocumentPort} from '@/components/rac-editor/store/CanvasDocumentPort.ts';
import type {HouseManagerCanvasPort} from '@/components/rac-editor/store/HouseManagerCanvasPort.ts';

/**
 * Porta imperativa exposta pelo canvas para os controladores do editor.
 */
export interface CanvasInteractionPort {
  createHouseManagerCanvasPort(): HouseManagerCanvasPort | null;
  createDocumentPort(): CanvasDocumentPort | null;
  createDebugPort(): CanvasDebugPort | null;
  saveHistory(): void;
  clearHistory(): void;
  undo(): void;
  copy(): void;
  paste(): void;
  createElementObject(kind: ElementStrategyKey): CanvasObject | null;
  createHouseViewGroup(payload: { viewType: HouseViewType; side?: HouseSide }): CanvasGroup | null;
  addObjectAtVisibleCenter(object: CanvasObject): boolean;
  setDrawingModeEnabled(enabled: boolean): boolean;
  resetSurface(): void;
  renderAll(): void;
  getActiveObjectCount(): number;
  deleteActiveObjects(handlers?: {
    canDeleteTopView?: () => boolean;
    onTopViewDeleted?: () => void;
    onHouseViewRemoved?: (group: CanvasGroup | null) => void;
    onBlockedTopViewDelete?: () => void;
  }): 'deleted' | 'blocked' | 'none';
  getCanvasPointScreenPosition(point: EditorScreenPoint): EditorScreenPoint | null;
  getGroupLocalPointScreenPosition(
    group: CanvasGroup,
    localCanvasPoint: EditorScreenPoint,
  ): EditorScreenPoint | null;
  applyGenericObjectEdit(payload: {
    kind: GenericObjectEditorType;
    object: CanvasObject;
    color: string;
    label: string;
  }): string | null;
  applyPilotiEditorCloseVisuals(group: CanvasGroup | null | undefined): void;
  applyPilotiSelectionVisuals(pilotiId: string): void;
  getVisibleCenter(): EditorScreenPoint;
  getCanvasPosition(): { x: number; y: number; zoom: number };
  setCanvasPosition(x: number, y: number): void;
  fitToView(): void;
}

export type CanvasHandle = CanvasInteractionPort;
