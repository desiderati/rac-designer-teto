import {RacEditorStoreProvider} from '@/bootstrap/editor-context.tsx';
import {RacEditorContent} from '@/components/rac-editor/ui/RacEditorContent.tsx';

export function RacEditor() {
  return (
    <RacEditorStoreProvider>
      <RacEditorContent/>
    </RacEditorStoreProvider>
  );
}
