import {Button} from '@/components/ui/button.tsx';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog.tsx';
import {Drawer, DrawerContent, DrawerHeader, DrawerTitle} from '@/components/ui/drawer.tsx';

interface ConfirmDialogModalProps {
  isMobile: boolean;
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onRequestClose: () => void;
}

export function ConfirmDialogModal({
  isMobile,
  isOpen,
  title,
  description,
  confirmLabel,
  onConfirm,
  onRequestClose,
}: ConfirmDialogModalProps) {
  const body = (
    <>
      <div className="bg-white rounded-xl p-4">
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex gap-[16px] pt-4">
        <Button variant="outline" className="flex-1 bg-white" onClick={onRequestClose}>
          Cancelar
        </Button>
        <Button className="flex-1" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onRequestClose()}>
        <DrawerContent>
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle className="text-center text-2xl">{title}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onRequestClose()}>
      <DialogContent className="sm:max-w-sm" hideCloseButton>
        <DialogHeader className="text-center">
          <DialogTitle className="text-center text-2xl">{title}</DialogTitle>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
