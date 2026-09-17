import {describe, expect, it} from 'vitest';
import {
  collectHouseGroupCandidates,
  findTopViewGroupCandidate,
  isHouseGroupCandidate,
} from './house-group-candidates.ts';

describe('house-group-candidates.ts', () => {
  it('filtra grupos visuais de casa e localiza a vista superior', () => {
    const objects = [
      {type: 'group', myType: 'house', houseView: 'top'},
      {type: 'group', myType: 'house', houseView: 'front'},
      {type: 'rect', myType: 'wall'},
    ];

    expect(isHouseGroupCandidate(objects[0] as never)).toBe(true);
    expect(collectHouseGroupCandidates(objects as never)).toHaveLength(2);
    expect(findTopViewGroupCandidate(objects as never)?.houseView).toBe('top');
  });
});
