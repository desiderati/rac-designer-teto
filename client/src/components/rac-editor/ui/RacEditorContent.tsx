import {useRacEditorController} from '@/components/rac-editor/hooks/useRacEditorController.ts';
import {RacEditorLayout} from '@/components/rac-editor/ui/RacEditorLayout.tsx';

export function RacEditorContent({onExit}: {onExit: () => void | Promise<void>}) {
  const layoutProps = useRacEditorController({onExit});

  return <RacEditorLayout {...layoutProps}/>;
}
