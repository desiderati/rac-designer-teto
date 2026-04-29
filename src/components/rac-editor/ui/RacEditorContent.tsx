import {useRacEditorController} from '@/components/rac-editor/hooks/useRacEditorController.ts';
import {RacEditorLayout} from '@/components/rac-editor/ui/RacEditorLayout.tsx';

export function RacEditorContent() {
  const layoutProps = useRacEditorController();

  return <RacEditorLayout {...layoutProps}/>;
}
