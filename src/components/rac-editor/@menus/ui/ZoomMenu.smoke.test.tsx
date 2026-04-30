import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {ZoomMenu} from './ZoomMenu.tsx';

const Menu = ZoomMenu as React.ComponentType<any>;

function renderZoomMenu({isMobile = false} = {}) {
  const user = userEvent.setup();
  const props = {
    isMobile,
    zoom: 1.25,
    canvasToolMode: 'select',
    onSetToolMode: vi.fn(),
    onFitToView: vi.fn(),
  };

  render(<Menu {...props}/>);

  return {user, props};
}

describe('ZoomMenu.tsx', () => {
  it('shows labels and shortcuts on desktop', async () => {
    const {user} = renderZoomMenu({isMobile: false});

    await user.click(screen.getByRole('button', {name: /Zoom atual 125%/}));

    expect(screen.getByText('Seleção')).toBeVisible();
    expect(screen.getByText('Panning')).toBeVisible();
    expect(screen.getByText('Fit to View')).toBeVisible();
    expect(screen.getByText('S')).toBeVisible();
    expect(screen.getByText('P')).toBeVisible();
    expect(screen.getByText('F')).toBeVisible();
  });

  it('keeps only icon buttons visible on mobile while preserving accessible names', async () => {
    const {user, props} = renderZoomMenu({isMobile: true});

    await user.click(screen.getByRole('button', {name: /Zoom atual 125%/}));
    await user.click(screen.getByRole('button', {name: 'Panning'}));

    expect(screen.queryByText('Seleção')).not.toBeInTheDocument();
    expect(screen.queryByText('Panning')).not.toBeInTheDocument();
    expect(screen.queryByText('Fit to View')).not.toBeInTheDocument();
    expect(screen.queryByText('S')).not.toBeInTheDocument();
    expect(screen.queryByText('P')).not.toBeInTheDocument();
    expect(screen.queryByText('F')).not.toBeInTheDocument();
    expect(props.onSetToolMode).toHaveBeenCalledWith('pan');
  });

  it('shows the zoom percentage instead of the magnifying glass on mobile', () => {
    renderZoomMenu({isMobile: true});

    const trigger = screen.getByRole('button', {name: /Zoom atual 125%/});

    expect(screen.getByText('125%')).toBeVisible();
    expect(trigger.querySelector('svg')).not.toBeInTheDocument();
  });
});
