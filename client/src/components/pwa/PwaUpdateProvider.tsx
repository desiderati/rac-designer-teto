import {useCallback, useEffect, useRef, useState, type ReactNode} from 'react';
import {toast} from 'sonner';
import {PwaUpdateSafetyContext, type PwaUpdateSafety} from './PwaUpdateSafetyContext.ts';

const UPDATE_TOAST_ID = 'rac-new-version';
const UPDATE_CHECK_INTERVAL_MS = 5 * 60 * 1000;

function canReloadSafely(safety: PwaUpdateSafety | null): boolean {
  return safety === null || (
    safety.syncStatus === 'synced'
    && safety.documentSaveStatus === 'saved'
    && !safety.hasUnsavedFormChanges
  );
}

export function PwaUpdateProvider({children}: {children: ReactNode}) {
  const [safety, setSafety] = useState<PwaUpdateSafety | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [noticeRevision, setNoticeRevision] = useState(0);
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);
  const workerActivatedRef = useRef(false);
  const updateRequestedRef = useRef(false);
  const updateRequestTimeoutRef = useRef<number | null>(null);
  const safetyRef = useRef(safety);
  safetyRef.current = safety;
  const reportSafety = useCallback((next: PwaUpdateSafety | null) => setSafety(next), []);
  const canReload = canReloadSafely(safety);

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

    let active = true;
    let intervalId: number | undefined;
    let registration: ServiceWorkerRegistration | undefined;
    let checking = false;

    const checkForUpdates = async () => {
      if (!registration || checking || !navigator.onLine) return;
      checking = true;
      try {
        await registration.update();
      } catch {
        // A failed check must not interrupt the editor.
      } finally {
        checking = false;
      }
    };
    const checkWhenVisible = () => {
      if (document.visibilityState === 'visible') void checkForUpdates();
    };

    void import('virtual:pwa-register').then(({registerSW}) => {
      if (!active) return;
      updateSWRef.current = registerSW({
        onNeedRefresh: () => setUpdateAvailable(true),
        onNeedReload: () => {
          workerActivatedRef.current = true;
          if (updateRequestTimeoutRef.current !== null) window.clearTimeout(updateRequestTimeoutRef.current);
          updateRequestTimeoutRef.current = null;
          if (updateRequestedRef.current && canReloadSafely(safetyRef.current)) {
            window.location.reload();
          } else {
            updateRequestedRef.current = false;
            setUpdateAvailable(true);
          }
        },
        onRegisteredSW: (_swUrl, registered) => {
          if (!active || !registered) return;
          registration = registered;
          intervalId = window.setInterval(() => void checkForUpdates(), UPDATE_CHECK_INTERVAL_MS);
          window.addEventListener('focus', checkForUpdates);
          window.addEventListener('online', checkForUpdates);
          document.addEventListener('visibilitychange', checkWhenVisible);
        },
      });
    }).catch(() => {
      // Registration is best effort; the online application remains usable.
    });

    return () => {
      active = false;
      if (intervalId !== undefined) window.clearInterval(intervalId);
      window.removeEventListener('focus', checkForUpdates);
      window.removeEventListener('online', checkForUpdates);
      document.removeEventListener('visibilitychange', checkWhenVisible);
      if (updateRequestTimeoutRef.current !== null) window.clearTimeout(updateRequestTimeoutRef.current);
      updateSWRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!updateAvailable) return;
    toast('Nova versão disponível', {
      id: UPDATE_TOAST_ID,
      description: canReload
        ? 'Atualize quando for conveniente para usar a versão mais recente.'
        : 'Salve suas alterações e conclua a sincronização antes de atualizar.',
      duration: Infinity,
      action: {
        label: 'Atualizar agora',
        onClick: () => {
          if (!canReloadSafely(safetyRef.current)) {
            toast.warning('Há alterações ou sincronizações pendentes. Conclua-as antes de atualizar.');
            window.setTimeout(() => setNoticeRevision((revision) => revision + 1), 0);
            return;
          }
          if (workerActivatedRef.current) {
            window.location.reload();
            return;
          }
          updateRequestedRef.current = true;
          if (updateRequestTimeoutRef.current !== null) window.clearTimeout(updateRequestTimeoutRef.current);
          updateRequestTimeoutRef.current = window.setTimeout(() => {
            updateRequestedRef.current = false;
            updateRequestTimeoutRef.current = null;
          }, 30_000);
          void updateSWRef.current?.(true).catch(() => {
            updateRequestedRef.current = false;
            if (updateRequestTimeoutRef.current !== null) window.clearTimeout(updateRequestTimeoutRef.current);
            updateRequestTimeoutRef.current = null;
            toast.error('Não foi possível atualizar agora. Tente novamente.');
            setNoticeRevision((revision) => revision + 1);
          });
        },
      },
    });
  }, [canReload, noticeRevision, updateAvailable]);

  return <PwaUpdateSafetyContext.Provider value={reportSafety}>{children}</PwaUpdateSafetyContext.Provider>;
}
