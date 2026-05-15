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
import type {StatusChangeAction} from './types.ts';

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
