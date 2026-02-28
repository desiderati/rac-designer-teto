import {Group} from 'fabric';
import {PILOTI_MASTER_STYLE, PILOTI_STYLE, PILOTI_VISUAL_FEEDBACK_COLORS} from '@/shared/config.ts';
import {
  CONTRAVENTAMENTO_FILL,
  CONTRAVENTAMENTO_SELECTED_FILL,
  CONTRAVENTAMENTO_SELECTED_STROKE, CONTRAVENTAMENTO_STROKE, CONTRAVENTAMENTO_STROKE_WIDTH
} from "@/components/lib/canvas/constants.ts";
import {getOrCreateContraventamentoId} from "@/components/lib/canvas/contraventamento.ts";

/**
 * Aplica o destaque visual de seleção aos contraventamentos da vista superior.
 *
 * Quando `contraventamentoId` é informado, somente o objeto com o ID correspondente
 * recebe o estilo de selecionado; os demais ficam com o estilo padrão.
 * Quando não é informado, todos ficam no estilo padrão.
 *
 * @param group Grupo Fabric que contém os objetos de contraventamento.
 * @param contraventamentoId ID opcional do contraventamento selecionado.
 */
export function highlightSelectedContraventamento(
  group: Group,
  contraventamentoId?: string,
): void {

  group.getObjects().forEach((obj: any) => {
    if (!obj.isContraventamento) return;

    const id = getOrCreateContraventamentoId(obj);
    const isSelected = !!contraventamentoId && id === contraventamentoId;
    obj.set({
      fill: isSelected ? CONTRAVENTAMENTO_SELECTED_FILL : CONTRAVENTAMENTO_FILL,
      stroke: isSelected ? CONTRAVENTAMENTO_SELECTED_STROKE : CONTRAVENTAMENTO_STROKE,
      strokeWidth: CONTRAVENTAMENTO_STROKE_WIDTH,
    });
    obj.dirty = true;
  });

  (group as any).dirty = true;
  group.canvas?.requestRenderAll();
}

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
  group: Group,
  getIsEligible: (pilotiId: string) => boolean,
  selectedCol?: number,
  skipPilotiId?: string,
): void {
  group.getObjects().forEach((obj: any) => {
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
        stroke: PILOTI_VISUAL_FEEDBACK_COLORS.emphasizedStrokeColor,
        strokeWidth: PILOTI_MASTER_STYLE.strokeWidthTopView,
        fill: PILOTI_MASTER_STYLE.fillColor,
        hoverCursor: 'pointer',
      });
    } else {
      // Dimmed - grey out, including master pilotis while not eligible.
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

/**
 * Remove o destaque de contraventamento dos pilotis na vista superior,
 * restaurando o estilo padrão de cada piloti conforme seu tipo.
 *
 * @param group Grupo Fabric da vista superior (`houseView = 'top'`).
 */
export function resetHighlightContraventamentoPilotis(group: Group): void {
  group.getObjects().forEach((obj: any) => {
    if (!obj.isPilotiCircle) return;

    if (obj.pilotiIsMaster) {
      obj.set({
        stroke: PILOTI_MASTER_STYLE.strokeColor,
        strokeWidth: PILOTI_MASTER_STYLE.strokeWidth,
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
