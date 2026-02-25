import type {Canvas as FabricCanvas, FabricObject} from 'fabric';

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

export interface ElementStrategy<TObject extends FabricObject = FabricObject, TOptions = undefined> {
  create(canvas: FabricCanvas, options?: TOptions): TObject;
}
