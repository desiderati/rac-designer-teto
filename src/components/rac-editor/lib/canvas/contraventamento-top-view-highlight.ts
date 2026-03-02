import {PILOTI_MASTER_STYLE, PILOTI_STYLE, PILOTI_VISUAL_FEEDBACK_COLORS} from '@/shared/config.ts';
import {CanvasGroup} from "@/components/rac-editor/lib/canvas/canvas.ts";

/**
 * Destaca visualmente os pilotis elegíveis para criação de contraventamento
 * na vista superior da casa.
 *
 * Objetos elegíveis recebem estilo de destaque (contorno amarelo e cursor
 * de ponteiro). Os demais ficam com estilo "apagado" (padrão) e cursor
 * padrão.
 *
 * @param group Grupo Fabric da vista superior (`houseView = 'top'`).
 * @param getIsEligible Callback que informa se um `pilotiId` pode ser selecionado.
 * @param selectedCol Coluna opcional para restringir os candidatos (0 a 3).
 * @param skipPilotiId ID opcional do piloti que deve ser ignorado no destaque.
 */
export function highlightEligibleContraventamentoPilotis(
  group: CanvasGroup,
  getIsEligible: (pilotiId: string) => boolean,
  selectedCol?: number,
  skipPilotiId?: string,
): void {
  group.getCanvasObjects().forEach((obj) => {
    if (!obj.isPilotiCircle) return;

    const id: string = obj.pilotiId ?? '';
    const match = id.match(/piloti_(\d+)_(\d+)/);
    if (!match) return;

    const col = parseInt(match[1], 10);
    const eligible = getIsEligible(id);
    const inColumn = selectedCol === undefined || col === selectedCol;
    const isSkipped = id === skipPilotiId;

    if (eligible && inColumn && !isSkipped) {
      // Available - yellow border highlight (same visual language as top-view selection).
      obj.set({
        stroke: PILOTI_VISUAL_FEEDBACK_COLORS.focusedStrokeColor,
        strokeWidth: PILOTI_STYLE.selectedStrokeWidthTopView,
        fill: PILOTI_STYLE.fillColor,
        hoverCursor: 'pointer',
      });
    } else {
      // Dimmed - grey out, including master pilotis while not eligible.
      obj.set({
        stroke: PILOTI_VISUAL_FEEDBACK_COLORS.dimmedStrokeColor,
        strokeWidth: PILOTI_STYLE.strokeWidthTopView,
        fill: PILOTI_VISUAL_FEEDBACK_COLORS.dimmedStrokeColor,
        hoverCursor: 'default',
      });
    }
    (obj as any).dirty = true;
  });

  (group as any).dirty = true;
  group.canvas?.requestRenderAll();
}

/**
 * Remove o destaque de contraventamento dos pilotis na vista superior,
 * restaurando o estilo padrão de cada piloti conforme seu tipo.
 *
 * @param group Grupo Fabric da vista superior (`houseView = 'top'`).
 */
export function resetHighlightContraventamentoPilotis(group: CanvasGroup): void {
  group.getCanvasObjects().forEach((obj) => {
    if (!obj.isPilotiCircle) return;

    if (obj.pilotiIsMaster) {
      obj.set({
        stroke: PILOTI_MASTER_STYLE.strokeColor,
        strokeWidth: PILOTI_MASTER_STYLE.strokeWidthTopView,
        fill: PILOTI_MASTER_STYLE.fillColor,
        hoverCursor: 'default',
      });
    } else {
      obj.set({
        stroke: PILOTI_STYLE.strokeColor,
        strokeWidth: PILOTI_STYLE.strokeWidthTopView,
        fill: PILOTI_STYLE.fillColor,
        hoverCursor: 'default',
      });
    }
    (obj as any).dirty = true;
  });

  (group as any).dirty = true;
  group.canvas?.requestRenderAll();
}
