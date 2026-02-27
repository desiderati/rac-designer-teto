import {describe, expect, it, vi} from 'vitest';
import {buildPilotiSelectionHandler} from './canvas-piloti-selection.ts';

describe('canvas piloti selection handler', () => {
  it('emits selection and hint for piloti clicks', () => {
    const piloti = {
      pilotiId: 'piloti_0_0',
      isPilotiCircle: true,
      pilotiHeight: 1.5,
      pilotiIsMaster: false,
      pilotiNivel: 0.3,
      getCenterPoint: () => ({x: 10, y: 20}),
      set: vi.fn(),
    } as any;

    const group = {
      type: 'group',
      myType: 'house',
      houseView: 'top',
      getObjects: () => [piloti],
      setCoords: vi.fn(),
    } as any;

    const canvas = {
      getObjects: () => [group],
      renderAll: vi.fn(),
    } as any;

    const emitPilotiSelection = vi.fn();
    const emitSelectionChange = vi.fn();
    const onContraventamentoPilotiClick = vi.fn();
    const onContraventamentoCancel = vi.fn();

    const handler = buildPilotiSelectionHandler({
      canvas,
      isPilotiVisualTarget: () => true,
      emitPilotiSelection,
      emitSelectionChange,
      clearContraventamentoSelection: vi.fn(),
      isContraventamentoMode: () => false,
      isSelectingContraventamentoDestination: () => false,
      isPilotiEligibleForContraventamento: () => true,
      onContraventamentoCancel,
      onContraventamentoPilotiClick,
      getCurrentScreenPoint: () => ({x: 100, y: 200}),
    });

    handler(piloti, group);

    expect(emitPilotiSelection).toHaveBeenCalledWith(
      expect.objectContaining({pilotiId: 'piloti_0_0', currentHeight: 1.5, currentNivel: 0.3}),
    );
    expect(emitSelectionChange).toHaveBeenCalled();
    expect(onContraventamentoPilotiClick).not.toHaveBeenCalled();
    expect(onContraventamentoCancel).not.toHaveBeenCalled();
  });
});
