import {createContext, useContext} from 'react';
import type {RemoteSyncStatus} from '@/contexts/RemoteSyncContext.tsx';
import type {HouseDocumentSaveStatus} from '@/components/rac-editor/ports/HouseDocumentSaveStatus.ts';

export interface PwaUpdateSafety {
  syncStatus: RemoteSyncStatus;
  documentSaveStatus: HouseDocumentSaveStatus;
  hasUnsavedFormChanges: boolean;
}

export const PwaUpdateSafetyContext = createContext<(safety: PwaUpdateSafety | null) => void>(() => undefined);

export function useReportPwaUpdateSafety(): (safety: PwaUpdateSafety | null) => void {
  return useContext(PwaUpdateSafetyContext);
}
