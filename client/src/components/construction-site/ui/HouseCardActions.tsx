import {type ReactNode, useLayoutEffect, useRef} from 'react';
import {getAllPilotiIds, parsePilotiGridPosition} from '@/shared/types/piloti.ts';

/** Adapta os rótulos ao espaço real do card, inclusive após zoom e carregamento de fontes. */
export function HouseCardActions({children}: {children: ReactNode}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const band = ref.current;
    if (!band) return;
    let disposed = false;
    const fitLabels = () => {
      if (disposed || band.clientWidth === 0) return;
      band.dataset.labelMode = 'full';
      const labels = [...band.querySelectorAll<HTMLElement>('[data-house-action-label]')];
      const exportLabel = band.querySelector<HTMLElement>('[data-house-action-short-label]');
      const fits = (label: HTMLElement, lines: number) => {
        const lineHeight = Number.parseFloat(getComputedStyle(label).lineHeight);
        return label.scrollWidth <= label.clientWidth + 1
          && label.scrollHeight <= lineHeight * lines + 1;
      };
      if (exportLabel && !fits(exportLabel, 1)) band.dataset.labelMode = 'short';
      if (labels.some((label) => !fits(label, label === exportLabel ? 1 : 2))
        || band.scrollWidth > band.clientWidth + 1) {
        band.dataset.labelMode = 'icons';
      }
    };
    fitLabels();
    // Ignore height-only notifications caused by revealing/hiding the captions.
    let width = band.clientWidth;
    const observer = new ResizeObserver(() => {
      if (band.clientWidth === width) return;
      width = band.clientWidth;
      fitLabels();
    });
    observer.observe(band);
    void document.fonts?.ready.then(fitLabels);
    document.fonts?.addEventListener('loadingdone', fitLabels);
    return () => {
      disposed = true;
      observer.disconnect();
      document.fonts?.removeEventListener('loadingdone', fitLabels);
    };
  }, [children]);

  return <div ref={ref} role='group' aria-label='Ações da casa' data-label-mode='icons'
    className='group/house-actions mt-3 flex min-w-0 items-stretch gap-0.5 overflow-x-auto rounded-xl bg-blue-100/60 p-1 [&>button]:flex [&>button]:h-auto [&>button]:min-h-11 [&>button]:min-w-11 [&>button]:flex-1 [&>button]:basis-0 [&>button]:flex-col [&>button]:justify-center [&>button]:gap-1 [&>button]:rounded-lg [&>button]:px-0.5 [&>button]:py-2 [&>button]:text-slate-600 [&>button>svg]:shrink-0 [&>button:has([data-house-pilotis])]:bg-blue-100 [&>button:has([data-house-pilotis])]:text-blue-700'
    onClick={(event) => event.stopPropagation()}>
    {children}
  </div>;
}

export function HouseCardActionLabel({children, shortLabel}: {children: string; shortLabel?: string}) {
  return <span aria-hidden='true' data-house-action-label='' data-house-action-short-label={shortLabel ? '' : undefined}
    className='block w-full text-center text-xs font-medium leading-4 group-data-[label-mode=icons]/house-actions:hidden'>
    {shortLabel ? <>
      <span className='group-data-[label-mode=short]/house-actions:hidden'>{children}</span>
      <span className='hidden group-data-[label-mode=short]/house-actions:inline'>{shortLabel}</span>
    </> : children}
  </span>;
}

const pilotis = getAllPilotiIds().map((id) => ({id, ...parsePilotiGridPosition(id)!}));

/** Mesmo plano A1–C4 do editor: quatro colunas e três linhas, sem inferir estados. */
export function HousePilotisMinimap() {
  return <svg data-house-pilotis='' viewBox='0 0 24 18' className='h-[18px] w-6' aria-hidden='true' focusable='false'>
    {pilotis.map(({id, col, row}) => <circle key={id} data-piloti-id={id}
      cx={3 + col * 6} cy={3 + row * 6} r='1.7' fill='currentColor'/>)}
  </svg>;
}
