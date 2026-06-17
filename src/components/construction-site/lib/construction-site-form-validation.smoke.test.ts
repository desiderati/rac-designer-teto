import {describe, expect, it} from 'vitest';
import {
  constructionFormSchema,
  formatPhoneInput,
  houseConfigurationFormSchema,
  houseExtraMaterialsFormSchema,
  monitorFormSchema,
} from '@/components/construction-site/lib/construction-site-form-validation.ts';

const VALID_PNG_DATA_URL = 'data:image/png;base64,iVBORw0KGgo=';

describe('construction-site-form-validation.ts', () => {
  it('aplica os limites de texto definidos para construção', () => {
    expect(constructionFormSchema.safeParse({
      externalCode: 'CC2603',
      constructionDate: '2026-06-16',
      communityName: 'A'.repeat(30),
    }).success).toBe(true);

    expect(constructionFormSchema.safeParse({
      externalCode: 'CC2603',
      constructionDate: '2026-06-16',
      communityName: 'A'.repeat(31),
    }).success).toBe(false);
  });

  it('valida cadastro de monitor com nome e telefone obrigatórios', () => {
    expect(monitorFormSchema.safeParse({
      name: 'Ana Monitoria',
      phone: '(11) 99999-0000',
      email: '',
      photoDataUrl: '',
    }).success).toBe(true);

    expect(monitorFormSchema.safeParse({
      name: '',
      phone: '(11) 99999-0000',
      email: '',
      photoDataUrl: '',
    }).success).toBe(false);

    expect(monitorFormSchema.safeParse({
      name: 'Ana Monitoria',
      phone: '',
      email: '',
      photoDataUrl: '',
    }).success).toBe(false);
  });

  it('mantém telefone e e-mail de monitor consistentes com os formulários atuais', () => {
    expect(formatPhoneInput('abc41999998888xyz')).toBe('(41) 99999-8888');

    expect(monitorFormSchema.safeParse({
      name: 'Ana Monitoria',
      phone: '(41) 99999-8888',
      email: 'ana@example.com',
      photoDataUrl: '',
    }).success).toBe(true);

    expect(monitorFormSchema.safeParse({
      name: 'Ana Monitoria',
      phone: '(41) 9999-888',
      email: 'ana@example.com',
      photoDataUrl: '',
    }).success).toBe(false);

    expect(monitorFormSchema.safeParse({
      name: 'Ana Monitoria',
      phone: '(41) 99999-8888',
      email: 'email inválido',
      photoDataUrl: '',
    }).success).toBe(false);

    expect(monitorFormSchema.safeParse({
      name: 'A'.repeat(26),
      phone: '(41) 99999-8888',
      email: '',
      photoDataUrl: '',
    }).success).toBe(false);

    expect(monitorFormSchema.safeParse({
      name: 'Ana Monitoria',
      phone: '(41) 99999-8888',
      email: `${'a'.repeat(43)}@example.com`,
      photoDataUrl: '',
    }).success).toBe(false);
  });

  it('bloqueia foto de monitor fora dos tipos de imagem aceitos', () => {
    expect(monitorFormSchema.safeParse({
      name: 'Ana Monitoria',
      phone: '(41) 99999-8888',
      email: '',
      photoDataUrl: VALID_PNG_DATA_URL,
    }).success).toBe(true);

    expect(monitorFormSchema.safeParse({
      name: 'Ana Monitoria',
      phone: '(41) 99999-8888',
      email: '',
      photoDataUrl: 'data:image/svg+xml;base64,PHN2Zy8+',
    }).success).toBe(false);
  });

  it('mantém dados opcionais de Sobre a Casa sem obrigar preenchimento', () => {
    const baseHouseConfiguration = {
      familyName: 'Família Souza',
      primaryContactName: 'Maria',
      primaryContactPhone: '',
      primaryContactEmail: '',
      familyPhotoDataUrl: '',
      soilProfile: '',
      hasUndergroundObstacles: false,
      hasElevatedObstacles: false,
      hasNeighborSetbacks: false,
      locationQuery: '',
      terrainComplexity: 'flat',
    };

    expect(houseConfigurationFormSchema.safeParse({
      ...baseHouseConfiguration,
      houseSize: '',
      leaders: '',
      notes: '',
    }).success).toBe(true);

    expect(houseConfigurationFormSchema.safeParse({
      ...baseHouseConfiguration,
      houseSize: 'large',
      leaders: 'Ana e Bruno',
      notes: 'Casa próxima ao acesso lateral.',
    }).success).toBe(true);

    expect(houseConfigurationFormSchema.safeParse({
      ...baseHouseConfiguration,
      houseSize: 'tipo6',
      leaders: '',
      notes: '',
    }).success).toBe(false);

    expect(houseConfigurationFormSchema.safeParse({
      ...baseHouseConfiguration,
      familyName: 'A'.repeat(26),
      houseSize: '',
      leaders: '',
      notes: '',
    }).success).toBe(false);

    expect(houseConfigurationFormSchema.safeParse({
      ...baseHouseConfiguration,
      primaryContactName: 'A'.repeat(26),
      houseSize: '',
      leaders: '',
      notes: '',
    }).success).toBe(false);

    expect(houseConfigurationFormSchema.safeParse({
      ...baseHouseConfiguration,
      primaryContactEmail: `${'a'.repeat(43)}@example.com`,
      houseSize: '',
      leaders: '',
      notes: '',
    }).success).toBe(false);

    expect(houseConfigurationFormSchema.safeParse({
      ...baseHouseConfiguration,
      houseSize: '',
      leaders: 'A'.repeat(51),
      notes: '',
    }).success).toBe(false);
  });

  it('aceita coordenadas geográficas com precisão de GPS e rejeita limites inválidos', () => {
    const baseHouseConfiguration = {
      familyName: 'Família Souza',
      primaryContactName: 'Maria',
      primaryContactPhone: '',
      primaryContactEmail: '',
      familyPhotoDataUrl: '',
      houseSize: '',
      leaders: '',
      notes: '',
      soilProfile: '',
      hasUndergroundObstacles: false,
      hasElevatedObstacles: false,
      hasNeighborSetbacks: false,
      terrainComplexity: 'flat',
    };

    for (const locationQuery of ['-25.4284567, -49.2733123', '-90, -180', '90, 180']) {
      expect(houseConfigurationFormSchema.safeParse({
        ...baseHouseConfiguration,
        locationQuery,
      }).success).toBe(true);
    }

    for (const locationQuery of ['-90.0001, 0', '90.0001, 0', '0, -180.0001', '0, 180.0001']) {
      expect(houseConfigurationFormSchema.safeParse({
        ...baseHouseConfiguration,
        locationQuery,
      }).success).toBe(false);
    }
  });

  it('aceita apenas inteiros opcionais em materiais extras', () => {
    expect(houseExtraMaterialsFormSchema.safeParse({
      floorBeams: '',
      rafters: '24',
      secondaryBeams: '8',
      gutters: '4',
      justification: 'Reforço combinado com a liderança.',
    }).success).toBe(true);

    for (const invalidValue of ['1.5', '-2', '1e3', '12a']) {
      expect(houseExtraMaterialsFormSchema.safeParse({
        floorBeams: invalidValue,
        rafters: '',
        secondaryBeams: '',
        gutters: '',
        justification: '',
      }).success).toBe(false);
    }
  });
});
