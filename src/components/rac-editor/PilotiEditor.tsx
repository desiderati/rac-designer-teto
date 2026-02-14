import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Group } from 'fabric';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  PILOTI_HEIGHTS,
  CORNER_PILOTI_IDS,
  formatPilotiHeight,
  getPilotiName,
  getPilotiFromGroup,
  getAllPilotiIds,
  getPilotiIdsFromGroup,
} from '@/lib/canvas-utils';
import { houseManager } from '@/lib/house-manager';
import { getSettings } from '@/lib/settings';
import { PilotiGridIcon } from './PilotiGridIcon';

interface PilotiEditorProps {
  isOpen: boolean;
  onClose: () => void;
  pilotiId: string | null;
  currentHeight: number;
  currentIsMaster?: boolean;
  currentNivel?: number;
  group: Group | null;
  isMobile: boolean;
  anchorPosition?: { x: number; y: number };
  houseView?: 'top' | 'front' | 'back' | 'side';
  onHeightChange: (newHeight: number) => void;
  onNavigate?: (pilotiId: string, height: number, isMaster: boolean, nivel: number) => void;
}

const DEFAULT_NIVEL = 0.2;

function formatNivel(n: number): string {
  return n.toFixed(2).replace('.', ',');
}

function clampNivel(nivel: number, pilotiHeight: number): number {
  const maxNivel = Math.round(pilotiHeight * 200 / 3) / 100;
  return Math.round(Math.max(0.2, Math.min(nivel, maxNivel)) * 100) / 100;
}

export function PilotiEditor({
  isOpen,
  onClose,
  pilotiId,
  currentHeight,
  currentIsMaster = false,
  currentNivel = DEFAULT_NIVEL,
  group,
  isMobile,
  anchorPosition,
  houseView = 'top',
  onHeightChange,
  onNavigate,
}: PilotiEditorProps) {
  const [tempHeight, setTempHeight] = useState(() => currentHeight);
  const [tempIsMaster, setTempIsMaster] = useState(() => currentIsMaster);
  const [tempNivel, setTempNivel] = useState(() => currentNivel);
  const [clickedHeight, setClickedHeight] = useState<number | null>(null);

  // Popover draggable position (desktop)
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const dragStateRef = useRef<null | { offsetX: number; offsetY: number }>(null);
  const userDraggedRef = useRef(false);

  const allIds = useMemo(() => {
    if (group) return getPilotiIdsFromGroup(group);
    return getAllPilotiIds();
  }, [group]);
  const currentIndex = pilotiId ? allIds.indexOf(pilotiId) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allIds.length - 1 && currentIndex >= 0;
  const pilotiName = pilotiId ? getPilotiName(pilotiId) : '';
  const isCornerPiloti = pilotiId ? CORNER_PILOTI_IDS.includes(pilotiId) : false;

  // Find master piloti name for grid icon
  const masterPilotiName = useMemo(() => {
    if (!group) return undefined;
    for (const id of allIds) {
      const data = getPilotiFromGroup(group, id);
      if (data?.isMaster) return getPilotiName(id);
    }
    // Check current if it's being set as master
    if (tempIsMaster && pilotiId) return getPilotiName(pilotiId);
    return undefined;
  }, [group, allIds, tempIsMaster, pilotiId]);

  // Synchronize temp state with props immediately when pilotiId changes
  const lastPilotiIdRef = useRef<string | null>(null);
  const wasOpenRef = useRef(false);

  if (isOpen && pilotiId !== lastPilotiIdRef.current) {
    lastPilotiIdRef.current = pilotiId;
    setTempHeight(currentHeight);
    setTempIsMaster(currentIsMaster);
    setTempNivel(currentNivel);
  }

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      lastPilotiIdRef.current = null;
      return;
    }

    const isFirstOpen = !wasOpenRef.current;
    wasOpenRef.current = true;

    if (isFirstOpen) {
      userDraggedRef.current = false;
      if (anchorPosition) {
        setPopoverPos({ x: anchorPosition.x + 12, y: anchorPosition.y + 12 });
      } else {
        setPopoverPos({ x: 24, y: 24 });
      }
    }
  }, [isOpen, anchorPosition]);

  // Drag listeners (desktop)
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragStateRef.current) return;
      userDraggedRef.current = true;
      setPopoverPos({
        x: e.clientX - dragStateRef.current.offsetX,
        y: e.clientY - dragStateRef.current.offsetY,
      });
    };

    const onUp = () => {
      dragStateRef.current = null;
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!pilotiId) return;

    const idx = allIds.indexOf(pilotiId);
    if (idx === -1) return;

    const newIndex = direction === 'next' ? idx + 1 : idx - 1;
    const newId = allIds[newIndex];
    if (!newId) return;

    if (pilotiId && (tempHeight !== currentHeight || tempIsMaster !== currentIsMaster || tempNivel !== currentNivel)) {
      houseManager.updatePiloti(pilotiId, {
        height: tempHeight,
        isMaster: tempIsMaster,
        nivel: tempNivel,
      });
      onHeightChange(tempHeight);
      onNavigate?.(pilotiId, tempHeight, tempIsMaster, tempNivel);
    }

    if (!group) return;

    const pilotiData = getPilotiFromGroup(group, newId);
    if (pilotiData && onNavigate) {
      onNavigate(newId, pilotiData.height, pilotiData.isMaster, pilotiData.nivel);
      setTempHeight(pilotiData.height);
      setTempIsMaster(pilotiData.isMaster);
      setTempNivel(pilotiData.nivel);
    }
  };

  const handleApply = () => {
    const nivelToApply = clampNivel(tempNivel, tempHeight);

    if (pilotiId) {
      houseManager.updatePiloti(pilotiId, {
        height: tempHeight,
        isMaster: tempIsMaster,
        nivel: nivelToApply,
      });
      onHeightChange(tempHeight);
      onNavigate?.(pilotiId, tempHeight, tempIsMaster, nivelToApply);
    }

    onClose();
  };

  const handleCancel = () => {
    setTempHeight(currentHeight);
    setTempIsMaster(currentIsMaster);
    setTempNivel(currentNivel);
    onClose();
  };

  const handleNivelChange = (value: number) => {
    setTempNivel(clampNivel(value, tempHeight));
  };

  const handleNivelIncrement = (delta: number) => {
    const newVal = Math.round((tempNivel + delta) * 100) / 100;
    handleNivelChange(newVal);
  };

  const handlePopoverPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('button, input, textarea, select, [role="switch"], [role="slider"], a');
    if (isInteractive) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragStateRef.current = { offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    e.preventDefault();
  };

  const handleHeightClick = (h: number) => {
    setTempHeight(h);

    const { autoNavigatePiloti } = getSettings();

    if (pilotiId) {
      const nivelToApply = clampNivel(tempNivel, h);
      houseManager.updatePiloti(pilotiId, {
        height: h,
        isMaster: tempIsMaster,
        nivel: nivelToApply,
      });
      onHeightChange(h);
      onNavigate?.(pilotiId, h, tempIsMaster, nivelToApply);
    }

    if (autoNavigatePiloti && pilotiId) {
      setClickedHeight(h);

      const idx = allIds.indexOf(pilotiId);
      const nextId = idx >= 0 && idx < allIds.length - 1 ? allIds[idx + 1] : null;

      setTimeout(() => {
        setClickedHeight(null);

        if (nextId && group) {
          const pilotiData = getPilotiFromGroup(group, nextId);
          if (pilotiData && onNavigate) {
            onNavigate(nextId, pilotiData.height, pilotiData.isMaster, pilotiData.nivel);
            setTempHeight(pilotiData.height);
            setTempIsMaster(pilotiData.isMaster);
            setTempNivel(pilotiData.nivel);
          }
        } else {
          onClose();
        }
      }, 180);
    }
  };

  const getHeightButtonClasses = (h: number): string => {
    const isSelected = clickedHeight === h || (clickedHeight === null && tempHeight === h);
    return isSelected
      ? 'bg-primary text-primary-foreground rounded-xl text-lg font-semibold py-3'
      : 'bg-primary/10 text-foreground rounded-xl text-lg font-semibold py-3 hover:bg-primary/20';
  };

  const maxNivel = Math.round(tempHeight * 200 / 3) / 100;

  if (!isOpen) return null;

  // ---- Shared content renderers (inline to avoid remount/focus-loss) ----

  const editorContent = (
    <div className="flex flex-col gap-4">
      {/* Header: grid icon + title + arrows */}
      <div className="flex items-center gap-3" data-no-drag>
        <PilotiGridIcon
          selectedPiloti={pilotiName}
          masterPiloti={masterPilotiName}
          className="w-16 h-12 flex-shrink-0"
        />
        <span className="font-bold text-2xl flex-1">Piloti {pilotiName}</span>
        <div className="flex items-center gap-1 select-none">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleNavigate('prev')}
            disabled={!hasPrev}
            className="h-8 w-8 rounded-full bg-white"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleNavigate('next')}
            disabled={!hasNext}
            className="h-8 w-8 rounded-full bg-white"
          >
            <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Central card */}
      <div className="bg-white rounded-xl p-4 space-y-4" data-no-drag>
        {/* Master toggle - only for corners */}
        {isCornerPiloti && (
          <>
            <div className="flex items-center justify-between">
              <Label htmlFor="is-master" className="text-sm font-medium select-none">
                Definir como Mestre?
              </Label>
              <Switch id="is-master" checked={tempIsMaster} onCheckedChange={setTempIsMaster} />
            </div>
            <Separator />
          </>
        )}

        {/* Nivel section - only for corners */}
        {isCornerPiloti && (
          <>
            <div className="space-y-4">
              <p className="text-sm font-medium text-center">Nível do Piloti</p>

              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => handleNivelIncrement(-0.01)}
                  disabled={tempNivel <= 0.20}
                >
                  <FontAwesomeIcon icon={faMinus} className="h-3 w-3" />
                </Button>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-primary">{formatNivel(tempNivel)}</span>
                  <span className="text-lg text-muted-foreground">m</span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => handleNivelIncrement(0.01)}
                  disabled={tempNivel >= maxNivel}
                >
                  <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                </Button>
              </div>

              <div className="space-y-3 px-2">
                <Slider
                  value={[tempNivel]}
                  onValueChange={([v]) => handleNivelChange(v)}
                  min={0.20}
                  max={maxNivel}
                  step={0.01}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0,20m</span>
                  <span>{formatNivel(maxNivel)}m</span>
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Height grid 3x2 */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-center">Tamanho dos Pilotis</p>
          <div className="grid grid-cols-3 gap-2">
            {PILOTI_HEIGHTS.map((h) => (
              <button
                key={h}
                onClick={() => handleHeightClick(h)}
                disabled={clickedHeight !== null}
                className={getHeightButtonClasses(h)}
              >
                {formatPilotiHeight(h)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="flex gap-2 w-full" data-no-drag>
        <Button variant="outline" className="flex-1 bg-white" onClick={handleCancel}>
          Cancelar
        </Button>
        <Button className="flex-1" onClick={handleApply}>
          Aplicar
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="sr-only">Editor de Piloti</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">
            {editorContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: floating draggable panel
  return createPortal(
    <div
      className="fixed inset-0 z-50"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') handleCancel();
      }}
      tabIndex={-1}
    >
      <div
        className="rounded-xl border bg-background p-6 text-popover-foreground shadow-md outline-none min-w-[300px] max-w-[340px]"
        style={
          popoverPos
            ? { position: 'fixed', left: popoverPos.x, top: popoverPos.y }
            : anchorPosition
              ? { position: 'fixed', left: anchorPosition.x + 12, top: anchorPosition.y + 12 }
              : { position: 'fixed', left: 24, top: 24 }
        }
        onPointerDown={(e) => {
          e.stopPropagation();
          handlePopoverPointerDown(e);
        }}
      >
        {editorContent}
      </div>
    </div>,
    document.body,
  );
}
