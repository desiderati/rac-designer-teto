import {ReactNode} from 'react';
import {cn} from '@/lib/utils';
import {Dialog, DialogContent, DialogHeader, DialogTitle,} from '@/components/ui/dialog';
import {Sheet, SheetContent, SheetHeader, SheetTitle,} from '@/components/ui/sheet';
import {useIsMobile} from '@/hooks/use-mobile';

interface CardConfig {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  subtext?: string;
}

interface TwoCardSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  left: CardConfig;
  right: CardConfig;
  tutorialLocked?: boolean;
}

function CardButton({ label, icon, onClick, disabled, subtext }: CardConfig) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-col items-center gap-4 p-6 rounded-xl border-2 transition-all duration-200',
        'min-w-[140px] flex-1',
        disabled
          ? 'bg-muted/50 border-muted-foreground/20 text-muted-foreground cursor-not-allowed'
          : 'bg-white hover:bg-accent hover:border-primary border-border hover:scale-105 active:scale-95'
      )}
    >
      <div className="flex items-center justify-center h-14">
        {icon}
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <h3 className="font-semibold text-foreground text-center text-base">{label}</h3>
        {subtext && <span className="text-xs opacity-70">{subtext}</span>}
      </div>
    </button>
  );
}

export function TwoCardSelector({ isOpen, onClose, title, left, right, tutorialLocked = false }: TwoCardSelectorProps) {
  const isMobile = useIsMobile();

  const content = (
    <div className="flex flex-row gap-4 justify-center pt-2">
      <CardButton {...left} />
      <CardButton {...right} />
    </div>
  );

  if (tutorialLocked) {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-30 pointer-events-none">
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute left-1/2 top-1/2 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg">
          <div className="text-center">
            <h2 className="text-center text-2xl font-semibold leading-none tracking-tight">{title}</h2>
          </div>
          {content}
        </div>
      </div>
    );
  }

  if (!isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-sm" hideCloseButton>
          <DialogHeader className="text-center">
            <DialogTitle className="text-center text-2xl">{title}</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-xl">
        <SheetHeader className="text-center pb-2">
          <SheetTitle className="text-center text-2xl">{title}</SheetTitle>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
}
