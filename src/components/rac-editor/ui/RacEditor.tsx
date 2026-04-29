import {EditorStoreProvider} from '@/bootstrap/editor-context.tsx';
import {RacEditorContent} from '@/components/rac-editor/ui/RacEditorContent.tsx';

export function RacEditor() {
  return (
    <EditorStoreProvider>
      <RacEditorContent/>
    </EditorStoreProvider>
  );
}
