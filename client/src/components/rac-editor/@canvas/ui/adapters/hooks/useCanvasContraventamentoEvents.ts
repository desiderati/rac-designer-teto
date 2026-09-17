import {useCallback} from 'react';
import {Canvas as FabricCanvas, util as fabricUtil} from 'fabric';
import {CanvasObject, CanvasPointerPayload, isCanvasGroup, toCanvasGroup} from '@/components/rac-editor/@canvas/lib';
import {INTERACTION_THRESHOLDS, TIMINGS, VIEWPORT} from '@/shared/config.ts';

interface useCanvasContraventamentoEventsArgs {
  canvas: FabricCanvas;
  getEventPayload: (event: unknown) => CanvasPointerPayload;
  handlePilotiSelection: (subTarget: CanvasObject, target: CanvasObject) => void;
  isContraventamentoMode: () => boolean;
  isPilotiEligibleForContraventamento: (pilotiId: string) => boolean;
  onContraventamentoCancel: () => void;
  onSelectionChange: (message: string) => void;
  isAnyEditorOpen: () => boolean;
}

export function useCanvasContraventamentoEvents() {

  const bindContraventamentoEvents = useCallback(({
    canvas,
    getEventPayload,
    handlePilotiSelection,
    isContraventamentoMode,
    isPilotiEligibleForContraventamento,
    onContraventamentoCancel,
    isAnyEditorOpen,
  }: useCanvasContraventamentoEventsArgs) => {

    const setCanvasCursor = (cursor: string) => {
      if (!canvas.upperCanvasEl) return;
      if (canvas.upperCanvasEl.style.cursor !== cursor) {
        canvas.upperCanvasEl.style.cursor = cursor;
      }
    };

    const handleContraventamentoPilotiClick = (event: unknown) => {
      if (!isContraventamentoMode()) return;

      const cancelIfSelectingDestination = () => {
        if (isContraventamentoMode()) {
          onContraventamentoCancel();
        }
      };

      const payload = getEventPayload(event);
      const target = payload.target ?? null;
      if (!isCanvasGroup(target)) {
        cancelIfSelectingDestination();
        return;
      }

      const group = toCanvasGroup(target);
      if (group?.houseView !== 'top') {
        cancelIfSelectingDestination();
        return;
      }

      const subTargets = payload.subTargets ?? [];
      const directPilotiTarget =
        subTargets.find(
          (subTarget) =>
            subTarget?.isPilotiCircle || subTarget?.isPilotiHitArea
        );

      if (directPilotiTarget) {
        handlePilotiSelection(directPilotiTarget, target);
        return;
      }

      if (!payload.e) {
        cancelIfSelectingDestination();
        return;
      }

      const pointer = canvas.getPointer(payload.e);
      const groupMatrix = group.calcTransformMatrix();
      const invertedMatrix = fabricUtil.invertTransform(groupMatrix);
      const localPoint = fabricUtil.transformPoint(
        {x: pointer.x, y: pointer.y},
        invertedMatrix
      );

      const objects = group.getCanvasObjects();
      for (let i = objects.length - 1; i >= 0; i--) {
        const object = objects[i];
        if (!object || !(object.isPilotiCircle || object.isPilotiHitArea)) continue;

        const objectLeft = object.left || 0;
        const objectTop = object.top || 0;
        const radius = object.radius || ((object.width ?? 0) / 2) || 10;
        const distance = Math.sqrt(
          Math.pow(localPoint.x - objectLeft, 2) + Math.pow(localPoint.y - objectTop, 2),
        );

        if (distance <= radius) {
          handlePilotiSelection(object, target);
          return;
        }
      }

      cancelIfSelectingDestination();
    };

    const handleContraventamentoCursor = (event: unknown) => {
      if (!isContraventamentoMode()) {
        setCanvasCursor('default');
        return;
      }

      const payload = getEventPayload(event);
      const target = payload.target ?? null;
      const subTargets = payload.subTargets ?? [];
      if (toCanvasGroup(target)?.houseView !== 'top') {
        setCanvasCursor('default');
        return;
      }

      const pilotiTarget = subTargets.find((subTarget) =>
        (subTarget?.isPilotiCircle || subTarget?.isPilotiHitArea) && typeof subTarget?.pilotiId === 'string'
      );
      if (!pilotiTarget) {
        setCanvasCursor('default');
        return;
      }

      const pilotiId = String(pilotiTarget.pilotiId ?? '');
      const eligible = !!pilotiId && isPilotiEligibleForContraventamento(pilotiId);
      setCanvasCursor(eligible ? 'pointer' : 'default');
    };

    let mobilePilotiLongPressTimeout: number | null = null;
    let mobilePilotiLongPressStartPoint: { x: number; y: number } | null = null;

    const clearMobilePilotiLongPress = () => {
      if (mobilePilotiLongPressTimeout !== null) {
        window.clearTimeout(mobilePilotiLongPressTimeout);
      }
      mobilePilotiLongPressTimeout = null;
      mobilePilotiLongPressStartPoint = null;
    };

    const handleMobilePilotiLongPressStart = (event: unknown) => {
      const isMobileDevice = window.matchMedia(VIEWPORT.mobileMaxWidthQuery).matches;
      if (!isMobileDevice || isAnyEditorOpen() || isContraventamentoMode()) return;

      const payload = getEventPayload(event);
      const target = payload.target ?? null;
      const subTargets = payload.subTargets ?? [];
      const pilotiTarget = subTargets.find((subTarget) =>
        subTarget?.myType === 'piloti'
        || subTarget?.myType === 'pilotiHitArea'
        || subTarget?.isPilotiCircle
        || subTarget?.isPilotiHitArea
      );
      if (!pilotiTarget || !target || !payload.e) return;

      clearMobilePilotiLongPress();
      mobilePilotiLongPressStartPoint = canvas.getPointer(payload.e);
      mobilePilotiLongPressTimeout = window.setTimeout(() => {
        clearMobilePilotiLongPress();
        handlePilotiSelection(pilotiTarget, target);
      }, TIMINGS.mobileLongPressDelayMs);
    };

    const handleMobilePilotiLongPressMove = (event: unknown) => {
      if (mobilePilotiLongPressTimeout === null || !mobilePilotiLongPressStartPoint) return;

      const payload = getEventPayload(event);
      if (!payload.e) return;

      const pointer = canvas.getPointer(payload.e);
      const movement = Math.hypot(
        pointer.x - mobilePilotiLongPressStartPoint.x,
        pointer.y - mobilePilotiLongPressStartPoint.y,
      );
      if (movement > INTERACTION_THRESHOLDS.mobilePanActivation) clearMobilePilotiLongPress();
    };

    const handleMouseOut = () => {
      setCanvasCursor('default');
      clearMobilePilotiLongPress();
    };

    canvas.on('mouse:down', handleContraventamentoPilotiClick);
    canvas.on('mouse:move', handleContraventamentoCursor);
    canvas.on('mouse:down', handleMobilePilotiLongPressStart);
    canvas.on('mouse:move', handleMobilePilotiLongPressMove);
    canvas.on('mouse:up', clearMobilePilotiLongPress);
    canvas.on('mouse:out', handleMouseOut);

    return () => {
      clearMobilePilotiLongPress();
      canvas.off('mouse:down', handleContraventamentoPilotiClick);
      canvas.off('mouse:move', handleContraventamentoCursor);
      canvas.off('mouse:down', handleMobilePilotiLongPressStart);
      canvas.off('mouse:move', handleMobilePilotiLongPressMove);
      canvas.off('mouse:up', clearMobilePilotiLongPress);
      canvas.off('mouse:out', handleMouseOut);
    };
  }, []);

  return {bindContraventamentoEvents};
}

