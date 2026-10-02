import {Canvas as FabricCanvas, Circle, Group as FabricGroup, Line, Path, Text} from 'fabric';
import {CANVAS_ELEMENT_STYLE, CANVAS_STYLE} from '@/shared/config.ts';
import {ElementStrategy} from './element.strategy.ts';
import {setCanvasGroupMyType, setCanvasObjectMyType} from './shared.ts';
import {CanvasGroup} from '@/components/rac-editor/@canvas/lib/canvas.ts';

export const treeStrategy: ElementStrategy = {
  create(canvas: FabricCanvas): CanvasGroup {
    const top = new Path(
      'M -43 -9 Q -52 -23 -36 -31 Q -38 -48 -18 -44 Q -8 -55 8 -44 Q 24 -52 34 -35 Q 51 -34 44 -15 Q 55 0 42 13 Q 47 34 27 39 Q 11 49 -3 39 Q -23 48 -32 33 Q -52 27 -42 9 Q -56 -1 -43 -9 Z',
      {
        fill: '#578518',
        strokeWidth: 0,
        originX: 'center', originY: 'center', top: -8,
      },
    );
    const topObject = setCanvasObjectMyType(top, 'treeBody');

    // Grupos de folhas sobre os ramos, com recortes entre eles e borda irregular.
    const foliage = [
      [-34, -27, 13], [-18, -37, 16], [2, -40, 18], [25, -32, 15],
      [39, -14, 14], [35, 12, 16], [17, 25, 17], [-8, 27, 18],
      [-31, 20, 15], [-41, -2, 13], [2, -12, 12],
    ].flatMap(([left, top, radius], index) => {
      const palette = ['#619c13', '#7daf24', '#8cba34', '#55930e'];
      const leaves = Array.from({length: 7}, (_, leaf) => {
        const angle = leaf * Math.PI * 2 / 7 + index * 0.6;
        const distance = radius * (leaf % 2 ? 0.68 : 0.8);
        return setCanvasObjectMyType(new Circle({
          left: left + Math.cos(angle) * distance,
          top: top - 8 + Math.sin(angle) * distance,
          radius: radius * (0.35 + (leaf % 3) * 0.055),
          fill: palette[(index + leaf) % palette.length], strokeWidth: 0,
          originX: 'center', originY: 'center', selectable: false, evented: false,
        }), 'treeFoliage');
      });
      leaves.push(setCanvasObjectMyType(new Circle({
        left, top: top - 8, radius: radius * 0.77,
        fill: palette[index % palette.length], strokeWidth: 0,
        originX: 'center', originY: 'center', selectable: false, evented: false,
      }), 'treeFoliage'));
      return leaves;
    });

    const branchPoints: Array<[number, number, number, number]> = [
      [0, -8, -28, -31], [0, -8, 20, -32], [0, -8, -32, 13],
      [0, -8, 28, 12], [0, -8, 6, 24],
      [-15, -20, -34, -9], [11, -21, 4, -41], [16, 4, 34, -4],
      [-19, 5, -30, 29], [4, 9, 19, 27],
    ];
    const branches = branchPoints.map((points) => setCanvasObjectMyType(new Line(points, {
      stroke: '#79502c', strokeWidth: 2.8, strokeLineCap: 'round',
      selectable: false, evented: false,
    }), 'treeBranch'));

    const trunk = new Circle({
      radius: 3,
      fill: '#79502c',
      originX: 'center',
      originY: 'center',
      top: -10,
    });
    const trunkObject = setCanvasObjectMyType(trunk, 'treeTrunk');

    const text = new Text('Árvore', {
      fontSize: CANVAS_STYLE.fontSize,
      fontFamily: CANVAS_STYLE.fontFamily,
      fill: CANVAS_ELEMENT_STYLE.strokeColor.treeElement,
      originX: 'center',
      originY: 'center',
      top: 59,
    });
    const textObject = setCanvasObjectMyType(text, 'treeLabel');

    const group = new FabricGroup([topObject, ...branches, trunkObject, ...foliage, textObject], {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
    });
    group.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});
    return setCanvasGroupMyType(group, 'tree');
  },
};
