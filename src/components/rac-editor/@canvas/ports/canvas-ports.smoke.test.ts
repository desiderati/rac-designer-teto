import {describe, expect, it, vi} from 'vitest';
import type {EditorSelection} from '@/components/rac-editor/@canvas/store/types.ts';
import {EditorStore} from '@/components/rac-editor/store/EditorStateStore.ts';
import {
  CANVAS_DOCUMENT_VERSION,
  type CanvasSerializedDocumentPort,
  type SerializedCanvasDocument,
} from './CanvasSerializedDocumentPort.ts';
import type {CanvasEventPort} from './CanvasEventPort.ts';
import type {CanvasRenderPort} from './CanvasRenderPort.ts';

class FakeCanvasAdapter implements CanvasEventPort, CanvasRenderPort, CanvasSerializedDocumentPort {
  private selectionHandlers = new Set<(selection: EditorSelection | null) => void>();
  private document: SerializedCanvasDocument = {
    schemaVersion: CANVAS_DOCUMENT_VERSION,
    objects: [],
  };

  readonly renderEditorState = vi.fn();
  readonly renderSelection = vi.fn();

  onSelectionChange(handler: (selection: EditorSelection | null) => void): () => void {
    this.selectionHandlers.add(handler);
    return () => this.selectionHandlers.delete(handler);
  }

  emitSelection(selection: EditorSelection | null): void {
    this.selectionHandlers.forEach((handler) => handler(selection));
  }

  async exportDocument(): Promise<SerializedCanvasDocument> {
    return JSON.parse(JSON.stringify(this.document)) as SerializedCanvasDocument;
  }

  async importDocument(document: SerializedCanvasDocument): Promise<void> {
    this.document = JSON.parse(JSON.stringify(document)) as SerializedCanvasDocument;
  }

  saveHistorySnapshot(): void {
    return undefined;
  }

  async restorePreviousHistorySnapshot(): Promise<boolean> {
    return false;
  }
}

describe('canvas ports', () => {
  it('allows canvas events to update editor store without runtime canvas objects', () => {
    const adapter = new FakeCanvasAdapter();
    const store = new EditorStore();
    const selection: EditorSelection = {
      type: 'terrain',
      viewId: 'front_1',
      terrainType: 3,
      screenPosition: {x: 12, y: 34},
    };

    const unsubscribe = adapter.onSelectionChange((nextSelection) => {
      store.dispatch({type: 'SELECT_EDITOR_TARGET', selection: nextSelection});
    });

    adapter.emitSelection(selection);
    unsubscribe();

    expect(store.getState().selection).toEqual(selection);
  });

  it('moves canvas documents through serializable snapshots', async () => {
    const adapter = new FakeCanvasAdapter();
    const document: SerializedCanvasDocument = {
      schemaVersion: CANVAS_DOCUMENT_VERSION,
      objects: [
        {
          id: 'object_1',
          kind: 'house-view',
          shape: 'group',
          metadata: {houseView: 'top'},
        },
      ],
    };

    await adapter.importDocument(document);
    const exported = await adapter.exportDocument();

    expect(exported).toEqual(document);
    expect(exported.schemaVersion).toBe(CANVAS_DOCUMENT_VERSION);
    expect(JSON.parse(JSON.stringify(exported))).toEqual(document);
  });
});
