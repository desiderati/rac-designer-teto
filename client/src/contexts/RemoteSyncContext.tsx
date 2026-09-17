import { createContext, type ReactNode, useContext } from 'react';
import type { ConstructionSiteState } from '@/shared/types/construction-site.ts';

export type RemoteSyncStatus = 'synced' | 'syncing' | 'pending' | 'conflict' | 'error';

export interface RemoteSyncConflict {
  constructionSiteId: string;
  localState: ConstructionSiteState;
  remoteState: ConstructionSiteState;
  remoteVersion: number;
}

export interface RemoteSyncController {
  status: RemoteSyncStatus;
  revision: number;
  lastSyncedAt: string | null;
  errorMessage: string | null;
  conflict: RemoteSyncConflict | null;
  dismissError(): void;
  useRemoteVersion(): Promise<void>;
  keepLocalVersion(): Promise<void>;
  retry(): Promise<void>;
}

const RemoteSyncContext = createContext<RemoteSyncController | null>(null);

export function RemoteSyncProvider({
  value,
  children,
}: {
  value: RemoteSyncController;
  children: ReactNode;
}) {
  return <RemoteSyncContext.Provider value={value}>{children}</RemoteSyncContext.Provider>;
}

export function useRemoteSync(): RemoteSyncController {
  const value = useContext(RemoteSyncContext);
  if (!value) throw new Error('useRemoteSync must be used within RemoteSyncProvider.');
  return value;
}
