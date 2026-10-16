import {Canvas as FabricCanvas, IText} from 'fabric';
import {CanvasObject, toCanvasGroup} from '@/components/rac-editor/@canvas/lib/canvas.ts';
import {LINEAR_LABEL_TOP} from '@/components/rac-editor/@canvas/lib/factory/elements/shared.ts';
import {CANVAS_ELEMENT_STYLE} from '@/shared/config.ts';
import type {GenericCanvasObjectEditorType} from '@/components/rac-editor/@canvas/ports/CanvasSelectionPort.ts';
import {toPastelWallFill} from '@/components/rac-editor/@canvas/lib/factory/elements/wall.strategy.ts';
import {positionShapeLabel} from '@/components/rac-editor/@canvas/lib/factory/elements/shape-label-layout.ts';
import type {SiteLabelEditorType} from '@shared/types/site-element.ts';
import {fitSiteLabel} from './factory/elements/site.strategy.ts';

export type GenericObjectEditorType = GenericCanvasObjectEditorType;

export interface GenericObjectEditorApplyPayload {
  canvas: FabricCanvas;
  object: CanvasObject;
  color: string;
  label: string;
}

export interface GenericObjectEditorStrategy {
  kind: GenericObjectEditorType;
  apply: (payload: GenericObjectEditorApplyPayload) => void;
  getInfoMessage: () => string;
}

const genericObjectEditorStrategyRegistry: Record<GenericObjectEditorType, GenericObjectEditorStrategy> = {
  siteHouse: createSiteStrategy('siteHouse'),
  siteBuilding: createSiteStrategy('siteBuilding'),
  fence: createSiteStrategy('fence'),
  terrainEntry: createSiteStrategy('terrainEntry'),
  wall: createWallStrategy('wall'),
  square: createWallStrategy('square'),
  triangle: createWallStrategy('triangle'),
  circle: createWallStrategy('circle'),
  text: createColorStrategy('text'),
  freehand: createColorStrategy('freehand'),
  line: createLinearStrategy('line'),
  arrow: createLinearStrategy('arrow'),
  distance: createLinearStrategy('distance'),
};

export function getGenericObjectEditorStrategy(kind: GenericObjectEditorType): GenericObjectEditorStrategy {
  return genericObjectEditorStrategyRegistry[kind];
}

function createSiteStrategy(kind: SiteLabelEditorType): GenericObjectEditorStrategy {
  return {
    kind,
    apply: ({canvas, object, color, label}) => {
      const visit = (child: CanvasObject) => {
        if (child.myType === 'siteLabel') {
          child.set({text: label, fill: color, visible: Boolean(label.trim())});
          (child as IText).initDimensions();
        } else {
          if (child.stroke && child.stroke !== 'transparent') child.set({stroke: color});
          if (kind === 'terrainEntry' && child.myType === 'siteBody') child.set({fill: color});
          child.getObjects?.().forEach(visit);
        }
      };
      object.getObjects().forEach(visit);
      if (kind === 'fence') {
        const children = object.getObjects();
        const body = children.find(child => child.myType === 'fenceBody');
        children.find(child => child.myType === 'siteLabel')?.set({
          left: body?.left ?? 0,
          top: (body?.top ?? 0) + (label.trim() ? (body?.height ?? 12) / 2 + 18 : 0),
        });
      }
      const group = toCanvasGroup(object);
      if (group) {fitSiteLabel(group); group.triggerLayout();}
      object.setCoords();
      canvas.requestRenderAll();
    },
    getInfoMessage: () => 'Objeto atualizado.',
  };
}

function createWallStrategy(kind: 'wall' | 'square' | 'triangle' | 'circle'): GenericObjectEditorStrategy {
  return {
    kind,
    apply: ({canvas, object, color, label}) => {
      const groupChildren = object.getObjects();
      const wallColor = color || CANVAS_ELEMENT_STYLE.strokeColor.wallElement;
      groupChildren.forEach((child) => {
        if (child.myType === 'wallBody') {
          child.set({
            stroke: wallColor,
            fill: toPastelWallFill(wallColor),
          });
        } else if (child.myType === 'wallBrick') {
          child.set({fill: wallColor, stroke: toPastelWallFill(wallColor)});
        } else if (child.myType !== 'wallLabel') {
          child.set({stroke: wallColor});
        }
      });

      const existingLabel =
        groupChildren.find((child) => child.myType === 'wallLabel') as IText | undefined;
      if (!existingLabel) return;

      updateLabel({
        labelObject: existingLabel,
        defaultTop: 0,
        text: label,
        color: wallColor
      });
      positionShapeLabel(object, kind);
      canvas.requestRenderAll();
    },
    getInfoMessage: () => 'Objeto atualizado.',
  };
}

function createColorStrategy(kind: 'text' | 'freehand'): GenericObjectEditorStrategy {
  return {
    kind,
    apply: ({canvas, object, color, label}) => {
      if (kind === 'text') {
        object.set({fill: color, text: label});
        (object as IText).initDimensions();
      }
      else object.set({stroke: color});
      object.setCoords();
      canvas.requestRenderAll();
    },
    getInfoMessage: () => kind === 'text' ? 'Texto atualizado.' : 'Desenho atualizado.',
  };
}

function createLinearStrategy(kind: 'line' | 'arrow' | 'distance'): GenericObjectEditorStrategy {
  return {
    kind,

    apply: ({canvas, object, color, label}) => {
      const groupChildren = object.getObjects();
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
