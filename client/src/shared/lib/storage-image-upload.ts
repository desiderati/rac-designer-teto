export type StorageImageUploadPayload = {
  fileName: string;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  base64: string;
};

const DATA_URL_PATTERN = /^data:(image\/png|image\/jpeg|image\/webp);base64,([A-Za-z0-9+/]+={0,2})$/i;

export async function toStorageImageUploadPayload(
  file: File,
  onReadProgress?: (percent: number) => void,
): Promise<StorageImageUploadPayload> {
  const dataUrl = await readFileAsDataUrl(file, onReadProgress);
  return dataUrlToStorageImageUploadPayload(dataUrl, file.name);
}

export function dataUrlToStorageImageUploadPayload(dataUrl: string, fileName = 'imagem'): StorageImageUploadPayload {
  const match = DATA_URL_PATTERN.exec(dataUrl.trim());
  if (!match) throw new Error('O arquivo não é uma imagem PNG, JPG ou WEBP válida.');

  return {
    fileName,
    mimeType: match[1].toLowerCase() as StorageImageUploadPayload['mimeType'],
    base64: match[2],
  };
}

function readFileAsDataUrl(file: File, onProgress?: (percent: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem selecionada.'));
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Resultado de imagem inválido.'));
    };
    reader.readAsDataURL(file);
  });
}
