import {DestructiveConfirmationDialog} from './DestructiveConfirmationDialog.tsx';
export function ResetHouseDialog({open, onOpenChange, onConfirm}: {
  open: boolean; onOpenChange(open: boolean): void; onConfirm(): Promise<void>;
}) {
  return <DestructiveConfirmationDialog open={open} onOpenChange={onOpenChange} onConfirm={onConfirm}
    title='Redefinir Casa?' confirmLabel='Redefinir Casa' pendingLabel='Redefinindo…'
    description='Os pilotis, níveis e demais definições da casa serão apagados. Todas as vistas desta casa serão removidas do Canvas. Os demais objetos do Canvas serão mantidos. A casa voltará ao status Inicial e poderá ser definida do zero.'/ >;
}
