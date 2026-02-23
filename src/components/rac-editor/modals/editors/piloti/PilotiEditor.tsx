import {createPortal} from 'react-dom';
import {Group} from 'fabric';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronLeft, faChevronRight, faMinus, faPlus} from '@fortawesome/free-solid-svg-icons';
import {Button} from '@/components/ui/button.tsx';
import {Switch} from '@/components/ui/switch.tsx';
import {Label} from '@/components/ui/label.tsx';
import {Slider} from '@/components/ui/slider.tsx';
import {Separator} from '@/components/ui/separator.tsx';
import {Drawer, DrawerContent, DrawerHeader, DrawerTitle} from '@/components/ui/drawer.tsx';
import {
  ContraventamentoSide,
  formatPilotiHeight,
  PILOTI_HEIGHTS
} from '@/lib/canvas-utils.ts';
import {PilotiGridIcon} from './PilotiGridIcon.tsx';
import {ContraventamentoSideIcon} from '@/components/rac-editor/modals/editors/piloti/ContraventamentoSideIcon.tsx';
import {DEFAULT_NIVEL, usePilotiEditorLogic} from '../../../hooks/usePilotiEditorLogic.ts';

interface PilotiEditorProps {
  isOpen: boolean;
  onClose: () => void;
  pilotiId: string | null;
  currentHeight: number;
  currentIsMaster?: boolean;
  currentNivel?: number;
  group: Group | null;
  isMobile: boolean;
  anchorPosition?: { x: number; y: number; };
  houseView?: 'top' | 'front' | 'back' | 'side';
  onHeightChange: (newHeight: number) => void;
  onNavigate?: (pilotiId: string, height: number, isMaster: boolean, nivel: number) => void;
  contraventamentoLeftDisabled?: boolean;
  contraventamentoRightDisabled?: boolean;
  contraventamentoLeftActive?: boolean;
  contraventamentoRightActive?: boolean;
  onContraventamentoSideAction?: (side: ContraventamentoSide) => void;
}

function formatNivel(n: number): string {
  return n.toFixed(2).replace('.', ',');
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
  onHeightChange,
  onNavigate,
  contraventamentoLeftDisabled = true,
  contraventamentoRightDisabled = true,
  contraventamentoLeftActive = false,
  contraventamentoRightActive = false,
  onContraventamentoSideAction
}: PilotiEditorProps) {
  const {
    tempIsMaster,
    setTempIsMaster,
    tempNivel,
    clickedHeight,
    popoverPos,
    hasPrev,
    hasNext,
    pilotiName,
    isCornerPiloti,
    masterPilotiName,
    maxNivel,
    handleNavigate,
    handleApply,
    handleCancel,
    handleNivelChange,
    handleNivelIncrement,
    handlePopoverPointerDown,
    handleHeightClick,
    getHeightButtonClasses,
    getContraventamentoButtonClasses,
  } = usePilotiEditorLogic({
    isOpen,
    onClose,
    pilotiId,
    currentHeight,
    currentIsMaster,
    currentNivel,
    group,
    anchorPosition,
    onHeightChange,
    onNavigate,
  });

  if (!isOpen) return null;

  // ---- Shared content renderers (inline to avoid remount/focus-loss) ----

  const editorContent =
    <div className="flex flex-col gap-4">
      {/* Header: grid icon + title + arrows */}
      <div className="flex items-center gap-3" data-no-drag>
        <PilotiGridIcon
          selectedPiloti={pilotiName}
          masterPiloti={masterPilotiName}
          className="w-16 h-12 flex-shrink-0"/>

        <span className="font-bold text-2xl flex-1 text-center">Piloti {pilotiName}</span>

        <div className="flex items-center gap-1 select-none">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleNavigate('prev')}
            disabled={!hasPrev}
            className="h-8 w-8 rounded-full bg-white">

            <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3"/>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleNavigate('next')}
            disabled={!hasNext}
            className="h-8 w-8 rounded-full bg-white">

            <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3"/>
          </Button>
        </div>
      </div>

      {/* Central card */}
      <div className="bg-white rounded-xl p-4 space-y-4" data-no-drag>
        {/* Master toggle - only for corners */}
        {isCornerPiloti &&
          <>
            <div className="flex items-center justify-between">
              <Label htmlFor="is-master" className="text-sm font-medium select-none">
                Definir como Mestre?
              </Label>
              <Switch id="is-master" checked={tempIsMaster} onCheckedChange={setTempIsMaster}/>
            </div>

            <Separator/>
          </>
        }

        {/* Nivel section - only for corners */}
        {isCornerPiloti &&
          <>
            <div className="space-y-4">
              <p className="text-sm font-medium text-center">Nível do Piloti</p>

              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => handleNivelIncrement(-0.01)}
                  disabled={tempNivel <= 0.20}>

                  <FontAwesomeIcon icon={faMinus} className="h-3 w-3"/>
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
                  disabled={tempNivel >= maxNivel}>

                  <FontAwesomeIcon icon={faPlus} className="h-3 w-3"/>
                </Button>
              </div>

              <div className="space-y-3 px-2">
                <Slider
                  value={[tempNivel]}
                  onValueChange={([v]) => handleNivelChange(v)}
                  min={0.20}
                  max={maxNivel}
                  step={0.01}
                  className="w-full"/>

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0,20m</span>
                  <span>{formatNivel(maxNivel)}m</span>
                </div>
              </div>
            </div>

            <Separator/>
          </>
        }

        {/* Height grid 3x2 */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-center">Tamanho dos Pilotis</p>
          <div className="grid grid-cols-3 gap-2">
            {PILOTI_HEIGHTS.map((h) =>
              <button
                key={h}
                onClick={() => handleHeightClick(h)}
                disabled={clickedHeight !== null}
                className={getHeightButtonClasses(h)}
              >
                {formatPilotiHeight(h)}
              </button>
            )}
          </div>
        </div>

        <Separator/>

        <div className="space-y-3">
          <p className="text-sm font-medium text-center">Contraventamento</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={contraventamentoLeftDisabled}
              onClick={() => onContraventamentoSideAction?.('left')}
              className={
                getContraventamentoButtonClasses(
                  contraventamentoLeftActive, contraventamentoLeftDisabled
                )
              }>
              <span className="flex flex-col items-center gap-1.5">
                <ContraventamentoSideIcon side="left" size={40}/>
                <span className="text-xs font-semibold">Esquerdo</span>
              </span>
            </button>

            <button
              type="button"
              disabled={contraventamentoRightDisabled}
              onClick={() => onContraventamentoSideAction?.('right')}
              className={
                getContraventamentoButtonClasses(
                  contraventamentoRightActive,
                  contraventamentoRightDisabled
                )
              }>
              <span className="flex flex-col items-center gap-1.5">
                <ContraventamentoSideIcon side="right" size={40}/>
                <span className="text-xs font-semibold">Direito</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="flex w-full flex-col gap-3" data-no-drag>
        <div className="flex w-full gap-[16px]">
          <Button variant="outline" className="flex-1 bg-white" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={handleApply}>
            Aplicar
          </Button>
        </div>
      </div>
    </div>;

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
      tabIndex={-1}>

      <div
        className="rounded-xl border bg-background p-6 text-popover-foreground shadow-md outline-none min-w-[300px] max-w-[340px] cursor-grab"
        style={
          popoverPos ?
            {position: 'fixed', left: popoverPos.x, top: popoverPos.y} :
            anchorPosition ?
              {position: 'fixed', left: anchorPosition.x + 12, top: anchorPosition.y + 12} :
              {position: 'fixed', left: 24, top: 24}
        }
        onPointerDown={(e) => {
          e.stopPropagation();
          handlePopoverPointerDown(e);
        }}>

        {editorContent}
      </div>
    </div>,
    document.body
  );
}
