import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { COOKIE_NAME } from '@shared/const';
import { trpc } from '@/lib/trpc.ts';

/** Cliente único consumido pelo Provider React e pelos adapters de infraestrutura. */
export const racTrpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      transformer: superjson as never,
      headers() {
        try {
          const raw = sessionStorage.getItem('manus-cookie');
          if (!raw) return {};
          const prefix = `${COOKIE_NAME}=`;
          const token = raw.split(';').find((entry) => entry.trim().startsWith(prefix))?.trim().slice(prefix.length);
          return token ? { Authorization: `Bearer ${token}` } : {};
        } catch {
          return {};
        }
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: 'include',
        });
      },
    }),
  ],
});

export type RacTrpcClient = typeof racTrpcClient;
