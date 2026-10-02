import type {HouseDrawingDocument, HouseDrawingElementDocument} from '@/shared/types/house-drawing-document.ts';
import type {House3DProjection, House3DElevationViewProjection} from '@/components/rac-editor/ports/House3DProjectionPort.ts';
import type {HouseViewType} from '@/shared/types/house.ts';

const ELEVATION_TYPES: HouseViewType[] = ['front', 'back', 'side1', 'side2'];

function groupFor(document: HouseDrawingDocument, instanceId: string) {
  return document.canvas.objects.find((object) =>
    object.kind === 'house' && object.metadata?.houseInstanceId === instanceId);
}

function childWithFlag(group: HouseDrawingElementDocument | undefined, flag: string) {
  return group?.children?.find((child) => child.metadata?.[flag] === true);
}

function number(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function width(element: HouseDrawingElementDocument | undefined): number | undefined {
  const geometry = element?.geometry;
  const base = number(geometry?.width);
  if (base === undefined) return undefined;
  return base * (number(geometry?.scaleX) ?? 1);
}

/** Deriva a mesma projeção da casa a partir do documento salvo, sem depender do canvas ativo. */
export function createHouse3DProjectionFromDocument(document: HouseDrawingDocument): House3DProjection {
  const topInstance = document.house.views.top[0];
  const topGroup = topInstance ? groupFor(document, topInstance.instanceId) : undefined;
  const elevationViews: House3DElevationViewProjection[] = ELEVATION_TYPES.flatMap((viewType) =>
    document.house.views[viewType].map((instance) => {
      const group = groupFor(document, instance.instanceId);
      const body = childWithFlag(group, 'isHouseBody');
      const door = childWithFlag(group, 'isHouseDoor');
      const stairs = childWithFlag(group, 'isAutoStairs');
      return {
        viewType,
        instanceId: instance.instanceId,
        houseView: typeof group?.metadata?.houseView === 'string' ? group.metadata.houseView : undefined,
        groupWidth: width(group) ?? 0,
        bodyLeft: number(body?.geometry?.left),
        bodyWidth: width(body),
        doorWidth: width(door),
        stairs: stairs ? {
          width: width(stairs) ?? 0,
          left: number(stairs.geometry?.left) ?? 0,
          heightMts: number(stairs.metadata?.stairsHeight) ?? 0,
          stepCount: number(stairs.metadata?.stairsStepCount) ?? 0,
        } : undefined,
      };
    }));

  return {
    houseType: document.house.houseType,
    pilotis: {...document.house.pilotis},
    sideMappings: document.house.sideMappings,
    hasHouseViews: Object.values(document.house.views).some((instances) => instances.length > 0),
    topView: topGroup ? {
      contraventamentos: (topGroup.children ?? [])
        .filter((child) => child.metadata?.isContraventamento === true)
        .map((child) => ({
          id: typeof child.metadata?.contraventamentoId === 'string' ? child.metadata.contraventamentoId : undefined,
          orientation: typeof child.metadata?.contraventamentoOrientation === 'string' ? child.metadata.contraventamentoOrientation : undefined,
          col: child.metadata?.contraventamentoCol,
          row: child.metadata?.contraventamentoRow,
          startRow: child.metadata?.contraventamentoStartRow,
          endRow: child.metadata?.contraventamentoEndRow,
          startCol: child.metadata?.contraventamentoStartCol,
          endCol: child.metadata?.contraventamentoEndCol,
          side: typeof child.metadata?.contraventamentoSide === 'string' ? child.metadata.contraventamentoSide : undefined,
          anchorPilotiId: typeof child.metadata?.contraventamentoAnchorPilotiId === 'string'
            ? child.metadata.contraventamentoAnchorPilotiId : undefined,
        })),
    } : null,
    elevationViews,
  };
}
