import {FabricObject} from 'fabric';
import {CanvasObject} from './canvas.ts';

export function getHintForObject(obj: FabricObject | null): string {
  if (!obj) {
    return 'Dica: Selecione uma ferramenta. (Ctrl+C Copiar, Ctrl+V Colar, Ctrl+Z Desfazer)';
  }

  const myType = (obj as CanvasObject).myType;

  switch (myType) {
    case 'house':
      return '<b>Casa:</b> Clique em um piloti para editar sua altura. Para mover a casa inteira, arraste.';

    case 'piloti':
      return '<b>Piloti:</b> Clique para editar a altura.';

    case 'gate':
      return '<b>Porta:</b> Posicione na lateral da casa.';

    case 'wall':
      return '<b>Objeto:</b> Puxe as laterais para aumentar.';

    case 'stairs':
      return '<b>Escada:</b> Redimensione para ajustar. Os degraus se ajustam automaticamente.';

    case 'tree':
      return '<b>Árvore:</b> Escala proporcional.';

    case 'water':
      return '<b>Água:</b> Escala proporcional.';

    case 'line':
      return '<b>Reta:</b> Rotação livre e redimensionamento lateral.';

    case 'arrow':
      return '<b>Seta:</b> Redimensiona no comprimento.';

    case 'dimension':
      return '<b>Distância:</b> Clique duas vezes no meio para digitar a medida.';

    default:
      if (obj.type === 'i-text') {
        return '<b>Texto:</b> Clique duas vezes para editar.';
      } else if (obj.type === 'activeSelection') {
        return 'Múltiplos itens selecionados. Use "Bloquear" para Agrupar.';
      } else if (obj.type === 'group') {
        return '<b>Grupo:</b> Use "Desbloquear" para editar partes.';
      }
      return 'Objeto selecionado.';
  }
}
