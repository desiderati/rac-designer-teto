import {describe, expect, it} from 'vitest';
import {
  resolveHouseElevationAxisContext,
  resolveHouseElevationCornerPilotiIds,
} from '@/domain/house/use-cases/house-view-orientation.use-case.ts';

describe('house-view-orientation.use-case.ts', () => {
  it('preserva orientação de vistas frontais e traseiras legadas', () => {
    expect(resolveHouseElevationAxisContext({
      houseView: 'front',
      isFlippedHorizontally: false,
    })).toEqual({side: 'bottom', reverseAxis: false});
    expect(resolveHouseElevationCornerPilotiIds({
      houseView: 'front',
      isFlippedHorizontally: false,
    })).toEqual({leftId: 'piloti_0_2', rightId: 'piloti_3_2'});

    expect(resolveHouseElevationAxisContext({
      houseView: 'back',
      isFlippedHorizontally: true,
    })).toEqual({side: 'top', reverseAxis: true});
    expect(resolveHouseElevationCornerPilotiIds({
      houseView: 'back',
      isFlippedHorizontally: true,
    })).toEqual({leftId: 'piloti_3_0', rightId: 'piloti_0_0'});
  });

  it('preserva orientação de vistas laterais legadas', () => {
    expect(resolveHouseElevationAxisContext({
      houseView: 'side',
      isRightSide: false,
    })).toEqual({side: 'left', reverseAxis: false});
    expect(resolveHouseElevationCornerPilotiIds({
      houseView: 'side',
      isRightSide: false,
    })).toEqual({leftId: 'piloti_0_0', rightId: 'piloti_0_2'});

    expect(resolveHouseElevationAxisContext({
      houseView: 'side',
      isRightSide: true,
    })).toEqual({side: 'right', reverseAxis: true});
    expect(resolveHouseElevationCornerPilotiIds({
      houseView: 'side',
      isRightSide: true,
    })).toEqual({leftId: 'piloti_3_2', rightId: 'piloti_3_0'});
  });

  it('usa houseSide como fonte quando não há metadados legados', () => {
    expect(resolveHouseElevationAxisContext({houseSide: 'top'})).toEqual({
      side: 'top',
      reverseAxis: true,
    });
    expect(resolveHouseElevationCornerPilotiIds({houseSide: 'right'})).toEqual({
      leftId: 'piloti_3_2',
      rightId: 'piloti_3_0',
    });
  });
});
