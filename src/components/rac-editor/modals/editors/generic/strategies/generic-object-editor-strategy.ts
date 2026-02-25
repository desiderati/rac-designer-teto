import {Canvas as FabricCanvas, FabricObject, Group, IText} from 'fabric';
import {CanvasObject} from '@/components/lib/canvas/canvas.ts';
import {LINEAR_LABEL_TOP} from "@/components/lib/canvas/factory/elements/shared.ts";
import {WALL_DEFAULT_COLOR} from "@/components/lib/canvas/factory/elements/wall.strategy.ts";

export type GenericObjectEditorType = 'wall' | 'line' | 'arrow' | 'distance';

export interface GenericObjectEditorApplyPayload {
  canvas: FabricCanvas;
  object: FabricObject;
  color: string;
  label: string;
}

export interface GenericObjectEditorStrategy {
  kind: GenericObjectEditorType;
  apply: (payload: GenericObjectEditorApplyPayload) => void;
  getInfoMessage: () => string;
}

const genericObjectEditorStrategyRegistry: Record<GenericObjectEditorType, GenericObjectEditorStrategy> = {
  wall: createWallStrategy(),
  line: createLinearStrategy('line'),
  arrow: createLinearStrategy('arrow'),
  distance: createLinearStrategy('distance'),
};

export function getGenericObjectEditorStrategy(kind: GenericObjectEditorType): GenericObjectEditorStrategy {
  return genericObjectEditorStrategyRegistry[kind];
}

function createWallStrategy(): GenericObjectEditorStrategy {
  return {
    kind: 'wall',
    apply: ({canvas, object, color, label}) => {
      const groupChildren = toRuntimeChildren(object);
      groupChildren.forEach((child) => {
        if (child.myType !== 'wallLabel') {
          child.set({stroke: color || WALL_DEFAULT_COLOR});
        }
      });

      const existingLabel =
        groupChildren.find((child) => child.myType === 'wallLabel') as IText | undefined;
      if (!existingLabel) return;

      updateLabel({labelObject: existingLabel, defaultTop: 0, text: label, color: color || WALL_DEFAULT_COLOR});
      canvas.requestRenderAll();
    },
    getInfoMessage: () => 'Objeto atualizado.',
  };
}

function createLinearStrategy(kind: 'line' | 'arrow' | 'distance'): GenericObjectEditorStrategy {
  return {
    kind,

    apply: ({canvas, object, color, label}) => {
      const groupChildren = toRuntimeChildren(object);
      groupChildren.forEach((child) => {
        if (child.type === 'line') {
          child.set({stroke: color});
        } else {
          child.set({fill: color});
        }
      });

      const existingLabel =
        groupChildren.find((child) => child.myType === 'objLabel') as IText | undefined;
      if (!existingLabel) return;

      updateLabel({labelObject: existingLabel, defaultTop: LINEAR_LABEL_TOP, text: label, color});
      canvas.requestRenderAll();
    },

    getInfoMessage: () => {
      if (kind === 'line') return 'Linha atualizada.';
      if (kind === 'arrow') return 'Seta atualizada.';
      if (kind === 'distance') return 'Distância atualizada.';
    },
  };
}

function updateLabel(options: {
  labelObject: IText | undefined;
  defaultTop: number;
  text: string;
  color: string;
}): void {
  const {labelObject, defaultTop, text, color} = options;
  if (!labelObject) return;

  const normalizedTop = typeof labelObject.top === 'number' ? labelObject.top : defaultTop;
  labelObject.set({text, fill: color, visible: true, left: 0, top: normalizedTop, scaleX: 1, scaleY: 1});
}

function toRuntimeChildren(object: FabricObject): CanvasObject[] {
  return (object as Group).getObjects().map(
    (child) => child as CanvasObject
  );
}
