import {Smartphone} from 'lucide-react';
import {Dialog, DialogContent, DialogDescription, DialogTitle} from '@/components/ui/dialog.tsx';
import {Button} from '@/components/ui/button.tsx';
import {useCanvasMobileViewport} from '../lib/use-canvas-mobile-viewport.ts';
export function CanvasOrientationNotice({onBackToConstructions}: {onBackToConstructions: () => void}) {
  const {mobile, portrait} = useCanvasMobileViewport();
  return <Dialog open={mobile && portrait}>
    <DialogContent hideCloseButton className='max-w-sm text-center' onEscapeKeyDown={(event) => event.preventDefault()} onPointerDownOutside={(event) => event.preventDefault()}>
      <div className='mx-auto grid h-24 w-24 place-items-center text-blue-600' aria-hidden='true'><Smartphone className='h-16 w-16 motion-safe:animate-[rac-rotate-phone_2s_ease-in-out_infinite]'/></div>
      <DialogTitle>Gire seu celular</DialogTitle>
      <DialogDescription>Use o celular na horizontal para trabalhar no Canvas. A tela será liberada ao girar o aparelho.</DialogDescription>
      <Button type='button' className='min-h-11 bg-blue-600 text-white hover:bg-blue-700' onClick={onBackToConstructions}>Voltar às construções</Button>
    </DialogContent>
  </Dialog>;
}
