import {type ReactNode, useState} from 'react';
import {ClipboardList, X} from 'lucide-react';
import type {PersistedHouseRecord, HouseExtraMaterials} from '@/shared/types/construction-site.ts';
import {getExtraMaterialSummary} from '@/shared/lib/house-extra-materials.ts';
import {Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog.tsx';
import {Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger} from '@/components/ui/drawer.tsx';
import {ModalFrame} from '@/components/ui/ModalFrame.tsx';
import {useCanvasMobileViewport} from '@/components/rac-editor/lib/use-canvas-mobile-viewport.ts';
import {HousePlanMiniature} from './HousePlanMiniature.tsx';

const MATERIAL_SECTIONS = [
  {title: 'Benfeitorias Casa', labels: ['Vigas p/ Escada', 'Tipo Escada']},
  {title: 'Benfeitorias Telhado', labels: ['Calhas', 'Tampão', 'Joelhos', 'Manta Asfáltica']},
  {title: 'Reparos Casa', labels: ['Contraventamento', 'Caibros', 'Secundárias', 'Mata-Juntas', 'Outros / Justificativas']},
] as const;

export function HouseMaterialsSummary({familyName, materials, guidedTourId, house, children}: {familyName: string; materials?: HouseExtraMaterials; guidedTourId?: string; house?: PersistedHouseRecord; children?: ReactNode}) {
  const [open, setOpen] = useState(false);
  const {mobile} = useCanvasMobileViewport();
  const rows = getExtraMaterialSummary(materials);
  const trigger = <button type='button' aria-label={`Resumo da Casa de ${familyName}`}
    data-guided-tour-id={guidedTourId} onKeyDown={event => event.stopPropagation()}
    className='grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full bg-transparent text-slate-400 transition-colors hover:bg-amber-100 hover:text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500'>
    <ClipboardList className='h-4 w-4' aria-hidden='true'/>{children}
  </button>;
  const content = <div className='space-y-4'>
    {house ? <HousePlanMiniature pilotis={house.drawingDocument.house?.pilotis ?? {}} house={house.drawingDocument.house}/> : null}
    {MATERIAL_SECTIONS.map((section, index) => {
      const sectionRows = rows.filter(row => section.labels.some(label => label === row.label));
      return <section key={section.title} aria-label={section.title}>
        {index > 0 ? <div data-testid='materials-summary-divider' aria-hidden='true' className='mx-2 mb-4 h-px bg-slate-200'/> : null}
        {sectionRows.length ? <dl className='space-y-2'>
          {sectionRows.map(row => <div key={row.label} className={row.label === 'Outros / Justificativas' ? 'space-y-1.5 pt-1' : 'flex gap-4'}>
            <dt className='min-w-0 flex-1 text-slate-600'>{row.label}</dt>
            <dd className={row.label === 'Outros / Justificativas' ? 'whitespace-pre-wrap break-words text-left font-medium' : 'max-w-[60%] break-words text-right font-medium'}>{row.value}</dd>
          </div>)}
        </dl> : <p className='mt-1 text-slate-500'>Não informado.</p>}
      </section>;
    })}
  </div>;

  // Portal events must not activate the surrounding house card or table row.
  return <div className='contents' onClick={event => event.stopPropagation()}>
    {mobile ? <Drawer open={open} onOpenChange={setOpen} autoFocus>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className='[&>.rac-modal-handle]:hidden'>
        <DrawerClose asChild>
          <button type='button' aria-label='Fechar resumo da casa' data-vaul-no-drag
            className='mx-auto grid h-11 w-24 shrink-0 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600'>
            <span className='h-1 w-14 rounded-full bg-slate-300' aria-hidden='true'/>
          </button>
        </DrawerClose>
        <ModalFrame header={<DrawerHeader>
          <DrawerTitle>Resumo da Casa</DrawerTitle>
          <DrawerDescription className='sr-only'>Planta e materiais da casa de {familyName}.</DrawerDescription>
        </DrawerHeader>}>{content}</ModalFrame>
      </DrawerContent>
    </Drawer> : <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent hideCloseButton>
        <ModalFrame header={<DialogHeader className='relative min-h-11 justify-center pr-12'>
          <DialogTitle>Resumo da Casa</DialogTitle>
          <DialogDescription className='sr-only'>Planta e materiais da casa de {familyName}.</DialogDescription>
          <DialogClose asChild>
            <button type='button' aria-label='Fechar resumo da casa'
              className='absolute right-0 top-0 grid h-11 w-11 place-items-center rounded-full text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600'>
              <X className='h-5 w-5' aria-hidden='true'/>
            </button>
          </DialogClose>
        </DialogHeader>}>{content}</ModalFrame>
      </DialogContent>
    </Dialog>}
  </div>;
}
