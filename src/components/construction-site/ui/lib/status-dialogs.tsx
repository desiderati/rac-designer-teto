import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog.tsx';
import {AlertTriangle} from 'lucide-react';
import type {StatusChangeAction} from './types.ts';

export function UnsavedChangesDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel(): void;
  onConfirm(): void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) onCancel();
    }}>
      <AlertDialogContent className='w-[calc(100vw-2rem)] max-w-md rounded-2xl border-slate-200 bg-white p-5 shadow-xl sm:p-6'>
        <AlertDialogHeader className='space-y-3 text-left'>
          <div className='flex items-center gap-3'>
            <span
              data-testid='unsaved-changes-icon-badge'
              className='inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 leading-none'
            >
              <AlertTriangle
                aria-hidden='true'
                data-testid='unsaved-changes-icon'
                className='block h-5 w-5 -translate-y-px'
              />
            </span>
            <AlertDialogTitle className='text-xl font-semibold text-slate-950'>
              Sair sem salvar?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className='text-sm leading-6 text-slate-600'>
            Você está saindo da página sem salvar as alterações atuais. Se continuar, as alterações serão perdidas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className='flex-col gap-2 sm:flex-row sm:gap-2 sm:space-x-0'>
          <AlertDialogCancel className='mt-0 w-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50 sm:w-auto'>
            Continuar editando
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className='w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto'
          >
            Sair sem salvar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ConstructionStatusDialog({
  open,
  constructionCode,
  action,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  constructionCode: string;
  action: StatusChangeAction;
  onCancel(): void;
  onConfirm(): void;
}) {
  const isUnarchive = action === 'unarchive';
  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) onCancel();
    }}>
      <AlertDialogContent className='bg-white'>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isUnarchive ? 'Desarquivar construção?' : 'Arquivar construção?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isUnarchive
              ? `A construção ${constructionCode || 'sem código'} voltará a ficar disponível para gestão e seleção.`
              : `A construção ${constructionCode || 'sem código'} será arquivada e deixará de abrir no Canvas.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={isUnarchive ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-red-600 text-white hover:bg-red-700'}
          >
            {isUnarchive ? 'Desarquivar construção' : 'Arquivar construção'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function HouseStatusDialog({
  open,
  familyName,
  action,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  familyName: string;
  action: StatusChangeAction;
  onCancel(): void;
  onConfirm(): void;
}) {
  const isUnarchive = action === 'unarchive';
  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) onCancel();
    }}>
      <AlertDialogContent className='bg-white'>
        <AlertDialogHeader>
          <AlertDialogTitle>{isUnarchive ? 'Desarquivar casa?' : 'Arquivar casa?'}</AlertDialogTitle>
          <AlertDialogDescription>
            {isUnarchive
              ? `A casa de ${familyName || 'família sem nome'} voltará a ficar disponível no gerenciamento.`
              : `A casa de ${familyName || 'família sem nome'} será arquivada e deixará de aparecer no Canvas.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={isUnarchive ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-red-600 text-white hover:bg-red-700'}
          >
            {isUnarchive ? 'Desarquivar casa' : 'Arquivar casa'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function MonitorStatusDialog({
  open,
  monitorName,
  action,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  monitorName: string;
  action: StatusChangeAction;
  onCancel(): void;
  onConfirm(): void;
}) {
  const isReactivate = action === 'unarchive';
  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) onCancel();
    }}>
      <AlertDialogContent className='bg-white'>
        <AlertDialogHeader>
          <AlertDialogTitle>{isReactivate ? 'Reativar monitor?' : 'Inativar monitor?'}</AlertDialogTitle>
          <AlertDialogDescription>
            {isReactivate
              ? `O monitor ${monitorName || 'sem nome'} voltará a aparecer na listagem ativa.`
              : `O monitor ${monitorName || 'sem nome'} será inativado e ficará disponível pelo filtro de status.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={isReactivate ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-red-600 text-white hover:bg-red-700'}
          >
            {isReactivate ? 'Reativar monitor' : 'Inativar monitor'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
