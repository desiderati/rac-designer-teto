import {expect, it, vi} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {CanvasOverlays} from './CanvasOverlays.tsx';

it('disponibiliza recarga do desenho sem depender de refresh da página', () => {
  const onReloadDrawing = vi.fn();

  render(
    <CanvasOverlays
      showZoomControls={false}
      isPinching={false}
      zoom={1}
      onZoomChange={vi.fn()}
      containerWidth={800}
      containerHeight={600}
      viewportX={0}
      viewportY={0}
      onViewportChange={vi.fn()}
      minimapObjects={[]}
      showTips={false}
      onReloadDrawing={onReloadDrawing}
    />,
  );

  fireEvent.click(screen.getByRole('button', {name: 'Recarregar desenho do Canvas'}));
  expect(onReloadDrawing).toHaveBeenCalledOnce();
});
