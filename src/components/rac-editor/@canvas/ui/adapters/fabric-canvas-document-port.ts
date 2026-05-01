import type {Canvas as FabricCanvas} from 'fabric';
import {refreshHouseGroupsOnCanvas} from '@/components/rac-editor/@canvas/lib';
import {canvasObjectProps} from '@/components/rac-editor/@canvas/lib/canvas.ts';
import type {CanvasDocumentPort} from '@/components/rac-editor/@canvas/ports/CanvasDocumentPort.ts';
import {
  HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
  type HouseDrawingCanvasDocument,
  type HouseDrawingElementDocument,
  type HouseDrawingElementGeometry,
  type HouseDrawingPoint,
  isHouseDrawingCanvasDocument,
  isHouseDrawingElementShape,
  type JsonObject,
  type JsonValue,
} from '@/shared/types/house-drawing-document.ts';

const geometryKeys = [
  'left',
  'top',
  'width',
  'height',
  'scaleX',
  'scaleY',
  'angle',
  'radius',
  'x1',
  'y1',
  'x2',
  'y2',
] as const satisfies readonly (keyof HouseDrawingElementGeometry)[];

const styleKeys = [
  'fill',
  'stroke',
  'strokeWidth',
  'strokeDashArray',
  'strokeLineCap',
  'strokeLineJoin',
  'opacity',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'textAlign',
  'underline',
  'overline',
  'linethrough',
  'charSpacing',
  'backgroundColor',
  'visible',
  'selectable',
  'evented',
  'strokeUniform',
  'objectCaching',
  'originX',
  'originY',
  'hasControls',
  'hasBorders',
  'lockMovementX',
  'lockMovementY',
  'lockScalingX',
  'lockScalingY',
  'lockRotation',
] as const;

const resourceKeys = [
  'src',
  'crossOrigin',
  'cropX',
  'cropY',
] as const;

const metadataKeys = canvasObjectProps.filter((key) => key !== 'myType' && key !== 'editorObjectId');

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toJsonValue(value: unknown): JsonValue | undefined {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
    return value as JsonValue;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => toJsonValue(item))
      .filter((item): item is JsonValue => item !== undefined);
  }

  if (!isRecord(value)) return undefined;

  const jsonObject: JsonObject = {};
  Object.entries(value).forEach(([key, nested]) => {
    const jsonValue = toJsonValue(nested);
    if (jsonValue !== undefined) {
      jsonObject[key] = jsonValue;
    }
  });
  return jsonObject;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function normalizeFabricShape(value: unknown): HouseDrawingElementDocument['shape'] | null {
  const shape = readString(value)?.toLowerCase();
  if (!shape) return null;

  const normalized = shape === 'i-text' ? 'itext' : shape;
  return isHouseDrawingElementShape(normalized) ? normalized : null;
}

function pickNumberRecord<TKeys extends readonly string[]>(
  source: Record<string, unknown>,
  keys: TKeys,
): Partial<Record<TKeys[number], number>> | undefined {
  const result: Partial<Record<TKeys[number], number>> = {};
  keys.forEach((key) => {
    const value = source[key];
    if (typeof value === 'number') {
      result[key] = value;
    }
  });
  return Object.keys(result).length > 0 ? result : undefined;
}

function pickPoints(value: unknown): HouseDrawingPoint[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const points = value
    .map((point) => {
      if (!isRecord(point)) return null;
      if (typeof point.x !== 'number' || typeof point.y !== 'number') return null;
      return {x: point.x, y: point.y};
    })
    .filter((point): point is HouseDrawingPoint => point !== null);

  return points.length > 0 ? points : undefined;
}

function pickGeometry(source: Record<string, unknown>): HouseDrawingElementGeometry | undefined {
  const geometry: HouseDrawingElementGeometry = {
    ...pickNumberRecord(source, geometryKeys),
  };
  const points = pickPoints(source.points);
  const path = toJsonValue(source.path);

  if (points) geometry.points = points;
  if (path !== undefined) geometry.path = path;

  return Object.keys(geometry).length > 0 ? geometry : undefined;
}

function pickJsonObject(source: Record<string, unknown>, keys: readonly string[]): JsonObject | undefined {
  const result: JsonObject = {};
  keys.forEach((key) => {
    const value = toJsonValue(source[key]);
    if (value !== undefined) {
      result[key] = value;
    }
  });
  return Object.keys(result).length > 0 ? result : undefined;
}

function toDrawingElement(source: unknown, index: number, path = `${index}`): HouseDrawingElementDocument | null {
  if (!isRecord(source)) return null;

  const shape = normalizeFabricShape(source.type);
  if (!shape) return null;

  const kind = readString(source.myType) ?? shape;
  const id = readString(source.editorObjectId) ?? `${kind}-${path}`;
  const children = Array.isArray(source.objects)
    ? source.objects
      .map((child, childIndex) => toDrawingElement(child, childIndex, `${path}-${childIndex}`))
      .filter((child): child is HouseDrawingElementDocument => child !== null)
    : undefined;

  return {
    id,
    kind,
    shape,
    geometry: pickGeometry(source),
    style: pickJsonObject(source, styleKeys),
    text: readString(source.text) ?? undefined,
    metadata: pickJsonObject(source, metadataKeys),
    resource: pickJsonObject(source, resourceKeys),
    children: children && children.length > 0 ? children : undefined,
  };
}

function toRuntimePayload(document: HouseDrawingElementDocument): Record<string, unknown> {
  return {
    type: document.shape,
    ...document.geometry,
    ...document.style,
    ...document.metadata,
    ...document.resource,
    myType: document.kind,
    editorObjectId: document.id,
    ...(document.text ? {text: document.text} : {}),
    ...(document.children ? {objects: document.children.map(toRuntimePayload)} : {}),
  };
}

/**
 * Cria a borda documental do Fabric.
 *
 * Esta é a única camada que traduz entre serialização Fabric e o documento
 * visual canônico consumido pelos hooks do editor.
 */
export function createFabricCanvasDocumentPort(canvas: FabricCanvas): CanvasDocumentPort {
  return {
    exportCanvasDocument: () => {
      const rawDocument = canvas.toJSON() as { objects?: unknown[] };
      const objects = Array.isArray(rawDocument.objects) ? rawDocument.objects : [];

      return {
        schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
        objects: objects
          .map((object, index) => toDrawingElement(object, index))
          .filter((object): object is HouseDrawingElementDocument => object !== null),
      };
    },

    loadCanvasDocument: async (document: HouseDrawingCanvasDocument) => {
      if (!isHouseDrawingCanvasDocument(document)) return false;

      canvas.clear();
      await canvas.loadFromJSON({
        objects: document.objects.map(toRuntimePayload),
      });
      refreshHouseGroupsOnCanvas(canvas);

      canvas.renderAll();
      setTimeout(() => {
        canvas.requestRenderAll();
      }, 100);
      return true;
    },

    exportImageDataUrl: () => {
      canvas.discardActiveObject();
      canvas.renderAll();
      return canvas.toDataURL();
    },
  };
}
