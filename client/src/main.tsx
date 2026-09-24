import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';
import { createRoot } from 'react-dom/client';
import { UNAUTHED_ERR_MSG } from '@shared/const';
import App from './App.tsx';
import { installManusPreviewSessionBridge } from '@/_core/preview-session-bridge.ts';
import { startLogin } from '@/const.ts';
import { racTrpcClient } from '@/lib/trpc-client.ts';
import { trpc } from '@/lib/trpc.ts';
import {installChunkRecovery} from '@/shared/lib/runtime-resilience.ts';
import {isIsolatedLocalMode} from '@/shared/local-runtime.ts';
import './index.css';

installChunkRecovery();
if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('chunkRecovery')) {
  const cleanUrl = new URL(window.location.href);
  cleanUrl.searchParams.delete('chunkRecovery');
  window.history.replaceState({}, document.title, cleanUrl.toString());
}
if (!isIsolatedLocalMode) installManusPreviewSessionBridge();

let loginRedirectScheduled = false;

function redirectToLoginIfUnauthorized(error: unknown): void {
  if (isIsolatedLocalMode) return;
  if (!(error instanceof TRPCClientError)) return;
  if (error.data?.code !== 'UNAUTHORIZED' && error.message !== UNAUTHED_ERR_MSG) return;
  if (typeof window === 'undefined' || loginRedirectScheduled) return;
  if (new URLSearchParams(window.location.search).has('oauthError')) return;

  loginRedirectScheduled = true;
  window.setTimeout(() => {
    if (!new URLSearchParams(window.location.search).has('oauthError')) startLogin();
  }, 0);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

queryClient.getQueryCache().subscribe((event) => {
  if (event.type === 'updated' && event.action.type === 'error') {
    redirectToLoginIfUnauthorized(event.query.state.error);
  }
});

queryClient.getMutationCache().subscribe((event) => {
  if (event.type === 'updated' && event.action.type === 'error') {
    redirectToLoginIfUnauthorized(event.mutation.state.error);
  }
});

createRoot(document.getElementById('root')!).render(
  <trpc.Provider client={racTrpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App/>
    </QueryClientProvider>
  </trpc.Provider>,
);
