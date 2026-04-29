import {houseManager} from '@/components/rac-editor/lib/house-manager.ts';
import type {
  EditorPilotiId,
} from '@/components/rac-editor/canvas/store/types.ts';
import type {
  EditorPilotiData,
  PilotiEditorPort,
  UpdateEditorPilotiPatch,
} from '@/components/rac-editor/store/PilotiEditorPort.ts';

function readPilotiData(pilotiId: EditorPilotiId): EditorPilotiData {
  const piloti = houseManager.getPilotiData(pilotiId);
  return {
    pilotiId,
    height: piloti.height,
    isMaster: piloti.isMaster,
    nivel: piloti.nivel,
  };
}

/**
 * Adapter transitório entre o editor de piloti e o `houseManager`.
 *
 * Enquanto o estado canônico ainda vive no manager, este adapter impede que o
 * hook de UI dependa diretamente desse singleton e prepara a substituição por
 * um use case/store serializável.
 */
export const houseManagerPilotiEditorPort: PilotiEditorPort = {
  getSelectedPilotiHeights: () => houseManager.getSelectedPilotiHeights(),

  getPilotiData: (pilotiId) => readPilotiData(pilotiId),

  updatePiloti: (pilotiId: EditorPilotiId, patch: UpdateEditorPilotiPatch) => {
    houseManager.updatePiloti(pilotiId, patch);
    return readPilotiData(pilotiId);
  },
};
