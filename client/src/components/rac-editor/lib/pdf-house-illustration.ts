import type {HouseIllustrationPort} from '@/components/rac-editor/ports/HouseIllustrationPort.ts';

/** A mesma transformação é usada no PDF do Canvas, da listagem e no ZIP. */
export async function preparePdfHouseIllustration(
  screenshot: string,
  wallColor: string | undefined,
  port: HouseIllustrationPort | undefined,
  signal?: AbortSignal,
): Promise<string> {
  const illustration = await port?.generateFromDataUrl(screenshot, {wallColor, ...(signal ? {signal} : {})});
  if (!illustration?.dataUrl?.startsWith('data:image/')) {
    throw new Error('Não foi possível gerar a ilustração da casa a partir do 3D. Tente novamente.');
  }
  return illustration.dataUrl;
}
