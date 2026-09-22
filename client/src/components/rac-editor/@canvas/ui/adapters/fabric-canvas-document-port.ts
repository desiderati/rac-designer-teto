import {Canvas as FabricCanvas, FabricImage} from 'fabric';
import type {FabricObject} from 'fabric';
import {refreshHouseGroupsOnCanvas} from '@/components/rac-editor/@canvas/lib';
import {
  type CanvasObject,
  canvasObjectProps,
  getCanvasGroupObjects,
  toCanvasGroup,
} from '@/components/rac-editor/@canvas/lib/canvas.ts';
import {bindWallCanvasGroupScaling} from '@/components/rac-editor/@canvas/lib/factory/elements/wall.strategy.ts';
import type {CanvasDocumentPort} from '@/components/rac-editor/@canvas/ports/CanvasDocumentPort.ts';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
} from '@/shared/constants.ts';
import {
  CANVAS_STYLE,
  HOUSE_2D_STYLE,
  PILOTI_MASTER_STYLE,
  PILOTI_STYLE,
} from '@/shared/config.ts';
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
  'paintFirst',
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
  'storageUrl',
  'crossOrigin',
  'cropX',
  'cropY',
] as const;

const metadataKeys = canvasObjectProps.filter((key) => key !== 'myType' && key !== 'editorObjectId');
const exportVisualStyleKeys = ['fill', 'stroke', 'strokeWidth', 'strokeUniform', 'hoverCursor'] as const;

interface ExportVisualSnapshot {
  object: CanvasObject;
  style: Record<string, unknown>;
}

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

function isTextShape(shape: HouseDrawingElementDocument['shape']): boolean {
  return shape === 'itext' || shape === 'text' || shape === 'textbox';
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

function pickResource(source: Record<string, unknown>): JsonObject | undefined {
  const resource = pickJsonObject(source, resourceKeys);
  if (!resource) return undefined;

  const storageUrl = resource.storageUrl;
  const src = resource.src;
  if (typeof storageUrl === 'string' && (
    /^data:image\//i.test(String(src ?? ''))
    || /^https?:\/\//i.test(String(src ?? ''))
    || /^\/manus-storage\//i.test(String(src ?? ''))
  )) {
    resource.src = storageUrl;
  }
  return resource;
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
    resource: pickResource(source),
    children: children && children.length > 0 ? children : undefined,
  };
}

function readFabricProperty(object: FabricObject, key: string): unknown {
  return (object as unknown as Record<string, unknown>)[key];
}

function readImageSourceWithoutFabricSerialization(image: FabricImage): string | null {
  const directSource = readString(readFabricProperty(image, 'src'));
  if (directSource) return directSource;

  const element = image.getElement();
  if ('src' in element && typeof element.src === 'string' && element.src.length > 0) {
    return element.src;
  }

  // A canvas-backed source is intentionally not converted to pixels here. If
  // it has no Storage reference, the safe snapshot omits it instead of
  // calling toDataURL and rethrowing a SecurityError from a tainted canvas.
  return null;
}

function toFabricSerializableObject(object: FabricObject): Record<string, unknown> {
  const group = 'getObjects' in object && typeof object.getObjects === 'function'
    ? object as FabricObject & {getObjects: () => FabricObject[]}
    : null;
  let nativeObject: Record<string, unknown> | null = null;
  if (!group && object.type !== 'image') {
    try {
      const serialized = object.toObject([...canvasObjectProps]);
      nativeObject = isRecord(serialized) ? serialized : null;
    } catch (error) {
      console.warn('[Canvas PDF export] Object serialization skipped native properties:', error);
    }
  }
  const source: Record<string, unknown> = isRecord(nativeObject)
    ? {...nativeObject}
    : {type: object.type};

  if (!nativeObject) {
    [...geometryKeys, ...styleKeys, ...metadataKeys].forEach((key) => {
      const value = readFabricProperty(object, key);
      if (value !== undefined) source[key] = value;
    });
  }

  const myType = readString(readFabricProperty(object, 'myType'));
  const editorObjectId = readString(readFabricProperty(object, 'editorObjectId'));
  const text = readFabricProperty(object, 'text');
  if (myType) source.myType = myType;
  if (editorObjectId) source.editorObjectId = editorObjectId;
  if (typeof text === 'string') source.text = text;

  if (object.type === 'image') {
    const image = object as FabricImage;
    const storageUrl = readString(readFabricProperty(image, 'storageUrl'));
    const src = storageUrl ?? readImageSourceWithoutFabricSerialization(image);
    if (src) source.src = src;
    if (storageUrl) source.storageUrl = storageUrl;
    const crossOrigin = readFabricProperty(image, 'crossOrigin');
    if (crossOrigin !== undefined) source.crossOrigin = crossOrigin;
    for (const key of ['cropX', 'cropY']) {
      const value = readFabricProperty(image, key);
      if (value !== undefined) source[key] = value;
    }
  }

  if (group) {
    source.objects = group.getObjects().map((child) => toFabricSerializableObject(child));
  }

  return source;
}

function readCanvasObjectsForExport(canvas: FabricCanvas): unknown[] {
  if (typeof canvas.getObjects === 'function') {
    return canvas.getObjects().map(toFabricSerializableObject);
  }

  const rawDocument = canvas.toJSON() as {objects?: unknown[]};
  return Array.isArray(rawDocument.objects) ? rawDocument.objects : [];
}

function normalizeStorageImageSource(source: unknown): unknown {
  if (typeof source !== 'string') return source;

  const storagePathMatch = source.match(/(?:^|https?:\/\/[^/]+)(\/manus-storage\/[^?#]+)/i);
  return storagePathMatch?.[1] ?? source;
}

function imageElementToDataUrl(element: Element): string {
  const width = 'naturalWidth' in element
    ? Number((element as HTMLImageElement).naturalWidth)
    : Number((element as HTMLCanvasElement).width);
  const height = 'naturalHeight' in element
    ? Number((element as HTMLImageElement).naturalHeight)
    : Number((element as HTMLCanvasElement).height);

  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    throw new Error('A imagem não possui dimensões renderizáveis.');
  }

  const raster = globalThis.document.createElement('canvas');
  raster.width = width;
  raster.height = height;
  const context = raster.getContext('2d');
  if (!context) throw new Error('Não foi possível criar o contexto de rasterização da imagem.');

  context.drawImage(element as CanvasImageSource, 0, 0, width, height);
  // This is intentionally done before Fabric receives the source. A failure
  // here means the image is not CORS-readable and must not enter the isolated
  // Fabric canvas at all.
  return raster.toDataURL('image/png');
}

function toRuntimePayload(document: HouseDrawingElementDocument): Record<string, unknown> {
  const text = document.text !== undefined
    ? document.text
    : isTextShape(document.shape)
      ? ''
      : undefined;

  const payload: Record<string, unknown> = {
    type: document.shape,
    ...document.geometry,
    ...document.style,
    ...document.metadata,
    ...document.resource,
    myType: document.kind,
    editorObjectId: document.id,
    ...(text !== undefined ? {text} : {}),
    ...(document.children ? {objects: document.children.map(toRuntimePayload)} : {}),
  };

  if (document.shape === 'image') {
    payload.src = normalizeStorageImageSource(payload.src);
    const source = payload.src;
    const hasExternalSource = typeof source === 'string' && !/^(data:|blob:)/i.test(source);
    if (hasExternalSource && (payload.crossOrigin === undefined || payload.crossOrigin === null || payload.crossOrigin === '')) {
      payload.crossOrigin = 'anonymous';
    }
  }

  return payload;
}

function collectExportVisualObjects(canvas: FabricCanvas): CanvasObject[] {
  return canvas.getObjects()
    .flatMap((item) => {
      const group = toCanvasGroup(item);
      if (!group || group.myType !== 'house') return [];

      return getCanvasGroupObjects(group).filter((object) => (
        object.isPilotiCircle
        || object.isPilotiRect
        || object.isHouseBorderEdge
      ));
    });
}

function captureExportVisualState(canvas: FabricCanvas): ExportVisualSnapshot[] {
  return collectExportVisualObjects(canvas).map((object) => ({
    object,
    style: Object.fromEntries(
      exportVisualStyleKeys.map((key) => [key, object[key]]),
    ),
  }));
}

function applyCleanExportVisualState(canvas: FabricCanvas): void {
  collectExportVisualObjects(canvas).forEach((object) => {
    if (object.isPilotiCircle || object.isPilotiRect) {
      const isRect = Boolean(object.isPilotiRect);
      const isMaster = Boolean(object.pilotiIsMaster);

      object.set({
        fill: isMaster ? PILOTI_MASTER_STYLE.fillColor : PILOTI_STYLE.fillColor,
        stroke: isMaster ? PILOTI_MASTER_STYLE.strokeColor : PILOTI_STYLE.strokeColor,
        strokeWidth: isMaster
          ? (isRect ? PILOTI_MASTER_STYLE.strokeWidth : PILOTI_MASTER_STYLE.strokeWidthTopView)
          : (isRect ? PILOTI_STYLE.strokeWidth : PILOTI_STYLE.strokeWidthTopView),
        strokeUniform: true,
        hoverCursor: 'default',
      });
      object.dirty = true;
      return;
    }

    if (object.isHouseBorderEdge) {
      object.set({
        stroke: HOUSE_2D_STYLE.outlineStrokeColor,
        strokeWidth: HOUSE_2D_STYLE.outlineStrokeWidth,
        hoverCursor: 'default',
      });
      object.dirty = true;
    }
  });
}

function restoreExportVisualState(snapshot: ExportVisualSnapshot[]): void {
  snapshot.forEach(({object, style}) => {
    object.set(style);
    object.dirty = true;
  });
}

function restoreCanvasRuntimeBehaviors(canvas: FabricCanvas): void {
  canvas.getObjects()
    .map((object) => toCanvasGroup(object))
    .filter((group): group is NonNullable<ReturnType<typeof toCanvasGroup>> => group?.myType === 'wall')
    .forEach(bindWallCanvasGroupScaling);
}

function collectFabricImages(objects: FabricObject[]): FabricImage[] {
  return objects.flatMap((object) => {
    if (object.type === 'image') return [object as FabricImage];

    const nestedObjects = 'getObjects' in object && typeof object.getObjects === 'function'
      ? object.getObjects()
      : [];
    return collectFabricImages(nestedObjects);
  });
}

async function prepareImageAssetsForExport(canvas: FabricCanvas): Promise<() => void> {
  const visibilitySnapshot = new Map<FabricImage, boolean>();
  const images = collectFabricImages(canvas.getObjects());

  await Promise.all(images.map(async (image) => {
    const src = image.getSrc();
    if (!src || /^(data:|blob:)/i.test(src)) return;

    visibilitySnapshot.set(image, image.visible !== false);
    try {
      const rehydrated = await FabricImage.fromURL(src, {crossOrigin: 'anonymous'});
      image.setElement(rehydrated.getElement());
      image.set({crossOrigin: 'anonymous'});
      image.setCoords();
      image.dirty = true;
    } catch (error) {
      // Uma imagem legada sem CORS não pode contaminar a captura inteira. Ela
      // fica temporariamente invisível e volta ao estado original ao final.
      console.warn('[Canvas PDF export] Image could not be rehydrated:', error);
      image.set({visible: false});
      image.dirty = true;
    }
  }));

  canvas.requestRenderAll();
  return () => {
    visibilitySnapshot.forEach((visible, image) => {
      image.set({visible});
      image.dirty = true;
    });
    canvas.requestRenderAll();
  };
}

async function sanitizeElementForSafeExport(
  element: HouseDrawingElementDocument,
): Promise<HouseDrawingElementDocument | null> {
  const children = element.children
    ? (await Promise.all(element.children.map((child) => sanitizeElementForSafeExport(child))))
      .filter((child): child is HouseDrawingElementDocument => child !== null)
    : undefined;

  if (element.shape !== 'image') {
    return children
      ? {...element, children}
      : element;
  }

  const resource = element.resource;
  const source = readString(resource?.src) ?? readString(resource?.storageUrl);
  if (!source) {
    return null;
  }

  const normalizedSource = String(normalizeStorageImageSource(source));
  let probe: FabricImage | null = null;
  try {
    // This is deliberately performed before Fabric receives the document. If
    // the response has no CORS permission, the object is omitted before any
    // pixel can reach the temporary canvas.
    probe = await FabricImage.fromURL(normalizedSource, {crossOrigin: 'anonymous'});
    const dataUrl = imageElementToDataUrl(probe.getElement());

    return {
      ...element,
      resource: {
        ...resource,
        src: dataUrl,
      },
      ...(children ? {children} : {}),
    };
  } catch (error) {
    console.warn('[Canvas PDF export] Image omitted from isolated snapshot:', error);
    return null;
  } finally {
    probe?.dispose();
  }
}

async function sanitizeDocumentForSafeExport(
  document: HouseDrawingCanvasDocument,
): Promise<HouseDrawingCanvasDocument> {
  const objects = await Promise.all(document.objects.map((object) => sanitizeElementForSafeExport(object)));
  return {
    ...document,
    objects: objects.filter((object): object is HouseDrawingElementDocument => object !== null),
  };
}

function isSecurityError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === 'SecurityError'
    : error instanceof Error && /tainted canvases|not be exported/i.test(error.message);
}

function removeImagesFromDocument(
  document: HouseDrawingCanvasDocument,
): HouseDrawingCanvasDocument {
  const removeImages = (objects: HouseDrawingElementDocument[]): HouseDrawingElementDocument[] => objects
    .filter((object) => object.shape !== 'image')
    .map((object) => object.children
      ? {...object, children: removeImages(object.children)}
      : object);

  return {
    ...document,
    objects: removeImages(document.objects),
  };
}

function createIsolatedCanvas(width: number, height: number): {
  canvas: FabricCanvas;
  element: HTMLCanvasElement;
} {
  const element = globalThis.document.createElement('canvas');
  element.width = width;
  element.height = height;
  element.style.position = 'fixed';
  element.style.left = '-10000px';
  element.style.top = '0';
  element.setAttribute('aria-hidden', 'true');
  globalThis.document.body.appendChild(element);

  return {
    element,
    canvas: new FabricCanvas(element, {
      width,
      height,
      backgroundColor: CANVAS_STYLE.backgroundColor,
      renderOnAddRemove: false,
    }),
  };
}

async function exportDocumentFromFreshCanvas(
  document: HouseDrawingCanvasDocument,
  width: number,
  height: number,
): Promise<string | null> {
  const isolated = createIsolatedCanvas(width, height);
  try {
    const isolatedPort = createFabricCanvasDocumentPort(isolated.canvas);
    const loaded = await isolatedPort.loadCanvasDocument(document);
    if (!loaded) return null;
    isolated.canvas.renderAll();
    return isolatedPort.exportImageDataUrl();
  } finally {
    await isolated.canvas.dispose();
    isolated.element.remove();
  }
}

async function exportSafeImageDataUrl(canvas: FabricCanvas): Promise<string | null> {
  const sourcePort = createFabricCanvasDocumentPort(canvas);
  const canvasDocument = sourcePort.exportCanvasDocument();
  if (!canvasDocument) return null;

  const safeDocument = await sanitizeDocumentForSafeExport(canvasDocument);
  const width = canvas.getWidth() || CANVAS_WIDTH;
  const height = canvas.getHeight() || CANVAS_HEIGHT;
  const isolated = createIsolatedCanvas(width, height);

  try {
    const isolatedPort = createFabricCanvasDocumentPort(isolated.canvas);
    const loaded = await isolatedPort.loadCanvasDocument(safeDocument);
    if (!loaded) return null;
    isolated.canvas.renderAll();
    try {
      return isolatedPort.exportImageDataUrl();
    } catch (error) {
      if (!isSecurityError(error)) throw error;

      // A legacy image can still arrive through a browser-specific source
      // path (for example a Blob URL). Do not let that single object abort the
      // whole RAC: remove all image pixels from this disposable canvas and
      // retry the export. The user's live canvas is never touched.
      console.warn('[Canvas PDF export] Isolated canvas was tainted; retrying without image pixels.', error);
      return exportDocumentFromFreshCanvas(removeImagesFromDocument(safeDocument), width, height);
    }
  } finally {
    await isolated.canvas.dispose();
    isolated.element.remove();
  }
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
      const objects = readCanvasObjectsForExport(canvas);

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
      restoreCanvasRuntimeBehaviors(canvas);

      canvas.renderAll();
      setTimeout(() => {
        canvas.requestRenderAll();
      }, 100);
      return true;
    },

    exportImageDataUrl: () => {
      const activeObject = canvas.getActiveObject();
      const visualSnapshot = captureExportVisualState(canvas);

      try {
        canvas.discardActiveObject();
        applyCleanExportVisualState(canvas);
        canvas.renderAll();
        return canvas.toDataURL();
      } finally {
        restoreExportVisualState(visualSnapshot);
        if (activeObject) {
          canvas.setActiveObject(activeObject);
        }
        canvas.renderAll();
      }
    },

    exportSafeImageDataUrl: () => exportSafeImageDataUrl(canvas),

    prepareImageAssetsForExport: () => prepareImageAssetsForExport(canvas),
  };
}
