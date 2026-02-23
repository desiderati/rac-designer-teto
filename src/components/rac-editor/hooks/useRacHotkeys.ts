import {useEffect, useRef} from 'react';

interface UseRacHotkeysOptions {
  onToggleDrawMode: () => void;
  onToggleZoomControls: () => void;
}

function isEditableElement(element: Element | null): boolean {
  if (!element) return false;
  if (element instanceof HTMLElement && element.isContentEditable) return true;
  const tagName = (element as HTMLElement).tagName;
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
}

function shouldIgnoreShortcut(event: KeyboardEvent): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) return true;
  return isEditableElement(document.activeElement);
}

export function useRacHotkeys({onToggleDrawMode, onToggleZoomControls}: UseRacHotkeysOptions) {
  const drawModeHandlerRef = useRef(onToggleDrawMode);
  const zoomHandlerRef = useRef(onToggleZoomControls);

  useEffect(() => {
    drawModeHandlerRef.current = onToggleDrawMode;
  }, [onToggleDrawMode]);

  useEffect(() => {
    zoomHandlerRef.current = onToggleZoomControls;
  }, [onToggleZoomControls]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreShortcut(event)) return;

      const key = event.key.toLowerCase();
      if (key === 'l') {
        event.preventDefault();
        drawModeHandlerRef.current();
        return;
      }

      if (key === 'z') {
        event.preventDefault();
        zoomHandlerRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
