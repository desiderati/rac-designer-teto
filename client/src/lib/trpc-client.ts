import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import {getSessionHeaders} from '@/_core/session-headers.ts';
import { trpc } from '@/lib/trpc.ts';

/** Cliente único consumido pelo Provider React e pelos adapters de infraestrutura. */
export const racTrpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      transformer: superjson as never,
      headers: getSessionHeaders,
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
