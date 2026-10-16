import type {PersistedHouseRecord} from '@/shared/types/construction-site.ts';
import {isHouseDefinitionReady} from '@/components/construction-site/lib/house-definition.ts';
export function withPreparedHouseRacView(house: PersistedHouseRecord): PersistedHouseRecord {
  if (!isHouseDefinitionReady(house) || house.drawingDocument.house.views.top.length) return house;
  return {...house, drawingDocument: {...house.drawingDocument,
    house: {...house.drawingDocument.house, views: {...house.drawingDocument.house.views, top: [{instanceId: 'prepared-rac-top'}]}}}};
}
