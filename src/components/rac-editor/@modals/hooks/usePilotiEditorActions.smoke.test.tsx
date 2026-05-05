import {ReactNode, createRef} from 'react';
import {act, renderHook} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {
  createEditorStore,
  EditorStoreContext,
} from '@/bootstrap/editor-bootstrap.ts';
import type {PilotiCanvasSelection} from '@/components/rac-editor/@canvas/ports/CanvasSelectionPort.ts';
import {RAC_CANVAS_OBJECT_SELECTED_EVENT} from '@/components/rac-editor/@canvas/lib/canvas-object-dom-events.ts';
import {usePilotiEditorActions} from '@/components/rac-editor/@modals/hooks/usePilotiEditorActions.ts';

function createPilotiSelection(): PilotiCanvasSelection {
  return {
    pilotiId: 'piloti_0_0',
    currentHeight: 1,
    currentIsMaster: false,
    currentNivel: 0.2,
    editorSelection: {
      type: 'piloti',
      pilotiId: 'piloti_0_0',
      houseView: 'top',
      screenPosition: {x: 10, y: 20},
    },
    pilotiIds: ['piloti_0_0', 'piloti_3_2'],
    screenPosition: {x: 10, y: 20},
    houseView: 'top',
  };
}

function Wrapper({children}: { children: ReactNode }) {
  return (
    <EditorStoreContext.Provider value={createEditorStore()}>
      {children}
    </EditorStoreContext.Provider>
  );
}

describe('usePilotiEditorActions', () => {
  it('emits the master-piloti tip at the navigated piloti screen position', () => {
    const canvasRef = createRef<any>();
    canvasRef.current = {
      applyPilotiSelectionVisuals: vi.fn(),
      getPilotiScreenPosition: vi.fn(() => ({x: 300, y: 400})),
      renderAll: vi.fn(),
      saveHistory: vi.fn(),
    };
    const events: CustomEvent[] = [];
    const listener = (event: Event) => events.push(event as CustomEvent);
    document.addEventListener(RAC_CANVAS_OBJECT_SELECTED_EVENT, listener);

    const {result} = renderHook(() => usePilotiEditorActions({
      isContraventamentoMode: false,
      canvasRef,
      pilotiSelection: createPilotiSelection(),
      setPilotiSelection: vi.fn(),
      setIsPilotiEditorOpen: vi.fn(),
      syncContraventamentoElevations: vi.fn(),
      setInfoMessage: vi.fn(),
    }), {wrapper: Wrapper});

    act(() => {
      result.current.handlePilotiNavigate('piloti_3_2', 1.5, true, 0.6);
    });

    document.removeEventListener(RAC_CANVAS_OBJECT_SELECTED_EVENT, listener);

    expect(canvasRef.current.getPilotiScreenPosition).toHaveBeenCalledWith('piloti_3_2', 'top');
    expect(events).toHaveLength(1);
    expect(events[0].detail).toMatchObject({
      kind: 'piloti-master',
      rect: {
        left: 282,
        top: 382,
        width: 36,
        height: 36,
      },
    });
  });
});
