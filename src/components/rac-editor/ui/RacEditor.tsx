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
    return <RacEditorLoadingState/>;
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

function RacEditorLoadingState() {
  return (
    <div className='grid h-full place-items-center px-6 text-center' style={CANVAS_WORKSPACE_STYLE}>
      <div
        aria-live='polite'
        className='flex flex-col items-center gap-3 rounded-lg bg-white/80 px-6 py-5 text-slate-700 shadow-sm ring-1 ring-slate-200/80'
        role='status'
      >
        <span
          aria-hidden='true'
          className='h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700'
        />
        <p className='m-0 text-sm font-medium text-slate-700'>Carregando o Canvas...</p>
      </div>
    </div>
  );
}

function RacEditorEntryPoint() {
  const constructionSiteManagement = useConstructionSiteManagementController({});
  const [editorOpen, setEditorOpen] = useState(constructionSiteManagement.canOpenRacEditor);
  const openRacEditor = () => {
    if (!constructionSiteManagement.prepareRacEditorOpening()) return;
    setEditorOpen(true);
  };

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
        onBackToCanvas={openRacEditor}
      />
    </div>
  );
}
