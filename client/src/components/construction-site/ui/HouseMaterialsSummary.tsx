import {type ReactNode, useState} from 'react';
import {ClipboardList} from 'lucide-react';
import type {PersistedHouseRecord, HouseExtraMaterials} from '@/shared/types/construction-site.ts';
import {getExtraMaterialSummary} from '@/shared/lib/house-extra-materials.ts';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip.tsx';
import {HOUSE_SIZE_LABELS} from './lib/constants.ts';

const MATERIAL_SECTIONS = [
  {title: 'Benfeitorias Casa', labels: ['Vigas p/ Escada', 'Tipo Escada']},
  {title: 'Benfeitorias Telhado', labels: ['Calhas', 'Tampão', 'Joelhos', 'Manta Asfáltica']},
  {title: 'Reparos Casa', labels: ['Contraventamento', 'Caibros', 'Secundárias', 'Mata-Juntas', 'Outros / Justificativas']},
] as const;

export function HouseMaterialsSummary({familyName, materials, guidedTourId, house, children}: {familyName: string; materials?: HouseExtraMaterials; guidedTourId?: string; house?: PersistedHouseRecord; children?: ReactNode}) {
  const [open, setOpen] = useState(false);
  const rows = getExtraMaterialSummary(materials);
  const pilotiCounts = Object.values(house?.drawingDocument.house?.pilotis ?? {}).reduce<Record<string, number>>((counts, piloti) => {
    if (piloti.height > 0) counts[piloti.height] = (counts[piloti.height] ?? 0) + 1;
    return counts;
  }, {});
  return (
    <TooltipProvider delayDuration={250}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button type='button' aria-label={`Resumo da Casa de ${familyName}`} aria-expanded={open}
            data-guided-tour-id={guidedTourId}
            onClick={(event) => {event.stopPropagation(); setOpen((current) => !current);}}
            onKeyDown={(event) => event.stopPropagation()}
            className='grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full bg-transparent text-slate-400 transition-colors hover:bg-amber-100 hover:text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500'>
            <ClipboardList className='h-4 w-4' aria-hidden='true'/>
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent side='top' collisionPadding={12} className='max-h-[50dvh] w-64 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl bg-white p-4 text-slate-900 shadow-lg' onClick={(event) => event.stopPropagation()}>
          <div className='space-y-3'><strong>Resumo da Casa</strong>{house ? <dl className='space-y-2 text-xs'>
            <div><dt className='inline'>Tipo da casa: </dt><dd className='inline'>{house.houseType === 'tipo6' ? 'Tipo 6' : house.houseType === 'tipo3' ? 'Tipo 3' : 'Não definido'}</dd></div>
            <div><dt className='inline'>Tamanho da casa: </dt><dd className='inline'>{house.houseSize ? HOUSE_SIZE_LABELS[house.houseSize] : 'Não informado'}</dd></div>
            {Object.entries(pilotiCounts).sort(([a], [b]) => Number(a) - Number(b)).map(([height, count]) => <div key={height}><dt className='inline'>Pilotis {Number(height).toLocaleString('pt-BR')} m: </dt><dd className='inline'>{count}</dd></div>)}
          </dl> : null}
            {MATERIAL_SECTIONS.map((section, index) => {
              const sectionRows = rows.filter((row) => section.labels.some((label) => label === row.label));
              return <section key={section.title} aria-label={section.title}>
                {index > 0 ? <div data-testid='materials-summary-divider' aria-hidden='true' className='mx-2 mb-3 h-px bg-slate-200'/> : null}
                {sectionRows.length ? <dl className='space-y-1.5'>
                  {sectionRows.map((row) => <div key={row.label} className={row.label === 'Outros / Justificativas' ? 'space-y-1.5 pt-1 text-xs' : 'flex gap-4 text-xs'}>
                    <dt className='flex-1 text-slate-600'>{row.label}</dt>
                    <dd className={row.label === 'Outros / Justificativas' ? 'whitespace-pre-wrap break-words text-left font-medium' : 'max-w-[60%] break-words text-right font-medium'}>{row.value}</dd>
                  </div>)}
                </dl> : <p className='mt-1 text-xs text-slate-500'>Não informado.</p>}
              </section>;
            })}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
