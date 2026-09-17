import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { racTrpcClient } from '@/lib/trpc-client.ts';
import { trpc } from '@/lib/trpc.ts';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <trpc.Provider client={racTrpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App/>
    </QueryClientProvider>
  </trpc.Provider>,
);
