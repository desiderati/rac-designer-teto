import {MouseEvent as ReactMouseEvent, useCallback, useEffect, useRef, useState} from 'react';
import {getSettings} from '@/infra/settings.ts';

const INTERACTIVE_SELECTOR = '[data-no-drag], button, input, textarea, select, a';
const FIXED_EDITOR_POSITION = {x: 88, y: 24} as const;

interface UseFloatingEditorArgs {
  isOpen: boolean;
  anchorPosition?: { x: number; y: number };
  onCancel: () => void;
}

interface UseFloatingEditorResult {
  panelPos: { x: number; y: number } | null;
  handleDragStart: (e: ReactMouseEvent) => void;
}

export function useFloatingEditor({
  isOpen,
  anchorPosition,
  onCancel,
}: UseFloatingEditorArgs): UseFloatingEditorResult {

  const [panelPos, setPanelPos] = useState<{ x: number; y: number } | null>(null);
  const {openEditorsAtFixedPosition} = getSettings();
  const wasOpenRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({x: 0, y: 0});

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }

    const isFirstOpen = !wasOpenRef.current;
    wasOpenRef.current = true;

    if (isFirstOpen) {
      isDraggingRef.current = false;
      if (openEditorsAtFixedPosition) {
        setPanelPos({...FIXED_EDITOR_POSITION});
      } else if (anchorPosition) {
        setPanelPos({x: anchorPosition.x + 12, y: anchorPosition.y + 12});
      } else {
        setPanelPos({x: 24, y: 24});
      }
      return;
    }

    setPanelPos(null);
  }, [isOpen, anchorPosition, openEditorsAtFixedPosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      onCancel();
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onCancel]);

  const handleDragStart = useCallback((e: ReactMouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest(INTERACTIVE_SELECTOR)) return;

    const currentPos = panelPos || {
      x: openEditorsAtFixedPosition ? FIXED_EDITOR_POSITION.x : (anchorPosition?.x ?? 200) + 10,
      y: openEditorsAtFixedPosition ? FIXED_EDITOR_POSITION.y : (anchorPosition?.y ?? 200) - 60,
    };

    isDraggingRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - currentPos.x,
      y: e.clientY - currentPos.y,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current) return;
      setPanelPos({
        x: ev.clientX - dragOffsetRef.current.x,
        y: ev.clientY - dragOffsetRef.current.y,
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [panelPos, anchorPosition, openEditorsAtFixedPosition]);

  return {
    panelPos,
    handleDragStart,
  };
}
