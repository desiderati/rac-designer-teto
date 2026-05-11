import {useEffect, useMemo, useState} from 'react';
import {createEditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import {RacEditorStoreProvider} from '@/bootstrap/editor-context.tsx';
import {useIndexedDbConstructionSiteSessionStorage} from '@/bootstrap/useIndexedDbConstructionSiteSessionStorage.ts';
import {useConstructionSiteManagementController} from '@/components/construction-site/hooks/useConstructionSiteManagementController.ts';
import {ConstructionSiteManagementPanel} from '@/components/construction-site/ui/ConstructionSiteManagementPanel.tsx';
import {RacEditorContent} from '@/components/rac-editor/ui/RacEditorContent.tsx';
import {CANVAS_WORKSPACE_STYLE} from '@/components/rac-editor/@canvas/ui/workspace-style.ts';

export function RacEditor() {
  const storageState = useIndexedDbConstructionSiteSessionStorage();
  const ports = useMemo(() => {
    if (storageState.status !== 'ready') return null;
    return createEditorPorts({
      constructionSiteSessionStorage: storageState.storage,
    });
  }, [storageState]);

  if (storageState.status === 'loading') {
    return (
      <div className='grid h-full place-items-center' style={CANVAS_WORKSPACE_STYLE}>
        <span
          aria-label='Carregando o Canvas...'
          className='h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700'
        />
      </div>
    );
  }

  if (storageState.status === 'error') {
    return (
      <div className='grid h-full place-items-center px-6 text-center text-sm font-medium text-red-700' style={CANVAS_WORKSPACE_STYLE}>
        {storageState.message}
      </div>
    );
  }

  if (!ports) return null;

  return (
    <RacEditorStoreProvider ports={ports}>
      <RacEditorEntryPoint/>
    </RacEditorStoreProvider>
  );
}

function RacEditorEntryPoint() {
  const constructionSiteManagement = useConstructionSiteManagementController({});
  const [editorOpen, setEditorOpen] = useState(constructionSiteManagement.canOpenRacEditor);

  useEffect(() => {
    if (!constructionSiteManagement.canOpenRacEditor) {
      setEditorOpen(false);
    }
  }, [constructionSiteManagement.canOpenRacEditor]);

  if (editorOpen && constructionSiteManagement.canOpenRacEditor) {
    return <RacEditorContent/>;
  }

  return (
    <div className='relative h-full overflow-hidden' style={CANVAS_WORKSPACE_STYLE}>
      <ConstructionSiteManagementPanel
        {...constructionSiteManagement}
        onBackToCanvas={() => setEditorOpen(true)}
      />
    </div>
  );
}
