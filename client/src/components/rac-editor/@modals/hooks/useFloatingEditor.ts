import {type MouseEvent as ReactMouseEvent, type RefObject, useCallback, useEffect, useRef, useState} from 'react';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';

const INTERACTIVE_SELECTOR = '[data-no-drag], button, input, textarea, select, a';
const FIXED_EDITOR_POSITION = {x: 88, y: 24} as const;

interface UseFloatingEditorArgs {
  isOpen: boolean;
  anchorPosition?: { x: number; y: number };
  onCancel: () => void;
  panelRef?: RefObject<HTMLElement | null>;
  initialTop?: number;
}

interface UseFloatingEditorResult {
  panelPos: { x: number; y: number } | null;
  handleDragStart: (e: ReactMouseEvent) => void;
}

export function useFloatingEditor({
  isOpen,
  anchorPosition,
  onCancel,
  panelRef,
  initialTop,
}: UseFloatingEditorArgs): UseFloatingEditorResult {

  const [panelPos, setPanelPos] = useState<{ x: number; y: number } | null>(null);
  const {settingsPort} = useEditorPorts();
  const {openEditorsAtFixedPosition} = settingsPort.getSettings();
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
        setPanelPos({...FIXED_EDITOR_POSITION, y: initialTop ?? FIXED_EDITOR_POSITION.y});
      } else if (anchorPosition) {
        setPanelPos({x: anchorPosition.x + 12, y: initialTop ?? anchorPosition.y + 12});
      } else {
        setPanelPos({x: 24, y: initialTop ?? 24});
      }
      return;
    }

    setPanelPos(null);
  }, [isOpen, anchorPosition, openEditorsAtFixedPosition, initialTop]);

  useEffect(() => {
    const panel = panelRef?.current;
    if (!isOpen || !panel) return;
    const keepInsideViewport = () => {
      const maximumTop = Math.max(8, window.innerHeight - panel.getBoundingClientRect().height - 8);
      setPanelPos(current => {
        if (!current) return current;
        const y = Math.min(Math.max(8, current.y), maximumTop);
        return y === current.y ? current : {...current, y};
      });
    };
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(keepInsideViewport);
    observer?.observe(panel);
    window.addEventListener('resize', keepInsideViewport);
    return () => {observer?.disconnect(); window.removeEventListener('resize', keepInsideViewport);};
  }, [isOpen, panelRef]);

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

    const bounds = panelRef?.current?.getBoundingClientRect();
    const currentPos = bounds?.height ? {x: bounds.left, y: bounds.top} : panelPos || {
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
        y: Math.min(Math.max(8, ev.clientY - dragOffsetRef.current.y),
          Math.max(8, window.innerHeight - (panelRef?.current?.getBoundingClientRect().height ?? 0) - 8)),
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [panelPos, anchorPosition, openEditorsAtFixedPosition, panelRef]);

  return {
    panelPos,
    handleDragStart,
  };
}
