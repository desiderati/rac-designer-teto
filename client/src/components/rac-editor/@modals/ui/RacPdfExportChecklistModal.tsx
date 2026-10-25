import {AlertTriangle, CheckCircle2, XCircle} from 'lucide-react';
import {Button} from '@/components/ui/button.tsx';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog.tsx';
import {Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle} from '@/components/ui/drawer.tsx';
import {ActionDock} from '@/components/ui/ActionDock.tsx';
import {ModalFrame} from '@/components/ui/ModalFrame.tsx';
import {ModalActions} from '@/components/ui/ModalActions.tsx';
import {cn} from '@/components/rac-editor/lib/utils.ts';
import type {
  RacPdfExportChecklist,
  RacPdfExportChecklistItem,
} from '@/components/rac-editor/lib/rac-pdf-export-checklist.ts';

interface RacPdfExportChecklistModalProps {
  isMobile: boolean;
  isOpen: boolean;
  checklist: RacPdfExportChecklist | null;
  isExporting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RacPdfExportChecklistModal({
  isMobile,
  isOpen,
  checklist,
  isExporting,
  onConfirm,
  onCancel,
}: RacPdfExportChecklistModalProps) {
  const blockingCount = checklist?.missingRequiredItems.length ?? 0;
  const alertCount = checklist?.missingRecommendedItems.length ?? 0;
  const canConfirm = Boolean(checklist) && !checklist.hasBlockingItems && !isExporting;
  const description = resolveDescription(blockingCount, alertCount);
  const Header = isMobile ? DrawerHeader : DialogHeader;
  const Title = isMobile ? DrawerTitle : DialogTitle;
  const Description = isMobile ? DrawerDescription : DialogDescription;
  const header = <Header className='text-center'>
    <Title className='text-center'>Checklist da RAC</Title>
    <Description className='sr-only'>Verifique pendências antes de gerar o PDF da RAC.</Description>
  </Header>;
  const actions = <ActionDock testId='rac-pdf-checklist-actions' surface={isMobile ? 'drawer' : 'dialog'} spacing='flush'>
    <ModalActions
      cancel={<Button data-action='cancel' variant='outline' className='bg-white disabled:pointer-events-auto disabled:cursor-not-allowed' onClick={onCancel} disabled={isExporting}>Cancelar</Button>}
      confirm={<Button className='disabled:pointer-events-auto disabled:cursor-not-allowed' onClick={onConfirm} disabled={!canConfirm}>{isExporting ? 'Gerando...' : 'Gerar PDF'}</Button>}/>
  </ActionDock>;
  const composition = <ModalFrame header={header} headerTone='section' actions={actions} contentClassName='space-y-4'>
    <div className={cn('rounded-lg border px-3 py-2 text-sm', blockingCount > 0
      ? 'border-red-200 bg-red-50 text-red-800' : alertCount > 0
        ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-800')}>
      {description}
    </div>
    <ChecklistSection title='Obrigatórios' items={checklist?.items.filter(item => item.severity === 'required') ?? []}/>
    <ChecklistSection title='Recomendados' items={checklist?.items.filter(item => item.severity === 'recommended') ?? []}/>
  </ModalFrame>;
  if (isMobile) return <Drawer open={isOpen} onOpenChange={open => !open && onCancel()}>
    <DrawerContent>{composition}</DrawerContent>
  </Drawer>;
  return <Dialog open={isOpen} onOpenChange={open => !open && onCancel()}>
    <DialogContent className='sm:max-w-lg' hideCloseButton>{composition}</DialogContent>
  </Dialog>;
}

function ChecklistSection({title, items}: { title: string; items: RacPdfExportChecklistItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className='space-y-2'>
      <h3 className='text-xs font-bold uppercase tracking-normal text-muted-foreground'>{title}</h3>
      <ul className='space-y-2'>
        {items.map((item) => (
          <li
            key={item.id}
            className={cn(
              'flex gap-2 rounded-md border px-3 py-2',
              item.status === 'ok'
                ? 'border-slate-200 bg-white'
                : item.severity === 'required'
                  ? 'border-red-200 bg-red-50'
                  : 'border-amber-200 bg-amber-50',
            )}
          >
            <ChecklistIcon item={item}/>
            <div className='min-w-0 flex-1'>
              <p className='m-0 text-sm font-semibold text-slate-900'>{item.label}</p>
              <p className='m-0 mt-0.5 text-xs leading-snug text-slate-600'>{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ChecklistIcon({item}: { item: RacPdfExportChecklistItem }) {
  if (item.status === 'ok') {
    return <CheckCircle2 className='mt-0.5 h-4 w-4 flex-none text-emerald-600'/>;
  }

  if (item.severity === 'required') {
    return <XCircle className='mt-0.5 h-4 w-4 flex-none text-red-600'/>;
  }

  return <AlertTriangle className='mt-0.5 h-4 w-4 flex-none text-amber-600'/>;
}

function resolveDescription(blockingCount: number, alertCount: number): string {
  if (blockingCount > 0) {
    return `Há ${blockingCount} item(ns) obrigatório(s) pendente(s). Corrija antes de gerar o PDF.`;
  }

  if (alertCount > 0) {
    return `Há ${alertCount} alerta(s). Você pode revisar ou continuar a geração do PDF.`;
  }

  return 'Todos os itens verificados estão completos.';
}
