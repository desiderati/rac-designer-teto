import {CANVAS_WORKSPACE_STYLE} from '@/components/rac-editor/@canvas/ui/workspace-style.ts';

export function CanvasLoadingState() {
  return (
    <div className='grid h-full place-items-center px-6 text-center' style={CANVAS_WORKSPACE_STYLE}>
      <div
        aria-live='polite'
        className='flex flex-col items-center gap-3 rounded-lg bg-white/80 px-6 py-5 text-slate-700 shadow-sm ring-1 ring-slate-200/80'
        role='status'
      >
        <span
          aria-hidden='true'
          className='h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700'
        />
        <p className='m-0 text-sm font-medium text-slate-700'>Carregando o Canvas...</p>
      </div>
    </div>
  );
}
