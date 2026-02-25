import {useCallback} from 'react';
import {
  Canvas as FabricCanvas,
  FabricObject,
  Group,
  util as fabricUtil,
} from 'fabric';
import {CanvasObject} from "@/components/lib/canvas/canvas.ts";

type ContraventamentoRuntimeObject = FabricObject & {
  houseView?: string;
  isContraventamento?: boolean;
  contraventamentoId?: string;
  isPilotiCircle?: boolean;
  isPilotiHitArea?: boolean;
  pilotiId?: string;
  myType?: string;
  left?: number;
  top?: number;
  radius?: number;
  width?: number;
};

type CanvasMouseEvent = MouseEvent | PointerEvent | TouchEvent;

interface CanvasPointerPayload {
  target?: FabricObject | null;
  subTargets?: FabricObject[];
  e?: CanvasMouseEvent;
}

interface BindContraventamentoEventsArgs {
  canvas: FabricCanvas;
  getEventPayload: (event: unknown) => CanvasPointerPayload;
  handlePilotiSelection: (subTarget: FabricObject, target: FabricObject) => void;
  isContraventamentoMode: () => boolean;
  isSelectingContraventamentoDestination: () => boolean;
  isPilotiEligibleForContraventamento: (pilotiId: string) => boolean;
  onContraventamentoSelect: (selection: { group: Group; contraventamentoId: string } | null) => void;
  onContraventamentoCancel: () => void;
  onSelectionChange: (message: string) => void;
  isAnyEditorOpen: () => boolean;
}

function toRuntimeObject(object: FabricObject): CanvasObject {
  return object as CanvasObject;
}

export function useCanvasContraventamentoEvents() {
  const bindContraventamentoEvents = useCallback(({
    canvas,
    getEventPayload,
    handlePilotiSelection,
    isContraventamentoMode,
    isSelectingContraventamentoDestination,
    isPilotiEligibleForContraventamento,
    onContraventamentoSelect,
    onContraventamentoCancel,
    onSelectionChange,
    isAnyEditorOpen,
  }: BindContraventamentoEventsArgs) => {
    const setCanvasCursor = (cursor: string) => {
      if (!canvas.upperCanvasEl) return;
      if (canvas.upperCanvasEl.style.cursor !== cursor) {
        canvas.upperCanvasEl.style.cursor = cursor;
      }
    };

    const handleContraventamentoSelection = (event: unknown) => {
      if (isContraventamentoMode()) return;

      const payload = getEventPayload(event);
      const target = payload.target ?? null;
      const subTargets = (payload.subTargets as ContraventamentoRuntimeObject[] | undefined) ?? [];

      if (!target || target.type !== 'group') {
        onContraventamentoSelect(null);
        return;
      }

      const group = target as Group;
      if (toRuntimeObject(group)?.houseView !== 'top') {
        onContraventamentoSelect(null);
        return;
      }

      const contraventamentoObject = subTargets.find((subTarget) => subTarget?.isContraventamento === true);
      if (contraventamentoObject) {
        const contraventamentoId = String(contraventamentoObject.contraventamentoId ?? '');
        if (contraventamentoId) {
          onContraventamentoSelect({group, contraventamentoId});
          onSelectionChange('Contraventamento selecionado. Use Excluir para remover.');
          return;
        }
      }

      onContraventamentoSelect(null);
    };

    const handleContraventamentoPilotiClick = (event: unknown) => {
      if (!isContraventamentoMode()) return;

      const cancelIfSelectingDestination = () => {
        if (isSelectingContraventamentoDestination()) {
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
      if (toRuntimeObject(group)?.houseView !== 'top') {
        cancelIfSelectingDestination();
        return;
      }

      const subTargets = (payload.subTargets as ContraventamentoRuntimeObject[] | undefined) ?? [];
      const directPilotiTarget = subTargets.find((subTarget) => subTarget?.isPilotiCircle || subTarget?.isPilotiHitArea);
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
        const object = toRuntimeObject(objects[i]);
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
      const subTargets = (payload.subTargets as ContraventamentoRuntimeObject[] | undefined) ?? [];
      if (!target || target.type !== 'group' || toRuntimeObject(target)?.houseView !== 'top') {
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
      const isMobileDevice = window.matchMedia('(max-width: 767px)').matches;
      if (!isMobileDevice || isAnyEditorOpen()) return;

      const payload = getEventPayload(event);
      const target = payload.target ?? null;
      const subTargets = (payload.subTargets as ContraventamentoRuntimeObject[] | undefined) ?? [];
      const pilotiTarget = subTargets.find((subTarget) =>
        subTarget.myType === 'piloti' || subTarget.myType === 'pilotiHitArea'
      );

      if (pilotiTarget && target) {
        setTimeout(() => {
          handlePilotiSelection(pilotiTarget, target);
        }, 50);
      }
    };

    const handleMouseOut = () => setCanvasCursor('default');

    canvas.on('mouse:down', handleContraventamentoSelection);
    canvas.on('mouse:down', handleContraventamentoPilotiClick);
    canvas.on('mouse:move', handleContraventamentoCursor);
    canvas.on('mouse:out', handleMouseOut);
    canvas.on('mouse:down', handleMobilePilotiTap);

    return () => {
      canvas.off('mouse:down', handleContraventamentoSelection);
      canvas.off('mouse:down', handleContraventamentoPilotiClick);
      canvas.off('mouse:move', handleContraventamentoCursor);
      canvas.off('mouse:out', handleMouseOut);
      canvas.off('mouse:down', handleMobilePilotiTap);
    };
  }, []);

  return {bindContraventamentoEvents};
}

