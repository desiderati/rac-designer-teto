import {useState} from 'react';
import {ClipboardList} from 'lucide-react';
import type {HouseExtraMaterials} from '@/shared/types/construction-site.ts';
import {getExtraMaterialSummary} from '@/shared/lib/house-extra-materials.ts';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip.tsx';

const MATERIAL_SECTIONS = [
  {title: 'Benfeitorias Casa', labels: ['Vigas p/ Escada', 'Tipo Escada']},
  {title: 'Benfeitorias Telhado', labels: ['Calhas', 'Tampão', 'Joelhos', 'Manta Asfáltica']},
  {title: 'Reparos Casa', labels: ['Contraventamento', 'Caibros', 'Secundárias', 'Mata-Juntas', 'Outros / Justificativas']},
] as const;

export function HouseMaterialsSummary({familyName, materials, guidedTourId}: {familyName: string; materials?: HouseExtraMaterials; guidedTourId?: string}) {
  const [open, setOpen] = useState(false);
  const rows = getExtraMaterialSummary(materials);
  return (
    <TooltipProvider delayDuration={250}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button type='button' aria-label={`Resumo dos materiais extras da casa ${familyName}`} aria-expanded={open}
            data-guided-tour-id={guidedTourId}
            onClick={(event) => {event.stopPropagation(); setOpen((current) => !current);}}
            onKeyDown={(event) => event.stopPropagation()}
            className='grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 hover:text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500'>
            <ClipboardList className='h-4 w-4' aria-hidden='true'/>
          </button>
        </TooltipTrigger>
        <TooltipContent side='top' collisionPadding={12} className='max-h-[50dvh] w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl bg-white p-4 text-slate-900 shadow-lg' onClick={(event) => event.stopPropagation()}>
          <div className='space-y-3'>
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
