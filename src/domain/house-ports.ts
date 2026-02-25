import type {HouseElementsRepository} from '@/domain/repository/house-elements-repository.ts';
import type {HouseRepository} from '@/domain/repository/house-repository.ts';
import type {HouseViewsRepository} from '@/domain/repository/house-views-repository.ts';

export type HouseViewsPort<TView extends string, TSide extends string, TGroup> =
  HouseViewsRepository<TView, TSide, TGroup>;

export type HouseElementsPort<TElement extends { id: string }> =
  HouseElementsRepository<TElement>;

export type HousePilotiPort = HouseRepository;

export interface HouseCanvasPort<TObject = unknown> {
  getObjects(): TObject[];

  requestRenderAll(): void;

  add(object: TObject): void;

  setActiveObject(object: TObject): void;

  getVpCenter(): { x: number; y: number };

  getWidth(): number;

  getHeight(): number;
}
