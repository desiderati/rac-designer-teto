import {APP_VERSION} from '@/shared/app-version.ts';

const CHUNK_RECOVERY_KEY = 'rac-designer.chunk-recovery-at';
const CHUNK_RECOVERY_WINDOW_MS = 60_000;
const PDF_TELEMETRY_KEY = 'rac-designer.pdf-export-telemetry';
const PDF_TELEMETRY_LIMIT = 30;

export type PdfExportTelemetryEventName =
  | 'checklist_started'
  | 'prepare_started'
  | 'prepare_succeeded'
  | 'prepare_failed'
  | 'retry_requested'
  | 'download_succeeded'
  | 'download_failed'
  | 'status_sync_failed';

export interface PdfExportTelemetryEvent {
  name: PdfExportTelemetryEventName;
  timestamp: number;
  version: string;
  durationMs?: number;
  phase?: string;
  errorName?: string;
  errorMessage?: string;
}

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : error && typeof error === 'object' && 'message' in error
        ? String((error as {message?: unknown}).message)
        : '';

  return /failed to fetch dynamically imported module|importing a module script failed|loading chunk .* failed|chunkloaderror|dynamically imported module/i.test(message);
}

/**
 * Recarrega a aplicação uma única vez por janela curta quando um asset de
 * código antigo ou incompleto impede um import dinâmico. A trava em
 * sessionStorage evita loops infinitos caso o deploy continue inconsistente.
 */
export function requestChunkRecovery(error: unknown): boolean {
  if (typeof window === 'undefined' || !isChunkLoadError(error)) return false;

  try {
    const now = Date.now();
    const previousRecovery = Number(sessionStorage.getItem(CHUNK_RECOVERY_KEY));
    if (Number.isFinite(previousRecovery) && now - previousRecovery < CHUNK_RECOVERY_WINDOW_MS) {
      return false;
    }

    sessionStorage.setItem(CHUNK_RECOVERY_KEY, String(now));
    window.setTimeout(() => {
      try {
        sessionStorage.removeItem(CHUNK_RECOVERY_KEY);
      } catch {
        // Restricted storage must not block the fallback reload.
      }
    }, CHUNK_RECOVERY_WINDOW_MS);

    const reloadUrl = new URL(window.location.href);
    reloadUrl.searchParams.set('chunkRecovery', String(now));
    window.location.replace(reloadUrl.toString());
    return true;
  } catch {
    // If storage or URL manipulation is blocked, a plain reload is still useful.
    try {
      window.location.reload();
      return true;
    } catch {
      return false;
    }
  }
}

export function installChunkRecovery(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleError = (event: ErrorEvent) => {
    if (isChunkLoadError(event.error) || isChunkLoadError(event.message)) {
      requestChunkRecovery(event.error ?? event.message);
    }
  };
  const handleRejection = (event: PromiseRejectionEvent) => {
    if (isChunkLoadError(event.reason)) requestChunkRecovery(event.reason);
  };

  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleRejection);

  return () => {
    window.removeEventListener('error', handleError);
    window.removeEventListener('unhandledrejection', handleRejection);
  };
}

export function recordPdfExportTelemetry(
  name: PdfExportTelemetryEventName,
  details: Omit<PdfExportTelemetryEvent, 'name' | 'timestamp' | 'version'> = {},
): PdfExportTelemetryEvent {
  const event: PdfExportTelemetryEvent = {
    name,
    timestamp: Date.now(),
    version: APP_VERSION,
    ...details,
  };

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rac:pdf-export-telemetry', {detail: event}));
    try {
      const previous = JSON.parse(localStorage.getItem(PDF_TELEMETRY_KEY) ?? '[]');
      const entries = Array.isArray(previous) ? previous : [];
      localStorage.setItem(PDF_TELEMETRY_KEY, JSON.stringify([...entries, event].slice(-PDF_TELEMETRY_LIMIT)));
    } catch {
      // Local telemetry is best-effort and must never affect PDF generation.
    }
  }

  if (import.meta.env.DEV) {
    console.debug('[RAC PDF telemetry]', event);
  }

  return event;
}
