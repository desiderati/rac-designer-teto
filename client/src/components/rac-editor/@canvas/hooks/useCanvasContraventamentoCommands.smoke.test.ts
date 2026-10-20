import {act, renderHook} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {Group} from 'fabric';
import {toCanvasGroup} from '@/components/rac-editor/@canvas/lib/canvas.ts';
import {TOAST_MESSAGES} from '@/shared/config.ts';
import {useContraventamentoCommands} from './useCanvasContraventamentoCommands.ts';

const mocks = vi.hoisted(() => ({
  toast: {error: vi.fn(), success: vi.fn(), info: vi.fn(), warning: vi.fn()},
  resetHighlight: vi.fn(),
  emit: vi.fn(),
}));
vi.mock('@/components/ui/sonner.tsx', () => ({toast: mocks.toast}));
vi.mock('@/bootstrap/editor-bootstrap.ts', () => ({useEditorPorts: () => ({settingsPort: {getSettings: vi.fn()}})}));
vi.mock('@/components/rac-editor/lib/house-store.ts', () => ({
  useHouseRuntimeSnapshot: () => null,
  useHouseStoreEmitter: () => mocks.emit,
}));
vi.mock('@/components/rac-editor/@canvas/lib', () => ({
  addContraventamentoBeam: vi.fn(), addHorizontalContraventamentoBeam: vi.fn(),
  removeContraventamentosFromTopView: vi.fn(), syncContraventamentoElevationViews: vi.fn(),
}));
vi.mock('@/components/rac-editor/@canvas/lib/contraventamento-top-view-highlight.ts', () => ({
  highlightEligibleContraventamentoPilotis: vi.fn(),
  resetHighlightContraventamentoPilotis: mocks.resetHighlight,
}));

beforeEach(() => vi.clearAllMocks());

describe('cancelamento de contraventamento', () => {
  it.each([false, true])('limpa o fluxo sem toast ou gravação (destino pendente: %s)', (pending) => {
    const resetContraventamentoFlow = vi.fn();
    const saveHistory = vi.fn();
    const topGroup = toCanvasGroup(new Group());
    const input: Parameters<typeof useContraventamentoCommands>[0] = {
      canvasRef: {current: {saveHistory, renderAll: vi.fn(), clearHistory: vi.fn(),
        undo: vi.fn(), copy: vi.fn(), paste: vi.fn()}},
      getTopViewGroup: vi.fn(() => topGroup),
      getNonTopViewGroups: () => [],
      getContraventamentoColumnSides: () => ({left: false, right: false}),
      getContraventamentoHorizontalSides: () => ({top: false, bottom: false}),
      isPilotiEligibleForContraventamentoColumn: () => false,
      isPilotiEligibleForContraventamentoRow: () => false,
      isPilotiEligibleAsDestination: () => false,
      setSelectedContraventamento: vi.fn(), setIsContraventamentoMode: vi.fn(),
      contraventamentoFirst: pending ? {col: 0, row: 0, pilotiId: 'piloti_0_0'} : null,
      setContraventamentoFirst: vi.fn(), contraventamentoSide: pending ? 'left' : null,
      setContraventamentoSide: vi.fn(), resetContraventamentoFlow,
      pilotiSelection: null, setPilotiSelection: vi.fn(), setIsPilotiEditorOpen: vi.fn(),
      setActiveSubmenu: vi.fn(),
    };
    const {result} = renderHook(() => useContraventamentoCommands(input));
    act(() => result.current.handleCancelContraventamento());
    expect(resetContraventamentoFlow).toHaveBeenCalledOnce();
    expect(mocks.resetHighlight).toHaveBeenCalledWith(topGroup);
    for (const notify of Object.values(mocks.toast)) expect(notify).not.toHaveBeenCalled();
    expect(saveHistory).not.toHaveBeenCalled();
    expect(mocks.emit).not.toHaveBeenCalled();
    if (pending) {
      act(() => result.current.handleContraventamentoPilotiClick(1, 0));
      expect(mocks.toast.warning).toHaveBeenCalledWith(TOAST_MESSAGES.contraventamentoSelectSecondPilotiInSameColumn);
    }
  });
});
