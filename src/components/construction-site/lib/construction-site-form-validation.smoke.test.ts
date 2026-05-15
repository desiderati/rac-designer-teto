import {describe, expect, it} from 'vitest';
import {
  formatPhoneInput,
  houseConfigurationFormSchema,
  monitorFormSchema,
} from '@/components/construction-site/lib/construction-site-form-validation.ts';

const VALID_PNG_DATA_URL = 'data:image/png;base64,iVBORw0KGgo=';

describe('construction-site-form-validation.ts', () => {
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
  });
});
