import {describe, expect, it} from 'vitest';
import type {HouseState} from '@/shared/types/house.ts';
import {
  HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
  HOUSE_DRAWING_DOCUMENT_SCHEMA_VERSION,
  HOUSE_DRAWING_DOCUMENT_TYPE,
  isHouseDrawingDocument,
  parseHouseDrawingDocument,
  type HouseDrawingDocument,
} from '@/shared/types/house-drawing-document.ts';

function createHouseState(): HouseState {
  return {
    id: 'house-1',
    houseType: 'tipo6',
    pilotis: {
      p1: {
        height: 1.5,
        isMaster: true,
        nivel: 0,
      },
    },
    terrainType: 1,
    views: {
      top: [{instanceId: 'view-top-1'}],
      front: [{instanceId: 'view-front-1', side: 'top'}],
      back: [],
      side1: [],
      side2: [],
    },
    sideMappings: {
      top: 'front',
      bottom: null,
      left: null,
      right: null,
    },
    preAssignedSides: {
      'view-front-1': 'top',
    },
  };
}

function createDocument(): HouseDrawingDocument {
  return {
    documentType: HOUSE_DRAWING_DOCUMENT_TYPE,
    schemaVersion: HOUSE_DRAWING_DOCUMENT_SCHEMA_VERSION,
    setup: {
      familyName: 'Família teste',
      selectedPilotiHeights: [1, 1.5, 2],
    },
    house: createHouseState(),
    canvas: {
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [{
        id: 'house-top-1',
        kind: 'house',
        shape: 'group',
        geometry: {left: 10, top: 20, width: 30, height: 40},
        style: {fill: '#fff', visible: true},
        metadata: {
          houseInstanceId: 'view-top-1',
          nested: {source: 'test'},
        },
        children: [{
          id: 'label-1',
          kind: 'label',
          shape: 'textbox',
          text: 'Casa',
        }],
      }],
    },
  };
}

describe('house-drawing-document.ts', () => {
  it('aceita documento canônico completo e parseável', () => {
    const document = createDocument();

    expect(isHouseDrawingDocument(document)).toBe(true);
    expect(parseHouseDrawingDocument(JSON.stringify(document))).toEqual(document);
  });

  it('rejeita JSON Fabric antigo como documento RAC', () => {
    expect(isHouseDrawingDocument({objects: []})).toBe(false);
    expect(() => parseHouseDrawingDocument('{"objects":[]}')).toThrow('Arquivo RAC inválido.');
  });

  it('rejeita estado lógico da casa incompleto ou inconsistente', () => {
    const document = createDocument();
    const invalidDocument = {
      ...document,
      house: {
        ...document.house,
        sideMappings: {
          ...document.house.sideMappings,
          top: 'side1',
        },
      },
    };

    expect(isHouseDrawingDocument(invalidDocument)).toBe(false);
  });

  it('rejeita payload visual opaco e metadados fora de JSON', () => {
    const opaquePayloadDocument = createDocument();
    const nonJsonMetadataDocument = createDocument();

    (opaquePayloadDocument.canvas.objects[0] as unknown as Record<string, unknown>).payload = {
      type: 'group',
      objects: [],
    };
    nonJsonMetadataDocument.canvas.objects[0].metadata = {
      invalid: () => undefined,
    } as never;

    expect(isHouseDrawingDocument(opaquePayloadDocument)).toBe(false);
    expect(isHouseDrawingDocument(nonJsonMetadataDocument)).toBe(false);
  });

  it('rejeita campos extras estruturais e formas visuais desconhecidas', () => {
    const rootExtraDocument = createDocument() as unknown as Record<string, unknown>;
    const shapeDocument = createDocument();

    rootExtraDocument.payload = {};
    shapeDocument.canvas.objects[0].shape = 'fabricCustomShape';

    expect(isHouseDrawingDocument(rootExtraDocument)).toBe(false);
    expect(isHouseDrawingDocument(shapeDocument)).toBe(false);
  });

  it('aceita geometria com pontos de Polygon e Polyline', () => {
    const document = createDocument();

    document.canvas.objects[0] = {
      id: 'terrain-line-1',
      kind: 'terrain',
      shape: 'polyline',
      geometry: {
        left: 0,
        top: 0,
        points: [
          {x: 0, y: 10},
          {x: 20, y: 30},
        ],
      },
    };

    expect(isHouseDrawingDocument(document)).toBe(true);
  });

  it('aceita imagem serializável com recurso embutido', () => {
    const document = createDocument();

    document.canvas.objects[0] = {
      id: 'snapshot-1',
      kind: 'image',
      shape: 'image',
      geometry: {left: 10, top: 20, width: 100, height: 80},
      resource: {src: 'data:image/png;base64,abc', crossOrigin: 'anonymous'},
    };

    expect(isHouseDrawingDocument(document)).toBe(true);
  });

  it('aceita texto editável normalizado do Fabric', () => {
    const document = createDocument();

    document.canvas.objects[0] = {
      id: 'text-1',
      kind: 'text',
      shape: 'itext',
      text: 'Observação',
    };

    expect(isHouseDrawingDocument(document)).toBe(true);
  });
});
