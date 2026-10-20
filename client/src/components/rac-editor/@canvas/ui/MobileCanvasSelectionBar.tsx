import {Move, Pencil, Scaling} from 'lucide-react';

interface MobileCanvasSelectionBarProps {
  count: number;
  resizing: boolean;
  canResize: boolean;
  canEditPilotis: boolean;
  onEditPilotis: () => void;
  onToggleResize: () => void;
}

export function MobileCanvasSelectionBar({count, resizing, canResize, canEditPilotis, onEditPilotis, onToggleResize}: MobileCanvasSelectionBarProps) {
  if (!count) return null;
  const buttonClasses = 'flex h-11 w-20 items-center justify-center gap-1 rounded-xl border px-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed';
  const modeClasses = (active: boolean) => `${buttonClasses} disabled:opacity-40 ${active ? 'border-blue-600 bg-blue-600 text-white' : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'}`;
  return <div
    aria-label='Ações da seleção'
    className='fixed bottom-[max(12px,env(safe-area-inset-bottom))] left-1/2 z-30 flex w-max max-w-[calc(100vw_-_32px_-_env(safe-area-inset-left)_-_env(safe-area-inset-right))] -translate-x-1/2 items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 p-2 pl-4 text-slate-900 shadow-lg backdrop-blur-xl'
    onMouseDown={event => event.stopPropagation()}
    onTouchStart={event => event.stopPropagation()}
  >
    <p role='status' className='min-w-0 text-xs font-semibold leading-snug'>
      {resizing ? 'Arraste os pontos destacados para escalar.'
        : count === 1 ? 'Item selecionado. Arraste pra movê-lo.' : 'Itens selecionados. Arraste pra movê-los.'}
    </p>
    <div className='flex shrink-0 items-center gap-2'>
      {count === 1 ? <button type='button' disabled={!canEditPilotis} onClick={onEditPilotis}
        title={canEditPilotis ? 'Editar pilotis da vista planta' : 'Edição disponível somente para uma vista planta'}
        className={`${buttonClasses} border-blue-600 bg-blue-600 text-white hover:bg-blue-700 disabled:border-slate-100 disabled:bg-slate-100 disabled:text-slate-400`}>
        <Pencil aria-hidden='true' className='size-4'/>Editar
      </button> : null}
      <button type='button' aria-pressed={resizing} disabled={!canResize} onClick={onToggleResize}
        className={modeClasses(resizing)}>
        {resizing ? <Move aria-hidden='true' className='size-4'/> : <Scaling aria-hidden='true' className='size-4'/>}
        {resizing ? 'Mover' : 'Escalar'}
      </button>
    </div>
  </div>;
}
