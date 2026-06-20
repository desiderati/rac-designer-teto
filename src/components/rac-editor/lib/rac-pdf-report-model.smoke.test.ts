import {describe, expect, it} from 'vitest';
import {
  buildRacPdfReportModel,
  calculateDesnivelCm,
  calculateTerrainRiskIndicator,
} from '@/components/rac-editor/lib/rac-pdf-report-model.ts';
import {createRacPdfReportDocument} from '@/components/rac-editor/lib/rac-pdf-report-renderer.ts';
import {
  CONSTRUCTION_SITE_DOCUMENT_SCHEMA_VERSION,
  type ConstructionSiteState,
  type PersistedHouseRecord,
} from '@/shared/types/construction-site.ts';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/shared/constants.ts';
import {
  HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
} from '@/shared/types/house-drawing-document.ts';
import type {HousePiloti, HouseState} from '@/shared/types/house.ts';
import {getAllPilotiIds} from '@/shared/types/piloti.ts';
import {jsPDF} from 'jspdf';

const TINY_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

describe('rac pdf report model', () => {
  it('calcula desnivel pela diferenca entre maior e menor nivel dos pilotis', () => {
    const house = createHouseState({
      piloti_0_0: {height: 1.5, nivel: 0.2, isMaster: true},
      piloti_3_2: {height: 2.5, nivel: 0.72, isMaster: false},
    });

    expect(calculateDesnivelCm(house)).toBe(52);
  });

  it('calcula indicador de risco do terreno por solo, desnivel dos pilotis, obstaculos e media dos pilotis', () => {
    expect(calculateTerrainRiskIndicator({
      soilProfile: 'stable_clay',
    })).toEqual({
      score: 0,
      label: 'Baixa',
      level: 'low',
    });

    expect(calculateTerrainRiskIndicator({
      soilProfile: 'water_table',
      hasElevatedObstacles: true,
    }, createPilotisWithHeightAndDesnivel(1, 30))).toEqual({
      score: 34,
      label: 'Média',
      level: 'medium',
    });

    expect(calculateTerrainRiskIndicator({
      soilProfile: 'water_table',
      hasElevatedObstacles: true,
    }, createPilotisWithHeightAndDesnivel(3, 30))).toEqual({
      score: 74,
      label: 'Alta',
      level: 'high',
    });

    expect(calculateTerrainRiskIndicator({
      soilProfile: 'stable_clay',
    }, createPilotisWithHeightAndDesnivel(3.5, 0))).toEqual({
      score: 50,
      label: 'Alta',
      level: 'high',
    });

    expect(calculateTerrainRiskIndicator({
      soilProfile: 'water_table',
      hasElevatedObstacles: true,
    })).toEqual({
      score: 27,
      label: 'Média',
      level: 'medium',
    });

    expect(calculateTerrainRiskIndicator({
      soilProfile: 'water_table',
      hasHydraulicObstacles: true,
      hasUndergroundObstacles: true,
      hasElevatedObstacles: true,
      hasNeighborSetbackConstraints: true,
    }, createPilotisWithHeightAndDesnivel(3.5, 120))).toEqual({
      score: 100,
      label: 'Crítica',
      level: 'critical',
    });
  });

  it('monta o relatorio com metadados atuais, monitores ativos e dados de pilotis', () => {
    const report = buildRacPdfReportModel({
      constructionSite: createConstructionSiteState(),
      canvasImageDataUrl: TINY_PNG_DATA_URL,
      generatedAt: new Date('2026-06-16T12:00:00.000Z'),
    });

    expect(report).not.toBeNull();
    expect(report?.headerFields).toEqual([
      {label: 'Comunidade', value: 'Nova Primavera'},
      {label: 'Construção', value: 'CC2603'},
      {label: 'Data de geração', value: '16/06/2026 09:00'},
    ]);
    expect(report?.terrain.riskIndicator).toEqual({
      score: 70,
      label: 'Alta',
      level: 'high',
    });
    expect(report?.familyName).toBe('Daniel');
    expect(report?.leaders).toBe('Math Almeida + Calfa');
    expect(report?.constructionCode).toBe('CC2603');
    expect(report?.constructionCodeDisplay).toBe('2603');
    expect(report?.house.selectedSize).toBe('Grande');
    expect(report?.house.selectedType).toBe('Tipo 6');
    expect(report?.terrain.desnivelCm).toBe(70);
    expect(report?.terrain.volumes?.rachaoM3).toBeGreaterThan(0);
    expect(report?.terrain.volumes?.britaM3).toBeGreaterThan(0);
    expect(report?.terrain.volumes?.pedrasM3).toBeCloseTo(
      (report?.terrain.volumes?.rachaoM3 ?? 0) + (report?.terrain.volumes?.britaM3 ?? 0),
      6,
    );
    expect(report?.terrain.optionGroups.find((group) => group.label === 'Solo')?.selected)
      .toEqual(['Lençol Freático / Água no Fundo']);
    expect(report?.terrain.optionGroups.find((group) => group.label === 'Obstáculos')?.options)
      .toEqual(['Hidráulicos', 'Subterrâneos', 'Elevados', 'Esquadro']);
    expect(report?.terrain.optionGroups.find((group) => group.label === 'Obstáculos')?.selected)
      .toEqual(['Hidráulicos', 'Subterrâneos', 'Elevados', 'Esquadro']);
    expect(report?.monitors.map((monitor) => monitor.name)).toEqual(['Carioca', 'John']);
    expect(report?.pilotis.master?.code).toBe('A1');
    expect(report?.pilotis.master?.nivelLabel).toBe('0,10 m');
    expect(report?.pilotis.grid).toHaveLength(3);
    expect(report?.pilotis.grid[0]).toHaveLength(4);
    expect(report?.pilotis.totals).toContainEqual({heightLabel: '1,0 m', count: 1});
    expect(report?.pilotis.totals).toContainEqual({heightLabel: '2,0 m', count: 1});
    expect(report?.extraMaterials.fields).toContainEqual({label: 'Vigas de Piso', value: '12'});
    expect(report?.extraMaterials.fields).toContainEqual({label: 'Caibros', value: '24'});
    expect(report?.extraMaterials.justification).toBe('Material para reforço do acesso lateral.');
    expect(report?.canvasImageAspectRatio).toBe(1);
    expect(report?.house3DImageDataUrl).toBeNull();
    expect(report?.house3DImageAspectRatio).toBe(1);
    expect(report?.fileName).toBe('RAC-CC2603-DANIEL.pdf');
  });

  it('gera um documento PDF em A4 paisagem com o modelo do relatorio', () => {
    const report = buildRacPdfReportModel({
      constructionSite: createConstructionSiteState(),
      canvasImageDataUrl: TINY_PNG_DATA_URL,
      canvasImageAspectRatio: CANVAS_WIDTH / CANVAS_HEIGHT,
      generatedAt: new Date('2026-06-16T12:00:00.000Z'),
    });

    expect(report).not.toBeNull();
    const pdf = createRacPdfReportDocument({
      report: report!,
      jsPDF,
      compress: false,
    });

    expect(pdf.getNumberOfPages()).toBe(1);
    const output = pdf.output();

    expect(pdf.output('arraybuffer').byteLength).toBeGreaterThan(1000);
    expect(output).toContain('Daniel');
    expect(output).toContain('Nova Primavera');
    expect(output).toContain('CONSTRUÇÃO');
    expect(output).toContain('CC2603');
    expect(output).not.toContain('CONSTRU...');
    expect(output).toContain('Math Almeida + Calfa');
    expect(output).toContain('DATA DE GERAÇÃO');
    expect(output).not.toContain('DATA DE GERA...');
    expect(output).toContain('16/06/2026 09:00');
    expect(output).toMatch(/58\. 0 0 24\.\d+ 763\.\d+ 549\.\d+ cm/);
    expect(output).toContain(String(report!.terrain.riskIndicator.score));
    expect(output).toContain('BR');
    expect(output).toContain('70 cm');
    expect(output).toContain('Grande');
    expect(output).toContain('Tipo 6');
    expect(output).toContain('Hidráulicos');
    expect(output).toContain('Subterrâneos');
    expect(output).toContain('Elevados');
    expect(output).toContain('Esquadro');
    expect(output).not.toContain('+2');
    expect(output).not.toContain('MATERIAIS DE BASE');
    expect(output).not.toContain('RACHÃO');
    expect(output).not.toContain('BRITA');
    expect(output).not.toContain('RACHÃO | BRITA');
    expect(output).not.toContain('COMPLEXIDADE');
    expect(output).not.toContain('Moderado');
    expect(output).toContain('MATERIAL EXTRA');
    expect(output).toContain('VIGAS DE PISO');
    expect(output).toContain('CAIBROS');
    expect(output).toContain('12');
    expect(output).toContain('24');
    expect(getPrecedingSegments(output, 'Material para reforço', 240).at(0)).toContain('0.42 0.447 0.502 rg');
    expect(output).toContain('MONITORIA');
    expect(output).toContain('PILOTIS MESTRE');
    expect(output).toContain('A1 / 1,0 m / Nível = 0,10 m');
    expect((output.match(/\/Subtype \/Image\b/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(output).toMatch(/583\.\d+ 0 0 455\.\d+ 238\.\d+ 82\. cm/);
    expect(output).toContain('Carioca');
    expect(output).toContain('John');
    expect(output).not.toContain('Senna');
    expect(output).not.toContain('LÍDERES');
    expect(output).not.toContain('Pequena');
    expect(output).not.toContain('Tipo 3');
    expect(output).not.toContain('Terreno Firme / Duro');
    expect(output).not.toContain('Solo Aluvial');
    expect(output).not.toContain('Plano');
  });

  it('gera pagina extra com visualizacao 3D no mesmo formato do canvas principal', () => {
    const report = buildRacPdfReportModel({
      constructionSite: createConstructionSiteState(),
      canvasImageDataUrl: TINY_PNG_DATA_URL,
      canvasImageAspectRatio: CANVAS_WIDTH / CANVAS_HEIGHT,
      house3DImageDataUrl: TINY_PNG_DATA_URL,
      house3DImageAspectRatio: CANVAS_WIDTH / CANVAS_HEIGHT,
      generatedAt: new Date('2026-06-16T12:00:00.000Z'),
    });

    expect(report).not.toBeNull();
    expect(report?.house3DImageDataUrl).toBe(TINY_PNG_DATA_URL);
    expect(report?.house3DImageAspectRatio).toBe(CANVAS_WIDTH / CANVAS_HEIGHT);

    const pdf = createRacPdfReportDocument({
      report: report!,
      jsPDF,
      compress: false,
    });
    const output = pdf.output();

    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(2);
    expect(output).not.toContain('RAC - continuação');
    expect((output.match(/DATA DE GERAÇÃO/g) ?? [])).toHaveLength(2);
    expect((output.match(/Nova Primavera/g) ?? [])).toHaveLength(2);
    expect((output.match(/58\. 0 0 24\.\d+ 763\.\d+ 549\.\d+ cm/g) ?? [])).toHaveLength(2);
    expect((output.match(/PILOTIS MESTRE/g) ?? [])).toHaveLength(2);
    getPrecedingSegments(output, 'PILOTIS MESTRE').forEach((segment) => {
      expect(getLastLineWidthCommand(segment)).toBe('0.35');
    });
    expect(output).not.toContain('MONITORIA \\(CONTINUAÇÃO\\)');
    expect(output).not.toContain('OUTROS / JUSTIFICATIVAS MATERIAIS EXTRAS');
    expect(output).not.toContain('OBSERVAÇÕES COMPLETAS');
  });

  it('limita o cabecalho do PDF quando familia e lideres usam texto continuo longo', () => {
    const constructionSite = createConstructionSiteState();
    constructionSite.families[0].name = 'M'.repeat(80);
    constructionSite.houses[0].leaders = 'L'.repeat(80);

    const report = buildRacPdfReportModel({
      constructionSite,
      canvasImageDataUrl: TINY_PNG_DATA_URL,
      canvasImageAspectRatio: CANVAS_WIDTH / CANVAS_HEIGHT,
      generatedAt: new Date('2026-06-16T12:00:00.000Z'),
    });

    expect(report).not.toBeNull();
    const pdf = createRacPdfReportDocument({
      report: report!,
      jsPDF,
      compress: false,
    });
    const output = pdf.output();

    expect(output).toContain('COMUNIDADE');
    expect(output).toContain('Nova Primavera');
    expect(output).toContain('DATA DE GERAÇÃO');
    expect(output).toMatch(/\(M+\.{3}\) Tj/);
    expect(output).toMatch(/\(L+\.{3}\) Tj/);
    expect(output).not.toContain('M'.repeat(80));
    expect(output).not.toContain('L'.repeat(80));
  });

  it('mostra ate quatro monitores ativos na primeira pagina do PDF', () => {
    const constructionSite = createConstructionSiteState();
    constructionSite.monitors = Array.from({length: 4}, (_, index) => (
      createMonitor(`monitor-visible-${index + 1}`, `Monitor ${index + 1}`, 'active')
    ));

    const report = buildRacPdfReportModel({
      constructionSite,
      canvasImageDataUrl: TINY_PNG_DATA_URL,
      generatedAt: new Date('2026-06-16T12:00:00.000Z'),
    });

    expect(report).not.toBeNull();
    const pdf = createRacPdfReportDocument({
      report: report!,
      jsPDF,
      compress: false,
    });
    const output = pdf.output();

    expect(pdf.getNumberOfPages()).toBe(1);
    expect(output).toContain('Monitor 1');
    expect(output).toContain('Monitor 4');
    expect(output).not.toContain('MONITORIA (CONTINUAÇÃO)');
  });

  it('gera pagina de continuacao para monitores excedentes e observacoes longas', () => {
    const constructionSite = createConstructionSiteState();
    const longJustificationSentence = 'Mobilizar voluntariado jovem para trabalhar com senso de urgencia em acao conjunta com moradores de comunidades precarias e outros atores da sociedade desenvolvendo solucoes de moradia segura.';
    constructionSite.monitors = Array.from({length: 8}, (_, index) => (
      createMonitor(`monitor-extra-${index + 1}`, `Monitor ${index + 1}`, 'active')
    ));
    constructionSite.houses[0].extraMaterials = {
      floorBeams: 12,
      rafters: 24,
      secondaryBeams: 8,
      gutters: 4,
      justification: `${longJustificationSentence} ${longJustificationSentence} Trecho final da justificativa.`,
    };
    constructionSite.houses[0].notes = `${'Detalhe operacional da casa. '.repeat(80)}Trecho final da observacao.`;

    const report = buildRacPdfReportModel({
      constructionSite,
      canvasImageDataUrl: TINY_PNG_DATA_URL,
      generatedAt: new Date('2026-06-16T12:00:00.000Z'),
    });

    expect(report).not.toBeNull();
    const pdf = createRacPdfReportDocument({
      report: report!,
      jsPDF,
      compress: false,
    });
    const output = pdf.output();

    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(2);
    expect(output).toContain('OBSERVAÇÕES COMPLETAS');
    expect(output).toContain('OUTROS / JUSTIFICATIVAS MATERIAIS EXTRAS');
    expect(output).toContain('MONITORIA \\(CONTINUAÇÃO\\)');
    expect(output).toMatch(/20\. 529\.\d+ Td[\s\S]{0,120}\(MONITORIA \\\(CONTINUAÇÃO\\\)\) Tj/);
    expect(output).not.toContain('Observações completas');
    expect(output).not.toContain('Justificativa de materiais extras');
    expect(output).not.toContain('Monitoria - continuação');
    expect(output).toContain('Monitor 8');
    expect(output).not.toContain(longJustificationSentence);
    expect(output).not.toContain(`${longJustificationSentence} Mobilizar`);
    expect(output).toContain('Trecho final da');
    expect(output).toContain('justificativa.');
    expect(output).toContain('Trecho final da');
    expect(output).toContain('observacao.');
  });

  it('gera pagina de continuacao quando apenas observacoes excedem a coluna esquerda', () => {
    const constructionSite = createConstructionSiteState();
    constructionSite.houses[0].notes = [
      'Mobilizar voluntariado jovem para trabalhar com senso de urgencia em acao conjunta com os moradores.',
      'Registrar detalhes de campo que ultrapassam a area resumida da primeira pagina do relatorio.',
      'Adicionar contexto operacional suficiente para manter a quebra em pagina extra mesmo com uma linha visivel adicional.',
      'Preservar a cobertura de observacoes longas sem acionar continuacao de monitoria ou materiais extras.',
      'Trecho final exclusivo das observacoes.',
    ].join(' ');

    const report = buildRacPdfReportModel({
      constructionSite,
      canvasImageDataUrl: TINY_PNG_DATA_URL,
      generatedAt: new Date('2026-06-16T12:00:00.000Z'),
    });

    expect(report).not.toBeNull();
    const pdf = createRacPdfReportDocument({
      report: report!,
      jsPDF,
      compress: false,
    });
    const output = pdf.output();

    expect(pdf.getNumberOfPages()).toBe(2);
    expect(output).toContain('OBSERVAÇÕES COMPLETAS');
    expect(output).not.toContain('MONITORIA (CONTINUAÇÃO)');
    expect(output).not.toContain('OUTROS / JUSTIFICATIVAS MATERIAIS EXTRAS');
    expect(output).toContain('Trecho final exclusivo das');
    expect(output).toContain('observacoes.');
  });

  it('move observacoes para continuacao quando a previa ultrapassaria o canvas', () => {
    const constructionSite = createConstructionSiteState();
    constructionSite.monitors = Array.from({length: 4}, (_, index) => (
      createMonitor(`monitor-visible-${index + 1}`, `Monitor ${index + 1}`, 'active')
    ));
    constructionSite.houses[0].notes = 'Observacao curta que precisa respeitar o limite inferior do canvas.';

    const report = buildRacPdfReportModel({
      constructionSite,
      canvasImageDataUrl: TINY_PNG_DATA_URL,
      canvasImageAspectRatio: 16 / 9,
      generatedAt: new Date('2026-06-16T12:00:00.000Z'),
    });

    expect(report).not.toBeNull();
    const pdf = createRacPdfReportDocument({
      report: report!,
      jsPDF,
      compress: false,
    });
    const output = pdf.output();

    expect(pdf.getNumberOfPages()).toBe(2);
    expect(output).toContain('OBSERVAÇÕES COMPLETAS');
    expect(output).toContain('limite inferior do');
    expect(output).toContain('canvas.');
  });

  it('pagina continuacao sem descartar monitoria ou observacoes extensas', () => {
    const constructionSite = createConstructionSiteState();
    constructionSite.monitors = Array.from({length: 42}, (_, index) => (
      createMonitor(`monitor-volume-${index + 1}`, `MV ${index + 1}`, 'active')
    ));
    constructionSite.houses[0].notes = `${'Linha longa de acompanhamento construtivo. '.repeat(480)}Fim integral.`;

    const report = buildRacPdfReportModel({
      constructionSite,
      canvasImageDataUrl: TINY_PNG_DATA_URL,
      generatedAt: new Date('2026-06-16T12:00:00.000Z'),
    });

    expect(report).not.toBeNull();
    const pdf = createRacPdfReportDocument({
      report: report!,
      jsPDF,
      compress: false,
    });
    const output = pdf.output();

    expect(pdf.getNumberOfPages()).toBeGreaterThan(2);
    expect(output).toContain('MV 42');
    expect(output).toContain('OBSERVAÇÕES COMPLETAS \\(CONTINUAÇÃO\\)');
    expect(output).toContain('Fim');
    expect(output).toContain('integral.');
  });
});

function createConstructionSiteState(): ConstructionSiteState {
  return {
    constructionSite: {
      id: 'cc-1',
      externalCode: 'CC2603',
      constructionDate: '2026-06-15',
      communityId: 'community-1',
      status: 'in_progress',
      activeHouseId: 'house-1',
      createdAt: '2026-06-15T00:00:00.000Z',
      updatedAt: '2026-06-15T00:00:00.000Z',
    },
    communities: [
      {
        id: 'community-1',
        name: 'Nova Primavera',
      },
    ],
    families: [
      {
        id: 'family-1',
        constructionSiteId: 'cc-1',
        name: 'Daniel',
      },
    ],
    monitors: [
      createMonitor('monitor-1', 'Carioca', 'active'),
      createMonitor('monitor-2', 'Senna', 'inactive'),
      createMonitor('monitor-3', 'John', 'active'),
    ],
    houses: [
      createHouseRecord({
        id: 'house-1',
        status: 'draft',
        familyId: 'family-1',
      }),
    ],
  };
}

function createMonitor(id: string, name: string, status: 'active' | 'inactive') {
  return {
    id,
    constructionSiteId: 'cc-1',
    name,
    phone: '(41) 99999-0000',
    status,
    createdAt: '2026-06-15T00:00:00.000Z',
    updatedAt: '2026-06-15T00:00:00.000Z',
  };
}

function createHouseRecord({
  id,
  familyId,
  status,
}: Pick<PersistedHouseRecord, 'id' | 'familyId' | 'status'>): PersistedHouseRecord {
  const house = createHouseState({
    piloti_0_0: {height: 1, nivel: 0.1, isMaster: true},
    piloti_1_0: {height: 1.5, nivel: 0.3, isMaster: false},
    piloti_3_2: {height: 2, nivel: 0.8, isMaster: false},
  });

  return {
    id,
    constructionSiteId: 'cc-1',
    familyId,
    houseType: 'tipo6',
    terrainType: 3,
    status,
    houseSize: 'large',
    leaders: 'Math Almeida + Calfa',
    extraMaterials: {
      floorBeams: 12,
      rafters: 24,
      secondaryBeams: 8,
      gutters: 4,
      justification: 'Material para reforço do acesso lateral.',
    },
    designSettings: {
      selectedPilotiHeights: [1, 1.5, 2, 2.5],
    },
    siteAssessment: {
      soilProfile: 'water_table',
      hasHydraulicObstacles: true,
      hasElevatedObstacles: true,
      hasUndergroundObstacles: true,
      hasNeighborSetbackConstraints: true,
    },
    pilotiLayout: {
      masterCode: 'a1',
      points: [],
    },
    drawingDocument: {
      schemaVersion: CONSTRUCTION_SITE_DOCUMENT_SCHEMA_VERSION,
      house,
      canvas: {
        schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
        objects: [],
      },
      views: {},
    },
    notes: 'Observacao de campo.',
    version: 1,
    createdAt: '2026-06-15T00:00:00.000Z',
    updatedAt: '2026-06-15T00:00:00.000Z',
  };
}

function createPilotisWithHeightAndDesnivel(height: number, desnivelCm: number): Record<string, HousePiloti> {
  const maxNivel = desnivelCm / 100;

  return Object.fromEntries(
    getAllPilotiIds().map((pilotiId, index) => [
      pilotiId,
      {
        height,
        nivel: index === 0 ? 0 : maxNivel,
        isMaster: index === 0,
      },
    ]),
  );
}

function getPrecedingSegments(output: string, marker: string, sliceLength = 2000): string[] {
  const segments: string[] = [];
  let cursor = 0;

  while (cursor < output.length) {
    const markerIndex = output.indexOf(marker, cursor);
    if (markerIndex === -1) break;
    segments.push(output.slice(Math.max(0, markerIndex - sliceLength), markerIndex));
    cursor = markerIndex + marker.length;
  }

  return segments;
}

function getLastLineWidthCommand(segment: string): string | undefined {
  return [...segment.matchAll(/(\d+(?:\.\d+)?) w/g)].at(-1)?.[1];
}

function createHouseState(overrides: Record<string, HousePiloti>): HouseState {
  const pilotis = Object.fromEntries(
    getAllPilotiIds().map((pilotiId) => [
      pilotiId,
      overrides[pilotiId] ?? {height: 1.5, nivel: 0.4, isMaster: false},
    ]),
  );

  return {
    id: 'house-state-1',
    houseType: 'tipo6',
    pilotis,
    terrainType: 3,
    views: {
      top: [],
      front: [],
      back: [],
      side1: [],
      side2: [],
    },
    sideMappings: {
      top: null,
      bottom: null,
      left: null,
      right: null,
    },
    preAssignedSides: {},
  };
}
