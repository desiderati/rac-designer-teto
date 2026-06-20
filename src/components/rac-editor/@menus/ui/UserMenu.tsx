import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover.tsx';
import {TOP_BAR_ICONS} from '../lib/menu-config.ts';
import {cn} from '@/components/rac-editor/lib/utils.ts';

interface UserMenuProps {
  isMobile: boolean;
  showTips: boolean;
  onRestartDrawing: () => void;
  restartDrawingDisabled?: boolean;
  onOpen3DViewer: () => void;
  onSavePDF: () => void;
  canExportPDF: boolean;
  onToggleTips: () => void;
  onOpenSettings: () => void;
  onExit: () => void;
}

/**
 * Top-right user avatar dropdown.
 *
 * Items (per the Stitch reference, in vertical order):
 *   1. Reiniciar Desenho
 *   ── divider ──
 *   2. Dicas (toggle)
 *   3. Abrir Tutorial
 *   ── divider ──
 *   4. Configurações
 *   ── divider ──
 *   5. Sair (destructive)
 */
export function UserMenu({
  isMobile,
  showTips,
  onRestartDrawing,
  restartDrawingDisabled = false,
  onOpen3DViewer,
  onSavePDF,
  canExportPDF,
  onToggleTips,
  onOpenSettings,
  onExit,
}: UserMenuProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type='button'
          title='Conta'
          aria-label='Abrir menu da conta'
          data-guided-tour-id='rac-user-menu'
          data-guided-tour-aliases={isMobile ? 'rac-export-pdf rac-view-3d' : undefined}
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center',
            'bg-white/90 border-2 border-white shadow-sm overflow-hidden',
            'text-slate-500 hover:text-slate-700 hover:border-blue-200 transition-colors',
          )}
        >
          <FontAwesomeIcon icon={TOP_BAR_ICONS.user} className='text-2xl'/>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align='end'
        sideOffset={8}
        className='w-52 p-1 rounded-xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-xl'
      >
        <Item
          icon={TOP_BAR_ICONS.restart}
          label='Reiniciar Desenho'
          onClick={onRestartDrawing}
          disabled={restartDrawingDisabled}
        />
        <Divider/>
        {isMobile ? (
          <>
            <Item
              icon={TOP_BAR_ICONS.view3d}
              label='Visualização 3D'
              onClick={onOpen3DViewer}
              dataGuidedTourId='rac-view-3d'
            />
            <Item
              icon={TOP_BAR_ICONS.export}
              label='Exportar RAC em PDF'
              onClick={onSavePDF}
              disabled={!canExportPDF}
              dataGuidedTourId='rac-export-pdf'
            />
            <Divider/>
          </>
        ) : null}
        <Item
          icon={TOP_BAR_ICONS.tips}
          label='Dicas'
          onClick={onToggleTips}
          rightSlot={showTips ? <ActiveDot/> : undefined}
        />
        <Item
          icon={TOP_BAR_ICONS.guidedTour}
          label='Abrir Tutorial'
          dataGuidedTourStart='rac-editor-intro'
        />
        <Divider/>
        <Item icon={TOP_BAR_ICONS.settings} label='Configurações' onClick={onOpenSettings}/>
        <Divider/>
        <Item icon={TOP_BAR_ICONS.exit} label='Sair' onClick={onExit} destructive/>
      </PopoverContent>
    </Popover>
  );
}

interface ItemProps {
  icon: typeof TOP_BAR_ICONS[keyof typeof TOP_BAR_ICONS];
  label: string;
  onClick?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  rightSlot?: React.ReactNode;
  dataGuidedTourStart?: string;
  dataGuidedTourId?: string;
}

function Item({
  icon,
  label,
  onClick,
  destructive = false,
  disabled = false,
  rightSlot,
  dataGuidedTourStart,
  dataGuidedTourId,
}: ItemProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      data-guided-tour-id={dataGuidedTourId}
      data-guided-tour-start={dataGuidedTourStart}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
        'transition-colors',
        disabled
          ? 'text-slate-400 cursor-not-allowed'
          : destructive
            ? 'text-red-600 hover:bg-red-50'
            : 'text-slate-700 hover:bg-slate-100',
      )}
    >
      <FontAwesomeIcon
        icon={icon}
        className={cn(
          'w-4',
          disabled ? 'text-slate-300' : destructive ? 'text-red-500' : 'text-slate-500',
        )}
      />
      <span className='flex-1 text-left'>{label}</span>
      {rightSlot}
    </button>
  );
}

function ActiveDot() {
  return <span className='w-2 h-2 rounded-full bg-blue-500' aria-hidden/>;
}

function Divider() {
  return <div role='separator' className='h-px bg-slate-100 my-1 mx-2'/>;
}
