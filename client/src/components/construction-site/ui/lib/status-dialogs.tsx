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
  const content = getConstructionStatusDialogContent(action, constructionCode);
  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) onCancel();
    }}>
      <AlertDialogContent className='bg-white'>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {content.title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {content.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={content.actionClassName}
          >
            {content.actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function getConstructionStatusDialogContent(action: StatusChangeAction, constructionCode: string) {
  const normalizedConstructionCode = constructionCode || 'sem código';

  if (action === 'unarchive') {
    return {
      title: 'Desarquivar construção?',
      description: `A construção ${normalizedConstructionCode} voltará a ficar disponível para gestão e seleção.`,
      actionLabel: 'Desarquivar construção',
      actionClassName: 'bg-blue-600 text-white hover:bg-blue-700',
    };
  }

  if (action === 'markCompleted') {
    return {
      title: 'Concluir construção?',
      description: `A construção ${normalizedConstructionCode} ficará disponível para visualização, sem edição de casas e monitores.`,
      actionLabel: 'Concluir construção',
      actionClassName: 'bg-emerald-600 text-white hover:bg-emerald-700',
    };
  }

  if (action === 'markInProgress') {
    return {
      title: 'Voltar construção para andamento?',
      description: `A construção ${normalizedConstructionCode} voltará a permitir edição de casas e monitores.`,
      actionLabel: 'Voltar para andamento',
      actionClassName: 'bg-amber-600 text-white hover:bg-amber-700',
    };
  }

  return {
    title: 'Arquivar construção?',
    description: `A construção ${normalizedConstructionCode} será arquivada e deixará de abrir no Canvas.`,
    actionLabel: 'Arquivar construção',
    actionClassName: 'bg-red-600 text-white hover:bg-red-700',
  };
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
  const content = getHouseStatusDialogContent(action, familyName);

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) onCancel();
    }}>
      <AlertDialogContent className='bg-white'>
        <AlertDialogHeader>
          <AlertDialogTitle>{content.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {content.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={content.actionClassName}
          >
            {content.actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function getHouseStatusDialogContent(action: StatusChangeAction, familyName: string) {
  const normalizedFamilyName = familyName || 'família sem nome';

  if (action === 'unarchive') {
    return {
      title: 'Desarquivar casa?',
      description: `A casa de ${normalizedFamilyName} voltará a ficar disponível no gerenciamento.`,
      actionLabel: 'Desarquivar casa',
      actionClassName: 'bg-blue-600 text-white hover:bg-blue-700',
    };
  }

  if (action === 'markBuilt') {
    return {
      title: 'Marcar casa como construída?',
      description: `A casa de ${normalizedFamilyName} ficará bloqueada para edição no Canvas, configurações e materiais extras.`,
      actionLabel: 'Marcar como construída',
      actionClassName: 'bg-emerald-600 text-white hover:bg-emerald-700',
    };
  }

  if (action === 'markDraft') {
    return {
      title: 'Voltar casa para rascunho?',
      description: `A casa de ${normalizedFamilyName} voltará a permitir edição no Canvas, configurações e materiais extras.`,
      actionLabel: 'Voltar para rascunho',
      actionClassName: 'bg-amber-600 text-white hover:bg-amber-700',
    };
  }

  return {
    title: 'Arquivar casa?',
    description: `A casa de ${normalizedFamilyName} será arquivada e deixará de aparecer no Canvas.`,
    actionLabel: 'Arquivar casa',
    actionClassName: 'bg-red-600 text-white hover:bg-red-700',
  };
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

export function PermanentDeleteDialog({
  open,
  title,
  description,
  actionLabel,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  actionLabel: string;
  onCancel(): void;
  onConfirm(): void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) onCancel();
    }}>
      <AlertDialogContent className='bg-white'>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className='bg-red-700 text-white hover:bg-red-800'
          >
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
