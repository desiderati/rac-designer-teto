import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover.tsx';
import {TOP_BAR_ICONS} from '../lib/menu-config.ts';
import {cn} from '@/components/rac-editor/lib/utils.ts';
import type {CanvasToolMode} from '../lib/menu-types.ts';

interface ZoomMenuProps {
  /** Zoom atual do canvas (1 = 100%). */
  zoom: number;
  /** Modo atual da ferramenta do canvas. */
  canvasToolMode: CanvasToolMode;
  /** Alterna o modo da ferramenta do canvas. */
  onSetToolMode: (mode: CanvasToolMode) => void;
  /** Reposiciona a viewport para encaixar o canvas no contêiner visível. */
  onFitToView: () => void;
  /** Modo mobile mantém controles compactos com nomes acessíveis. */
  isMobile: boolean;
}

/**
 * Botão indicador de zoom no centro superior.
 *
 * Mostra o percentual de zoom atual e abre um submenu horizontal com seleção,
 * pan e ajuste à viewport, seguindo a referência visual refinada do Stitch.
 */
export function ZoomMenu({zoom, canvasToolMode, onSetToolMode, onFitToView, isMobile}: ZoomMenuProps) {
  const zoomPercent = Math.round(zoom * 100);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type='button'
          title='Ferramentas de canvas'
          aria-label={`Zoom atual ${zoomPercent}%. Abrir ferramentas de canvas.`}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium',
            'bg-white/85 backdrop-blur-xl border border-slate-200 shadow-sm',
            'hover:bg-slate-50 transition-colors text-slate-700',
          )}
        >
          {!isMobile ? <FontAwesomeIcon icon={TOP_BAR_ICONS.zoom} className='text-base text-slate-500'/> : null}
          <span className='tabular-nums'>{zoomPercent}%</span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align='center'
        sideOffset={8}
        className='w-auto p-1.5 rounded-full bg-white/95 backdrop-blur-xl border border-slate-200 shadow-xl'
      >
        <div className='flex flex-row items-center gap-1'>
          <ToolPill
            icon={TOP_BAR_ICONS.toolSelect}
            label='Seleção'
            shortcut='S'
            isActive={canvasToolMode === 'select'}
            onClick={() => onSetToolMode('select')}
            isMobile={isMobile}
          />
          <ToolPill
            icon={TOP_BAR_ICONS.toolPan}
            label='Panning'
            shortcut='P'
            isActive={canvasToolMode === 'pan'}
            onClick={() => onSetToolMode('pan')}
            isMobile={isMobile}
          />
          <ToolPill
            icon={TOP_BAR_ICONS.toolFitView}
            label='Fit to View'
            shortcut='F'
            isActive={false}
            onClick={onFitToView}
            isMobile={isMobile}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface ToolPillProps {
  icon: typeof TOP_BAR_ICONS[keyof typeof TOP_BAR_ICONS];
  label: string;
  shortcut: string;
  isActive: boolean;
  onClick: () => void;
  isMobile: boolean;
}

function ToolPill({icon, label, shortcut, isActive, onClick, isMobile}: ToolPillProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      title={label}
      aria-label={isMobile ? label : undefined}
      className={cn(
        'flex items-center rounded-full text-sm font-medium',
        isMobile ? 'justify-center w-10 h-10 px-0 py-0' : 'gap-2 px-4 py-2',
        'transition-colors',
        isActive
          ? 'bg-blue-50 text-blue-600'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800',
      )}
    >
      <FontAwesomeIcon icon={icon} className='text-base'/>
      {!isMobile ? (
        <>
          <span>{label}</span>
          <span className='text-[10px] opacity-60 font-bold'>{shortcut}</span>
        </>
      ) : null}
    </button>
  );
}
