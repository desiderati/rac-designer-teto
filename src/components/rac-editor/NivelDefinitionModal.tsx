import { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { PilotiMinimap } from './PilotiMinimap';

const CORNER_ORDER = ['A1', 'A4', 'C1', 'C4'] as const;
type CornerName = typeof CORNER_ORDER[number];

export interface NivelEntry {
  nivel: number;
  isMaster: boolean;
}

interface NivelDefinitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (niveis: Record<string, NivelEntry>) => void;
  pilotiData: Record<string, { height: number; isMaster: boolean; nivel: number }>;
}

function formatNivelForInput(n: number): string {
  return n.toFixed(2).replace('.', ',');
}

function filterNivelText(value: string): string {
  let filtered = value.replace(/[^0-9.,]/g, '');
  const firstSep = filtered.search(/[.,]/);
  if (firstSep !== -1) {
    const before = filtered.slice(0, firstSep + 1);
    const after = filtered.slice(firstSep + 1).replace(/[.,]/g, '');
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
  return Math.round(parsed * 100) / 100;
}

function clampNivel(nivel: number): number {
  return Math.round(Math.max(0.2, Math.min(nivel, 1.50)) * 100) / 100;
}

function cornerToId(name: string): string {
  const row = name.charCodeAt(0) - 65;
  const col = parseInt(name[1]) - 1;
  return `piloti_${col}_${row}`;
}

export function NivelDefinitionModal({ isOpen, onClose, onApply, pilotiData }: NivelDefinitionModalProps) {
  const isMobile = useIsMobile();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [entries, setEntries] = useState<Record<CornerName, NivelEntry & { visited: boolean }>>(() => ({
    A1: { nivel: 0.20, isMaster: false, visited: false },
    A4: { nivel: 0.20, isMaster: false, visited: false },
    C1: { nivel: 0.20, isMaster: false, visited: false },
    C4: { nivel: 0.20, isMaster: false, visited: false },
  }));
  const [nivelInput, setNivelInput] = useState('0,20');
  const nivelInputRef = useRef<HTMLInputElement>(null);
  const appliedRef = useRef(false);

  const currentCorner = CORNER_ORDER[currentIdx];
  const entry = entries[currentCorner];
  const hasMaster = CORNER_ORDER.some((c) => entries[c].isMaster);
  const allVisited = CORNER_ORDER.every((c) => entries[c].visited);

  const commitCurrentNivel = () => {
    const parsed = parseNivelText(nivelInput);
    const clamped = parsed != null ? clampNivel(parsed) : 0.20;
    const updated = {
      ...entries,
      [currentCorner]: { ...entries[currentCorner], nivel: clamped, visited: true },
    };
    setEntries(updated);
    return updated;
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    commitCurrentNivel();
    const newIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    if (newIdx < 0 || newIdx >= CORNER_ORDER.length) return;
    setCurrentIdx(newIdx);
    const nextCorner = CORNER_ORDER[newIdx];
    setNivelInput(formatNivelForInput(entries[nextCorner].nivel));
  };

  const handleMasterChange = (checked: boolean) => {
    if (checked) {
      // Only one master allowed — deselect all others
      const updated = { ...entries };
      for (const c of CORNER_ORDER) {
        updated[c] = { ...updated[c], isMaster: c === currentCorner };
      }
      setEntries(updated);
    } else {
      setEntries((prev) => ({
        ...prev,
        [currentCorner]: { ...prev[currentCorner], isMaster: false },
      }));
    }
  };

  const handleNivelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNivelInput(filterNivelText(e.target.value));
  };

  const handleNivelBlur = () => {
    const parsed = parseNivelText(nivelInput);
    if (parsed == null) {
      setNivelInput('0,20');
      setEntries((prev) => ({ ...prev, [currentCorner]: { ...prev[currentCorner], nivel: 0.20 } }));
    } else {
      const clamped = clampNivel(parsed);
      setNivelInput(formatNivelForInput(clamped));
      setEntries((prev) => ({ ...prev, [currentCorner]: { ...prev[currentCorner], nivel: clamped } }));
    }
  };

  const handleApply = () => {
    const finalEntries = commitCurrentNivel();
    const result: Record<string, NivelEntry> = {};
    for (const name of CORNER_ORDER) {
      const id = cornerToId(name);
      const e = finalEntries[name];
      result[id] = { nivel: e.nivel, isMaster: e.isMaster };
    }
    appliedRef.current = true;
    onApply(result);
    resetState();
  };

  const resetState = () => {
    setCurrentIdx(0);
    setEntries({
      A1: { nivel: 0.20, isMaster: false, visited: false },
      A4: { nivel: 0.20, isMaster: false, visited: false },
      C1: { nivel: 0.20, isMaster: false, visited: false },
      C4: { nivel: 0.20, isMaster: false, visited: false },
    });
    setNivelInput('0,20');
  };

  const handleClose = () => {
    if (appliedRef.current) {
      appliedRef.current = false;
      return;
    }
    resetState();
    onClose();
  };

  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < CORNER_ORDER.length - 1;

  // Build pilotiData with master highlights for minimap
  const minimapData = { ...pilotiData };
  for (const name of CORNER_ORDER) {
    const id = cornerToId(name);
    if (minimapData[id]) {
      minimapData[id] = { ...minimapData[id], isMaster: entries[name].isMaster };
    }
  }

  const content = (
    <div className="flex flex-col items-center gap-4">
      {/* Navigation header */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => handleNavigate('prev')} disabled={!hasPrev} className="h-8 w-8">
          <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
        </Button>
        <span className="font-bold min-w-[100px] text-center" style={{ fontSize: '1.5rem' }}>Piloti {currentCorner}</span>
        <Button variant="ghost" size="icon" onClick={() => handleNavigate('next')} disabled={!hasNext} className="h-8 w-8">
          <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />
        </Button>
      </div>

      {/* Master switch */}
      <div className="w-full space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="nivel-master" className="text-sm font-medium">
            Definir piloti como mestre?
          </Label>
          <Switch id="nivel-master" checked={entry.isMaster} onCheckedChange={handleMasterChange} />
        </div>

        {/* Nivel input */}
        <div className="pl-2 border-l-2 border-primary/30">
          <div className="flex items-center gap-2">
            <Input
              ref={nivelInputRef}
              type="text"
              inputMode="decimal"
              value={nivelInput}
              onChange={handleNivelChange}
              onBlur={handleNivelBlur}
              className="w-20 text-center cursor-text"
            />
            <Label className="text-sm font-medium whitespace-nowrap">
              Nível do piloti <span className="text-xs font-normal text-muted-foreground">(0,20 a 1,50 m)</span>
            </Label>
          </div>
        </div>
      </div>

      {/* Minimap */}
      <PilotiMinimap pilotiData={minimapData} hoveredSide={null} selectedPiloti={currentCorner} />

      {/* Progress indicators */}
      <div className="flex gap-2">
        {CORNER_ORDER.map((c, i) => (
          <div
            key={c}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === currentIdx
                ? 'bg-primary'
                : entries[c].visited
                  ? 'bg-primary/40'
                  : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>

      {/* Buttons */}
      <div className="flex gap-2 w-full">
        <Button variant="outline" className="flex-1" onClick={handleClose}>
          Cancelar
        </Button>
        <Button className="flex-1" onClick={handleApply} disabled={!hasMaster || !allVisited}>
          Inserir
        </Button>
      </div>
    </div>
  );

  if (!isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-sm" hideCloseButton>
          <div className="mx-auto w-full max-w-xs">
            <DialogDescription className="sr-only">Defina os níveis dos pilotis de canto</DialogDescription>
            <div className="py-4">{content}</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-xl">
        <div className="mx-auto w-full max-w-xs">
          <div className="py-4">{content}</div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
