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
  updatePilotiAll,
  formatPilotiHeight,
  getPilotiName,
  getAdjacentPilotiId,
  getPilotiFromGroup,
  getAllPilotiIds,
} from '@/lib/canvas-utils';

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
  return value.replace(/[^0-9.,]/g, '');
}

function parseNivelText(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return parsed;
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
  const [tempHeight, setTempHeight] = useState(currentHeight);
  const [tempIsMaster, setTempIsMaster] = useState(currentIsMaster);
  const [tempNivel, setTempNivel] = useState(currentNivel);
  const [tempNivelInput, setTempNivelInput] = useState(formatNivelForInput(currentNivel));

  // Popover draggable position (desktop)
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const dragStateRef = useRef<null | { offsetX: number; offsetY: number }>(null);
  const nivelInputRef = useRef<HTMLInputElement | null>(null);
  // Track if user manually dragged the popover - if so, keep position on navigation
  const userDraggedRef = useRef(false);

  const allIds = useMemo(() => getAllPilotiIds(), []);
  const currentIndex = pilotiId ? allIds.indexOf(pilotiId) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allIds.length - 1 && currentIndex >= 0;
  const pilotiName = pilotiId ? getPilotiName(pilotiId) : '';

  // Only initialize local state when opening, or when switching piloti
  const lastPilotiIdRef = useRef<string | null>(null);
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (!isOpen) {
      // Reset drag flag when closing
      wasOpenRef.current = false;
      return;
    }

    const isFirstOpen = !wasOpenRef.current;
    wasOpenRef.current = true;
    
    const isNewPiloti = pilotiId !== lastPilotiIdRef.current;
    lastPilotiIdRef.current = pilotiId;

    // Init form values on open or on piloti change
    if (isNewPiloti) {
      setTempHeight(currentHeight);
      setTempIsMaster(currentIsMaster);
      setTempNivel(currentNivel);
      setTempNivelInput(formatNivelForInput(currentNivel));
    }

    // Init draggable position only on first open, or if user hasn't dragged
    // If user dragged, keep current position even when navigating
    if (isFirstOpen) {
      userDraggedRef.current = false;
      if (anchorPosition) {
        setPopoverPos({ x: anchorPosition.x + 12, y: anchorPosition.y + 12 });
      } else {
        setPopoverPos({ x: 24, y: 24 });
      }
    }
    // If navigating and user hasn't dragged, we could update position, but user wants to keep it
    // So we only set position on first open
  }, [isOpen, pilotiId, anchorPosition, currentHeight, currentIsMaster, currentNivel]);

  // Drag listeners (desktop)
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragStateRef.current) return;
      userDraggedRef.current = true; // Mark that user manually dragged
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

  // Mantém o foco no campo de nível enquanto o usuário digita (evita “perder foco” em re-renders)
  useEffect(() => {
    if (!isOpen || !tempIsMaster) return;
    const el = nivelInputRef.current;
    if (!el) return;

    // Se o input já está focado, não faz nada.
    if (document.activeElement === el) return;

    // Se o usuário estava interagindo com o nível (campo existe na tela), re-foca.
    // requestAnimationFrame evita competir com o React na mesma pintura.
    requestAnimationFrame(() => {
      // Checagem dupla (pode ter fechado)
      if (nivelInputRef.current && isOpen && tempIsMaster) {
        nivelInputRef.current.focus();
      }
    });
  }, [isOpen, tempIsMaster, tempNivelInput]);

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!pilotiId || !group) return;

    const newId = getAdjacentPilotiId(pilotiId, direction);
    if (!newId) return;

    // Apply current changes before navigating
    if (tempHeight !== currentHeight || tempIsMaster !== currentIsMaster || tempNivel !== currentNivel) {
      updatePilotiAll(group, pilotiId, tempHeight, tempIsMaster, tempNivel);
      onHeightChange(tempHeight);
    }

    // Get new piloti data
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
    // Converte o texto do nível apenas na hora de aplicar
    const parsed = parseNivelText(tempNivelInput);
    const nivelToApply = parsed ?? DEFAULT_NIVEL;

    setTempNivel(nivelToApply);
    setTempNivelInput(parsed ? tempNivelInput : DEFAULT_NIVEL_INPUT);

    if (group && pilotiId) {
      updatePilotiAll(group, pilotiId, tempHeight, tempIsMaster, nivelToApply);
      onHeightChange(tempHeight);
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
    // Apenas filtra caracteres; não faz parse aqui (para não quebrar backspace/cursor)
    const next = filterNivelText(e.target.value);
    setTempNivelInput(next);
  };

  const handleNivelBlur = () => {
    // Se campo vazio, volta ao valor padrão (default value), sem placeholder
    if (tempNivelInput.trim() === '') {
      setTempNivelInput(DEFAULT_NIVEL_INPUT);
    }
  };

  const handlePopoverPointerDown = (e: React.PointerEvent) => {
    // Arrastar quando clicar em qualquer área NÃO interativa dentro do popover.
    // (não bloquear arrasto em containers, só em controles interativos)
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('button, input, textarea, select, [role="switch"], a');
    if (isInteractive) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragStateRef.current = { offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    e.preventDefault();
  };

  const NavigationHeader = () => (
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

  const HeightControls = ({ compact = false }: { compact?: boolean }) => (
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
            variant={tempHeight === h ? 'default' : 'outline'}
            size={compact ? 'sm' : 'default'}
            onClick={() => setTempHeight(h)}
            className={compact ? 'flex-none min-w-[40px] h-8 text-xs' : 'flex-none px-3 text-base'}
          >
            {formatPilotiHeight(h)}
          </Button>
        ))}
      </div>
    </div>
  );

  const MasterControls = ({ compact = false }: { compact?: boolean }) => (
    <div className="space-y-3" data-no-drag>
      <div className="flex items-center justify-between">
        <Label htmlFor="is-master" className={compact ? 'text-sm font-medium' : 'text-base font-medium'}>
          Definir piloti como mestre?
        </Label>
        <Switch id="is-master" checked={tempIsMaster} onCheckedChange={setTempIsMaster} />
      </div>

      {/* Show nivel field only in top (plant) view */}
      {tempIsMaster && houseView === 'top' && (
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
                Nível do mestre (m)
              </Label>
              <p className={compact ? 'text-xs text-muted-foreground' : 'text-sm text-muted-foreground'}>
                Parte visível acima do terreno
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (!isOpen) return null;

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              <NavigationHeader />
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-6">
            <MasterControls />
            <HeightControls />
          </div>
          <DrawerFooter className="flex-row gap-2">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1" onClick={handleCancel}>
                Cancelar
              </Button>
            </DrawerClose>
            <Button className="flex-1" onClick={handleApply}>
              Aplicar
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: painel flutuante (sem Radix Popover) para termos posição/drag 100% determinísticos
  return createPortal(
    <div
      className="fixed inset-0 z-50"
      onPointerDown={(e) => {
        // Clique fora do painel fecha sem aplicar
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
          // impedir que o clique dentro feche
          e.stopPropagation();
          handlePopoverPointerDown(e);
        }}
      >
        <div className="space-y-4">
          <NavigationHeader />

          <MasterControls compact />

          <div className="space-y-2" data-no-drag>
            <Label className="text-sm font-medium">Altura do piloti</Label>
            <div className="flex flex-nowrap gap-1 overflow-x-auto justify-start">
              {PILOTI_HEIGHTS.map((h) => (
                <Button
                  key={h}
                  variant={tempHeight === h ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTempHeight(h)}
                  className="flex-none min-w-[40px] h-8 text-xs"
                >
                  {formatPilotiHeight(h)}
                </Button>
              ))}
            </div>
          </div>

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
