import {jsPDF} from 'jspdf';
import {describe, expect, it, vi} from 'vitest';
import type {RacPdfReportModel} from '@/components/rac-editor/lib/rac-pdf-report-model.ts';
import {
  createRacPdfReportDocument,
  getContinuationMediaSlots,
} from '@/components/rac-editor/lib/rac-pdf-report-renderer.ts';

const TINY_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

describe('rac pdf report renderer', () => {
  it('alinha o primeiro material a Terreno e reduz 25% das demais distâncias sem cortar a continuação', () => {
    const report = createMinimalReport();
    report.extraMaterials.fields = Array.from({length: 10}, (_, index) => ({label: `Material ${index}`, value: `${index}`}));
    const actions = ['Escavar', 'Aterrar', 'Retirar vegetação', 'Retirar entulho', 'Desmontar a Casa', 'Liberar acesso'];
    report.terrain.optionGroups.push({label: 'Ações do Morador', options: actions, selected: actions});
    report.monitors = Array.from({length: 6}, (_, index) => ({name: `Monitor ${index}`, phone: '11999999999'}));
    const drawn: Array<{text: string; y: number; page: number}> = [];
    function ObservedPdf(options: ConstructorParameters<typeof jsPDF>[0]) {
      const pdf = new jsPDF(options);
      const text = pdf.text.bind(pdf);
      vi.spyOn(pdf, 'text').mockImplementation((...args: Parameters<typeof pdf.text>) => {
        drawn.push({text: String(args[0]), y: args[2], page: pdf.getNumberOfPages()});
        return text(...args);
      });
      return pdf;
    }
    createRacPdfReportDocument({report, jsPDF: ObservedPdf as never});
    const first = drawn.find((row) => row.text === 'MATERIAL 0')!;
    const second = drawn.find((row) => row.text === 'MATERIAL 2')!;
    const title = drawn.find((row) => row.text === 'MATERIAL EXTRA')!;
    const terrainTitle = drawn.find((row) => row.text === 'TERRENO')!;
    const terrainFirst = drawn.find((row) => row.text === 'DESNÍVEL')!;
    expect(first.y - title.y).toBeCloseTo(terrainFirst.y - terrainTitle.y);
    expect(second.y - first.y).toBeCloseTo(35 * 0.75);
    const last = drawn.find((row) => row.text === 'MATERIAL 8')!;
    expect(last.y + 13).toBeLessThan(513);
    report.monitors.forEach((monitor) => {
      const row = drawn.find((entry) => entry.text === monitor.name);
      expect(row).toBeDefined();
      expect(row?.y).toBeLessThan(513);
    });
    expect(drawn.find((entry) => entry.text === 'Monitor 5')?.page).toBeGreaterThan(1);
  });
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
    expect(output).not.toContain('MODELO 3D');
    expect(output).not.toContain('FOTO FAMÍLIA');
    expect(output).not.toContain('FOTO TERRENO 1');
    expect(output).not.toContain('FOTO TERRENO 4');
    expect(output).not.toContain('FOTO TERRENO 3');
    expect(output).not.toContain('FOTO TERRENO 2');
    expect(output).toContain('Modelo 3D indisponível');
    expect(output).toContain('Imagem não informada.');
    expect(output).toContain('Foto não informada.');
  });

  it('insere o desenho 3D recebido na página de mídia do relatório', () => {
    const report = createMinimalReport();
    report.house3DImageDataUrl = TINY_PNG_DATA_URL;
    const addedImages: Array<{source: string; page: number}> = [];

    function ObservedPdf(options: ConstructorParameters<typeof jsPDF>[0]) {
      const pdf = new jsPDF(options);
      const addImage = pdf.addImage.bind(pdf);
      vi.spyOn(pdf, 'addImage').mockImplementation((...args: Parameters<typeof pdf.addImage>) => {
        addedImages.push({source: String(args[0]), page: pdf.getNumberOfPages()});
        return addImage(...args);
      });
      return pdf;
    }

    createRacPdfReportDocument({report, jsPDF: ObservedPdf as never});

    expect(addedImages.some((image) => image.source === TINY_PNG_DATA_URL && image.page === 2)).toBe(true);
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
