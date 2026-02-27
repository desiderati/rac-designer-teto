import {describe, expect, it} from 'vitest';
import {buildSceneOpeningsFromCanvasModel} from '@/components/lib/3d/openings-mapper.ts';

describe('buildSceneOpeningsFromCanvasModel', () => {
  it('maps tipo6 front/back faces according to selected front side', () => {
    const openings = buildSceneOpeningsFromCanvasModel('tipo6', 'bottom', null);
    const frontDoor = openings.find((o) => o.id === 'canvas-front-door');
    const backWindow = openings.find((o) => o.id === 'canvas-back-window');

    expect(frontDoor?.face).toBe('back');
    expect(backWindow?.face).toBe('front');
  });

  it('maps tipo3 open side from assignment with right-side fallback', () => {
    const openings = buildSceneOpeningsFromCanvasModel('tipo3', null, 'left');

    const door = openings.find((o) => o.type === 'door');
    expect(door?.face).toBe('left');

    const fallback = buildSceneOpeningsFromCanvasModel('tipo3');
    const fallbackDoor = fallback.find((o) => o.type === 'door');
    expect(fallbackDoor?.face).toBe('right');
  });
});
