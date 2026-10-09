import {expect, it} from 'vitest';
import {render, screen} from '@testing-library/react';
import {CanvasOverlays} from './CanvasOverlays.tsx';

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
