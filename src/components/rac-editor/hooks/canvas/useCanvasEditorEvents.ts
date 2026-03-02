import {useCallback} from 'react';
import {Canvas as FabricCanvas, util as fabricUtil} from 'fabric';
import {readLinearObjectState} from '@/components/rac-editor/ui/modals/editors/generic/helpers/linear-object-state.ts';
import {
  CanvasGroup,
  CanvasObject,
  CanvasPointerPayload,
  isCanvasGroup,
  toCanvasGroup,
} from '@/components/rac-editor/lib/canvas/canvas.ts';
import {
  LinearCanvasSelection,
  LinearCanvasSelectionType,
  TerrainCanvasSelection,
  WallCanvasSelection
} from '@/components/rac-editor/ui/canvas/Canvas.tsx';
import {readWallObjectState} from '@/components/rac-editor/ui/modals/editors/generic/helpers/wall-object-state.ts';
import {TIMINGS, VIEWPORT} from '@/shared/config.ts';
import {houseManager} from '@/components/rac-editor/lib/house-manager.ts';

interface UseCanvasEditorEventsArgs {
  canvas: FabricCanvas;
  isAnyEditorOpen: () => boolean;
  getEventPayload: (event: unknown) => CanvasPointerPayload;
  getCurrentScreenPoint: (canvasPoint: { x: number; y: number }) => { x: number; y: number } | null;
  handlePilotiSelection: (subTarget: CanvasObject, target: CanvasObject) => void;
  onWallSelect: (selection: WallCanvasSelection) => void;
  onLinearSelect: (selection: LinearCanvasSelection) => void;
  onTerrainSelect: (selection: TerrainCanvasSelection) => void;
  onSelectionChange: (message: string) => void;
}

export function useCanvasEditorEvents() {

  const bindInlineEditorEvents = useCallback(({
    canvas,
    isAnyEditorOpen,
    getEventPayload,
    getCurrentScreenPoint,
    handlePilotiSelection,
    onWallSelect,
    onLinearSelect,
    onTerrainSelect,
    onSelectionChange,
  }: UseCanvasEditorEventsArgs) => {

    const handleWallSelection = (
      wallObject: CanvasGroup,
    ) => {
      if (!wallObject) return;

      const {currentLabel} = readWallObjectState(wallObject);
      const center = wallObject.getCenterPoint();
      const screenPoint = getCurrentScreenPoint({x: center.x, y: center.y});
      if (!screenPoint) return;

      onWallSelect({
        object: wallObject,
        currentLabel: currentLabel,
        screenPosition: screenPoint,
      });
      onSelectionChange('Editando nome do objeto.');
    };

    const handleLinearSelection = (
      linearObject: CanvasGroup,
      myType: LinearCanvasSelectionType
    ) => {
      if (!linearObject) return;

      const {currentColor, currentLabel} = readLinearObjectState(linearObject);
      const center = linearObject.getCenterPoint();
      const screenPoint = getCurrentScreenPoint({x: center.x, y: center.y});
      if (!screenPoint) return;

      onLinearSelect({
        object: linearObject,
        myType,
        currentColor,
        currentLabel,
        screenPosition: screenPoint,
      });
    };

    const isPointInsideRect = (
      point: { x: number; y: number },
      runtime: CanvasObject,
    ): boolean => {

      const left = Number(runtime?.left ?? 0);
      const top = Number(runtime?.top ?? 0);
      const width = Number(runtime?.width ?? 0) * Number(runtime?.scaleX ?? 1);
      const height = Number(runtime?.height ?? 0) * Number(runtime?.scaleY ?? 1);
      if (width <= 0 || height <= 0) return false;

      return point.x >= left && point.x <= left + width && point.y >= top && point.y <= top + height;
    };

    const isPointInsideCircle = (
      point: { x: number; y: number },
      runtime: CanvasObject,
    ): boolean => {

      const cx = Number(runtime?.left ?? 0);
      const cy = Number(runtime?.top ?? 0);
      const radius =
        Number(runtime?.radius ?? 0)
        || (Number(runtime?.width ?? 0) * Number(runtime?.scaleX ?? 1)) / 2;
      if (radius <= 0) return false;

      const dx = point.x - cx;
      const dy = point.y - cy;
      return (dx * dx + dy * dy) <= radius * radius;
    };

    const handleTerrainSelection = (event: unknown): boolean => {
      const payload = getEventPayload(event);
      if (!payload.e) return false;

      const subTargets =
        Array.isArray(payload.subTargets) ? payload.subTargets : [];

      const terrainSubTarget =
        subTargets.find(object => object?.isTerrainEditTarget);

      if (isCanvasGroup(terrainSubTarget?.group)) {
        const pointer = canvas.getPointer(payload.e);
        const screenPoint = getCurrentScreenPoint({x: pointer.x, y: pointer.y});
        if (!screenPoint) return false;

        onTerrainSelect({
          group: toCanvasGroup(terrainSubTarget.group),
          terrainType: houseManager.getTerrainType(),
          screenPosition: screenPoint,
        });
        onSelectionChange('Editando tipo de terreno.');
        return true;
      }

      const pointer = canvas.getPointer(payload.e);
      const preferredGroup = toCanvasGroup(payload.target);

      const groupCandidates = canvas.getObjects()
        .filter((object): object is CanvasGroup => isCanvasGroup(object))
        .filter((group) => {
          return group?.myType === 'house' && group?.houseView !== 'top';
        })
        .sort((a, b) => (a === preferredGroup ? -1 : b === preferredGroup ? 1 : 0));

      let selectedGroup: CanvasGroup | null = null;
      for (const group of groupCandidates) {
        const groupMatrix = group.calcTransformMatrix();
        const invertedMatrix = fabricUtil.invertTransform(groupMatrix);
        const localPoint = fabricUtil.transformPoint(
          {x: pointer.x, y: pointer.y},
          invertedMatrix,
        );

        const pilotiTarget = group.getCanvasObjects()
          .find((runtime) => {
            if (!runtime) return false;

            if (runtime.isPilotiRect === true) return isPointInsideRect(localPoint, runtime);

            if (runtime.isPilotiCircle === true || runtime.isPilotiHitArea === true) {
              return isPointInsideCircle(localPoint, runtime);
            }
            return false;
          });
        if (pilotiTarget) return false;

        const terrainTarget = group.getCanvasObjects()
          .find((object) =>
            object?.isTerrainEditTarget && isPointInsideRect(localPoint, object)
          );

        if (terrainTarget) {
          selectedGroup = group;
          break;
        }
      }
      if (!selectedGroup) return false;

      const screenPoint = getCurrentScreenPoint({x: pointer.x, y: pointer.y});
      if (!screenPoint) return false;

      onTerrainSelect({
        group: selectedGroup,
        terrainType: houseManager.getTerrainType(),
        screenPosition: screenPoint,
      });
      onSelectionChange('Editando tipo de terreno.');
      return true;
    };

    const handleDesktopDoubleClick = (event: unknown) => {
      const isMobileDevice = window.matchMedia(VIEWPORT.mobileMaxWidthQuery).matches;
      const payload = getEventPayload(event);
      const targetRuntime = toCanvasGroup(payload.target) ?? null;
      if (isMobileDevice || !targetRuntime) return;
      if (isAnyEditorOpen()) return;

      if (targetRuntime?.myType === 'wall') {
        handleWallSelection(targetRuntime);
        return;
      }

      if (targetRuntime?.myType === 'line') {
        handleLinearSelection(targetRuntime, 'line');
        return;
      }

      if (targetRuntime?.myType === 'arrow') {
        handleLinearSelection(targetRuntime, 'arrow');
        return;
      }

      if (targetRuntime?.myType === 'distance') {
        handleLinearSelection(targetRuntime, 'distance');
        return;
      }

      if (!payload.e) return;
      const pointer = canvas.getPointer(payload.e);
      const groupMatrix = targetRuntime.calcTransformMatrix();
      const invertedMatrix = fabricUtil.invertTransform(groupMatrix);
      const localPoint = fabricUtil.transformPoint(
        {x: pointer.x, y: pointer.y},
        invertedMatrix
      );

      const objects = targetRuntime.getCanvasObjects();
      for (let i = objects.length - 1; i >= 0; i--) {
        const object = objects[i];
        if (!object) continue;
        if (object.myType !== 'piloti' && object.myType !== 'pilotiHitArea') continue;

        if (object.isPilotiCircle || object.isPilotiHitArea) {
          const objectLeft = object.left || 0;
          const objectTop = object.top || 0;
          const radius = object.radius || ((object.width ?? 0) / 2) || 10;
          const distance = Math.sqrt(
            Math.pow(localPoint.x - objectLeft, 2) + Math.pow(localPoint.y - objectTop, 2)
          );
          if (distance <= radius) {
            handlePilotiSelection(object, targetRuntime);
            return;
          }
        }

        if (object.isPilotiRect) {
          const left = object.left || 0;
          const top = object.top || 0;
          const width = (object.width || 0) * (object.scaleX || 1);
          const height = (object.height || 0) * (object.scaleY || 1);
          const withinX = localPoint.x >= left && localPoint.x <= left + width;
          const withinY = localPoint.y >= top && localPoint.y <= top + height;
          if (withinX && withinY) {
            handlePilotiSelection(object, targetRuntime);
            return;
          }
        }
      }
    };

    const handleMobileTap = (event: unknown) => {
      const isMobileDevice = window.matchMedia(VIEWPORT.mobileMaxWidthQuery).matches;
      const payload = getEventPayload(event);
      const runtimeTarget = toCanvasGroup(payload.target) ?? null;
      if (!isMobileDevice || !runtimeTarget) return;
      if (isAnyEditorOpen()) return;

      if (runtimeTarget.myType === 'wall') {
        setTimeout(() => {
          if (canvas.getActiveObject() === runtimeTarget) {
            handleWallSelection(runtimeTarget);
          }
        }, TIMINGS.mobileTapToEditDelayMs);
        return;
      }

      if (runtimeTarget.myType === 'line') {
        setTimeout(() => {
          if (canvas.getActiveObject() === runtimeTarget) {
            handleLinearSelection(runtimeTarget, 'line');
          }
        }, TIMINGS.mobileTapToEditDelayMs);
        return;
      }

      if (runtimeTarget.myType === 'arrow') {
        setTimeout(() => {
          if (canvas.getActiveObject() === runtimeTarget) {
            handleLinearSelection(runtimeTarget, 'arrow');
          }
        }, TIMINGS.mobileTapToEditDelayMs);
        return;
      }

      if (runtimeTarget.myType === 'distance') {
        setTimeout(() => {
          if (canvas.getActiveObject() === runtimeTarget) {
            handleLinearSelection(runtimeTarget, 'distance');
          }
        }, TIMINGS.mobileTapToEditDelayMs);
        return;
      }
    };

    const handleTerrainDoubleClick = (event: unknown) => {
      if (isAnyEditorOpen()) return;
      handleTerrainSelection(event);
    };

    canvas.on('mouse:dblclick', handleDesktopDoubleClick);
    canvas.on('mouse:down', handleMobileTap);
    canvas.on('mouse:dblclick', handleTerrainDoubleClick);

    return () => {
      canvas.off('mouse:dblclick', handleDesktopDoubleClick);
      canvas.off('mouse:down', handleMobileTap);
      canvas.off('mouse:dblclick', handleTerrainDoubleClick);
    };
  }, []);

  return {bindInlineEditorEvents};
}
