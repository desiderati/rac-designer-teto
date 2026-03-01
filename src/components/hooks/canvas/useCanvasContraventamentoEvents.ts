import {useCallback} from 'react';
import {Canvas as FabricCanvas, FabricObject, Group, util as fabricUtil,} from 'fabric';
import {CanvasObject, CanvasPointerPayload, toCanvasObject} from '@/components/lib/canvas';
import {TIMINGS, VIEWPORT} from '@/shared/config.ts';

interface useContraventamentoEventsArgs {
  canvas: FabricCanvas;
  getEventPayload: (event: unknown) => CanvasPointerPayload;
  handlePilotiSelection: (subTarget: FabricObject, target: FabricObject) => void;
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
  }: useContraventamentoEventsArgs) => {

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
      if (!target || target.type !== 'group') {
        cancelIfSelectingDestination();
        return;
      }

      const group = target as Group;
      if (toCanvasObject(group)?.houseView !== 'top') {
        cancelIfSelectingDestination();
        return;
      }

      const subTargets = (payload.subTargets as CanvasObject[] | undefined) ?? [];
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

      const objects = group.getObjects();
      for (let i = objects.length - 1; i >= 0; i--) {
        const object = toCanvasObject(objects[i]);
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
      const subTargets = (payload.subTargets as CanvasObject[] | undefined) ?? [];
      if (!target || target.type !== 'group' || toCanvasObject(target)?.houseView !== 'top') {
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

    const handleMobilePilotiTap = (event: unknown) => {
      const isMobileDevice = window.matchMedia(VIEWPORT.mobileMaxWidthQuery).matches;
      if (!isMobileDevice || isAnyEditorOpen()) return;

      const payload = getEventPayload(event);
      const target = payload.target ?? null;
      const subTargets = (payload.subTargets as CanvasObject[] | undefined) ?? [];
      const pilotiTarget = subTargets.find((subTarget) =>
        subTarget.myType === 'piloti' || subTarget.myType === 'pilotiHitArea'
      );

      if (pilotiTarget && target) {
        setTimeout(() => {
          handlePilotiSelection(pilotiTarget, target);
        }, TIMINGS.mobilePilotiTapDelayMs);
      }
    };

    const handleMouseOut = () => setCanvasCursor('default');

    canvas.on('mouse:down', handleContraventamentoPilotiClick);
    canvas.on('mouse:move', handleContraventamentoCursor);
    canvas.on('mouse:out', handleMouseOut);
    canvas.on('mouse:down', handleMobilePilotiTap);

    return () => {
      canvas.off('mouse:down', handleContraventamentoPilotiClick);
      canvas.off('mouse:move', handleContraventamentoCursor);
      canvas.off('mouse:out', handleMouseOut);
      canvas.off('mouse:down', handleMobilePilotiTap);
    };
  }, []);

  return {bindContraventamentoEvents};
}

