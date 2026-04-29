import {useEffect, useRef} from 'react';
import type {CanvasToolMode} from '@/components/rac-editor/menus/lib/menu-types.ts';
import {VIEWPORT} from '@/shared/config.ts';

interface UseHotkeysOptions {
  onToggleDrawMode: () => void;
  onToggleZoomControls: () => void;
  onSetCanvasToolMode: (mode: CanvasToolMode) => void;
  onFitToView: () => void;
}

/**
 * Global keyboard shortcuts for the canvas:
 *  - L: toggle draw (pencil) mode
 *  - Z: toggle zoom/minimap visibility
 *  - S: switch to selection tool
 *  - P: switch to pan tool
 *  - F: fit canvas to view
 *
 * Shortcuts are suppressed while the user is typing in editable elements
 * or pressing modifier keys (ctrl/meta/alt).
 */
export function useHotkeys({
  onToggleDrawMode,
  onToggleZoomControls,
  onSetCanvasToolMode,
  onFitToView,
}: UseHotkeysOptions) {
  const drawModeHandlerRef = useRef(onToggleDrawMode);
  const zoomHandlerRef = useRef(onToggleZoomControls);
  const setToolModeRef = useRef(onSetCanvasToolMode);
  const fitToViewRef = useRef(onFitToView);

  useEffect(() => {
    drawModeHandlerRef.current = onToggleDrawMode;
  }, [onToggleDrawMode]);

  useEffect(() => {
    zoomHandlerRef.current = onToggleZoomControls;
  }, [onToggleZoomControls]);

  useEffect(() => {
    setToolModeRef.current = onSetCanvasToolMode;
  }, [onSetCanvasToolMode]);

  useEffect(() => {
    fitToViewRef.current = onFitToView;
  }, [onFitToView]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreShortcut(event)) return;

      const key = event.key.toLowerCase();
      const isMobileDevice = window.matchMedia(VIEWPORT.mobileMaxWidthQuery).matches;
      switch (key) {
        case 'l':
          event.preventDefault();
          drawModeHandlerRef.current();
          return;
        case 'z':
          event.preventDefault();
          zoomHandlerRef.current();
          return;
        case 's':
          if (isMobileDevice) return;
          event.preventDefault();
          setToolModeRef.current('select');
          return;
        case 'p':
          if (isMobileDevice) return;
          event.preventDefault();
          setToolModeRef.current('pan');
          return;
        case 'f':
          if (isMobileDevice) return;
          event.preventDefault();
          fitToViewRef.current();
          return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}

function shouldIgnoreShortcut(event: KeyboardEvent): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) return true;
  return isEditableElement(document.activeElement);
}

function isEditableElement(element: Element | null): boolean {
  if (!element) return false;
  if (element instanceof HTMLElement && element.isContentEditable) return true;
  const tagName = (element as HTMLElement).tagName;
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
}
