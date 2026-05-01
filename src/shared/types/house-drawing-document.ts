import {
  ALL_HOUSE_VIEW_TYPES,
  HOUSE_SIDE_MAPPINGS,
  type HousePiloti,
  type HouseSide,
  type HouseState,
  type HouseType,
  type HouseViewInstance,
  type HouseViewType,
} from '@/shared/types/house.ts';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

/** Identificador do contrato serializável de desenho da casa ativa. */
export const HOUSE_DRAWING_DOCUMENT_TYPE = 'rac-house-drawing';

/** Versão do documento completo de desenho da casa ativa. */
export const HOUSE_DRAWING_DOCUMENT_SCHEMA_VERSION = 1;

/** Versão do subdocumento visual independente do runtime Fabric. */
export const HOUSE_DRAWING_CANVAS_SCHEMA_VERSION = 1;

const HOUSE_TYPES = ['tipo6', 'tipo3'] as const satisfies readonly Exclude<HouseType, null>[];

const HOUSE_SIDES = ['top', 'bottom', 'left', 'right'] as const satisfies readonly HouseSide[];

const HOUSE_STATE_KEYS = [
  'id',
  'houseType',
  'pilotis',
  'terrainType',
  'views',
  'sideMappings',
  'preAssignedSides',
] as const;

const HOUSE_DRAWING_DOCUMENT_KEYS = [
  'documentType',
  'schemaVersion',
  'setup',
  'house',
  'canvas',
] as const;

const HOUSE_DRAWING_SETUP_KEYS = [
  'familyName',
  'selectedPilotiHeights',
] as const;

const HOUSE_DRAWING_CANVAS_DOCUMENT_KEYS = [
  'schemaVersion',
  'objects',
] as const;

const HOUSE_DRAWING_ELEMENT_SHAPES = [
  'circle',
  'group',
  'image',
  'itext',
  'line',
  'path',
  'polygon',
  'polyline',
  'rect',
  'text',
  'textbox',
  'triangle',
] as const;

const HOUSE_DRAWING_ELEMENT_KEYS = [
  'id',
  'kind',
  'shape',
  'geometry',
  'style',
  'text',
  'metadata',
  'resource',
  'children',
] as const;

const HOUSE_DRAWING_ELEMENT_SCALAR_GEOMETRY_KEYS = [
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

const HOUSE_DRAWING_ELEMENT_GEOMETRY_KEYS = [
  ...HOUSE_DRAWING_ELEMENT_SCALAR_GEOMETRY_KEYS,
  'points',
  'path',
] as const satisfies readonly (keyof HouseDrawingElementGeometry)[];

export interface HouseDrawingPoint {
  x: number;
  y: number;
}

/** Geometria visual mínima que o adapter consegue reconstruir sem expor objetos Fabric. */
export interface HouseDrawingElementGeometry {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  radius?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  points?: HouseDrawingPoint[];
  path?: JsonValue;
}

export type HouseDrawingElementStyle = JsonObject;

/** Elemento visual serializável do desenho da casa ativa. */
export interface HouseDrawingElementDocument {
  /** Identidade serializável e estável do elemento visual. */
  id: string;

  /** Tipo semântico conhecido pelo editor, como `house`, `wall`, `line` ou `text`. */
  kind: string;

  /** Forma visual serializável usada pelo adapter para reconstruir o runtime. */
  shape: string;

  /** Geometria mínima da forma visual, sem instâncias vivas do canvas. */
  geometry?: HouseDrawingElementGeometry;

  /** Aparência serializável do elemento. */
  style?: HouseDrawingElementStyle;

  /** Texto do elemento quando a forma visual representa conteúdo textual. */
  text?: string;

  /** Metadados próprios do editor, limitados a valores JSON. */
  metadata?: JsonObject;

  /** Recursos externos ou embutidos necessários para reconstruir formas como imagens. */
  resource?: JsonObject;

  /** Elementos internos quando a forma visual é composta. */
  children?: HouseDrawingElementDocument[];
}

/** Subdocumento visual independente do runtime concreto do canvas. */
export interface HouseDrawingCanvasDocument {
  schemaVersion: typeof HOUSE_DRAWING_CANVAS_SCHEMA_VERSION;
  objects: HouseDrawingElementDocument[];
}

/** Dados de setup da casa ativa que não pertencem ao runtime visual. */
export interface HouseDrawingSetupDocument {
  familyName: string;
  selectedPilotiHeights: number[];
}

/** Documento canônico inicial para importação/exportação da casa ativa no editor RAC. */
export interface HouseDrawingDocument {
  documentType: typeof HOUSE_DRAWING_DOCUMENT_TYPE;
  schemaVersion: typeof HOUSE_DRAWING_DOCUMENT_SCHEMA_VERSION;
  setup: HouseDrawingSetupDocument;
  house: HouseState;
  canvas: HouseDrawingCanvasDocument;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOnlyKeys(value: Record<string, unknown>, allowedKeys: readonly string[]) {
  const allowed = new Set(allowedKeys);
  return Object.keys(value).every((key) => allowed.has(key));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isHouseType(value: unknown): value is HouseType {
  return value === null || HOUSE_TYPES.includes(value as Exclude<HouseType, null>);
}

function isHouseSide(value: unknown): value is HouseSide {
  return HOUSE_SIDES.includes(value as HouseSide);
}

function isHouseViewType(value: unknown): value is HouseViewType {
  return ALL_HOUSE_VIEW_TYPES.includes(value as HouseViewType);
}

export function isHouseDrawingElementShape(value: unknown): value is typeof HOUSE_DRAWING_ELEMENT_SHAPES[number] {
  return HOUSE_DRAWING_ELEMENT_SHAPES.includes(value as typeof HOUSE_DRAWING_ELEMENT_SHAPES[number]);
}

function isHousePiloti(value: unknown): value is HousePiloti {
  return isRecord(value)
    && isFiniteNumber(value.height)
    && typeof value.isMaster === 'boolean'
    && isFiniteNumber(value.nivel);
}

function isHouseViewInstance(value: unknown): value is HouseViewInstance {
  return isRecord(value)
    && isNonEmptyString(value.instanceId)
    && (value.side === undefined || isHouseSide(value.side));
}

function isHouseViews(value: unknown) {
  if (!isRecord(value)) return false;
  if (!hasOnlyKeys(value, ALL_HOUSE_VIEW_TYPES)) return false;

  return ALL_HOUSE_VIEW_TYPES.every((viewType) => {
    const instances = value[viewType];
    return Array.isArray(instances) && instances.every(isHouseViewInstance);
  });
}

function isHouseSideMappings(value: unknown) {
  if (!isRecord(value)) return false;
  if (!hasOnlyKeys(value, HOUSE_SIDES)) return false;

  return HOUSE_SIDES.every((side) => {
    const viewType = value[side];
    return viewType === null
      || (isHouseViewType(viewType) && HOUSE_SIDE_MAPPINGS[side].includes(viewType));
  });
}

function isHousePreAssignedSides(value: unknown) {
  if (!isRecord(value)) return false;
  return Object.values(value).every(isHouseSide);
}

function isHousePilotis(value: unknown) {
  if (!isRecord(value)) return false;
  return Object.values(value).every(isHousePiloti);
}

function isHouseState(value: unknown): value is HouseState {
  if (!isRecord(value)) return false;
  if (!hasOnlyKeys(value, HOUSE_STATE_KEYS)) return false;

  return isNonEmptyString(value.id)
    && isHouseType(value.houseType)
    && isHousePilotis(value.pilotis)
    && isFiniteNumber(value.terrainType)
    && isHouseViews(value.views)
    && isHouseSideMappings(value.sideMappings)
    && isHousePreAssignedSides(value.preAssignedSides);
}

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonValue);
  if (!isRecord(value)) return false;

  return Object.values(value).every(isJsonValue);
}

function isJsonObject(value: unknown): value is JsonObject {
  return isRecord(value) && Object.values(value).every(isJsonValue);
}

function isHouseDrawingPoint(value: unknown): value is HouseDrawingPoint {
  return isRecord(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y);
}

function isHouseDrawingElementGeometry(value: unknown): value is HouseDrawingElementGeometry {
  if (!isRecord(value)) return false;
  if (!hasOnlyKeys(value, HOUSE_DRAWING_ELEMENT_GEOMETRY_KEYS)) return false;

  return HOUSE_DRAWING_ELEMENT_SCALAR_GEOMETRY_KEYS.every((key) => (
    value[key] === undefined || isFiniteNumber(value[key])
  ))
    && (value.points === undefined || (Array.isArray(value.points) && value.points.every(isHouseDrawingPoint)))
    && (value.path === undefined || isJsonValue(value.path));
}

/** Verifica se um elemento visual serializável respeita o contrato documental vigente. */
export function isHouseDrawingElementDocument(value: unknown): value is HouseDrawingElementDocument {
  if (!isRecord(value)) return false;
  if (!hasOnlyKeys(value, HOUSE_DRAWING_ELEMENT_KEYS)) return false;

  return isNonEmptyString(value.id)
    && isNonEmptyString(value.kind)
    && isHouseDrawingElementShape(value.shape)
    && (value.geometry === undefined || isHouseDrawingElementGeometry(value.geometry))
    && (value.style === undefined || isJsonObject(value.style))
    && (value.text === undefined || typeof value.text === 'string')
    && (value.metadata === undefined || isJsonObject(value.metadata))
    && (value.resource === undefined || isJsonObject(value.resource))
    && (value.children === undefined
      || (Array.isArray(value.children) && value.children.every(isHouseDrawingElementDocument)));
}

/** Verifica se o subdocumento visual está estruturado e livre de payload opaco. */
export function isHouseDrawingCanvasDocument(value: unknown): value is HouseDrawingCanvasDocument {
  if (!isRecord(value)) return false;
  if (!hasOnlyKeys(value, HOUSE_DRAWING_CANVAS_DOCUMENT_KEYS)) return false;

  return value.schemaVersion === HOUSE_DRAWING_CANVAS_SCHEMA_VERSION
    && Array.isArray(value.objects)
    && value.objects.every(isHouseDrawingElementDocument);
}

/** Verifica se o setup serializável da casa ativa é válido. */
export function isHouseDrawingSetupDocument(value: unknown): value is HouseDrawingSetupDocument {
  if (!isRecord(value)) return false;
  if (!hasOnlyKeys(value, HOUSE_DRAWING_SETUP_KEYS)) return false;

  return typeof value.familyName === 'string'
    && Array.isArray(value.selectedPilotiHeights)
    && value.selectedPilotiHeights.every(isFiniteNumber);
}

/** Verifica se um valor desconhecido respeita o contrato `HouseDrawingDocument` vigente. */
export function isHouseDrawingDocument(value: unknown): value is HouseDrawingDocument {
  if (!isRecord(value)) return false;
  if (!hasOnlyKeys(value, HOUSE_DRAWING_DOCUMENT_KEYS)) return false;

  return value.documentType === HOUSE_DRAWING_DOCUMENT_TYPE
    && value.schemaVersion === HOUSE_DRAWING_DOCUMENT_SCHEMA_VERSION
    && isHouseDrawingSetupDocument(value.setup)
    && isHouseState(value.house)
    && isHouseDrawingCanvasDocument(value.canvas);
}

/** Converte conteúdo textual em `HouseDrawingDocument` ou falha com erro semântico de arquivo inválido. */
export function parseHouseDrawingDocument(rawContent: string): HouseDrawingDocument {
  const parsed: unknown = JSON.parse(rawContent);
  if (!isHouseDrawingDocument(parsed)) {
    throw new Error('Arquivo de projeto RAC inválido.');
  }
  return parsed;
}
