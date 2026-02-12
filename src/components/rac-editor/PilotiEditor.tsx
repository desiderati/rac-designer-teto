import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Group } from 'fabric';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const DEFAULT_NIVEL = 0.3;
const DEFAULT_NIVEL_INPUT = '0,3';

function formatNivelForInput(n: number): string {
  const raw = String(n).replace('.', ',');
  if (!raw.includes(',')) return raw;
  const [intPart, decPart = ''] = raw.split(',');
  const trimmedDec = decPart.replace(/0+$/, '');
  return trimmedDec ? `${intPart},${trimmedDec}` : intPart;
}

function filterNivelText(value: string): string {
  // Allow only digits, one comma or period as decimal separator
  let filtered = value.replace(/[^0-9.,]/g, '');
  // Keep only the first decimal separator
  const firstSep = filtered.search(/[.,]/);
  if (firstSep !== -1) {
    const before = filtered.slice(0, firstSep + 1);
    const after = filtered.slice(firstSep + 1).replace(/[.,]/g, '');
    // Limit to 2 decimal places
    filtered = before + after.slice(0, 2);
  }
  return filtered;
}

function parseNivelText(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  if (Number.isNaN(parsed) || parsed < 0) return null;
  // Round to 2 decimal places
  return Math.round(parsed * 100) / 100;
}

function clampNivel(nivel: number, pilotiHeight: number): number {
  const maxNivel = Math.round((pilotiHeight * 3 / 4) * 100) / 100;
  return Math.max(0.2, Math.min(nivel, maxNivel));
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
  const [tempNivelInput, setTempNivelInput] = useState(() => formatNivelForInput(currentNivel));
  const [clickedHeight, setClickedHeight] = useState<number | null>(null);

  // Popover draggable position (desktop)
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const dragStateRef = useRef<null | { offsetX: number; offsetY: number }>(null);
  const nivelInputRef = useRef<HTMLInputElement | null>(null);
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

  // Synchronize temp state with props immediately when pilotiId changes
  const lastPilotiIdRef = useRef<string | null>(null);
  const wasOpenRef = useRef(false);

  if (isOpen && pilotiId !== lastPilotiIdRef.current) {
    lastPilotiIdRef.current = pilotiId;
    setTempHeight(currentHeight);
    setTempIsMaster(currentIsMaster);
    setTempNivel(currentNivel);
    setTempNivelInput(formatNivelForInput(currentNivel));
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
      setTempNivelInput(formatNivelForInput(pilotiData.nivel));
    }
  };

  const handleApply = () => {
    const parsed = parseNivelText(tempNivelInput);
    const nivelToApply = parsed ? clampNivel(parsed, tempHeight) : DEFAULT_NIVEL;

    setTempNivel(nivelToApply);
    setTempNivelInput(formatNivelForInput(nivelToApply));

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
    setTempNivelInput(formatNivelForInput(currentNivel));
    onClose();
  };

  const handleNivelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = filterNivelText(e.target.value);
    setTempNivelInput(next);
  };

  const handleNivelBlur = () => {
    const parsed = parseNivelText(tempNivelInput);
    if (parsed == null || tempNivelInput.trim() === '') {
      setTempNivelInput(DEFAULT_NIVEL_INPUT);
      setTempNivel(DEFAULT_NIVEL);
    } else {
      const clamped = clampNivel(parsed, tempHeight);
      setTempNivelInput(formatNivelForInput(clamped));
      setTempNivel(clamped);
    }
  };

  const handlePopoverPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('button, input, textarea, select, [role="switch"], a');
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
      const parsed = parseNivelText(tempNivelInput);
      const nivelToApply = parsed ? clampNivel(parsed, h) : DEFAULT_NIVEL;
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
            setTempNivelInput(formatNivelForInput(pilotiData.nivel));
          }
        } else {
          onClose();
        }
      }, 180);
    }
  };

  const getHeightButtonVariant = (h: number): 'default' | 'outline' => {
    if (clickedHeight === h) return 'default';
    if (clickedHeight !== null) return 'outline';
    return tempHeight === h ? 'default' : 'outline';
  };

  const maxNivel = formatNivelForInput(Math.round((tempHeight * 3 / 4) * 100) / 100);

  if (!isOpen) return null;

  // ---- Shared inline JSX renderers (NOT components, to avoid remount/focus-loss) ----

  const navigationHeader = (
    <div className="flex items-center justify-center gap-2" data-no-drag>
      <Button variant="ghost" size="icon" onClick={() => handleNavigate('prev')} disabled={!hasPrev} className="h-8 w-8">
        <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
      </Button>
      <span className="font-bold text-2xl min-w-[80px] text-center">Piloti {pilotiName}</span>
      <Button variant="ghost" size="icon" onClick={() => handleNavigate('next')} disabled={!hasNext} className="h-8 w-8">
        <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />
      </Button>
    </div>
  );

  const renderHeightControls = (compact: boolean) => (
    <div className="space-y-2" data-no-drag>
      <Label className={compact ? 'text-sm font-medium' : 'text-base font-medium'}>Altura do piloti</Label>
      <div
        className={
          compact
            ? 'flex flex-nowrap gap-1 overflow-x-auto justify-start'
            : 'flex flex-nowrap gap-1.5 overflow-x-auto justify-start'
        }
      >
        {PILOTI_HEIGHTS.map((h) => (
          <Button
            key={h}
            variant={getHeightButtonVariant(h)}
            size={compact ? 'sm' : 'default'}
            onClick={() => handleHeightClick(h)}
            disabled={clickedHeight !== null}
            className={compact ? 'flex-none min-w-[40px] h-8 text-xs' : 'flex-none px-3 text-base'}
          >
            {formatPilotiHeight(h)}
          </Button>
        ))}
      </div>
    </div>
  );

  const renderMasterControls = (compact: boolean) => (
    <div className="space-y-3" data-no-drag>
      {isCornerPiloti && (
        <div className="flex items-center justify-between">
          <Label htmlFor="is-master" className={compact ? 'text-sm font-medium' : 'text-base font-medium'}>
            Definir piloti como mestre?
          </Label>
          <Switch id="is-master" checked={tempIsMaster} onCheckedChange={setTempIsMaster} />
        </div>
      )}

      {isCornerPiloti && (
        <div className="pl-2 border-l-2 border-primary/30">
          <div className="flex items-center gap-2">
            <Input
              ref={nivelInputRef}
              id="nivel"
              type="text"
              inputMode="decimal"
              value={tempNivelInput}
              onChange={handleNivelChange}
              onBlur={handleNivelBlur}
              className={compact ? 'w-20 text-center cursor-text' : 'w-24 text-center text-base cursor-text'}
            />
            <div className="flex flex-col">
              <Label htmlFor="nivel" className={compact ? 'text-sm font-medium whitespace-nowrap' : 'text-base font-medium whitespace-nowrap'}>
                Nível do piloti <span className={compact ? 'text-xs font-normal text-muted-foreground' : 'text-sm font-normal text-muted-foreground'}>(0,2 a {maxNivel})</span>
              </Label>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {navigationHeader}
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-6">
            {renderMasterControls(false)}
            {renderHeightControls(false)}
          </div>
          <DrawerFooter className="flex-row gap-2">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1" onClick={handleCancel}>
                Cancelar
              </Button>
            </DrawerClose>
            <DrawerClose asChild>
              <Button className="flex-1" onClick={handleApply}>
                Aplicar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: painel flutuante
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
        className="rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none min-w-[280px]"
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
        <div className="space-y-4">
          {navigationHeader}

          {renderMasterControls(true)}

          {renderHeightControls(true)}

          <div className="flex gap-2 pt-2" data-no-drag>
            <Button variant="outline" size="sm" className="flex-1" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button size="sm" className="flex-1" onClick={handleApply}>
              Aplicar
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
