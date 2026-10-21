import {CanvasObject, isCanvasGroup} from './canvas.ts';

export const DEFAULT_CANVAS_HINT = 'Selecione uma ferramenta para desenhar ou um objeto para ver suas opções.';

const EDITABLE_OBJECT_LABELS: Record<string, string> = {
  wall: 'Muro', square: 'Quadrado', triangle: 'Triângulo', circle: 'Círculo',
  fence: 'Cerca', terrainEntry: 'Entrada de terreno', siteHouse: 'Casa do entorno',
  siteBuilding: 'Construção do entorno', line: 'Linha', arrow: 'Seta',
};

export function getHintForObject(obj: CanvasObject | null, mobile = false): string {
  if (!obj) return DEFAULT_CANVAS_HINT;

  const edit = mobile
    ? 'Toque em Editar para alterar o texto e a cor.'
    : 'Dê dois cliques no objeto para alterar o texto e a cor.';
  const transform = mobile
    ? 'Use Transformar para ajustar o tamanho ou girar pelas alças disponíveis.'
    : 'Arraste as alças disponíveis para ajustar o tamanho ou girar.';
  const label = EDITABLE_OBJECT_LABELS[obj.myType];
  if (label) return `<b>${label}:</b> ${edit} ${transform}`;

  switch (obj.myType) {
    case 'house':
      if ((obj.houseView ?? obj.houseViewType) === 'top') {
        return mobile
          ? '<b>Casa:</b> Toque em Editar para ajustar nível, tamanho e contraventamento dos pilotis. Arraste a planta para movê-la.'
          : '<b>Casa:</b> Clique em um piloti para ajustar nível, tamanho e contraventamento. Arraste a planta para movê-la.';
      }
      return mobile
        ? '<b>Casa:</b> Toque em Editar para ajustar o terreno e a cama de rachão. Arraste a vista para movê-la.'
        : '<b>Casa:</b> Dê dois cliques no terreno da vista elevada para ajustar o solo e a cama de rachão. Arraste a vista para movê-la.';
    case 'piloti':
      return '<b>Piloti:</b> Ajuste nível, tamanho e contraventamento no editor do piloti.';
    case 'gate':
    case 'door':
      return `<b>Porta:</b> Arraste para posicionar junto à casa. ${transform}`;
    case 'gateSwing':
      return `<b>Portão:</b> Arraste para posicionar na entrada do terreno. ${transform}`;
    case 'street':
    case 'dirtRoad':
      return `<b>Via:</b> Arraste para posicionar no terreno. ${transform}`;
    case 'stairs':
      return `<b>Escada:</b> ${transform} Os degraus acompanham o tamanho da escada.`;
    case 'tree':
      return `<b>Árvore:</b> ${transform}`;
    case 'water':
      return `<b>Água:</b> ${transform}`;
    case 'fossa':
      return `<b>Fossa:</b> ${transform}`;
    case 'dimension':
    case 'distance':
      return mobile
        ? '<b>Distância:</b> Toque em Editar para digitar a medida e escolher a cor. O valor não é calculado pelo comprimento da linha.'
        : '<b>Distância:</b> Dê dois cliques para digitar a medida e escolher a cor. O valor não é calculado pelo comprimento da linha.';
    case 'text':
      return getTextHint(mobile);
    case 'freehand':
      return getFreehandHint(mobile);
    default:
      if (obj.type === 'i-text' || obj.type === 'IText') return getTextHint(mobile);
      if (obj.type === 'path' || obj.type === 'Path') return getFreehandHint(mobile);
      if (obj.type === 'activeSelection' || obj.type === 'ActiveSelection') {
        return `Vários objetos selecionados. Arraste para movê-los juntos. ${transform}`;
      }
      if (isCanvasGroup(obj)) return `<b>Grupo:</b> Arraste para mover os objetos juntos. ${transform}`;
      return `<b>Objeto:</b> Arraste para mover. ${transform}`;
  }
}

function getTextHint(mobile: boolean): string {
  return mobile
    ? '<b>Texto:</b> Toque em Editar para alterar o conteúdo e a cor.'
    : '<b>Texto:</b> Dê dois cliques para digitar. Use o botão direito para mudar a cor.';
}

function getFreehandHint(mobile: boolean): string {
  return mobile
    ? '<b>Desenho à mão livre:</b> Toque em Editar para mudar a cor do traço.'
    : '<b>Desenho à mão livre:</b> Dê dois cliques no traço para mudar a cor.';
}
