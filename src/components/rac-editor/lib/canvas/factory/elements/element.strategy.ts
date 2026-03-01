import type {Canvas as FabricCanvas} from 'fabric';
import type {CanvasGroup, CanvasObject} from '@/components/rac-editor/lib/canvas/canvas.ts';

export type ElementStrategyKey =
  | 'line'
  | 'arrow'
  | 'distance'
  | 'wall'
  | 'water'
  | 'door'
  | 'stairs'
  | 'fossa'
  | 'tree'
  | 'text';

export interface ElementStrategy<
  TGroup extends CanvasGroup = CanvasGroup,
  TObject extends CanvasObject = CanvasObject,
  TOptions = undefined
> {
  create(canvas: FabricCanvas, options?: TOptions): TGroup | TObject;
}
