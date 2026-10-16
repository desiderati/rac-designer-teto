import type {Canvas as FabricCanvas} from 'fabric';
import type {SiteElementKey} from '@shared/types/site-element.ts';
import type {CanvasGroup, CanvasObject} from '@/components/rac-editor/@canvas/lib/canvas.ts';

export type ElementStrategyKey = SiteElementKey
  | 'line'
  | 'arrow'
  | 'distance'
  | 'wall'
  | 'streetStraight'
  | 'streetCorner'
  | 'dirtRoad'
  | 'square'
  | 'triangle'
  | 'circle'
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
