import {act, renderHook, waitFor} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import type {CanvasDocumentPort} from '@/components/rac-editor/@canvas/ports/CanvasDocumentPort.ts';
import type {HouseDrawingDocumentPort} from '@/components/rac-editor/ports/HouseDrawingDocumentPort.ts';
import type {HouseState} from '@/shared/types/house.ts';
import {
  HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
  HOUSE_DRAWING_DOCUMENT_SCHEMA_VERSION,
  HOUSE_DRAWING_DOCUMENT_TYPE,
  type HouseDrawingCanvasDocument,
  type HouseDrawingDocument,
} from '@/shared/types/house-drawing-document.ts';
import {useCanvasHistory} from './useCanvasHistory.ts';

function createCanvasDocument(id: string): HouseDrawingCanvasDocument {
  return {
    schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
    objects: [{
      id,
      kind: 'house',
      shape: 'group',
      metadata: {houseInstanceId: id},
      children: [],
    }],
  };
}

function createHouseState(terrainType: number): HouseState {
  return {
    id: 'house-1',
    houseType: 'tipo6',
    pilotis: {
      piloti_0_0: {height: 1, isMaster: false, nivel: 0.2},
    },
    terrainType,
    views: {
      top: [{instanceId: 'view-top-1'}],
      front: [],
      back: [],
      side1: [],
      side2: [],
    },
    sideMappings: {
      top: null,
      bottom: null,
      left: null,
      right: null,
    },
    preAssignedSides: {},
  };
}

function createHouseDocument(
  canvas: HouseDrawingCanvasDocument,
  terrainType: number,
): HouseDrawingDocument {
  return {
    documentType: HOUSE_DRAWING_DOCUMENT_TYPE,
    schemaVersion: HOUSE_DRAWING_DOCUMENT_SCHEMA_VERSION,
    setup: {
      familyName: 'Família Teste',
      selectedPilotiHeights: [1, 1.5, 2],
    },
    house: createHouseState(terrainType),
    canvas,
  };
}

function createDocumentPort(documents: HouseDrawingCanvasDocument[]): CanvasDocumentPort {
  return {
    exportCanvasDocument: vi.fn(() => documents.shift() ?? null),
    loadCanvasDocument: vi.fn().mockResolvedValue(true),
    exportImageDataUrl: vi.fn(),
  };
}

describe('useCanvasHistory.ts', () => {
  it('restaura undo com documento visual e estado lógico explícito', async () => {
    const firstCanvasDocument = createCanvasDocument('view-top-1');
    const secondCanvasDocument = createCanvasDocument('view-top-2');
    const documentPort = createDocumentPort([
      firstCanvasDocument,
      secondCanvasDocument,
    ]);
    const firstHouseDocument = createHouseDocument(firstCanvasDocument, 1);
    const secondHouseDocument = createHouseDocument(secondCanvasDocument, 2);
    const houseDrawingDocumentPort: HouseDrawingDocumentPort = {
      exportHouseDrawingDocument: vi.fn((canvas) =>
        canvas.objects[0]?.id === 'view-top-1'
          ? firstHouseDocument
          : secondHouseDocument
      ),
      importHouseDrawingDocument: vi.fn(),
    };
    const updateMinimapObjects = vi.fn();
    const onHistorySave = vi.fn();
    const onSelectionChange = vi.fn();
    const onCanvasDocumentLoaded = vi.fn();

    const {result} = renderHook(() => useCanvasHistory({
      createCanvasDocumentPort: () => documentPort,
      houseDrawingDocumentPort,
      updateMinimapObjects,
      onHistorySave,
      onSelectionChange,
      onCanvasDocumentLoaded,
    }));

    act(() => {
      result.current.saveHistory();
      result.current.saveHistory();
      result.current.undo();
    });

    await waitFor(() => expect(documentPort.loadCanvasDocument).toHaveBeenCalledWith(firstCanvasDocument));

    expect(houseDrawingDocumentPort.exportHouseDrawingDocument).toHaveBeenCalledWith(firstCanvasDocument);
    expect(houseDrawingDocumentPort.importHouseDrawingDocument).toHaveBeenCalledWith(firstHouseDocument);
    expect(onCanvasDocumentLoaded).toHaveBeenCalledOnce();
    expect(updateMinimapObjects).toHaveBeenCalledTimes(3);
    expect(onHistorySave).toHaveBeenCalledTimes(2);
    expect(onSelectionChange).toHaveBeenCalledWith('Desfazer realizado.');
  });

  it('permite histórico visual sem casa lógica criada', async () => {
    const firstCanvasDocument = createCanvasDocument('free-object-1');
    const secondCanvasDocument = createCanvasDocument('free-object-2');
    const documentPort = createDocumentPort([
      firstCanvasDocument,
      secondCanvasDocument,
    ]);
    const houseDrawingDocumentPort: HouseDrawingDocumentPort = {
      exportHouseDrawingDocument: vi.fn(() => null),
      importHouseDrawingDocument: vi.fn(),
    };

    const {result} = renderHook(() => useCanvasHistory({
      createCanvasDocumentPort: () => documentPort,
      houseDrawingDocumentPort,
      updateMinimapObjects: vi.fn(),
      onHistorySave: vi.fn(),
      onSelectionChange: vi.fn(),
      onCanvasDocumentLoaded: vi.fn(),
    }));

    act(() => {
      result.current.saveHistory();
      result.current.saveHistory();
      result.current.undo();
    });

    await waitFor(() => expect(documentPort.loadCanvasDocument).toHaveBeenCalledWith(firstCanvasDocument));

    expect(houseDrawingDocumentPort.importHouseDrawingDocument).not.toHaveBeenCalled();
  });
});
