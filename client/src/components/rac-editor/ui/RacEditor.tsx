import {useEffect, useMemo, useState} from 'react';
import {ArrowRight, Globe2, History, House, LogIn, ShieldCheck} from 'lucide-react';
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

const PRODUCT_SCREENSHOT_URL = '/manus-storage/rac-editor-landing-screenshot-harmonized_a622cf88.png';
const HOUSE_ILLUSTRATION_URL = '/manus-storage/teto-house-linework-transparent-cropped_28fd1656.png';

export function RacEditor() {
  const {isAuthenticated, loading, error, logout} = useAuth();
  const landingPreview = useMemo(() => {
    if (!import.meta.env.DEV || typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('landing') === 'preview';
  }, []);

  if (landingPreview) return <RacEditorAuthenticationState error={null}/>;
  if (loading) return <RacEditorLoadingState/>;
  if (!isAuthenticated) return <RacEditorAuthenticationState error={error}/>;

  return (
    <StorageImageUploadProvider>
      <RemoteRacEditor onLogout={logout}/>
    </StorageImageUploadProvider>
  );
}

function RemoteRacEditor({onLogout}: {onLogout: () => Promise<void>}) {
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
          <RacEditorEntryPoint onLogout={onLogout}/>
        </RacEditorStoreProvider>
      </div>
    </RemoteSyncProvider>
  );
}

function RacEditorAuthenticationState({error}: {error: unknown}) {
  return (
    <main className='rac-login fixed inset-0 bg-[#eaf1f7] text-[#123d72]'>
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
            Registre, compartilhe e construa juntos os projetos da sua comunidade,
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

        </section>

        <section className='rac-login__visual' aria-label='Visão do RAC Designer TETO'>
          <div className='rac-login__editor-wrap'>
            <img
              className='rac-login__editor-shot'
              src={PRODUCT_SCREENSHOT_URL}
              alt='Editor RAC Designer TETO com planta baixa e vistas da casa'
            />
          </div>

          <div className='rac-login__callouts'>
            <div><span className='rac-login__callout-icon'><History aria-hidden='true'/></span><p><strong>Projetos</strong><span>Histórico e versões</span></p></div>
            <div><span className='rac-login__callout-icon'><Globe2 aria-hidden='true'/></span><p><strong>Comunidade</strong><span>Decisão conjunta</span></p></div>
            <div><span className='rac-login__callout-icon'><ShieldCheck aria-hidden='true'/></span><p><strong>Construção</strong><span>Mais segura</span></p></div>
          </div>
        </section>

        <section className='rac-login__impact' aria-label='Impacto social'>
          <p className='rac-login__house-caption'>Mais que plantas.<br/><strong>São pessoas.</strong><br/>São comunidades.</p>
          <p className='rac-login__impact-detail'>Cada traço organiza uma decisão. Cada decisão fortalece uma comunidade.</p>
          <div className='rac-login__benefits' aria-label='Recursos principais'>
            <span><Globe2 aria-hidden='true'/>Base global</span>
            <span><History aria-hidden='true'/>Histórico</span>
            <span><ShieldCheck aria-hidden='true'/>Storage seguro</span>
          </div>
        </section>

        <section className='rac-login__house-stage' aria-label='Casa TETO'>
          <img
            className='rac-login__house'
            src={HOUSE_ILLUSTRATION_URL}
            alt='Ilustração arquitetônica de uma casa TETO elevada sobre pilotis'
          />
        </section>
      </div>
    </main>
  );
}

function RacEditorLoadingState() {
  return (
    <div className='rac-login-loading' style={CANVAS_WORKSPACE_STYLE}>
      <div aria-live='polite' className='rac-login-loading__card' role='status'>
        <span aria-hidden='true' className='rac-login-loading__mark'><House/></span>
        <span aria-hidden='true' className='rac-login-loading__spinner'/>
        <p>Preparando seu espaço de projeto...</p>
      </div>
    </div>
  );
}

function RacEditorEntryPoint({onLogout}: {onLogout: () => Promise<void>}) {
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
    return <RacEditorContent onExit={onLogout}/>;
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
