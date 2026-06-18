import {z} from 'zod';
import {
  hasValidOptionalEmail,
  hasValidOptionalPhone,
  hasValidRequiredPhone,
} from '@/shared/lib/contact-validation.ts';
import {hasValidOptionalPhotoDataUrl, PHOTO_UPLOAD_ERROR_MESSAGE} from '@/shared/lib/photo-data-url.ts';
import {HOUSE_FAMILY_NAME_MAX_LENGTH} from '@/shared/constants.ts';

const CONSTRUCTION_CODE_PATTERN = /^CC\d{4}$/;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const CONSTRUCTION_COMMUNITY_MAX_LENGTH = 30;
export const HOUSE_PRIMARY_CONTACT_NAME_MAX_LENGTH = 25;
export const HOUSE_PRIMARY_CONTACT_EMAIL_MAX_LENGTH = 50;
export const HOUSE_LEADERS_MAX_LENGTH = 50;
export const HOUSE_NOTES_MAX_LENGTH = 300;
export const HOUSE_EXTRA_MATERIAL_INTEGER_MAX_LENGTH = 4;
export const HOUSE_EXTRA_MATERIAL_JUSTIFICATION_MAX_LENGTH = 300;
export const MONITOR_NAME_MAX_LENGTH = 25;
export const MONITOR_EMAIL_MAX_LENGTH = 50;

export {
  formatPhoneInput,
  getPhoneDigits,
  PHONE_MASK_MAX_LENGTH,
} from '@/shared/lib/contact-validation.ts';
export {
  HOUSE_FAMILY_NAME_MAX_LENGTH,
} from '@/shared/constants.ts';

export const constructionFormSchema = z.object({
  externalCode: z.string()
    .trim()
    .transform((value) => value.toUpperCase())
    .refine((value) => CONSTRUCTION_CODE_PATTERN.test(value), 'Informe o código no formato CC0000.'),
  photoDataUrl: z.string()
    .refine(hasValidOptionalPhotoDataUrl, PHOTO_UPLOAD_ERROR_MESSAGE)
    .optional(),
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
    .refine(hasValidOptionalPhone, 'Informe 11 dígitos com DDD.'),
  primaryContactEmail: z.string()
    .trim()
    .max(HOUSE_PRIMARY_CONTACT_EMAIL_MAX_LENGTH, `Máximo de ${HOUSE_PRIMARY_CONTACT_EMAIL_MAX_LENGTH} caracteres.`)
    .refine(hasValidOptionalEmail, 'Informe um e-mail válido.'),
  familyPhotoDataUrl: z.string()
    .refine(hasValidOptionalPhotoDataUrl, PHOTO_UPLOAD_ERROR_MESSAGE)
    .optional(),
  houseSize: z.enum(['large', 'small']).or(z.literal('')),
  leaders: z.string()
    .trim()
    .max(HOUSE_LEADERS_MAX_LENGTH, `Máximo de ${HOUSE_LEADERS_MAX_LENGTH} caracteres.`),
  notes: z.string()
    .trim()
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
});

const optionalIntegerDraftSchema = z.string()
  .trim()
  .max(HOUSE_EXTRA_MATERIAL_INTEGER_MAX_LENGTH, `Máximo de ${HOUSE_EXTRA_MATERIAL_INTEGER_MAX_LENGTH} dígitos.`)
  .refine((value) => value === '' || /^\d+$/.test(value), 'Use apenas números inteiros.');

export const houseExtraMaterialsFormSchema = z.object({
  floorBeams: optionalIntegerDraftSchema,
  rafters: optionalIntegerDraftSchema,
  secondaryBeams: optionalIntegerDraftSchema,
  gutters: optionalIntegerDraftSchema,
  justification: z.string()
    .trim()
    .max(
      HOUSE_EXTRA_MATERIAL_JUSTIFICATION_MAX_LENGTH,
      `Máximo de ${HOUSE_EXTRA_MATERIAL_JUSTIFICATION_MAX_LENGTH} caracteres.`,
    ),
});

export const monitorFormSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Informe o nome do monitor.')
    .max(MONITOR_NAME_MAX_LENGTH, `Máximo de ${MONITOR_NAME_MAX_LENGTH} caracteres.`),
  phone: z.string()
    .refine(hasValidRequiredPhone, 'Informe 11 dígitos com DDD.'),
  email: z.string()
    .trim()
    .max(MONITOR_EMAIL_MAX_LENGTH, `Máximo de ${MONITOR_EMAIL_MAX_LENGTH} caracteres.`)
    .refine(hasValidOptionalEmail, 'Informe um e-mail válido.'),
  photoDataUrl: z.string()
    .refine(hasValidOptionalPhotoDataUrl, PHOTO_UPLOAD_ERROR_MESSAGE)
    .optional(),
});

export type ConstructionFormValues = z.infer<typeof constructionFormSchema>;
export type HouseExtraMaterialsFormValues = z.infer<typeof houseExtraMaterialsFormSchema>;
export type HouseConfigurationFormValues = z.infer<typeof houseConfigurationFormSchema>;
export type MonitorFormValues = z.infer<typeof monitorFormSchema>;

export function normalizeConstructionCodeDraft(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^C0-9]/g, '')
    .slice(0, 6);
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
