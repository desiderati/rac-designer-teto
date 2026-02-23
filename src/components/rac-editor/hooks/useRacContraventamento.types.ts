import {FabricObject, Group} from 'fabric';
import {ContraventamentoSide} from '@/lib/canvas-utils';

export type ContraventamentoStep = 'select-first' | 'select-second';

export interface ContraventamentoOrigin {
  pilotiId: string;
  col: number;
  row: number;
  group: Group;
}

export type ContraventamentoMetaObject = FabricObject & {
  houseView?: string;
  contraventamentoCol?: number | string;
  contraventamentoSide?: ContraventamentoSide;
  left?: number;
  width?: number;
  scaleX?: number;
};
