import type {ReactNode} from 'react';
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle} from '@/components/ui/alert-dialog.tsx';
import {ConfirmationLayout} from '@/components/ui/ConfirmationLayout.tsx';
import {Archive, ArchiveRestore, CheckCircle2, Download, RotateCcw, AlertTriangle} from 'lucide-react';
import type {StatusChangeAction} from './types.ts';

type ConfirmationTone = 'export' | 'archive' | 'restore' | 'success' | 'warning';
const CONFIRMATION_TONE_CLASS_NAMES: Record<ConfirmationTone, string> = {
  export:'bg-blue-50 text-blue-600', archive:'bg-red-50 text-red-600',
  restore:'bg-sky-50 text-sky-600', success:'bg-emerald-50 text-emerald-600', warning:'bg-amber-50 text-amber-600',
};
const CONFIRMATION_ICONS = {export:Download, archive:Archive, restore:ArchiveRestore, success:CheckCircle2, warning:RotateCcw};

interface StatusConfirmationProps {
  open: boolean;
  title: string;
  description: string;
  actionLabel: string;
  actionClassName: string;
  tone: ConfirmationTone;
  cancelLabel?: string;
  icon?: ReactNode;
  onCancel(): void;
  onConfirm(): void;
}
function StatusConfirmation({open, title, description, actionLabel, actionClassName, tone, cancelLabel = 'Cancelar', icon, onCancel, onConfirm}: StatusConfirmationProps) {
  const Icon = CONFIRMATION_ICONS[tone];
  return <AlertDialog open={open} onOpenChange={nextOpen => {if (!nextOpen) onCancel();}}>
    <AlertDialogContent className='min-w-[360px] w-[calc(100vw-2rem)] max-w-md'>
      <ConfirmationLayout
        title={<AlertDialogTitle>{title}</AlertDialogTitle>}
        icon={icon ?? <span data-testid={`confirmation-icon-${tone}`} className={CONFIRMATION_TONE_CLASS_NAMES[tone]}><Icon aria-hidden='true' className='h-5 w-5'/></span>}
        description={<AlertDialogDescription>{description}</AlertDialogDescription>}
        actions={<AlertDialogFooter
          cancel={<AlertDialogCancel> {cancelLabel} </AlertDialogCancel>}
          confirm={<AlertDialogAction onClick={onConfirm} className={actionClassName}>{actionLabel}</AlertDialogAction>}/>}/>
    </AlertDialogContent>
  </AlertDialog>;
}

export function UnsavedChangesDialog({open, onCancel, onConfirm}: {open:boolean; onCancel():void; onConfirm():void}) {
  return <StatusConfirmation open={open} onCancel={onCancel} onConfirm={onConfirm}
    title='Sair sem salvar?'
    description='Você está saindo da página sem salvar as alterações atuais. Se continuar, as alterações serão perdidas.'
    actionLabel='Sair sem salvar' actionClassName='bg-red-600 text-white hover:bg-red-700' cancelLabel='Continuar editando' tone='warning'
    icon={<span data-testid='unsaved-changes-icon-badge' className='bg-amber-50 text-amber-600 leading-none'><AlertTriangle aria-hidden='true' data-testid='unsaved-changes-icon' className='block h-5 w-5 -translate-y-px'/></span>}/>;
}
export function ConstructionStatusDialog({open, constructionCode, action, onCancel, onConfirm}: {open:boolean; constructionCode:string; action:StatusChangeAction; onCancel():void; onConfirm():void}) {
  return <StatusConfirmation open={open} {...getConstructionStatusDialogContent(action, constructionCode)} onCancel={onCancel} onConfirm={onConfirm}/>;
}
export function ConstructionRacsZipConfirmationDialog({open, constructionCode, onCancel, onConfirm}: {open:boolean; constructionCode:string; onCancel():void; onConfirm():void}) {
  const normalizedConstructionCode = constructionCode || 'sem código';
  return <StatusConfirmation open={open} onCancel={onCancel} onConfirm={onConfirm}
    title='Exportar RACs da construção?' description={`Será gerado um arquivo ZIP com os RACs da construção ${normalizedConstructionCode}.`}
    actionLabel='Exportar RACs ZIP' actionClassName='bg-blue-600 text-white hover:bg-blue-700' tone='export'/>;
}
function getConstructionStatusDialogContent(action: StatusChangeAction, constructionCode: string) {
  const normalizedConstructionCode = constructionCode || 'sem código';

  if (action === 'unarchive') {
    return {
      title: 'Desarquivar construção?',
      description: `A construção ${normalizedConstructionCode} voltará a ficar disponível para gestão e seleção.`,
      actionLabel: 'Desarquivar construção',
      actionClassName: 'bg-blue-600 text-white hover:bg-blue-700',
      tone: 'restore' as const,
    };
  }

  if (action === 'markCompleted') {
    return {
      title: 'Concluir construção?',
      description: `A construção ${normalizedConstructionCode} será concluída e todas as suas casas serão marcadas como construídas, inclusive as arquivadas. Os dados continuarão disponíveis para consulta, sem edição de casas e monitores.`,
      actionLabel: 'Concluir construção',
      actionClassName: 'bg-emerald-600 text-white hover:bg-emerald-700',
      tone: 'success' as const,
    };
  }

  if (action === 'markInProgress') {
    return {
      title: 'Voltar construção para andamento?',
      description: `A construção ${normalizedConstructionCode} voltará a permitir gestão de casas e monitores. As casas voltarão ao status que tinham antes da conclusão. Quando o status anterior não estiver disponível, a casa continuará construída.`,
      actionLabel: 'Voltar para andamento',
      actionClassName: 'bg-amber-600 text-white hover:bg-amber-700',
      tone: 'warning' as const,
    };
  }

  return {
    title: 'Arquivar construção?',
    description: `A construção ${normalizedConstructionCode} será arquivada e deixará de abrir no Canvas.`,
    actionLabel: 'Arquivar construção',
    actionClassName: 'bg-red-600 text-white hover:bg-red-700',
    tone: 'archive' as const,
  };
}

export function HouseStatusDialog({open, familyName, action, onCancel, onConfirm}: {open:boolean; familyName:string; action:StatusChangeAction; onCancel():void; onConfirm():void}) {
  return <StatusConfirmation open={open} {...getHouseStatusDialogContent(action, familyName)} onCancel={onCancel} onConfirm={onConfirm}/>;
}
function getHouseStatusDialogContent(action: StatusChangeAction, familyName: string) {
  const normalizedFamilyName = familyName || 'família sem nome';

  if (action === 'unarchive') {
    return {
      title: 'Desarquivar casa?',
      description: `A casa de ${normalizedFamilyName} voltará a ficar disponível no gerenciamento.`,
      actionLabel: 'Desarquivar casa',
      actionClassName: 'bg-blue-600 text-white hover:bg-blue-700',
      tone: 'restore' as const,
    };
  }

  if (action === 'markBuilt') {
    return {
      title: 'Marcar casa como construída?',
      description: `A casa de ${normalizedFamilyName} ficará bloqueada para edição no Canvas, configurações e materiais extras.`,
      actionLabel: 'Marcar como construída',
      actionClassName: 'bg-emerald-600 text-white hover:bg-emerald-700',
      tone: 'success' as const,
    };
  }

  if (action === 'markDraft') {
    return {
      title: 'Liberar edição da casa?',
      description: `A casa de ${normalizedFamilyName} voltará a permitir edição no Canvas, configurações e materiais extras.`,
      actionLabel: 'Liberar edição',
      actionClassName: 'bg-amber-600 text-white hover:bg-amber-700',
      tone: 'warning' as const,
    };
  }

  return {
    title: 'Arquivar casa?',
    description: `A casa de ${normalizedFamilyName} será arquivada e deixará de aparecer no Canvas.`,
    actionLabel: 'Arquivar casa',
    actionClassName: 'bg-red-600 text-white hover:bg-red-700',
    tone: 'archive' as const,
  };
}

export function MonitorStatusDialog({open, monitorName, action, onCancel, onConfirm}: {open:boolean; monitorName:string; action:StatusChangeAction; onCancel():void; onConfirm():void}) {
  const isReactivate = action === 'unarchive';
  return <StatusConfirmation open={open} onCancel={onCancel} onConfirm={onConfirm}
    title={isReactivate ? 'Reativar monitor?' : 'Inativar monitor?'}
    description={isReactivate ? `O monitor ${monitorName || 'sem nome'} voltará a aparecer na listagem ativa.` : `O monitor ${monitorName || 'sem nome'} será inativado e ficará disponível pelo filtro de status.`}
    actionLabel={isReactivate ? 'Reativar monitor' : 'Inativar monitor'}
    actionClassName={isReactivate ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-red-600 text-white hover:bg-red-700'}
    tone={isReactivate ? 'restore' : 'archive'}/>;
}
export function PermanentDeleteDialog({open, title, description, actionLabel, onCancel, onConfirm}: {open:boolean; title:string; description:string; actionLabel:string; onCancel():void; onConfirm():void}) {
  return <StatusConfirmation open={open} title={title} description={description} actionLabel={actionLabel} onCancel={onCancel} onConfirm={onConfirm}
    actionClassName='bg-red-700 text-white hover:bg-red-800' tone='archive'
    icon={<span className='bg-red-50 text-red-600'><AlertTriangle aria-hidden='true' className='h-5 w-5'/></span>}/>;
}
