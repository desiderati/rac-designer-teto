import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {useHotkeys} from './useHotkeys.ts';

function HotkeysHarness({
  onToggleDrawMode,
  onToggleZoomControls,
}: {
  onToggleDrawMode: () => void;
  onToggleZoomControls: () => void;
}) {
  useHotkeys({onToggleDrawMode, onToggleZoomControls});
  return <input data-testid='hotkeys-input'/>;
}

describe('useHotkeys smoke', () => {
  it('triggers draw and zoom callbacks for L/Z keys', () => {
    const onToggleDrawMode = vi.fn();
    const onToggleZoomControls = vi.fn();

    render(
      <HotkeysHarness
        onToggleDrawMode={onToggleDrawMode}
        onToggleZoomControls={onToggleZoomControls}
      />,
    );

    fireEvent.keyDown(window, {key: 'l'});
    fireEvent.keyDown(window, {key: 'Z'});

    expect(onToggleDrawMode).toHaveBeenCalledTimes(1);
    expect(onToggleZoomControls).toHaveBeenCalledTimes(1);
  });

  it('ignores shortcuts when an input is focused or modifiers are pressed', () => {
    const onToggleDrawMode = vi.fn();
    const onToggleZoomControls = vi.fn();

    render(
      <HotkeysHarness
        onToggleDrawMode={onToggleDrawMode}
        onToggleZoomControls={onToggleZoomControls}
      />,
    );

    const input = screen.getByTestId('hotkeys-input');
    input.focus();

    fireEvent.keyDown(window, {key: 'l'});
    fireEvent.keyDown(window, {key: 'z', ctrlKey: true});

    expect(onToggleDrawMode).not.toHaveBeenCalled();
    expect(onToggleZoomControls).not.toHaveBeenCalled();
  });
});
