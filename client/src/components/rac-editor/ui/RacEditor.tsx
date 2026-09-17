import {useEffect, useMemo, useState} from 'react';
import {ArrowRight, CheckCircle2, Globe2, History, House, LogIn, ShieldCheck} from 'lucide-react';
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
import {RemoteSyncProvider} from '@/contexts/RemoteSyncContext.tsx';
import {RemoteSyncStatus} from './RemoteSyncStatus.tsx';
import {LegacyDataBlockedState, RemoteLegacyDataDialog} from './RemoteLegacyDataDialog.tsx';

const PRODUCT_SCREENSHOT_URL = '/manus-storage/pasted_file_3D3Rgh_image_7992f010.png';
const HOUSE_ILLUSTRATION_URL = '/manus-storage/teto-house-linework-transparent-clean_a64b114e.png';

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
  const [isDiscardingLegacyData, setIsDiscardingLegacyData] = useState(false);
  const ports = useMemo(() => {
    if (storageState.status !== 'ready') return null;
    return createEditorPorts({
      constructionSiteSessionStorage: storageState.storage,
    });
  }, [storageState]);

  if (storageState.status === 'loading') return <RacEditorLoadingState/>;

  if (storageState.status === 'legacy_confirmation') {
    return (
      <>
        <RemoteLegacyDataDialog
          open
          busy={isDiscardingLegacyData}
          onKeepLocal={storageState.keepLegacyData}
          onConfirmDiscard={async () => {
            setIsDiscardingLegacyData(true);
            try {
              await storageState.discardLegacyData();
            } finally {
              setIsDiscardingLegacyData(false);
            }
          }}
        />
        <RacEditorLoadingState/>
      </>
    );
  }

  if (storageState.status === 'blocked') {
    return <LegacyDataBlockedState onReview={storageState.reviewLegacyData}/>;
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
    <RemoteSyncProvider value={storageState.sync}>
      <div className='relative h-full'>
        <RemoteSyncStatus/>
        <RacEditorStoreProvider key={storageState.sync.revision} ports={ports}>
          <RacEditorEntryPoint/>
        </RacEditorStoreProvider>
      </div>
    </RemoteSyncProvider>
  );
}

function RacEditorAuthenticationState({error}: {error: unknown}) {
  return (
    <main className='rac-login fixed inset-0 overflow-y-auto bg-[#eaf1f7] text-[#123d72]'>
      <div className='rac-login__shell'>
        <section className='rac-login__copy'>
          <div className='rac-login__brand' aria-label='RAC Designer TETO'>
            <span className='rac-login__brand-mark' aria-hidden='true'><House/></span>
            <span>RAC Designer <strong>TETO</strong></span>
          </div>

          <div className='rac-login__divider' aria-hidden='true'/>
          <p className='rac-login__eyebrow'>FERRAMENTA PARA QUEM<br/>CONSTRÓI IMPACTO</p>

          <div className='rac-login__headline'>
            <span className='rac-login__headline-line' aria-hidden='true'/>
            <h1>Da ideia à planta<br/>que vira <em>abrigo.</em></h1>
          </div>

          <p className='rac-login__description'>
            Registre, compartilhe e construa<br className='hidden sm:block'/>
            juntos os projetos da sua comunidade,<br className='hidden sm:block'/>
            com histórico claro e decisões mais seguras.
          </p>

          <button type='button' className='rac-login__cta' onClick={startLogin}>
            <LogIn aria-hidden='true'/>
            <span>Entrar com Manus</span>
            <ArrowRight aria-hidden='true'/>
          </button>

          {error ? (
            <p role='alert' className='rac-login__auth-error'>Não foi possível validar a sessão. Tente entrar novamente.</p>
          ) : null}

          <div className='rac-login__benefits' aria-label='Recursos principais'>
            <span><Globe2 aria-hidden='true'/>Base global</span>
            <span><History aria-hidden='true'/>Histórico</span>
            <span><ShieldCheck aria-hidden='true'/>Storage seguro</span>
          </div>
        </section>

        <section className='rac-login__visual' aria-label='Visão do RAC Designer TETO'>
          <div className='rac-login__editor-stage'>
            <div className='rac-login__editor-wrap'>
              <img
                className='rac-login__editor-shot'
                src={PRODUCT_SCREENSHOT_URL}
                alt='Editor RAC Designer TETO com planta baixa e vistas da casa'
              />
              <span className='rac-login__sync-badge' aria-label='Editor sincronizado'>
                <CheckCircle2 aria-hidden='true'/>
              </span>
            </div>

            <div className='rac-login__callouts'>
              <div><span className='rac-login__callout-icon'><History aria-hidden='true'/></span><p><strong>Projetos</strong><br/>com histórico<br/>e versões.</p></div>
              <div><span className='rac-login__callout-icon'><Globe2 aria-hidden='true'/></span><p><strong>Comunidade</strong><br/>que decide<br/>junto.</p></div>
              <div><span className='rac-login__callout-icon'><ShieldCheck aria-hidden='true'/></span><p><strong>Construção</strong><br/>mais segura<br/>e eficiente.</p></div>
            </div>
          </div>

          <div className='rac-login__house-stage'>
            <p className='rac-login__house-caption'>Mais que plantas.<br/><strong>São pessoas.</strong><br/>São comunidades.</p>
            <img
              className='rac-login__house'
              src={HOUSE_ILLUSTRATION_URL}
              alt='Ilustração arquitetônica de uma casa TETO elevada sobre pilotis'
            />
          </div>
        </section>
      </div>
    </main>
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
