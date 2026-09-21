import {useEffect, useMemo, useState} from 'react';
import {AlertCircle, Check, Eye, FileImage, Loader2} from 'lucide-react';
import {Button} from '@/components/ui/button.tsx';
import {Checkbox} from '@/components/ui/checkbox.tsx';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog.tsx';
import {Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle} from '@/components/ui/drawer.tsx';
import {useIsMobile} from '@/hooks/useMobile.tsx';
import {
  MAX_PHOTO_UPLOAD_BYTES,
  PHOTO_COMPRESSION_THRESHOLD_BYTES,
  preparePhotoFileForUpload,
  type PreparedPhotoFile,
  validatePreparedPhotoSize,
} from '@/shared/lib/photo-data-url.ts';
import {cn} from '@/components/rac-editor/lib/utils.ts';

export interface ImageUploadReviewSelection {
  file: File;
  preparedFile: PreparedPhotoFile;
  preserveOriginalQuality: boolean;
}

interface ImageUploadReviewProps {
  file: File | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (selection: ImageUploadReviewSelection) => Promise<void> | void;
  title?: string;
}

export function ImageUploadReview({
  file,
  isOpen,
  onOpenChange,
  onConfirm,
  title = 'Revisar imagem',
}: ImageUploadReviewProps) {
  const isMobile = useIsMobile();
  const [prepared, setPrepared] = useState<PreparedPhotoFile | null>(null);
  const [preserveOriginalQuality, setPreserveOriginalQuality] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [preparingPercent, setPreparingPercent] = useState(0);
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPrepared(null);
    setPrepareError(null);
    setConfirmError(null);
    setPreserveOriginalQuality(false);
    setShowComparison(false);
    setPreparingPercent(0);

    if (!file || !isOpen) return () => { cancelled = true; };

    void preparePhotoFileForUpload(file, (percent) => {
      if (!cancelled) setPreparingPercent(percent);
    }, {preserveOriginalQuality: false})
      .then((result) => {
        if (cancelled) return;
        setPrepared(result);
        setPreparingPercent(100);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setPrepareError(error instanceof Error ? error.message : 'Não foi possível preparar a imagem.');
      });

    return () => { cancelled = true; };
  }, [file, isOpen]);

  const originalPreviewUrl = useObjectUrl(file);
  const optimizedPreviewUrl = useObjectUrl(prepared?.file ?? null);
  const selectedFile = preserveOriginalQuality ? file : prepared?.file ?? null;
  const selectedSizeError = selectedFile ? validatePreparedPhotoSize(selectedFile) : null;
  const hasCompression = Boolean(prepared?.compressed && optimizedPreviewUrl && originalPreviewUrl);
  const effectivePreparedFile = useMemo<PreparedPhotoFile | null>(() => {
    if (!prepared || !selectedFile) return null;
    if (!preserveOriginalQuality) return prepared;
    return {
      ...prepared,
      file: selectedFile,
      compressed: false,
      finalBytes: selectedFile.size,
      reductionPercent: 0,
    };
  }, [prepared, preserveOriginalQuality, selectedFile]);

  const handleConfirm = async () => {
    if (!file || !effectivePreparedFile || !selectedFile || isConfirming) return;
    const finalSizeError = validatePreparedPhotoSize(selectedFile);
    if (finalSizeError) {
      setConfirmError(finalSizeError);
      return;
    }

    setConfirmError(null);
    setIsConfirming(true);
    try {
      await onConfirm({
        file: selectedFile,
        preparedFile: effectivePreparedFile,
        preserveOriginalQuality,
      });
      onOpenChange(false);
    } catch (error: unknown) {
      setConfirmError(error instanceof Error ? error.message : 'Não foi possível enviar a imagem. Tente novamente.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (isConfirming) return;
    onOpenChange(open);
  };

  const body = (
    <div className='space-y-4'>
      {prepareError ? (
        <div role='alert' className='flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800'>
          <AlertCircle className='mt-0.5 h-4 w-4 shrink-0'/>
          <span>{prepareError}</span>
        </div>
      ) : null}

      {!prepared && !prepareError ? (
        <div className='flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 text-center text-sm text-blue-800' aria-live='polite'>
          <Loader2 className='h-7 w-7 animate-spin'/>
          <span>Preparando a imagem para revisão… {preparingPercent}%</span>
        </div>
      ) : null}

      {prepared && file && originalPreviewUrl ? (
        <>
          <div className='flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600'>
            <span className='flex min-w-0 items-center gap-2'><FileImage className='h-4 w-4 shrink-0 text-blue-600'/><span className='truncate'>{file.name}</span></span>
            <span className='shrink-0 font-semibold'>{formatFileSize(file.size)}</span>
          </div>

          <div className='overflow-hidden rounded-xl border border-slate-200 bg-slate-50'>
            <img
              src={preserveOriginalQuality ? originalPreviewUrl : optimizedPreviewUrl ?? originalPreviewUrl}
              alt={preserveOriginalQuality ? 'Prévia da imagem original' : 'Prévia da imagem que será enviada'}
              className='h-52 w-full object-contain sm:h-64'
            />
          </div>

          {hasCompression ? (
            <button
              type='button'
              className='flex w-full items-center justify-center gap-2 rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2 text-sm font-semibold text-blue-800 transition-colors hover:bg-blue-100'
              onClick={() => setShowComparison((current) => !current)}
              aria-expanded={showComparison}
            >
              <Eye className='h-4 w-4'/>
              {showComparison ? 'Ocultar comparação' : 'Comparar original e otimizada'}
            </button>
          ) : null}

          {showComparison && hasCompression ? (
            <div className='grid gap-3 sm:grid-cols-2'>
              <PreviewCard label='Original' file={file} src={originalPreviewUrl}/>
              <PreviewCard label='Otimizada' file={prepared.file} src={optimizedPreviewUrl!}/>
            </div>
          ) : null}

          <div className='grid gap-2 sm:grid-cols-3'>
            <Metric label='Original' value={formatFileSize(file.size)}/>
            <Metric label='Após preparo' value={formatFileSize(prepared.finalBytes)}/>
            <Metric label='Redução' value={prepared.compressed ? formatReduction(prepared.reductionPercent) : '0,0%'}/>
          </div>

          <label className='flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700'>
            <Checkbox
              checked={preserveOriginalQuality}
              onCheckedChange={(checked) => setPreserveOriginalQuality(checked === true)}
              disabled={isConfirming}
              aria-label='Manter qualidade original'
              className='mt-0.5'
            />
            <span>
              <span className='block font-semibold text-slate-800'>Manter qualidade original</span>
              <span className='block text-xs text-slate-500'>A compactação automática é aplicada a partir de {formatFileSize(PHOTO_COMPRESSION_THRESHOLD_BYTES)}. Arquivos acima de {formatFileSize(MAX_PHOTO_UPLOAD_BYTES)} continuam sendo recusados.</span>
            </span>
          </label>

          {preserveOriginalQuality && selectedSizeError ? (
            <p role='alert' className='rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700'>{selectedSizeError}</p>
          ) : null}
          {!preserveOriginalQuality && prepared.warning ? (
            <p className='rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800'>{prepared.warning}</p>
          ) : null}
          {confirmError ? (
            <p role='alert' className='rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700'>{confirmError}</p>
          ) : null}
        </>
      ) : null}

      <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
        <Button type='button' variant='outline' onClick={() => handleOpenChange(false)} disabled={isConfirming}>
          Cancelar
        </Button>
        <Button
          type='button'
          onClick={() => void handleConfirm()}
          disabled={!effectivePreparedFile || Boolean(prepareError) || Boolean(selectedSizeError) || isConfirming}
        >
          {isConfirming ? <Loader2 className='mr-2 h-4 w-4 animate-spin'/> : <Check className='mr-2 h-4 w-4'/>}
          {isConfirming ? 'Enviando…' : 'Usar esta imagem'}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleOpenChange}>
        <DrawerContent className='max-h-[92dvh] overflow-y-auto'>
          <DrawerHeader className='pb-2 text-center'>
            <DrawerTitle className='text-center text-2xl'>{title}</DrawerTitle>
            <DrawerDescription>Confira a imagem e escolha como deseja enviá-la.</DrawerDescription>
          </DrawerHeader>
          <div className='px-4 pb-5'>{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className={cn('max-h-[90dvh] overflow-y-auto sm:max-w-xl')} hideCloseButton>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Confira a imagem e escolha como deseja enviá-la.</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}

function PreviewCard({label, file, src}: {label: string; file: File; src: string}) {
  return (
    <div className='overflow-hidden rounded-xl border border-slate-200 bg-slate-50'>
      <div className='flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700'>
        <span>{label}</span>
        <span>{formatFileSize(file.size)}</span>
      </div>
      <img src={src} alt={`Prévia ${label.toLowerCase()}`} className='h-36 w-full object-contain sm:h-44'/>
    </div>
  );
}

function Metric({label, value}: {label: string; value: string}) {
  return (
    <div className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-2'>
      <span className='block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500'>{label}</span>
      <span className='mt-1 block text-sm font-semibold text-slate-800'>{value}</span>
    </div>
  );
}

function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file || typeof URL.createObjectURL !== 'function') {
      setUrl(null);
      return;
    }
    const nextUrl = URL.createObjectURL(file);
    setUrl(nextUrl);
    return () => {
      if (typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(nextUrl);
    };
  }, [file]);

  return url;
}

function formatFileSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2).replace('.', ',')} MB`;
}

function formatReduction(percent: number): string {
  return `${percent.toFixed(1).replace('.', ',')}%`;
}
