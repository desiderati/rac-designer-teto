import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { COOKIE_NAME } from '@shared/const';
import {
  ConstructionSiteDeleteNotAllowedError,
  ConstructionSiteVersionConflictError,
  getConstructionSiteDocument,
  listConstructionSiteSummaries,
  removeConstructionSiteDocument,
  saveConstructionSiteDocument,
} from './db.ts';
import { getSessionCookieOptions } from './_core/cookies.ts';
import { systemRouter } from './_core/systemRouter.ts';
import { protectedProcedure, publicProcedure, router } from './_core/trpc.ts';
import { generateImage } from './_core/imageGeneration.ts';
import { invokeLLM } from './_core/llm.ts';
import { storagePut } from './storage.ts';
import { removeLightBackgroundFromPng } from './image-transparency.ts';
import type { ConstructionSiteState } from '../client/src/shared/types/construction-site.ts';

const MAX_IMAGE_BYTES = 7.5 * 1024 * 1024;
const MAX_IMAGE_BASE64_LENGTH = Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 64;
const ALLOWED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
/**
 * O documento completo é um contrato de domínio serializável. A fronteira de
 * transporte valida a forma mínima, tamanho e ausência de base64; validações
 * de regras de negócio permanecem centralizadas na sessão do editor.
 */
const CONSTRUCTION_SITE_STATE_INPUT = z.custom<ConstructionSiteState>((value) => (
  Boolean(value)
  && typeof value === 'object'
  && !Array.isArray(value)
  && Boolean((value as Partial<ConstructionSiteState>).constructionSite?.id)
));

const IMAGE_UPLOAD_INPUT = z.object({
  fileName: z.string().trim().min(1).max(160),
  mimeType: z.enum(ALLOWED_IMAGE_MIME_TYPES),
  base64: z.string().min(4).max(MAX_IMAGE_BASE64_LENGTH),
  constructionSiteId: z.string().trim().min(1).max(128).optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  constructionSites: router({
    list: protectedProcedure.query(async () => listConstructionSiteSummaries()),

    load: protectedProcedure
      .input(z.object({ constructionSiteId: z.string().trim().min(1).max(128) }))
      .query(async ({ input }) => getConstructionSiteDocument(input.constructionSiteId)),

    save: protectedProcedure
      .input(z.object({
        state: CONSTRUCTION_SITE_STATE_INPUT,
        expectedDocumentVersion: z.number().int().nonnegative(),
      }))
      .mutation(async ({ input }) => {
        assertRemoteDocumentIsSafe(input.state);
        try {
          return await saveConstructionSiteDocument(
            input.state,
            input.expectedDocumentVersion,
          );
        } catch (error) {
          throw toConstructionSiteTrpcError(error);
        }
      }),

    remove: protectedProcedure
      .input(z.object({
        constructionSiteId: z.string().trim().min(1).max(128),
        expectedDocumentVersion: z.number().int().positive(),
      }))
      .mutation(async ({ input }) => {
        try {
          await removeConstructionSiteDocument(input.constructionSiteId, input.expectedDocumentVersion);
          return { success: true } as const;
        } catch (error) {
          throw toConstructionSiteTrpcError(error);
        }
      }),
  }),

  storage: router({
    uploadImage: protectedProcedure
      .input(IMAGE_UPLOAD_INPUT)
      .mutation(async ({ input }) => {
        const bytes = decodeBase64Image(input.base64, input.mimeType);
        const extension = input.mimeType === 'image/jpeg'
          ? 'jpg'
          : input.mimeType.split('/')[1];
        const safeFileName = sanitizeFileName(input.fileName).replace(/\.[a-z0-9]+$/i, '') || 'imagem';
        const scope = input.constructionSiteId ? sanitizePathSegment(input.constructionSiteId) : 'unassigned';
        const objectKey = `rac-designer-teto/${scope}/photos/${safeFileName}.${extension}`;
        const uploaded = await storagePut(objectKey, bytes, input.mimeType);

        return {
          key: uploaded.key,
          url: uploaded.url,
          bytes: bytes.byteLength,
          mimeType: input.mimeType,
        };
      }),

    describeImage: protectedProcedure
      .input(z.object({
        base64: z.string().min(4).max(MAX_IMAGE_BASE64_LENGTH),
        mimeType: z.enum(ALLOWED_IMAGE_MIME_TYPES),
      }))
      .mutation(async ({input}) => {
        const bytes = decodeBase64Image(input.base64, input.mimeType);
        const result = await invokeLLM({
          model: 'gemini-3-flash-preview',
          maxTokens: 120,
          messages: [
            {
              role: 'system',
              content: 'Você descreve fotos de terrenos para uma ficha de visita técnica. Observe somente o que está visível: vegetação, solo, relevo, acesso, estruturas, água, pedras ou entulho. Responda em português do Brasil com uma única frase curta, objetiva e visual, sem inventar detalhes nem usar linguagem genérica.',
            },
            {
              role: 'user',
              content: [
                {type: 'text', text: 'Descreva exatamente o que aparece nesta foto do terreno em uma única frase curta, com no máximo 120 caracteres. Não escreva o nome do campo, não use JSON e não comece por “A imagem mostra”.'},
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${input.mimeType};base64,${bytes.toString('base64')}`,
                    detail: 'high',
                  },
                },
              ],
            },
          ],
          outputSchema: {
            name: 'terrain_photo_description',
            schema: {
              type: 'object',
              properties: {description: {type: 'string', maxLength: 120}},
              required: ['description'],
              additionalProperties: false,
            },
            strict: true,
          },
        });

        const content = result.choices[0]?.message?.content;
        const text = Array.isArray(content)
          ? content.filter((part): part is {type: 'text'; text: string} => part.type === 'text').map((part) => part.text).join(' ')
          : content;
        return {description: extractDescription(text)};
      }),

    saveTemporaryHouseImage: protectedProcedure
      .input(z.object({
        fileName: z.string().trim().min(1).max(96),
        base64: z.string().min(4).max(MAX_IMAGE_BASE64_LENGTH),
      }))
      .mutation(async ({ input }) => {
        const bytes = decodeBase64Image(input.base64, 'image/png');
        const safeFileName = sanitizeFileName(input.fileName).replace(/\.[a-z0-9]+$/i, '') || 'house-3d';
        const uploaded = await storagePut(
          `rac-designer-teto/temp/house-3d/${safeFileName}-${Date.now()}.png`,
          bytes,
          'image/png',
        );

        return {
          key: uploaded.key,
          url: uploaded.url,
          bytes: bytes.byteLength,
          mimeType: 'image/png' as const,
        };
      }),

    generateHouseIllustration: protectedProcedure
      .input(z.object({
        base64: z.string().min(32).max(MAX_IMAGE_BASE64_LENGTH),
      }))
      .mutation(async ({ input }) => {
        const pngBytes = decodeBase64Image(input.base64, 'image/png');
        const generated = await generateImage({
          prompt: [
            'Transform the supplied 3D house render into a clean architectural watercolor-and-ink illustration for the RAC Designer TETO.',
            'Preserve the house geometry exactly: roof pitch and corrugated roof, facade proportions, every visible window and door, stairs, elevated pilotis, foundation and terrain footprint, camera angle and overall silhouette.',
            'Use fine dark architectural linework with restrained blue-gray walls, light roof details, soft natural colors and subtle shading.',
            'Output the complete house and foundation as a true transparent PNG with clean alpha edges. The house, roof, windows, door, stairs, pilotis and terrain/grass must be fully opaque and continuous, with no transparent holes or missing patches inside the subject. No background, no checkerboard, no text, no labels, no arrows, no extra buildings, no crop.',
          ].join(' '),
          originalImages: [{b64Json: pngBytes.toString('base64'), mimeType: 'image/png'}],
          model: 'MODEL_GPT_IMAGE_2',
          quality: 'medium',
        });

        if (!generated.url) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'A ilustração da casa não foi gerada.',
          });
        }

        if (!generated.dataUrl) {
          return {url: generated.url};
        }

        const generatedBase64 = generated.dataUrl.split(',', 2)[1];
        if (!generatedBase64) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'A ilustração da casa retornou um formato inválido.',
          });
        }

        const transparentPng = await removeLightBackgroundFromPng(
          Buffer.from(generatedBase64, 'base64'),
        );
        const processed = await storagePut(
          `rac-designer-teto/temp/house-3d/illustration-${Date.now()}.png`,
          transparentPng,
          'image/png',
        );

        return {
          url: processed.url,
          dataUrl: `data:image/png;base64,${transparentPng.toString('base64')}`,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;

function assertRemoteDocumentIsSafe(state: unknown): void {
  const serialized = JSON.stringify(state);
  if (Buffer.byteLength(serialized, 'utf8') > 8 * 1024 * 1024) {
    throw new TRPCError({
      code: 'PAYLOAD_TOO_LARGE',
      message: 'O documento da Construção TETO excede o limite de 8 MB.',
    });
  }

  if (containsEmbeddedDataUrl(state)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Imagens devem ser enviadas ao Storage nativo do Manus; dados base64 não são persistidos no documento.',
    });
  }
}

function containsEmbeddedDataUrl(value: unknown): boolean {
  if (typeof value === 'string') return /^data:image\//i.test(value.trim());
  if (Array.isArray(value)) return value.some(containsEmbeddedDataUrl);
  if (!value || typeof value !== 'object') return false;
  return Object.values(value as Record<string, unknown>).some(containsEmbeddedDataUrl);
}

function decodeBase64Image(base64: string, mimeType: typeof ALLOWED_IMAGE_MIME_TYPES[number]): Buffer {
  const normalized = base64.replace(/\s/g, '');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized) || normalized.length % 4 !== 0) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Payload de imagem inválido.' });
  }

  const bytes = Buffer.from(normalized, 'base64');
  if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) {
    throw new TRPCError({ code: 'PAYLOAD_TOO_LARGE', message: 'Use uma imagem de até 7,5 MB.' });
  }

  if (!hasImageSignature(bytes, mimeType)) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'O arquivo não corresponde ao tipo de imagem informado.' });
  }

  return bytes;
}

function hasImageSignature(bytes: Buffer, mimeType: typeof ALLOWED_IMAGE_MIME_TYPES[number]): boolean {
  if (mimeType === 'image/png') {
    return bytes.length >= 8
      && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
      && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  }
  if (mimeType === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  return bytes.length >= 12
    && bytes.subarray(0, 4).toString('ascii') === 'RIFF'
    && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
}

function sanitizeFileName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

function sanitizePathSegment(value: string): string {
  return sanitizeFileName(value).replace(/\./g, '-') || 'unassigned';
}

function toConstructionSiteTrpcError(error: unknown): TRPCError {
  if (error instanceof TRPCError) return error;
  if (error instanceof ConstructionSiteVersionConflictError) {
    return new TRPCError({ code: 'CONFLICT', message: error.message });
  }
  if (error instanceof ConstructionSiteDeleteNotAllowedError) {
    return new TRPCError({ code: 'PRECONDITION_FAILED', message: error.message });
  }
  console.error('[constructionSites] operação remota falhou:', error);
  return new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Não foi possível persistir a Construção TETO.' });
}

export function extractDescription(content: string | undefined): string {
  if (!content) return '';
  const normalized = content
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(normalized) as {description?: unknown};
    if (typeof parsed.description === 'string') return parsed.description.trim().slice(0, 120);
  } catch {
    // Alguns provedores devolvem JSON parcial ou envolto em texto.
  }

  const quotedDescription = normalized.match(/["']description["']?\s*:\s*["']((?:\\.|[^"'\\])*)/i);
  if (quotedDescription?.[1]) {
    try {
      return JSON.parse(`"${quotedDescription[1]}"`).trim().slice(0, 120);
    } catch {
      return quotedDescription[1].replace(/\\["']/g, '"').trim().slice(0, 120);
    }
  }

  const partialDescription = normalized.match(/description["']?\s*:\s*(.*)$/i)?.[1];
  const fallback = partialDescription ?? normalized;
  return fallback
    .replace(/[{}]/g, '')
    .replace(/^\s*["'`]?(?:description)?["'`]?\s*[:=-]\s*/i, '')
    .replace(/["'`}]+\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}
