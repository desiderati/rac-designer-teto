import {RemoteSyncContext, type RemoteSyncController} from './useRemoteSync.ts';
export type {RemoteSyncStatus, RemoteSyncConflict, RemoteSyncController} from './useRemoteSync.ts';
import type {ReactNode} from 'react';

export function RemoteSyncProvider({
  value,
  children,
}: {
  value: RemoteSyncController;
  children: ReactNode;
}) {
  return <RemoteSyncContext.Provider value={value}>{children}</RemoteSyncContext.Provider>;
}
