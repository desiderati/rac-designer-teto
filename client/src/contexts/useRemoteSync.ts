import {createContext, useContext} from 'react';
import type {ConstructionSiteState} from '@/shared/types/construction-site.ts';
import type {RemoteOnlyEntity} from '@/domain/construction-site/construction-site-conflict-merge.ts';

export type RemoteSyncStatus = 'synced' | 'syncing' | 'pending' | 'conflict' | 'error';

export interface RemoteSyncConflict {
  operation?: 'save' | 'remove';
  constructionSiteId: string;
  baseState: ConstructionSiteState | null;
  localState: ConstructionSiteState;
  remoteState: ConstructionSiteState;
  remoteVersion: number;
  remoteSavedAt?: string;
  conflicts: string[];
  remoteOnlyEntities: RemoteOnlyEntity[];
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

export const RemoteSyncContext = createContext<RemoteSyncController | null>(null);

export function useRemoteSync(): RemoteSyncController {
  const value = useContext(RemoteSyncContext);
  if (!value) throw new Error('useRemoteSync must be used within RemoteSyncProvider.');
  return value;
}
