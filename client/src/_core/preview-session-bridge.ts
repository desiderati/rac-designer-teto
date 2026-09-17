import { COOKIE_NAME } from '@shared/const';

const PREVIEW_CHANNEL = 'SpacePreviewerChannel';
const PREVIEW_ENDPOINT = 'content';
const SET_COOKIE_MESSAGE = 'setCookie';

interface PreviewChannelPayload {
  type?: unknown;
  to?: unknown;
  cookie?: unknown;
  payload?: { cookie?: unknown };
}

interface PreviewChannelEvent {
  type?: unknown;
  payload?: PreviewChannelPayload;
}

export function extractManusSessionCookie(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const tokenPair = value.split(';').find((part) => part.trim().startsWith(`${COOKIE_NAME}=`));
  return tokenPair ? value : null;
}

/**
 * Solicita ao contêiner do preview a sessão Manus espelhada para o iframe.
 *
 * Em um navegador normal, o cookie HttpOnly da sessão segue no request.
 * Em previews incorporados que bloqueiam cookies de terceiros, o runtime Manus
 * fornece o mesmo valor por postMessage. Este bridge replica o protocolo do
 * runtime para garantir que o cliente tRPC possa enviá-lo como Bearer token.
 */
export function installManusPreviewSessionBridge(): void {
  if (typeof window === 'undefined' || window.parent === window) return;

  const persistCookie = (value: unknown) => {
    const cookie = extractManusSessionCookie(value);
    if (!cookie) return;

    try {
      sessionStorage.setItem('manus-cookie', cookie);
    } catch {
      // sessionStorage may be unavailable in restrictive browser modes.
    }
  };

  window.addEventListener('message', (event: MessageEvent<PreviewChannelEvent>) => {
    if (event.source !== window.parent) return;
    const message = event.data;
    if (message?.type !== PREVIEW_CHANNEL) return;
    if (message.payload?.type !== SET_COOKIE_MESSAGE || message.payload?.to !== PREVIEW_ENDPOINT) return;
    // O runtime encapsula o conteúdo da mensagem em `payload.payload`; o
    // fallback suporta a forma direta para manter compatibilidade de preview.
    persistCookie(message.payload.payload?.cookie ?? message.payload.cookie);
  });

  // The Manus runtime responds to this request when the preview is embedded.
  window.parent.postMessage({
    type: PREVIEW_CHANNEL,
    payload: {
      type: 'getMessage',
      to: 'container',
      from: PREVIEW_ENDPOINT,
      payload: { messageType: SET_COOKIE_MESSAGE },
    },
  }, '*');
}
