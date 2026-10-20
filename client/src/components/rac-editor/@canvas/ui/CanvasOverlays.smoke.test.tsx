import {beforeEach, describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {CanvasOverlays} from './CanvasOverlays.tsx';

const viewport = vi.hoisted(() => ({mobile: false, landscape: false, portrait: false}));
vi.mock('@/components/rac-editor/lib/use-canvas-mobile-viewport.ts', () => ({
  useCanvasMobileViewport: () => viewport,
}));

beforeEach(() => Object.assign(viewport, {mobile: false, landscape: false, portrait: false}));

const minimapProps = {
  showZoomControls: false, isPinching: false, zoom: 1, onZoomChange: () => {},
  containerWidth: 800, containerHeight: 600, viewportX: 0, viewportY: 0,
  onViewportChange: () => {}, minimapObjects: [], showTips: false,
};

describe('minimapa temporário no panning mobile', () => {
  it.each([false, true])('respeita preferência %s ao mover objetos', (enabled) => {
    viewport.mobile = true;
    const {rerender} = render(<CanvasOverlays {...minimapProps} showZoomControls={enabled}/>);
    expect(screen.queryAllByTestId('rac-minimap').length > 0).toBe(enabled);
    rerender(<CanvasOverlays {...minimapProps} showZoomControls={enabled} isObjectMoving/>);
    expect(screen.queryAllByTestId('rac-minimap').length).toBeGreaterThan(0);
    rerender(<CanvasOverlays {...minimapProps} showZoomControls={enabled} isObjectMoving={false}/>);
    expect(screen.queryAllByTestId('rac-minimap').length > 0).toBe(enabled);
  });

  it('não abre ao mover objetos no desktop e mantém a visibilidade ao passar de arrasto para pan', () => {
    const {rerender} = render(<CanvasOverlays {...minimapProps} isObjectMoving/>);
    expect(screen.queryAllByTestId('rac-minimap')).toHaveLength(0);
    viewport.mobile = true;
    rerender(<CanvasOverlays {...minimapProps} isObjectMoving isPanning/>);
    rerender(<CanvasOverlays {...minimapProps} isPanning/>);
    expect(screen.queryAllByTestId('rac-minimap').length).toBeGreaterThan(0);
  });
  it.each(['vertical', 'horizontal'])('aparece somente durante o gesto na orientação %s', (orientation) => {
    Object.assign(viewport, {mobile: true, landscape: orientation === 'horizontal', portrait: orientation === 'vertical'});
    const {rerender} = render(<CanvasOverlays {...minimapProps} isPanning={false}/>);
    expect(screen.queryAllByTestId('rac-minimap')).toHaveLength(0);
    rerender(<CanvasOverlays {...minimapProps} isPanning/>);
    expect(screen.queryAllByTestId('rac-minimap').length).toBeGreaterThan(0);
    rerender(<CanvasOverlays {...minimapProps} isPanning={false}/>);
    expect(screen.queryAllByTestId('rac-minimap')).toHaveLength(0);
  });

  it('mantém o minimapa habilitado antes, durante e depois do panning', () => {
    viewport.mobile = true;
    const {rerender} = render(<CanvasOverlays {...minimapProps} showZoomControls/>);
    expect(screen.queryAllByTestId('rac-minimap').length).toBeGreaterThan(0);
    rerender(<CanvasOverlays {...minimapProps} showZoomControls isPanning/>);
    expect(screen.queryAllByTestId('rac-minimap').length).toBeGreaterThan(0);
    rerender(<CanvasOverlays {...minimapProps} showZoomControls isPanning={false}/>);
    expect(screen.queryAllByTestId('rac-minimap').length).toBeGreaterThan(0);
  });

  it('não abre automaticamente no desktop nem durante zoom sem deslocamento', () => {
    const {rerender} = render(<CanvasOverlays {...minimapProps} isPanning/>);
    expect(screen.queryAllByTestId('rac-minimap')).toHaveLength(0);
    viewport.mobile = true;
    rerender(<CanvasOverlays {...minimapProps} isPinching/>);
    expect(screen.queryAllByTestId('rac-minimap')).toHaveLength(0);
  });
});

it('não renderiza um segundo botão de recarga sobre o Canvas', () => {
  render(
    <CanvasOverlays
      showZoomControls={false}
      isPinching={false}
      zoom={1}
      onZoomChange={() => {}}
      containerWidth={800}
      containerHeight={600}
      viewportX={0}
      viewportY={0}
      onViewportChange={() => {}}
      minimapObjects={[]}
      showTips={false}
    />,
  );

  expect(screen.queryByRole('button', {name: 'Recarregar desenho do Canvas'})).not.toBeInTheDocument();
});
