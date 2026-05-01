import type {HouseState} from '@/shared/types/house.ts';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export const HOUSE_DRAWING_DOCUMENT_TYPE = 'rac-house-drawing';
export const HOUSE_DRAWING_DOCUMENT_SCHEMA_VERSION = 1;
export const HOUSE_DRAWING_CANVAS_SCHEMA_VERSION = 1;

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
}

export type HouseDrawingElementStyle = JsonObject;

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

  /** Elementos internos quando a forma visual é composta. */
  children?: HouseDrawingElementDocument[];
}

export interface HouseDrawingCanvasDocument {
  schemaVersion: typeof HOUSE_DRAWING_CANVAS_SCHEMA_VERSION;
  objects: HouseDrawingElementDocument[];
}

export interface HouseDrawingSetupDocument {
  familyName: string;
  selectedPilotiHeights: number[];
}

export interface HouseDrawingDocument {
  documentType: typeof HOUSE_DRAWING_DOCUMENT_TYPE;
  schemaVersion: typeof HOUSE_DRAWING_DOCUMENT_SCHEMA_VERSION;
  setup: HouseDrawingSetupDocument;
  house: HouseState;
  canvas: HouseDrawingCanvasDocument;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isHouseDrawingCanvasDocument(value: unknown): value is HouseDrawingCanvasDocument {
  if (!isRecord(value)) return false;
  return value.schemaVersion === HOUSE_DRAWING_CANVAS_SCHEMA_VERSION
    && Array.isArray(value.objects);
}

function isHouseDrawingSetupDocument(value: unknown): value is HouseDrawingSetupDocument {
  if (!isRecord(value)) return false;
  return typeof value.familyName === 'string'
    && Array.isArray(value.selectedPilotiHeights)
    && value.selectedPilotiHeights.every((height) => typeof height === 'number');
}

export function isHouseDrawingDocument(value: unknown): value is HouseDrawingDocument {
  if (!isRecord(value)) return false;

  return value.documentType === HOUSE_DRAWING_DOCUMENT_TYPE
    && value.schemaVersion === HOUSE_DRAWING_DOCUMENT_SCHEMA_VERSION
    && isHouseDrawingSetupDocument(value.setup)
    && isRecord(value.house)
    && isHouseDrawingCanvasDocument(value.canvas);
}

export function parseHouseDrawingDocument(rawContent: string): HouseDrawingDocument {
  const parsed: unknown = JSON.parse(rawContent);
  if (!isHouseDrawingDocument(parsed)) {
    throw new Error('Arquivo de projeto RAC inválido.');
  }
  return parsed;
}
