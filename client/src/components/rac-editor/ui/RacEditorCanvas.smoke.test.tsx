import {createRef} from 'react';
import type {ComponentProps} from 'react';
import {render} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {RacEditorCanvas} from './RacEditorCanvas.tsx';
import type {CanvasHandle} from '@/components/rac-editor/@canvas/ports/CanvasHandle.ts';

const mocks = vi.hoisted(() => ({
  initializeCanvas: vi.fn(),
}));

vi.mock('@/bootstrap/editor-bootstrap.ts', () => ({
  useEditorPorts: () => ({
    houseRuntimePort: {initializeCanvas: mocks.initializeCanvas},
  }),
}));

vi.mock('@/components/rac-editor/@canvas/ui/Canvas.tsx', async () => {
  const {forwardRef, useImperativeHandle} = await import('react');
  return {
    Canvas: forwardRef(function MockCanvas(_props, ref) {
      useImperativeHandle(ref, () => ({
        createCanvasHouseRuntimePort: () => ({
          getHouseGroups: () => [],
          includesGroup: () => false,
          requestRenderAll: () => {},
        }),
      }));
      return null;
    }),
  };
});

describe('RacEditorCanvas', () => {
  it('reconecta o runtime da casa quando o canvas é remontado', () => {
    const canvasRef = createRef<CanvasHandle>();
    const props = {
      canvasRef,
      showTips: false,
      showZoomControls: false,
      infoMessage: '',
      isAnyEditorOpen: false,
      isContraventamentoMode: false,
      isPilotiEligibleForContraventamento: () => false,
      canvasToolMode: 'select',
      onZoomChange: vi.fn(),
      onSelectionMessage: vi.fn(),
      onSelectionAuxCleanup: vi.fn(),
      onZoomInteraction: vi.fn(),
      onPilotiSelect: vi.fn(),
      onWallSelect: vi.fn(),
      onLinearSelect: vi.fn(),
      onTerrainSelect: vi.fn(),
      onDelete: vi.fn(),
      onContraventamentoPilotiClick: vi.fn(),
      onContraventamentoCancel: vi.fn(),
      onFreeDrawPathCreated: vi.fn(),
      onCanvasDocumentChange: vi.fn(),
    } satisfies ComponentProps<typeof RacEditorCanvas>;

    const firstMount = render(<RacEditorCanvas {...props}/>);
    expect(mocks.initializeCanvas).toHaveBeenCalledTimes(1);
    const firstRuntime = mocks.initializeCanvas.mock.calls[0]?.[0];

    firstMount.unmount();
    render(<RacEditorCanvas {...props}/>);

    expect(mocks.initializeCanvas).toHaveBeenCalledTimes(2);
    expect(mocks.initializeCanvas.mock.calls[1]?.[0]).not.toBe(firstRuntime);
  });
});
