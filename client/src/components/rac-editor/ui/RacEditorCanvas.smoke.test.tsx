import {createRef} from 'react';
import type {ComponentProps} from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {RacEditorCanvas} from './RacEditorCanvas.tsx';
import type {CanvasHandle} from '@/components/rac-editor/@canvas/ports/CanvasHandle.ts';

const mocks = vi.hoisted(() => {
  const initializeCanvas = vi.fn();
  return {initializeCanvas, ports: {houseRuntimePort: {initializeCanvas}},
    mobile: false, portrait: false, selectionCount: 0, infoToast: vi.fn(), dismissToast: vi.fn()};
});

vi.mock('@/components/rac-editor/lib/use-canvas-mobile-viewport.ts', () => ({
  useCanvasMobileViewport: () => ({mobile: mocks.mobile, portrait: mocks.portrait}),
}));
vi.mock('@/components/ui/sonner.tsx', () => ({toast: {info: mocks.infoToast, dismiss: mocks.dismissToast}}));

vi.mock('@/bootstrap/editor-bootstrap.ts', () => ({
  useEditorPorts: () => mocks.ports,
}));

vi.mock('@/components/rac-editor/@canvas/ui/Canvas.tsx', async () => {
  const {forwardRef, useImperativeHandle} = await import('react');
  return {
    Canvas: forwardRef(function MockCanvas(props: {children?: React.ReactNode; onSelectionChange: (message: string) => void}, ref) {
      useImperativeHandle(ref, () => ({
        getActiveObjectCount: () => mocks.selectionCount,
        createCanvasHouseRuntimePort: () => ({
          getHouseGroups: () => [],
          includesGroup: () => false,
          requestRenderAll: () => {},
        }),
      }), []);
      return <>{props.children}<button onClick={() => {
        mocks.selectionCount = 0;
        props.onSelectionChange('');
      }}>Limpar seleção de teste</button><button onClick={() => props.onSelectionChange('mesma dica')}>
        Atualizar seleção de teste
      </button></>;
    }),
  };
});

describe('RacEditorCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mobile = false;
    mocks.portrait = false;
    mocks.selectionCount = 0;
  });

  function hintProps() {
    return {
      canvasRef: createRef<CanvasHandle>(), showTips: true, showZoomControls: false,
      infoMessage: '<b>Árvore:</b> Escala proporcional.', isAnyEditorOpen: false,
      isContraventamentoMode: false, isPilotiEligibleForContraventamento: () => false,
      canvasToolMode: 'select' as const, onZoomChange: vi.fn(), onSelectionMessage: vi.fn(),
      onSelectionAuxCleanup: vi.fn(), onZoomInteraction: vi.fn(), onPilotiSelect: vi.fn(),
      onWallSelect: vi.fn(), onLinearSelect: vi.fn(), onTerrainSelect: vi.fn(), onDelete: vi.fn(),
      onContraventamentoPilotiClick: vi.fn(), onContraventamentoCancel: vi.fn(),
      onFreeDrawPathCreated: vi.fn(), onCanvasDocumentChange: vi.fn(),
    } satisfies ComponentProps<typeof RacEditorCanvas>;
  }

  it('mostra a dica mobile como informação temporária, sem hint fixo ou duplicação ao renderizar', () => {
    mocks.mobile = true;
    mocks.selectionCount = 1;
    const props = hintProps();
    const view = render(<RacEditorCanvas {...props}/>);
    expect(mocks.infoToast).toHaveBeenCalledTimes(1);
    expect(mocks.infoToast).toHaveBeenCalledWith('Dica', expect.objectContaining({duration: 5_000}));
    expect(screen.queryByText('Escala proporcional.', {exact: false})).not.toBeInTheDocument();
    view.rerender(<RacEditorCanvas {...props}/>);
    expect(mocks.infoToast).toHaveBeenCalledTimes(1);
    view.rerender(<RacEditorCanvas {...props} showTips={false}/>);
    expect(mocks.dismissToast).toHaveBeenCalledWith('rac-mobile-canvas-tip');
    view.rerender(<RacEditorCanvas {...props}/>);
    expect(mocks.infoToast).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole('button', {name: 'Limpar seleção de teste'}));
    expect(mocks.dismissToast).toHaveBeenCalledTimes(2);
    view.unmount();
  });

  it.each([{mobile: false, portrait: false}, {mobile: true, portrait: true}])(
    'mantém o hint desktop e não notifica sob o aviso de orientação: %o', (viewport) => {
      Object.assign(mocks, viewport, {selectionCount: 1});
      render(<RacEditorCanvas {...hintProps()}/>);
      expect(mocks.infoToast).not.toHaveBeenCalled();
      if (!viewport.mobile) expect(screen.getByText('Árvore:')).toBeVisible();
      else expect(screen.queryByText('Árvore:')).not.toBeInTheDocument();
    },
  );

  it('reapresenta o aviso em uma nova seleção mesmo quando o texto da dica é igual', () => {
    mocks.mobile = true;
    mocks.selectionCount = 1;
    render(<RacEditorCanvas {...hintProps()}/>);
    expect(mocks.infoToast).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', {name: 'Atualizar seleção de teste'}));
    expect(mocks.infoToast).toHaveBeenCalledTimes(2);
    expect(mocks.dismissToast).not.toHaveBeenCalled();
  });

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

    const firstMount = render(<RacEditorCanvas {...props} loading/>);
    const overlay = screen.getByTestId('house-canvas-loading');
    expect(overlay).toContainElement(screen.getByRole('status'));
    expect(screen.getByRole('status')).toHaveTextContent('Carregando o Canvas...');
    expect(overlay.parentElement).toHaveAttribute('aria-busy', 'true');
    firstMount.rerender(<RacEditorCanvas {...props} loading={false}/>);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(overlay.parentElement).toBeNull();
    expect(mocks.initializeCanvas).toHaveBeenCalledTimes(1);
    const firstRuntime = mocks.initializeCanvas.mock.calls[0]?.[0];

    firstMount.unmount();
    render(<RacEditorCanvas {...props}/>);

    expect(mocks.initializeCanvas).toHaveBeenCalledTimes(2);
    expect(mocks.initializeCanvas.mock.calls[1]?.[0]).not.toBe(firstRuntime);
  });
});
