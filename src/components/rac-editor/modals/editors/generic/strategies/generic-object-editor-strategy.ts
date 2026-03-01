import {Canvas as FabricCanvas, FabricObject, IText} from 'fabric';
import {toCanvasChildrenObjects} from '@/components/lib/canvas/canvas.ts';
import {LINEAR_LABEL_TOP} from '@/components/lib/canvas/factory/elements/shared.ts';
import {CANVAS_ELEMENT_STYLE} from '@/shared/config.ts';

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
      const groupChildren = toCanvasChildrenObjects(object);
      groupChildren.forEach((child) => {
        if (child.myType !== 'wallLabel') {
          child.set({stroke: color || CANVAS_ELEMENT_STYLE.strokeColor.wallElement});
        }
      });

      const existingLabel =
        groupChildren.find((child) => child.myType === 'wallLabel') as IText | undefined;
      if (!existingLabel) return;

      updateLabel({
        labelObject: existingLabel,
        defaultTop: 0,
        text: label,
        color: color || CANVAS_ELEMENT_STYLE.strokeColor.wallElement
      });
      canvas.requestRenderAll();
    },
    getInfoMessage: () => 'Objeto atualizado.',
  };
}

function createLinearStrategy(kind: 'line' | 'arrow' | 'distance'): GenericObjectEditorStrategy {
  return {
    kind,

    apply: ({canvas, object, color, label}) => {
      const groupChildren = toCanvasChildrenObjects(object);
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
      return 'Distância atualizada.';
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
