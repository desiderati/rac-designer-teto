import {useRacEditorController} from '@/components/rac-editor/hooks/useRacEditorController.ts';
import {RacEditorLayout} from '@/components/rac-editor/ui/RacEditorLayout.tsx';
import {useHouse3DImageInsertion} from '@/contexts/House3DImageInsertionContext.tsx';
import {useEffect} from 'react';

export function RacEditorContent({onExit}: {onExit: () => void | Promise<void>}) {
  const layoutProps = useRacEditorController({onExit});
  const {registerCanvasGetter} = useHouse3DImageInsertion();

  useEffect(() => registerCanvasGetter(() => layoutProps.canvas.canvasRef.current), [
    layoutProps.canvas.canvasRef,
    registerCanvasGetter,
  ]);

  return <RacEditorLayout {...layoutProps}/>;
}
