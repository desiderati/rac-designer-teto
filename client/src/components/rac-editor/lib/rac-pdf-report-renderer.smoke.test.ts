import {jsPDF} from 'jspdf';
import {describe, expect, it} from 'vitest';
import type {RacPdfReportModel} from '@/components/rac-editor/lib/rac-pdf-report-model.ts';
import {
  createRacPdfReportDocument,
  getContinuationMediaSlots,
} from '@/components/rac-editor/lib/rac-pdf-report-renderer.ts';

const TINY_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

describe('rac pdf report renderer', () => {
  it('mantém as cinco áreas de foto com largura e altura idênticas', () => {
    const rect = {x: 238, y: 58, width: 584, height: 454};
    const slots = getContinuationMediaSlots(rect);
    const photos = [
      slots.familyPhoto,
      slots.terrainPhoto1,
      slots.terrainPhoto2,
      slots.terrainPhoto3,
      slots.terrainPhoto4,
    ];

    photos.forEach((photo) => {
      expect(photo.width).toBeCloseTo(photos[0].width);
      expect(photo.height).toBeCloseTo(photos[0].height);
    });
    expect(slots.house3D.width).toBeCloseTo(photos[0].width * 2 + 8);
    expect(slots.house3D.height).toBeCloseTo(photos[0].height * 2 + 8);
    expect(slots.terrainPhoto2.x + slots.terrainPhoto2.width).toBeCloseTo(rect.x + rect.width);
    expect(slots.terrainPhoto2.y + slots.terrainPhoto2.height).toBeCloseTo(rect.y + rect.height);
  });

  it('gera a pagina de midia com placeholders mesmo sem 3D, fotos ou continuacao textual', () => {
    const pdf = createRacPdfReportDocument({
      report: createMinimalReport(),
      jsPDF,
      compress: false,
    });
    const output = pdf.output();

    expect(pdf.getNumberOfPages()).toBe(2);
    expect((output.match(/DATA DE GERAÇÃO/g) ?? [])).toHaveLength(2);
    expect(output).toContain('MODELO 3D');
    expect(output).toContain('FOTO FAMÍLIA');
    expect(output).toContain('FOTO TERRENO 1');
    expect(output).toContain('FOTO TERRENO 4');
    expect(output).toContain('FOTO TERRENO 3');
    expect(output).toContain('FOTO TERRENO 2');
    expect(output).toContain('Modelo 3D indisponível');
    expect(output).toContain('Imagem não informada.');
    expect(output).toContain('Foto não informada.');
    expect(output.indexOf('MODELO 3D')).toBeLessThan(output.indexOf('FOTO FAMÍLIA'));
    expect(output.indexOf('FOTO FAMÍLIA')).toBeLessThan(output.indexOf('FOTO TERRENO 1'));
    expect(output.indexOf('FOTO TERRENO 1')).toBeLessThan(output.indexOf('FOTO TERRENO 4'));
    expect(output.indexOf('FOTO TERRENO 4')).toBeLessThan(output.indexOf('FOTO TERRENO 3'));
    expect(output.indexOf('FOTO TERRENO 3')).toBeLessThan(output.indexOf('FOTO TERRENO 2'));
  });
});

function createMinimalReport(): RacPdfReportModel {
  return {
    title: 'RAC - Relatório de Acompanhamento Construtivo',
    fileName: 'RAC-CC0001-FAMILIA.pdf',
    canvasImageDataUrl: TINY_PNG_DATA_URL,
    canvasImageAspectRatio: 4 / 3,
    house3DImageDataUrl: null,
    house3DImageAspectRatio: 4 / 3,
    familyPhotoImageDataUrl: null,
    terrainPhotoImageDataUrls: [null, null, null, null],
    familyName: 'Família Teste',
    leaders: '',
    communityName: 'Comunidade Teste',
    constructionCode: 'CC0001',
    constructionCodeDisplay: 'CC0001',
    generatedAtLabel: '25/09/2026 12:00',
    headerFields: [
      {label: 'Comunidade', value: 'Comunidade Teste'},
      {label: 'Construção', value: 'CC0001'},
      {label: 'Data de geração', value: '25/09/2026 12:00'},
    ],
    house: {
      sizeOptions: ['Pequena', 'Grande'],
      selectedSize: null,
      typeOptions: ['Tipo 3', 'Tipo 6'],
      selectedType: null,
    },
    extraMaterials: {
      fields: [
        {label: 'Vigas de piso', value: '0'},
        {label: 'Caibros', value: '0'},
        {label: 'Vigas secundárias', value: '0'},
        {label: 'Mata-juntas', value: '0'},
        {label: 'Calhas', value: '0'},
        {label: 'Escada', value: 'Não informado'},
      ],
      justification: '',
    },
    terrain: {
      desnivelCm: null,
      volumes: null,
      riskIndicator: {score: 0, label: 'Baixa', level: 'low'},
      optionGroups: [
        {label: 'Solo', options: ['Terreno Estável / Argiloso'], selected: []},
        {label: 'Obstáculos', options: ['Hidráulicos', 'Subterrâneos', 'Elevados'], selected: []},
      ],
    },
    pilotis: {
      grid: [],
      totals: [],
      master: null,
    },
    monitors: [],
    notes: '',
  };
}
