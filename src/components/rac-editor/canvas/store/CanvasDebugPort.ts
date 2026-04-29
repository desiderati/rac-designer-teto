import type {CanvasObject} from '@/components/rac-editor/canvas/lib';

export interface CanvasObjectSummary {
  type: string | null;
  myType: string | null;
}

export interface ActiveCanvasObjectSummary extends CanvasObjectSummary {
  labelText: string | null;
  color: string | null;
}

/**
 * Porta de inspeção para o bridge DEV do editor.
 *
 * Mantém operações auxiliares de diagnóstico fora do contrato público normal
 * do editor e evita expor o runtime Fabric inteiro.
 */
export interface CanvasDebugPort {
  getCanvasScreenCenter(): { x: number; y: number } | null;
  removeObject(object: CanvasObject): boolean;
  selectObjectByMyType(myType: string, fromEnd?: boolean, triggerInlineEditor?: boolean): boolean;
  getActiveObjectSummary(): ActiveCanvasObjectSummary | null;
  getObjectsSummary(): CanvasObjectSummary[] | null;
}
