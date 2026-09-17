import {useEffect, useRef} from 'react';
import type {CanvasToolMode} from '@/components/rac-editor/@menus/lib/menu-types.ts';
import {VIEWPORT} from '@/shared/config.ts';

interface UseHotkeysOptions {
  onToggleDrawMode: () => void;
  onToggleZoomControls: () => void;
  onSetCanvasToolMode: (mode: CanvasToolMode) => void;
  onFitToView: () => void;
}

/**
 * Atalhos globais de teclado para o canvas:
 *  - L: alternar modo de desenho a lápis
 *  - Z: alternar visibilidade de zoom/minimapa
 *  - S: alternar para ferramenta de seleção
 *  - P: alternar para ferramenta de pan
 *  - F: ajustar canvas à viewport
 *
 * Os atalhos são suprimidos enquanto o usuário digita em elementos editáveis
 * ou pressiona teclas modificadoras (ctrl/meta/alt).
 */
export function useRacEditorHotkeys({
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
