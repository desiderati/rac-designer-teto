import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover.tsx';
import {TOP_BAR_ICONS} from '../helpers/toolbar-config.ts';
import {cn} from '@/components/rac-editor/lib/utils.ts';

interface UserAvatarMenuProps {
  isMobile: boolean;
  showTips: boolean;
  onRestartDrawing: () => void;
  onOpen3DViewer: () => void;
  onSavePDF: () => void;
  onToggleTips: () => void;
  onOpenTutorial: () => void;
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
export function UserAvatarMenu({
  isMobile,
  showTips,
  onRestartDrawing,
  onOpen3DViewer,
  onSavePDF,
  onToggleTips,
  onOpenTutorial,
  onOpenSettings,
  onExit,
}: UserAvatarMenuProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type='button'
          title='Conta'
          aria-label='Abrir menu da conta'
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
        <Item icon={TOP_BAR_ICONS.restart} label='Reiniciar Desenho' onClick={onRestartDrawing}/>
        <Divider/>
        {isMobile ? (
          <>
            <Item icon={TOP_BAR_ICONS.view3d} label='Visualização 3D' onClick={onOpen3DViewer}/>
            <Item icon={TOP_BAR_ICONS.export} label='Exportar RAC em PDF' onClick={onSavePDF}/>
            <Divider/>
          </>
        ) : null}
        <Item
          icon={TOP_BAR_ICONS.tips}
          label='Dicas'
          onClick={onToggleTips}
          rightSlot={showTips ? <ActiveDot/> : undefined}
        />
        <Item icon={TOP_BAR_ICONS.tutorial} label='Abrir Tutorial' onClick={onOpenTutorial}/>
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
  onClick: () => void;
  destructive?: boolean;
  rightSlot?: React.ReactNode;
}

function Item({icon, label, onClick, destructive = false, rightSlot}: ItemProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
        'transition-colors',
        destructive
          ? 'text-red-600 hover:bg-red-50'
          : 'text-slate-700 hover:bg-slate-100',
      )}
    >
      <FontAwesomeIcon
        icon={icon}
        className={cn('w-4', destructive ? 'text-red-500' : 'text-slate-500')}
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
  return <div className='h-px bg-slate-100 my-1 mx-2' aria-hidden/>;
}
