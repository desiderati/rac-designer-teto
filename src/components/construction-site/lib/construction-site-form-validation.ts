import {z} from 'zod';
import type {TerrainComplexity} from '@/shared/types/construction-site.ts';

const CONSTRUCTION_CODE_PATTERN = /^CC\d{4}$/;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGIT_COUNT = 11;

export const CONSTRUCTION_COMMUNITY_MAX_LENGTH = 50;
export const HOUSE_FAMILY_NAME_MAX_LENGTH = 50;
export const HOUSE_PRIMARY_CONTACT_NAME_MAX_LENGTH = 50;
export const HOUSE_NOTES_MAX_LENGTH = 300;
export const PHONE_MASK_MAX_LENGTH = 15;

export const constructionFormSchema = z.object({
  externalCode: z.string()
    .trim()
    .transform((value) => value.toUpperCase())
    .refine((value) => CONSTRUCTION_CODE_PATTERN.test(value), 'Informe o código no formato CC0000.'),
  photoDataUrl: z.string().optional(),
  constructionDate: z.string()
    .trim()
    .refine(isDateOnly, 'Informe a data da construção.'),
  communityName: z.string()
    .trim()
    .min(1, 'Informe a comunidade.')
    .max(CONSTRUCTION_COMMUNITY_MAX_LENGTH, `Máximo de ${CONSTRUCTION_COMMUNITY_MAX_LENGTH} caracteres.`),
});

export const houseConfigurationFormSchema = z.object({
  familyName: z.string()
    .trim()
    .min(1, 'Informe o nome da família.')
    .max(HOUSE_FAMILY_NAME_MAX_LENGTH, `Máximo de ${HOUSE_FAMILY_NAME_MAX_LENGTH} caracteres.`),
  primaryContactName: z.string()
    .trim()
    .min(1, 'Informe o contato principal.')
    .max(HOUSE_PRIMARY_CONTACT_NAME_MAX_LENGTH, `Máximo de ${HOUSE_PRIMARY_CONTACT_NAME_MAX_LENGTH} caracteres.`),
  primaryContactPhone: z.string()
    .refine((value) => {
      const digits = getPhoneDigits(value);
      return digits.length === 0 || digits.length === PHONE_DIGIT_COUNT;
    }, 'Informe 11 dígitos com DDD.'),
  primaryContactEmail: z.string()
    .trim()
    .refine((value) => value.length === 0 || EMAIL_PATTERN.test(value), 'Informe um e-mail válido.'),
  familyPhotoDataUrl: z.string().optional(),
  notes: z.string()
    .max(HOUSE_NOTES_MAX_LENGTH, `Máximo de ${HOUSE_NOTES_MAX_LENGTH} caracteres.`),
  soilProfile: z.enum(['stable', 'loose_clay', 'water_table']).or(z.literal('')),
  hasUndergroundObstacles: z.boolean(),
  hasElevatedObstacles: z.boolean(),
  hasNeighborSetbacks: z.boolean(),
  locationQuery: z.string()
    .trim()
    .refine((value) => value.length === 0 || parseMapCoordinates(value) !== null, {
      message: 'Use latitude e longitude, por exemplo: -25.4284, -49.2733.',
    }),
  terrainComplexity: z.enum(['flat', 'moderate', 'steep', 'very_steep', 'extreme'], {
    required_error: 'Informe a complexidade do terreno.',
  }),
});

export type ConstructionFormValues = z.infer<typeof constructionFormSchema>;
export type HouseConfigurationFormValues = z.infer<typeof houseConfigurationFormSchema>;

export function normalizeConstructionCodeDraft(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^C0-9]/g, '')
    .slice(0, 6);
}

export function formatPhoneInput(value: string): string {
  const digits = getPhoneDigits(value).slice(0, PHONE_DIGIT_COUNT);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function getPhoneDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function isDateOnly(value: string): boolean {
  if (!DATE_ONLY_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year
    && parsed.getMonth() === month - 1
    && parsed.getDate() === day;
}

export function parseMapCoordinates(value: string): { latitude: number; longitude: number } | null {
  const match = value.trim().match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))$/);
  if (!match) return null;

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return null;
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null;

  return {latitude, longitude};
}

export function isTerrainComplexity(value: string): value is TerrainComplexity {
  return value === 'flat'
    || value === 'moderate'
    || value === 'steep'
    || value === 'very_steep'
    || value === 'extreme';
}
