import {Smartphone} from 'lucide-react';
import {Dialog, DialogContent, DialogDescription, DialogTitle} from '@/components/ui/dialog.tsx';
import {Button} from '@/components/ui/button.tsx';
import {ModalFrame} from '@/components/ui/ModalFrame.tsx';
import {useCanvasMobileViewport} from '../lib/use-canvas-mobile-viewport.ts';
export function CanvasOrientationNotice({onBackToConstructions}: {onBackToConstructions: () => void}) {
  const {mobile, portrait} = useCanvasMobileViewport();
  return <Dialog open={mobile && portrait}>
    <DialogContent hideCloseButton overlayClassName='z-[2000]' className='rac-orientation-notice z-[2001] max-w-sm text-center' onEscapeKeyDown={(event) => event.preventDefault()} onPointerDownOutside={(event) => event.preventDefault()}>
      <ModalFrame header={<>
      <div className='rac-orientation-illustration mx-auto grid h-24 w-24 place-items-center text-blue-600' aria-hidden='true'><Smartphone className='h-16 w-16 motion-safe:animate-[rac-rotate-phone_2s_ease-in-out_infinite]'/></div>
      <DialogTitle>Gire seu celular</DialogTitle></>}
      actions={<Button type='button' variant='ghost' className='mx-auto block min-h-11 bg-slate-200/60 text-sm font-normal text-slate-900 hover:bg-slate-200/60 hover:text-slate-900 active:bg-slate-200/60' onClick={onBackToConstructions}>Voltar às construções</Button>}>
      <DialogDescription>Use o celular na horizontal para trabalhar no Canvas. A tela será liberada ao girar o aparelho.</DialogDescription>
      </ModalFrame>
    </DialogContent>
  </Dialog>;
}
