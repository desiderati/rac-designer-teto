import {useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {AlertCircle, ArrowRight, Globe2, History, House, LogIn, ShieldCheck, X} from 'lucide-react';
import {createEditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import {RacEditorStoreProvider} from '@/bootstrap/editor-context.tsx';
import {useRemoteConstructionSiteSessionStorage} from '@/bootstrap/useRemoteConstructionSiteSessionStorage.ts';
import {useConstructionSiteManagementController} from '@/components/construction-site/hooks/useConstructionSiteManagementController.ts';
import {ConstructionSiteManagementPanel} from '@/components/construction-site/ui/ConstructionSiteManagementPanel.tsx';
import {RacEditorContent} from '@/components/rac-editor/ui/RacEditorContent.tsx';
import {CANVAS_WORKSPACE_STYLE} from '@/components/rac-editor/@canvas/ui/workspace-style.ts';
import {StorageImageUploadProvider} from '@/contexts/StorageImageUploadContext.tsx';
import {House3DImageInsertionProvider} from '@/contexts/House3DImageInsertionContext.tsx';
import {TerrainPhotoDescriptionProvider} from '@/contexts/TerrainPhotoDescriptionContext.tsx';
import {House3DImagePendingToast} from '@/components/rac-editor/@viewer-3d/ui/House3DImagePendingToast.tsx';
import {useAuth} from '@/_core/hooks/useAuth.ts';
import {clearLoginLock, startLogin} from '@/const.ts';
import {RemoteSyncProvider} from '@/contexts/RemoteSyncContext.tsx';
import {RemoteSyncStatus} from './RemoteSyncStatus.tsx';
import {LegacyDataBlockedState, RemoteLegacyDataDialog} from './RemoteLegacyDataDialog.tsx';

const PRODUCT_SCREENSHOT_URL = '/api/public-assets/rac-editor-landing-screenshot-harmonized_95473d21.png';
const HOUSE_ILLUSTRATION_URL = '/api/public-assets/teto-house-linework-transparent-cropped_770579e2.png';
const isLocalE2eMode = import.meta.env.VITE_E2E === 'true';
const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  missing_parameters: 'A tentativa de login foi interrompida antes de concluir. Volte e tente novamente.',
  invalid_state: 'A sessão de login expirou ou foi aberta em outra tentativa. Inicie o acesso novamente.',
  profile_unavailable: 'Não foi possível confirmar os dados da sua conta. Tente entrar novamente.',
  callback_failed: 'O login não foi concluído desta vez. Tente novamente em alguns instantes.',
};

export function RacEditor() {
  const {isAuthenticated, loading, error, logout} = useAuth();
  const [isViewportTooNarrow, setIsViewportTooNarrow] = useState(false);
  const [isViewportWarningCollapsed, setIsViewportWarningCollapsed] = useState(false);
  const [oauthErrorCode, setOauthErrorCode] = useState<string | null>(null);
  const landingPreview = useMemo(() => {
    if (!import.meta.env.DEV || typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('landing') === 'preview';
  }, []);

  useEffect(() => {
    const updateViewportWarning = () => setIsViewportTooNarrow(window.innerWidth < 420);
    updateViewportWarning();
    window.addEventListener('resize', updateViewportWarning);
    return () => window.removeEventListener('resize', updateViewportWarning);
  }, []);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('oauthError');
    if (!code) return;
    setOauthErrorCode(code);
    clearLoginLock();
  }, []);

  const oauthErrorMessage = oauthErrorCode
    ? OAUTH_ERROR_MESSAGES[oauthErrorCode] ?? OAUTH_ERROR_MESSAGES.callback_failed
    : null;
  const retryLogin = () => {
    clearLoginLock();
    startLogin();
  };

  const withViewportWarning = (content: ReactNode) => (
    <>
      {content}
      {isViewportTooNarrow ? (
        <MinimumViewportWarning
          collapsed={isViewportWarningCollapsed}
          onCollapse={() => setIsViewportWarningCollapsed(true)}
          onExpand={() => setIsViewportWarningCollapsed(false)}
        />
      ) : null}
    </>
  );

  if (landingPreview) return withViewportWarning(<RacEditorAuthenticationState error={null} oauthErrorMessage={oauthErrorMessage} onRetryLogin={retryLogin}/>);
  if (isLocalE2eMode) {
    return withViewportWarning(
      <StorageImageUploadProvider>
        <TerrainPhotoDescriptionProvider>
          <House3DImageInsertionProvider>
            <RemoteRacEditor onLogout={async () => undefined}/>
          </House3DImageInsertionProvider>
        </TerrainPhotoDescriptionProvider>
      </StorageImageUploadProvider>,
    );
  }
  if (loading) return withViewportWarning(<RacEditorLoadingState/>);
  if (!isAuthenticated) return withViewportWarning(<RacEditorAuthenticationState error={error} oauthErrorMessage={oauthErrorMessage} onRetryLogin={retryLogin}/>);

  return withViewportWarning(
    <StorageImageUploadProvider>
      <TerrainPhotoDescriptionProvider>
        <House3DImageInsertionProvider>
          <RemoteRacEditor onLogout={logout}/>
        </House3DImageInsertionProvider>
      </TerrainPhotoDescriptionProvider>
    </StorageImageUploadProvider>,
  );
}

function MinimumViewportWarning({
  collapsed,
  onCollapse,
  onExpand,
}: {
  collapsed: boolean;
  onCollapse: () => void;
  onExpand: () => void;
}) {
  if (collapsed) {
    return (
      <button
        type='button'
        aria-label='Reabrir aviso de viewport'
        title='Reabrir aviso de viewport'
        data-testid='minimum-viewport-warning-reopen'
        onClick={onExpand}
        className='pointer-events-auto fixed right-3 top-3 z-[1200] grid h-9 w-9 place-items-center rounded-full border border-amber-300 bg-amber-50/95 text-amber-900 shadow-lg backdrop-blur-sm transition-colors hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2'
      >
        <AlertCircle className='h-4 w-4'/>
      </button>
    );
  }

  return (
    <div
      role='status'
      aria-live='polite'
      data-testid='minimum-viewport-warning'
      className='pointer-events-none fixed inset-x-3 top-3 z-[1200] mx-auto flex max-w-md items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/95 px-4 py-3 pl-11 text-center text-sm font-medium text-amber-950 shadow-lg backdrop-blur-sm relative'
    >
      <p className='flex-1'>
        Para uma experiência confortável, aumente a janela para pelo menos 420 px de largura ou gire o dispositivo.
      </p>
      <button
        type='button'
        aria-label='Ocultar aviso de viewport'
        title='Ocultar aviso'
        data-testid='minimum-viewport-warning-dismiss'
        onClick={onCollapse}
        className='pointer-events-auto absolute left-2 top-2 rounded-full p-1 text-amber-800 transition-colors hover:bg-amber-100 hover:text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1'
      >
        <X className='h-4 w-4'/>
      </button>
    </div>
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

function RacEditorAuthenticationState({
  error,
  oauthErrorMessage,
  onRetryLogin,
}: {
  error: unknown;
  oauthErrorMessage?: string | null;
  onRetryLogin?: () => void;
}) {
  const authErrorMessage = oauthErrorMessage ?? (error ? 'Não foi possível validar a sessão. Tente entrar novamente.' : null);

  return (
    <main className='rac-login fixed inset-0 bg-[#eaf1f7] text-[#123d72]'>
      <div className='rac-login__shell'>
        <LandingRevealSection className='rac-login__identity' aria-label='Identidade do RAC Designer TETO'>
          <div className='rac-login__brand' aria-label='RAC Designer TETO'>
            <span className='rac-login__brand-mark' aria-hidden='true'><House/></span>
            <span>RAC Designer <strong>TETO</strong></span>
          </div>

          <div className='rac-login__divider' aria-hidden='true'/>
          <p className='rac-login__eyebrow'>FERRAMENTA PARA QUEM<br/>CONSTRÓI IMPACTO</p>
        </LandingRevealSection>

        <LandingRevealSection className='rac-login__copy' aria-label='Acesso ao RAC Designer TETO'>
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

          {authErrorMessage ? (
            <div role='alert' className='rac-login__auth-error'>
              <div className='rac-login__auth-error-copy'>
                <AlertCircle aria-hidden='true'/>
                <span>{authErrorMessage}</span>
              </div>
              {onRetryLogin ? <button type='button' className='rac-login__auth-retry' onClick={onRetryLogin}>Tentar novamente</button> : null}
            </div>
          ) : null}
        </LandingRevealSection>

        <LandingRevealSection className='rac-login__visual' aria-label='Visão do RAC Designer TETO'>
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
        </LandingRevealSection>

        <LandingRevealSection className='rac-login__impact' aria-label='Impacto social'>
          <p className='rac-login__house-caption'>Mais que plantas.<br/><strong>São pessoas.</strong><br/>São comunidades.</p>
          <p className='rac-login__impact-detail'>Cada traço organiza uma decisão. Cada decisão fortalece uma comunidade.</p>
        </LandingRevealSection>

        <LandingRevealSection className='rac-login__house-stage' aria-label='Casa TETO'>
          <img
            className='rac-login__house'
            src={HOUSE_ILLUSTRATION_URL}
            alt='Ilustração arquitetônica de uma casa TETO elevada sobre pilotis'
          />
        </LandingRevealSection>

        <LandingRevealSection className='rac-login__benefits' aria-label='Recursos principais' eager>
          <span><Globe2 aria-hidden='true'/>Base global</span>
          <span><History aria-hidden='true'/>Histórico</span>
          <span><ShieldCheck aria-hidden='true'/>Storage seguro</span>
        </LandingRevealSection>
      </div>
    </main>
  );
}

function LandingRevealSection({
  className,
  children,
  'aria-label': ariaLabel,
  eager = false,
}: {
  className: string;
  children: ReactNode;
  'aria-label': string;
  eager?: boolean;
}) {
  const elementRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(eager);

  useEffect(() => {
    if (eager) return;
    const element = elementRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setIsVisible(true);
        observer.unobserve(entry.target);
      },
      {
        root: element.closest('.rac-login'),
        rootMargin: '0px 0px -8% 0px',
        threshold: 0.12,
      },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={elementRef}
      aria-label={ariaLabel}
      className={`rac-login__reveal ${className}${isVisible ? ' is-visible' : ''}`}
    >
      {children}
    </section>
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

  return (
    <>
      {editorOpen && constructionSiteManagement.canOpenRacEditor ? (
        <RacEditorContent onExit={onLogout}/>
      ) : (
        <div className='rac-min-width-shell relative h-full min-h-[480px] min-w-[420px] w-full overflow-hidden' style={CANVAS_WORKSPACE_STYLE}>
          <ConstructionSiteManagementPanel
            {...constructionSiteManagement}
            onBackToCanvas={openRacEditor}
          />
        </div>
      )}
      <House3DImagePendingToast/>
    </>
  );
}
