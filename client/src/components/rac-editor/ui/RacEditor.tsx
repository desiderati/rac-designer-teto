import {useEffect, useMemo, useState} from 'react';
import {createEditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import {RacEditorStoreProvider} from '@/bootstrap/editor-context.tsx';
import {useRemoteConstructionSiteSessionStorage} from '@/bootstrap/useRemoteConstructionSiteSessionStorage.ts';
import {useConstructionSiteManagementController} from '@/components/construction-site/hooks/useConstructionSiteManagementController.ts';
import {ConstructionSiteManagementPanel} from '@/components/construction-site/ui/ConstructionSiteManagementPanel.tsx';
import {RacEditorContent} from '@/components/rac-editor/ui/RacEditorContent.tsx';
import {CANVAS_WORKSPACE_STYLE} from '@/components/rac-editor/@canvas/ui/workspace-style.ts';
import {StorageImageUploadProvider} from '@/contexts/StorageImageUploadContext.tsx';
import {useAuth} from '@/_core/hooks/useAuth.ts';
import {startLogin} from '@/const.ts';

export function RacEditor() {
  const {isAuthenticated, loading, error} = useAuth();

  if (loading) return <RacEditorLoadingState/>;
  if (!isAuthenticated) return <RacEditorAuthenticationState error={error}/>;

  return (
    <StorageImageUploadProvider>
      <RemoteRacEditor/>
    </StorageImageUploadProvider>
  );
}

function RemoteRacEditor() {
  const storageState = useRemoteConstructionSiteSessionStorage();
  const ports = useMemo(() => {
    if (storageState.status !== 'ready') return null;
    return createEditorPorts({
      constructionSiteSessionStorage: storageState.storage,
    });
  }, [storageState]);

  if (storageState.status === 'loading') return <RacEditorLoadingState/>;

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

function RacEditorAuthenticationState({error}: {error: unknown}) {
  return (
    <div className='grid h-full place-items-center px-6 text-center' style={CANVAS_WORKSPACE_STYLE}>
      <section className='max-w-md rounded-xl bg-white/90 p-7 shadow-sm ring-1 ring-slate-200'>
        <p className='text-xs font-bold uppercase tracking-[0.16em] text-slate-500'>RAC Designer TETO</p>
        <h1 className='mt-2 text-2xl font-semibold text-slate-900'>Entre para acessar as Construções TETO</h1>
        <p className='mt-3 text-sm leading-6 text-slate-600'>
          Use sua conta Manus para abrir a base global e sincronizada do editor.
        </p>
        {error ? <p role='alert' className='mt-3 text-sm text-red-700'>Não foi possível validar sua sessão atual.</p> : null}
        <button
          type='button'
          className='mt-6 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700'
          onClick={startLogin}
        >
          Entrar com Manus
        </button>
      </section>
    </div>
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
